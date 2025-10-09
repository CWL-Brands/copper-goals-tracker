import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const maxDuration = 300; // 5 minutes for large datasets

interface CustomerMetrics {
  totalOrders: number;
  totalSpent: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
  averageOrderValue: number;
  daysSinceLastOrder: number | null;
  topProducts: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔢 Starting metrics calculation for matched Fishbowl customers...');

    // Get all matched Fishbowl customers (those with copperCompanyId)
    const customersSnapshot = await adminDb
      .collection('fishbowl_customers')
      .where('copperCompanyId', '!=', null)
      .get();

    const matchedCustomers = customersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    console.log(`📊 Found ${matchedCustomers.length} matched customers`);

    // Get all line items (fishbowl_soitems) - this is where the REAL data is!
    console.log('📥 Loading line items from fishbowl_soitems...');
    const lineItemsSnapshot = await adminDb.collection('fishbowl_soitems').get();
    const allLineItems = lineItemsSnapshot.docs.map(doc => doc.data()) as any[];
    
    console.log(`📦 Found ${allLineItems.length} line items`);

    // Log first line item to see structure
    if (allLineItems.length > 0) {
      console.log('📋 Sample line item structure:', JSON.stringify(allLineItems[0], null, 2));
    }

    // Group line items by customer ID for fast lookup
    const lineItemsByCustomer = new Map<string, any[]>();
    for (const item of allLineItems) {
      const customerId = item.customerId || item.customerNum || item.customerID;
      if (!customerId) continue;
      
      if (!lineItemsByCustomer.has(String(customerId))) {
        lineItemsByCustomer.set(String(customerId), []);
      }
      lineItemsByCustomer.get(String(customerId))!.push(item);
    }

    console.log(`🗺️  Grouped line items for ${lineItemsByCustomer.size} customers`);
    console.log(`🔑 Sample customer IDs from line items:`, Array.from(lineItemsByCustomer.keys()).slice(0, 5));

    // Calculate metrics for each customer
    let updated = 0;
    let skipped = 0;
    const batchSize = 500; // Firestore batch limit
    let currentBatch = adminDb.batch();
    let batchCount = 0;

    console.log(`🔄 Processing ${matchedCustomers.length} customers...`);
    
    // Log first customer to see structure
    if (matchedCustomers.length > 0) {
      console.log('📋 Sample customer structure:', JSON.stringify(matchedCustomers[0], null, 2));
    }

    for (const customer of matchedCustomers) {
      // Extract the numeric customer ID from the document ID
      // Document ID might be like "1001" or "fb_cust_1001"
      let customerId = customer.id;
      
      // If it starts with "fb_cust_", extract the number
      if (customerId && customerId.startsWith('fb_cust_')) {
        customerId = customerId.replace('fb_cust_', '');
      }
      
      if (!customerId) {
        console.log(`⚠️  Skipping customer - no ID found:`, customer);
        skipped++;
        continue;
      }

      const customerLineItems = lineItemsByCustomer.get(String(customerId)) || [];
      
      if (customerLineItems.length > 0) {
        console.log(`✅ Customer ${customerId}: Found ${customerLineItems.length} line items`);
      } else {
        console.log(`⚠️  Customer ${customerId}: No line items found`);
      }
      
      if (customerLineItems.length === 0) {
        // No line items - set zeros
        const metrics: CustomerMetrics = {
          totalOrders: 0,
          totalSpent: 0,
          firstOrderDate: null,
          lastOrderDate: null,
          averageOrderValue: 0,
          daysSinceLastOrder: null,
          topProducts: '',
        };

        const docRef = adminDb.collection('fishbowl_customers').doc(customer.id);
        currentBatch.update(docRef, {
          metrics,
          metricsCalculatedAt: new Date().toISOString(),
        });
        updated++;
        batchCount++;
        
        // Commit batch if we hit the limit
        if (batchCount >= batchSize) {
          await currentBatch.commit();
          console.log(`✅ Committed batch: ${updated} customers processed...`);
          currentBatch = adminDb.batch();
          batchCount = 0;
        }
        continue;
      }

      // Calculate metrics from LINE ITEMS using REVENUE
      // Get unique order numbers
      const uniqueOrderNums = new Set(customerLineItems.map((item: any) => item.salesOrderNum).filter(Boolean));
      const totalOrders = uniqueOrderNums.size;
      
      // Sum revenue from all line items
      const totalSpent = customerLineItems.reduce((sum: number, item: any) => {
        const revenue = parseFloat(item.revenue || 0);
        return sum + revenue;
      }, 0);

      // Get dates from commissionDate field
      const dates = customerLineItems
        .map((item: any) => item.commissionDate)
        .filter(Boolean)
        .map((d: any) => {
          // Handle Firestore Timestamp
          if (d && d.toDate) return d.toDate();
          // Handle ISO string
          if (typeof d === 'string') return new Date(d);
          // Handle Date object
          if (d instanceof Date) return d;
          return null;
        })
        .filter((d: any) => d && !isNaN(d.getTime()));

      const firstOrderDate = dates.length > 0 
        ? new Date(Math.min(...dates.map((d: Date) => d.getTime()))).toISOString()
        : null;
      
      const lastOrderDate = dates.length > 0
        ? new Date(Math.max(...dates.map((d: Date) => d.getTime()))).toISOString()
        : null;

      // Calculate days since last order
      const daysSinceLastOrder = lastOrderDate
        ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      // Calculate top 3 products by revenue
      const productRevenue = new Map<string, { name: string; revenue: number }>();
      for (const item of customerLineItems) {
        const partNumber = item.partNumber || item.productNum || 'Unknown';
        const productName = item.product || partNumber;
        const revenue = parseFloat(item.revenue || 0);
        
        if (!productRevenue.has(partNumber)) {
          productRevenue.set(partNumber, { name: productName, revenue: 0 });
        }
        const prod = productRevenue.get(partNumber)!;
        prod.revenue += revenue;
      }

      const topProducts = Array.from(productRevenue.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3)
        .map(p => `${p.name} ($${p.revenue.toFixed(2)})`)
        .join(', ');

      const metrics: CustomerMetrics = {
        totalOrders,
        totalSpent: Math.round(totalSpent * 100) / 100,
        firstOrderDate,
        lastOrderDate,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        daysSinceLastOrder,
        topProducts,
      };

      const docRef = adminDb.collection('fishbowl_customers').doc(customer.id);
      currentBatch.update(docRef, {
        metrics,
        metricsCalculatedAt: new Date().toISOString(),
      });
      updated++;
      batchCount++;

      // Commit batch if we hit the limit
      if (batchCount >= batchSize) {
        await currentBatch.commit();
        console.log(`✅ Committed batch: ${updated} customers processed...`);
        currentBatch = adminDb.batch();
        batchCount = 0;
      }
    }

    // Commit remaining updates
    if (batchCount > 0) {
      await currentBatch.commit();
      console.log(`✅ Final batch committed: ${updated} total customers processed`);
    }

    console.log(`✅ Metrics calculation complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers: matchedCustomers.length,
        updated,
        skipped,
        totalLineItems: allLineItems.length,
      },
    });

  } catch (error: any) {
    console.error('❌ Error calculating metrics:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
