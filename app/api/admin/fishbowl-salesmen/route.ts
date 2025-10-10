import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
 * GET /api/admin/fishbowl-salesmen
 * Get unique list of Fishbowl salesmen from orders
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Fishbowl Salesmen] Querying fishbowl_customers for salesPerson field...');
    
    // Get unique salesmen from customers (more reliable than orders)
    const customersSnapshot = await adminDb
      .collection('fishbowl_customers')
      .limit(5000) // Get more customers
      .get();

    console.log('[Fishbowl Salesmen] Found', customersSnapshot.docs.length, 'customers');

    const salesmenSet = new Set<string>();
    
    for (const doc of customersSnapshot.docs) {
      const customer = doc.data();
      const salesPerson = customer.salesPerson;
      
      if (salesPerson && typeof salesPerson === 'string' && salesPerson.trim()) {
        salesmenSet.add(salesPerson.trim());
      }
    }

    const salesmen = Array.from(salesmenSet).sort();

    console.log('[Fishbowl Salesmen] Found unique salesmen:', salesmen);

    return NextResponse.json({
      salesmen,
      count: salesmen.length,
      totalCustomers: customersSnapshot.docs.length,
    });
  } catch (error: any) {
    console.error('[Fishbowl Salesmen] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to get salesmen' },
      { status: 500 }
    );
  }
}
