import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

function getAdminEmails(): string[] {
  const env = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '';
  return env.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = (decoded.email || '').toLowerCase();
    const admins = getAdminEmails();
    if (email && admins.includes(email)) return decoded;
    return null;
  } catch {
    return null;
  }
}

/**
 * Get Fishbowl salesman to Firebase user mapping
 */
async function getFishbowlUsersMap(): Promise<Record<string, string>> {
  try {
    const doc = await adminDb.collection('settings').doc('fishbowl_users_map').get();
    if (!doc.exists) return {};
    const data = doc.data();
    return data?.bySalesman || {};
  } catch (e) {
    console.error('[Fishbowl Sync] Error loading users map:', e);
    return {};
  }
}

/**
 * Log a metric to Firestore (admin version)
 */
async function logMetricAdmin(params: {
  userId: string;
  type: string;
  value: number;
  date: Date;
  source: string;
  metadata?: Record<string, any>;
}) {
  const { userId, type, value, date, source, metadata } = params;
  
  // Normalize date to midnight UTC
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  
  // Create deterministic doc ID to prevent duplicates
  const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
  const docId = `${userId}_${type}_${dateStr}_${source}`;
  
  const metricData = {
    userId,
    type,
    value: Number(value),
    date: Timestamp.fromDate(d),
    source,
    metadata: metadata || {},
    createdAt: Timestamp.now(),
  };
  
  await adminDb.collection('metrics').doc(docId).set(metricData, { merge: true });
}

/**
 * POST /api/sync-fishbowl-sales
 * Sync sales from Fishbowl to metrics
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, startDate, endDate } = body;

    console.log('[Fishbowl Sync] Starting sync', { userId, startDate, endDate });

    // Get user mapping
    const usersMap = await getFishbowlUsersMap();
    console.log('[Fishbowl Sync] Loaded user mapping:', Object.keys(usersMap).length, 'salesmen');

    // Determine which users to sync
    let userIds: string[] = [];
    if (userId) {
      userIds = [userId];
    } else {
      // Get all users with Fishbowl mapping
      userIds = Object.values(usersMap);
    }

    if (userIds.length === 0) {
      return NextResponse.json({
        error: 'No users to sync. Please configure Fishbowl user mapping first.',
      }, { status: 400 });
    }

    console.log('[Fishbowl Sync] Syncing for', userIds.length, 'users');

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    console.log('[Fishbowl Sync] Date range:', start.toISOString(), 'to', end.toISOString());

    // Query Fishbowl sales orders
    let ordersQuery = adminDb
      .collection('fishbowl_sales_orders')
      .where('dateIssued', '>=', Timestamp.fromDate(start))
      .where('dateIssued', '<=', Timestamp.fromDate(end));

    const ordersSnapshot = await ordersQuery.get();
    console.log('[Fishbowl Sync] Found', ordersSnapshot.docs.length, 'orders in date range');

    // Group orders by user + day + accountType
    const metricsByUser: Record<string, Record<string, Record<string, number>>> = {};
    
    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data();
      
      // Get salesman
      const salesman = order.salesman || order.salesmanId;
      if (!salesman) {
        console.log('[Fishbowl Sync] Order', order.num, 'has no salesman, skipping');
        continue;
      }

      // Map salesman to userId
      const mappedUserId = usersMap[salesman];
      if (!mappedUserId) {
        console.log('[Fishbowl Sync] Salesman', salesman, 'not mapped to user, skipping');
        continue;
      }

      // If filtering by userId, skip if not match
      if (userId && mappedUserId !== userId) {
        continue;
      }

      // Get customer to determine accountType
      const customerId = order.customerId;
      if (!customerId) {
        console.log('[Fishbowl Sync] Order', order.num, 'has no customerId, skipping');
        continue;
      }

      // Fetch customer
      const customerDoc = await adminDb.collection('fishbowl_customers').doc(customerId).get();
      if (!customerDoc.exists) {
        console.log('[Fishbowl Sync] Customer', customerId, 'not found, skipping');
        continue;
      }

      const customer = customerDoc.data();
      const accountType = customer?.accountType || 'Retail';

      // Determine metric type based on accountType
      let metricType: string;
      if (accountType === 'Wholesale') {
        metricType = 'new_sales_wholesale';
      } else if (accountType === 'Distribution') {
        metricType = 'new_sales_distribution';
      } else {
        // Skip Retail for now (or create new metric type if needed)
        console.log('[Fishbowl Sync] Order', order.num, 'is Retail, skipping');
        continue;
      }

      // Get order value
      const totalPrice = Number(order.totalPrice || 0);
      if (totalPrice <= 0) {
        console.log('[Fishbowl Sync] Order', order.num, 'has no value, skipping');
        continue;
      }

      // Get order date
      const dateIssued = order.dateIssued?.toDate?.() || new Date(order.dateIssued);
      const dateKey = dateIssued.toISOString().split('T')[0]; // YYYY-MM-DD

      // Initialize nested structure
      if (!metricsByUser[mappedUserId]) {
        metricsByUser[mappedUserId] = {};
      }
      if (!metricsByUser[mappedUserId][dateKey]) {
        metricsByUser[mappedUserId][dateKey] = {};
      }
      if (!metricsByUser[mappedUserId][dateKey][metricType]) {
        metricsByUser[mappedUserId][dateKey][metricType] = 0;
      }

      // Add to total
      metricsByUser[mappedUserId][dateKey][metricType] += totalPrice;

      console.log('[Fishbowl Sync] Order', order.num, ':', salesman, '->', mappedUserId, 
                  '|', accountType, '|', dateKey, '| $' + totalPrice);
    }

    // Create metrics
    let metricsCreated = 0;
    const results: any[] = [];

    for (const [uid, datesByType] of Object.entries(metricsByUser)) {
      for (const [dateKey, typeValues] of Object.entries(datesByType)) {
        for (const [metricType, totalValue] of Object.entries(typeValues)) {
          await logMetricAdmin({
            userId: uid,
            type: metricType,
            value: totalValue,
            date: new Date(dateKey),
            source: 'fishbowl',
            metadata: {
              ordersCount: 1, // Could track this if needed
            },
          });
          metricsCreated++;
          results.push({
            userId: uid,
            date: dateKey,
            type: metricType,
            value: totalValue,
          });
        }
      }
    }

    console.log('[Fishbowl Sync] Complete:', metricsCreated, 'metrics created');

    return NextResponse.json({
      success: true,
      message: `Synced ${ordersSnapshot.docs.length} orders, created ${metricsCreated} metrics`,
      ordersProcessed: ordersSnapshot.docs.length,
      metricsCreated,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      results,
    });

  } catch (error: any) {
    console.error('[Fishbowl Sync] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to sync Fishbowl sales' },
      { status: 500 }
    );
  }
}
