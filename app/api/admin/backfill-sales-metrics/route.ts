import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAdminEmails(): string[] {
  const env = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '';
  return env.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

async function requireAdmin(req: NextRequest) {
  // Option 1: SYNC_SECRET header
  const syncSecret = process.env.SYNC_SECRET || '';
  const providedSecret = (req.headers.get('x-sync-secret') || req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (syncSecret && providedSecret && providedSecret === syncSecret) {
    return { email: 'sync@internal' } as any;
  }

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

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const end = body?.end ? new Date(body.end) : new Date();
    const start = body?.start ? new Date(body.start) : new Date(new Date().setDate(end.getDate() - 90));
    const origin = new URL(req.url).origin;

    // Find all users with role == 'sales'
    const usersSnap = await adminDb.collection('users').where('role', '==', 'sales').get();
    const salesUsers = usersSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).filter(u => !!u.email);

    let processed = 0;
    let ok = 0;
    let failed = 0;
    const details: Array<{ userId: string; email: string; status: number; warnings?: string[]; error?: string }> = [];

    for (const u of salesUsers) {
      processed++;
      try {
        const res = await fetch(`${origin}/api/sync-metrics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: u.id,
            period: 'custom',
            start: start.toISOString(),
            end: end.toISOString(),
            copperUserEmail: u.email,
          }),
        });
        const data: any = await res.json().catch(() => ({}));
        if (!res.ok) {
          failed++;
          details.push({ userId: u.id, email: u.email, status: res.status, error: data?.error || 'sync failed' });
        } else {
          ok++;
          const warnings: string[] = data?.metrics?.warnings || [];
          details.push({ userId: u.id, email: u.email, status: res.status, warnings });
        }
      } catch (e: any) {
        failed++;
        details.push({ userId: u.id, email: u.email, status: 0, error: e?.message || String(e) });
      }
      // Gentle pacing to avoid rate limits
      await new Promise(r => setTimeout(r, 600));
    }

    return NextResponse.json({ success: true, processed, ok, failed, window: { start: start.toISOString(), end: end.toISOString() }, details });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Batch backfill failed' }, { status: 500 });
  }
}
