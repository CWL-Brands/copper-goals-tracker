import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

/**
 * Unified Fishbowl Import from Conversight Report
 * 
 * This single import creates:
 * 1. fishbowl_customers (deduplicated by Customer id)
 * 2. fishbowl_sales_orders (deduplicated by Sales order Number)
 * 3. fishbowl_soitems (one per row - line items)
 * 
 * All properly linked together!
 */

interface ImportStats {
  processed: number;
  customersCreated: number;
  customersUpdated: number;
  ordersCreated: number;
  ordersUpdated: number;
  itemsCreated: number;
  skipped: number;
}

async function importUnifiedReport(buffer: Buffer, filename: string): Promise<ImportStats> {
  console.log('📥 Importing Unified Fishbowl Report from Conversight...');
  
  let data: Record<string, any>[];
  
  // Parse file
  if (filename.toLowerCase().endsWith('.csv')) {
    console.log('📄 Parsing CSV file...');
    const text = buffer.toString('utf-8');
    data = parseCSV(text);
  } else {
    console.log('📊 Parsing Excel file...');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
  }
  
  console.log(`✅ Found ${data.length} rows to process`);
  
  const stats: ImportStats = {
    processed: 0,
    customersCreated: 0,
    customersUpdated: 0,
    ordersCreated: 0,
    ordersUpdated: 0,
    itemsCreated: 0,
    skipped: 0
  };
  
  // Track what we've already processed (to avoid duplicates within the same import)
  const processedCustomers = new Set<string>();
  const processedOrders = new Set<string>();
  
  let batch = adminDb.batch();
  let batchCount = 0;
  
  for (const row of data) {
    stats.processed++;
    
    // Log progress every 1000 rows
    if (stats.processed % 1000 === 0) {
      console.log(`📊 Progress: ${stats.processed} of ${data.length} (${((stats.processed/data.length)*100).toFixed(1)}%)`);
      console.log(`   Customers: ${stats.customersCreated} created, ${stats.customersUpdated} updated`);
      console.log(`   Orders: ${stats.ordersCreated} created, ${stats.ordersUpdated} updated`);
      console.log(`   Items: ${stats.itemsCreated} created, Skipped: ${stats.skipped}`);
    }
    
    try {
      // Extract key fields
      const customerId = row['Customer id'];
      const salesOrderNum = row['Sales order Number'];
      const salesOrderId = row['Sales Order ID'];
      
      // Skip if missing critical data
      if (!customerId || !salesOrderNum || !salesOrderId) {
        stats.skipped++;
        continue;
      }
      
      // === 1. CREATE/UPDATE CUSTOMER ===
      if (!processedCustomers.has(String(customerId))) {
        // Sanitize customer ID - remove slashes and invalid Firestore path characters
        const customerDocId = String(customerId)
          .replace(/\//g, '_')  // Replace / with _
          .replace(/\\/g, '_')  // Replace \ with _
          .trim();
        
        const customerRef = adminDb.collection('fishbowl_customers').doc(customerDocId);
        
        const customerData: any = {
          id: customerDocId,
          name: row['Customer'] || row['Customer name'] || '',
          accountNumber: row['Account Number'] || '',
          accountType: row['Account Type'] || '',
          companyId: row['Company id'] || '',
          companyName: row['Company name'] || '',
          parentCompanyId: row['Parent Company ID'] || '',
          parentCustomerName: row['Parent Customer Name'] || '',
          shippingCity: row['Shipping City'] || '',
          shippingAddress: row['Shipping Address'] || '',
          shippingCountry: row['Shipping Country'] || '',
          customerContact: row['Customer contact'] || '',
          updatedAt: Timestamp.now(),
          source: 'fishbowl_unified',
        };
        
        // Check if exists
        const existingCustomer = await customerRef.get();
        if (existingCustomer.exists) {
          batch.update(customerRef, customerData);
          stats.customersUpdated++;
        } else {
          batch.set(customerRef, customerData);
          stats.customersCreated++;
        }
        
        processedCustomers.add(String(customerId));
        batchCount++;
      }
      
      // === 2. CREATE/UPDATE SALES ORDER ===
      if (!processedOrders.has(String(salesOrderNum))) {
        const orderDocId = `fb_so_${salesOrderNum}`;
        const orderRef = adminDb.collection('fishbowl_sales_orders').doc(orderDocId);
        
        // Sanitize customer ID for consistency
        const sanitizedCustomerId = String(customerId)
          .replace(/\//g, '_')
          .replace(/\\/g, '_')
          .trim();
        
        // Parse posting date for commission tracking
        const postingDateStr = row['Posting Date'] || '';
        let postingDate = null;
        let commissionMonth = '';
        let commissionYear = 0;
        
        if (postingDateStr) {
          try {
            // Parse date (format: MM/DD/YYYY or similar)
            const dateParts = postingDateStr.split('/');
            if (dateParts.length === 3) {
              const month = parseInt(dateParts[0]);
              const day = parseInt(dateParts[1]);
              const year = parseInt(dateParts[2]);
              postingDate = new Date(year, month - 1, day);
              commissionMonth = `${year}-${String(month).padStart(2, '0')}`; // e.g., "2025-10"
              commissionYear = year;
            }
          } catch (e) {
            console.warn(`Failed to parse posting date: ${postingDateStr}`);
          }
        }
        
        const orderData: any = {
          id: orderDocId,
          num: String(salesOrderNum),
          fishbowlNum: String(salesOrderNum),
          salesOrderId: String(salesOrderId), // Internal Fishbowl SO ID
          customerId: sanitizedCustomerId, // Link to customer!
          customerName: row['Customer'] || '',
          salesPerson: row['Sales person'] || row['Sales Rep'] || '',
          
          // Commission tracking fields
          postingDate: postingDate ? Timestamp.fromDate(postingDate) : null,
          postingDateStr: postingDateStr, // Keep original string
          commissionDate: postingDate ? Timestamp.fromDate(postingDate) : null, // COMMISSION DATE = POSTING DATE
          commissionMonth: commissionMonth, // For grouping by month
          commissionYear: commissionYear, // For filtering by year
          
          orderValue: parseFloat(row['Order value'] || 0),
          updatedAt: Timestamp.now(),
          source: 'fishbowl_unified',
          syncStatus: 'pending',
        };
        
        // Check if exists
        const existingOrder = await orderRef.get();
        if (existingOrder.exists) {
          batch.update(orderRef, orderData);
          stats.ordersUpdated++;
        } else {
          batch.set(orderRef, orderData);
          stats.ordersCreated++;
        }
        
        processedOrders.add(String(salesOrderNum));
        batchCount++;
      }
      
      // === 3. CREATE SOITEM (LINE ITEM) ===
      // Each row is a unique line item
      const itemDocId = `${salesOrderId}_${row['Sales Order Product ID'] || stats.itemsCreated}`;
      const itemRef = adminDb.collection('fishbowl_soitems').doc(itemDocId);
      
      // Sanitize customer ID for consistency
      const sanitizedCustomerId = String(customerId)
        .replace(/\//g, '_')
        .replace(/\\/g, '_')
        .trim();
      
      // Parse posting date for commission tracking (denormalized for fast queries)
      const postingDateStr = row['Posting Date'] || '';
      let postingDate = null;
      let commissionMonth = '';
      let commissionYear = 0;
      
      if (postingDateStr) {
        try {
          const dateParts = postingDateStr.split('/');
          if (dateParts.length === 3) {
            const month = parseInt(dateParts[0]);
            const day = parseInt(dateParts[1]);
            const year = parseInt(dateParts[2]);
            postingDate = new Date(year, month - 1, day);
            commissionMonth = `${year}-${String(month).padStart(2, '0')}`;
            commissionYear = year;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      const itemData: any = {
        id: itemDocId,
        salesOrderId: String(salesOrderId), // Internal Fishbowl SO ID
        salesOrderNum: String(salesOrderNum), // SO number
        soId: `fb_so_${salesOrderNum}`, // Link to fishbowl_sales_orders
        customerId: sanitizedCustomerId, // Denormalized for fast queries!
        customerName: row['Customer'] || '',
        
        // Commission tracking (denormalized from SO for fast queries)
        postingDate: postingDate ? Timestamp.fromDate(postingDate) : null,
        postingDateStr: postingDateStr,
        commissionDate: postingDate ? Timestamp.fromDate(postingDate) : null, // COMMISSION DATE = POSTING DATE
        commissionMonth: commissionMonth, // For grouping: "2025-10"
        commissionYear: commissionYear, // For filtering: 2025
        
        // Product info
        productId: row['Sales Order Product ID'] || row['Part id'] || '',
        productNum: row['Sales Order Product Number'] || row['Part Number'] || '',
        product: row['Product'] || '',
        productC1: row['Product c1'] || '',
        productC2: row['Product c2'] || '',
        productC3: row['Product c3'] || '',
        productC4: row['Product c4'] || '',
        productC5: row['Product c5'] || '',
        productDesc: row['Product desc'] || '',
        description: row['Sales Order Item Description'] || row['Part description'] || '',
        itemType: row['Sales Order Item Type'] || '',
        partNumber: row['Part Number'] || '',
        partId: row['Part id'] || '',
        partDescription: row['Part description'] || '',
        
        // Financial data
        revenue: parseFloat(row['Revenue'] || 0),
        unitPrice: parseFloat(row['Unit Price'] || 0),
        invoicedCost: parseFloat(row['Invoiced cost'] || 0),
        margin: parseFloat(row['Margin'] || 0),
        quantity: parseFloat(row['Shipped Quantity'] || 0),
        
        // Metadata
        salesPerson: row['Sales person'] || row['Sales Rep'] || '',
        shippingItemId: row['Shipping Item ID'] || '',
        
        // Import metadata
        importedAt: Timestamp.now(),
        source: 'fishbowl_unified',
      };
      
      batch.set(itemRef, itemData);
      stats.itemsCreated++;
      batchCount++;
      
      // Commit in batches of 500
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`💾 Committed batch: ${stats.customersCreated + stats.customersUpdated} customers, ${stats.ordersCreated + stats.ordersUpdated} orders, ${stats.itemsCreated} items`);
        batch = adminDb.batch();
        batchCount = 0;
      }
      
    } catch (error: any) {
      console.error(`❌ Error processing row ${stats.processed}:`, error.message);
      stats.skipped++;
    }
  }
  
  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
  }
  
  console.log(`\n✅ UNIFIED IMPORT COMPLETE!`);
  console.log(`   Rows processed: ${stats.processed}`);
  console.log(`   Customers: ${stats.customersCreated} created, ${stats.customersUpdated} updated`);
  console.log(`   Orders: ${stats.ordersCreated} created, ${stats.ordersUpdated} updated`);
  console.log(`   Line Items: ${stats.itemsCreated} created`);
  console.log(`   Skipped: ${stats.skipped}\n`);
  
  return stats;
}

/**
 * Parse CSV data
 */
function parseCSV(text: string): Record<string, any>[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data: Record<string, any>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, any> = {};
    
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    
    data.push(row);
  }
  
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log(`📁 File received: ${file.name}`);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const stats = await importUnifiedReport(buffer, file.name);
    
    return NextResponse.json({
      success: true,
      stats,
      message: `Successfully imported ${stats.itemsCreated} line items, ${stats.customersCreated + stats.customersUpdated} customers, ${stats.ordersCreated + stats.ordersUpdated} orders`
    });
    
  } catch (error: any) {
    console.error('❌ Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    );
  }
}
