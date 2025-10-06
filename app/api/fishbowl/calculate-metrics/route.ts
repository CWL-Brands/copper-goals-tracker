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

    // Get all sales orders
    console.log('📥 Loading sales orders...');
    const ordersSnapshot = await adminDb.collection('fishbowl_sales_orders').get();
    const allOrders = ordersSnapshot.docs.map(doc => doc.data()) as any[];
    
    console.log(`📦 Found ${allOrders.length} sales orders`);

    // Group orders by customer ID for fast lookup
    const ordersByCustomer = new Map<string, any[]>();
    for (const order of allOrders) {
      const customerId = order.customerId || order.customerNum;
      if (!customerId) continue;
      
      if (!ordersByCustomer.has(customerId)) {
        ordersByCustomer.set(customerId, []);
      }
      ordersByCustomer.get(customerId)!.push(order);
    }

    console.log(`🗺️  Grouped orders for ${ordersByCustomer.size} customers`);

    // Calculate metrics for each customer
    let updated = 0;
    let skipped = 0;
    const batchSize = 500; // Firestore batch limit
    let currentBatch = adminDb.batch();
    let batchCount = 0;

    console.log(`🔄 Processing ${matchedCustomers.length} customers...`);

    for (const customer of matchedCustomers) {
      const customerId = customer.accountId || customer.fishbowlId;
      if (!customerId) {
        skipped++;
        continue;
      }

      const customerOrders = ordersByCustomer.get(String(customerId)) || [];
      
      if (customerOrders.length === 0) {
        // No orders - set zeros
        const metrics: CustomerMetrics = {
          totalOrders: 0,
          totalSpent: 0,
          firstOrderDate: null,
          lastOrderDate: null,
          averageOrderValue: 0,
          daysSinceLastOrder: null,
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

      // Calculate metrics
      const totalOrders = customerOrders.length;
      const totalSpent = customerOrders.reduce((sum, order) => {
        const price = parseFloat(order.totalPrice || order.total || 0);
        return sum + price;
      }, 0);

      const orderDates = customerOrders
        .map(order => order.dateIssued || order.date)
        .filter(date => date)
        .sort();

      const firstOrderDate = orderDates[0] || null;
      const lastOrderDate = orderDates[orderDates.length - 1] || null;
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      let daysSinceLastOrder: number | null = null;
      if (lastOrderDate) {
        const lastDate = new Date(lastOrderDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        daysSinceLastOrder = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      const metrics: CustomerMetrics = {
        totalOrders,
        totalSpent: Math.round(totalSpent * 100) / 100, // Round to 2 decimals
        firstOrderDate,
        lastOrderDate,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        daysSinceLastOrder,
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
        totalOrders: allOrders.length,
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
