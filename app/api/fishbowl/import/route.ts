import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for large imports

/**
 * Fishbowl Import Endpoint
 * 
 * Reads Fishbowl Excel files and imports data into Firestore
 * 
 * POST /api/fishbowl/import
 * Body: { type: 'customers' | 'sales_orders' | 'both' }
 */

interface ImportStats {
  customersProcessed: number;
  customersCreated: number;
  customersUpdated: number;
  ordersProcessed: number;
  ordersCreated: number;
  ordersUpdated: number;
  errors: Array<{ recordId: string; error: string }>;
}

/**
 * Parse date from various formats
 */
function parseDate(value: any): Date | undefined {
  if (!value) return undefined;
  
  if (value instanceof Date) return value;
  
  // Handle Excel date numbers
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return date;
  }
  
  // Handle string dates
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  
  return undefined;
}

/**
 * Parse boolean from various formats
 */
function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1';
  }
  return false;
}

/**
 * Parse number safely
 */
function parseNumber(value: any): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

/**
 * Import Fishbowl Customers
 */
async function importCustomers(buffer: Buffer, stats: ImportStats): Promise<void> {
  console.log('📥 Importing customers...');
  
  // Read Excel file from buffer
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
  
  console.log(`✅ Found ${data.length} customers to import`);
  
  let batch = adminDb.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500;
  
  for (const row of data) {
    try {
      const customerId = String(row.id || '').trim();
      if (!customerId) {
        stats.errors.push({ recordId: 'unknown', error: 'Missing customer ID' });
        continue;
      }
      
      stats.customersProcessed++;
      
      // Reference to document (don't check if exists - just upsert)
      const docRef = adminDb.collection('fishbowl_customers').doc(customerId);
      
      // Parse custom fields JSON if present
      let customFields: Record<string, any> | undefined;
      if (row.customFields && typeof row.customFields === 'string') {
        try {
          customFields = JSON.parse(row.customFields);
        } catch (e) {
          console.warn(`Failed to parse customFields for customer ${customerId}`);
        }
      }
      
      // Build customer document (filter out undefined values)
      const customerData: Record<string, any> = {
        id: customerId,
        accountId: String(row.accountId || ''),
        name: String(row.name || ''),
        activeFlag: parseBoolean(row.activeFlag),
        
        // Sync tracking
        syncStatus: 'pending' as const,
        
        // Metadata
        updatedAt: Timestamp.now(),
        source: 'fishbowl' as const,
      };
      
      // Add optional fields only if they exist
      if (row.email) customerData.email = String(row.email);
      if (row.phone) customerData.phone = String(row.phone);
      if (row.customerContact) customerData.customerContact = String(row.customerContact);
      if (row.billToAddress) customerData.billToAddress = String(row.billToAddress);
      if (row.billToCity) customerData.billToCity = String(row.billToCity);
      if (row.billToStateID) customerData.billToStateID = String(row.billToStateID);
      if (row.billToZip) customerData.billToZip = String(row.billToZip);
      if (row.carrierServiceId) customerData.carrierServiceId = String(row.carrierServiceId);
      if (customFields) customerData.customFields = customFields;
      
      const creditLimit = parseNumber(row.creditLimit);
      if (creditLimit !== undefined) customerData.creditLimit = creditLimit;
      
      const dateCreated = parseDate(row.dateCreated);
      if (dateCreated) customerData.dateCreated = Timestamp.fromDate(dateCreated);
      
      const dateLastModified = parseDate(row.dateLastModified);
      if (dateLastModified) customerData.dateLastModified = Timestamp.fromDate(dateLastModified);
      
      // Use set with merge to upsert (create or update)
      batch.set(docRef, {
        ...customerData,
        createdAt: Timestamp.now(),
      }, { merge: true });
      
      stats.customersCreated++; // Count as created (will track updates later)
      
      batchCount++;
      
      // Commit batch if we hit the limit
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`💾 Committed batch of ${batchCount} customers`);
        batch = adminDb.batch(); // Create new batch
        batchCount = 0;
      }
      
    } catch (error: any) {
      stats.errors.push({
        recordId: String(row.id || 'unknown'),
        error: error.message,
      });
    }
  }
  
  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
    console.log(`💾 Committed final batch of ${batchCount} customers`);
  }
}

/**
 * Import Fishbowl Sales Orders
 */
async function importSalesOrders(buffer: Buffer, stats: ImportStats): Promise<void> {
  console.log('📥 Importing sales orders...');
  
  // Read Excel file from buffer
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
  
  console.log(`✅ Found ${data.length} sales orders to import`);
  
  let batch = adminDb.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500;
  
  for (const row of data) {
    try {
      const soNumber = String(row.num || row.id || '').trim();
      if (!soNumber) {
        stats.errors.push({ recordId: 'unknown', error: 'Missing SO number' });
        continue;
      }
      
      stats.ordersProcessed++;
      
      // Reference to document (don't check if exists - just upsert)
      const docRef = adminDb.collection('fishbowl_sales_orders').doc(soNumber);
      
      // Parse custom fields JSON if present
      let customFields: Record<string, any> | undefined;
      if (row.customFields && typeof row.customFields === 'string') {
        try {
          customFields = JSON.parse(row.customFields);
        } catch (e) {
          console.warn(`Failed to parse customFields for SO ${soNumber}`);
        }
      }
      
      // Build sales order document
      const orderData = {
        id: soNumber,
        num: soNumber,
        
        // Customer link
        customerId: String(row.customerId || row.id || ''),
        
        // Order info
        status: String(row.status || ''),
        priorityId: row.priorityId ? String(row.priorityId) : undefined,
        
        // Financial
        totalPrice: parseNumber(row.totalPrice) || 0,
        subtotal: parseNumber(row.subtotal) || 0,
        totalTax: parseNumber(row.totalTax) || 0,
        totalIncludesTax: parseBoolean(row.totalIncludesTax),
        cost: parseNumber(row.cost),
        
        // Dates
        dateIssued: parseDate(row.dateIssued) ? Timestamp.fromDate(parseDate(row.dateIssued)!) : undefined,
        dateCompleted: parseDate(row.dateCompleted) ? Timestamp.fromDate(parseDate(row.dateCompleted)!) : undefined,
        dateCreated: parseDate(row.dateCreated) ? Timestamp.fromDate(parseDate(row.dateCreated)!) : undefined,
        dateLastModified: parseDate(row.dateLastModified) ? Timestamp.fromDate(parseDate(row.dateLastModified)!) : undefined,
        dateFirstShip: parseDate(row.dateFirstShip) ? Timestamp.fromDate(parseDate(row.dateFirstShip)!) : undefined,
        dateCatStart: parseDate(row.dateCatStart) ? Timestamp.fromDate(parseDate(row.dateCatStart)!) : undefined,
        dateCatEnd: parseDate(row.dateCatEnd) ? Timestamp.fromDate(parseDate(row.dateCatEnd)!) : undefined,
        
        // People
        salesman: row.salesman ? String(row.salesman) : undefined,
        salesmanId: row.salesmanId ? String(row.salesmanId) : undefined,
        createdByUserId: row.createdByUserId ? String(row.createdByUserId) : undefined,
        username: row.username ? String(row.username) : undefined,
        
        // Customer info
        customerPO: row.customerPO ? String(row.customerPO) : undefined,
        customerContact: row.customerContact ? String(row.customerContact) : undefined,
        
        // Location/QB
        locationGroupId: row.locationGroupId ? String(row.locationGroupId) : undefined,
        qbClassId: row.qbClassId ? String(row.qbClassId) : undefined,
        
        // Shipping
        shipToName: row.shipToName ? String(row.shipToName) : undefined,
        shipToAddress: row.shipToAddress ? String(row.shipToAddress) : undefined,
        shipToCity: row.shipToCity ? String(row.shipToCity) : undefined,
        shipToStateID: row.shipToStateID ? String(row.shipToStateID) : undefined,
        shipToZip: row.shipToZip ? String(row.shipToZip) : undefined,
        shipToResidential: row.shipToResidential ? parseBoolean(row.shipToResidential) : undefined,
        carrierServiceId: row.carrierServiceId ? String(row.carrierServiceId) : undefined,
        
        // Payment
        paymentTermsId: row.paymentTermsId ? String(row.paymentTermsId) : undefined,
        fobPointId: row.fobPointId ? String(row.fobPointId) : undefined,
        
        // Tax
        taxRate: parseNumber(row.taxRate),
        taxRateName: row.taxRateName ? String(row.taxRateName) : undefined,
        toBeEmailed: row.toBeEmailed ? parseBoolean(row.toBeEmailed) : undefined,
        toBePrinted: row.toBePrinted ? parseBoolean(row.toBePrinted) : undefined,
        
        // Notes
        note: row.note ? String(row.note) : undefined,
        
        // Status
        statusId: parseNumber(row.statusId),
        
        // Custom fields
        customFields,
        
        // Sync tracking
        syncStatus: 'pending' as const,
        
        // Metadata
        updatedAt: Timestamp.now(),
        source: 'fishbowl' as const,
      };
      
      // Filter out undefined values
      const cleanOrderData = Object.fromEntries(
        Object.entries(orderData).filter(([_, v]) => v !== undefined)
      );
      
      // Use set with merge to upsert (create or update)
      batch.set(docRef, {
        ...cleanOrderData,
        createdAt: Timestamp.now(),
      }, { merge: true });
      
      stats.ordersCreated++; // Count as created (will track updates later)
      
      batchCount++;
      
      // Commit batch if we hit the limit
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`💾 Committed batch of ${batchCount} orders`);
        batch = adminDb.batch(); // Create new batch
        batchCount = 0;
      }
      
    } catch (error: any) {
      stats.errors.push({
        recordId: String(row.num || row.id || 'unknown'),
        error: error.message,
      });
    }
  }
  
  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
    console.log(`💾 Committed final batch of ${batchCount} orders`);
  }
}

/**
 * Log sync to audit trail
 */
async function logSync(stats: ImportStats, startTime: Date): Promise<void> {
  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();
  
  await adminDb.collection('sync_log').add({
    syncType: 'fishbowl_to_firestore',
    status: stats.errors.length > 0 ? 'completed' : 'completed',
    recordsProcessed: stats.customersProcessed + stats.ordersProcessed,
    recordsCreated: stats.customersCreated + stats.ordersCreated,
    recordsUpdated: stats.customersUpdated + stats.ordersUpdated,
    recordsFailed: stats.errors.length,
    errors: stats.errors.slice(0, 100), // Limit to first 100 errors
    startedAt: Timestamp.fromDate(startTime),
    completedAt: Timestamp.fromDate(endTime),
    duration,
    triggeredBy: 'api',
    metadata: {
      customersProcessed: stats.customersProcessed,
      customersCreated: stats.customersCreated,
      customersUpdated: stats.customersUpdated,
      ordersProcessed: stats.ordersProcessed,
      ordersCreated: stats.ordersCreated,
      ordersUpdated: stats.ordersUpdated,
    },
  });
}

export async function POST(req: NextRequest) {
  const startTime = new Date();
  
  try {
    // Parse multipart form data
    const formData = await req.formData();
    const customersFile = formData.get('customersFile') as File | null;
    const ordersFile = formData.get('ordersFile') as File | null;
    
    if (!customersFile && !ordersFile) {
      return NextResponse.json(
        { error: 'No files provided. Please upload at least one Excel file.' },
        { status: 400 }
      );
    }
    
    const stats: ImportStats = {
      customersProcessed: 0,
      customersCreated: 0,
      customersUpdated: 0,
      ordersProcessed: 0,
      ordersCreated: 0,
      ordersUpdated: 0,
      errors: [],
    };
    
    // Import customers
    if (customersFile) {
      const buffer = Buffer.from(await customersFile.arrayBuffer());
      await importCustomers(buffer, stats);
    }
    
    // Import sales orders
    if (ordersFile) {
      const buffer = Buffer.from(await ordersFile.arrayBuffer());
      await importSalesOrders(buffer, stats);
    }
    
    // Log sync
    await logSync(stats, startTime);
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    return NextResponse.json({
      success: true,
      duration: `${(duration / 1000).toFixed(2)}s`,
      stats: {
        customers: {
          processed: stats.customersProcessed,
          created: stats.customersCreated,
          updated: stats.customersUpdated,
        },
        salesOrders: {
          processed: stats.ordersProcessed,
          created: stats.ordersCreated,
          updated: stats.ordersUpdated,
        },
        errors: stats.errors.length,
        errorSamples: stats.errors.slice(0, 10),
      },
    });
    
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    );
  }
}
