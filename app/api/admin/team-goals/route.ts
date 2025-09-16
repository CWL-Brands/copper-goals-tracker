import { NextRequest, NextResponse } from 'next/server';
import { db, doc, setDoc, serverTimestamp } from '@/lib/firebase/db';
import { collections } from '@/lib/firebase/db';

// POST /api/admin/team-goals
// Secured by header x-admin-pass which must match process.env.TEAM_ADMIN_PASS
export async function POST(request: NextRequest) {
  try {
    const pass = request.headers.get('x-admin-pass') || '';
    const expected = process.env.TEAM_ADMIN_PASS || '';
    if (!expected) {
      return NextResponse.json({ error: 'Server missing TEAM_ADMIN_PASS' }, { status: 500 });
    }
    if (pass !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await setDoc(doc(db, collections.settings, 'team_goals'), {
      ...body,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update team goals' }, { status: 500 });
  }
}
