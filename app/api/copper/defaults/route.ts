import { NextRequest, NextResponse } from 'next/server';
import { db, doc, getDoc, setDoc } from '@/lib/firebase/db';

// Manage org-wide Copper defaults stored in settings/copper_metadata.defaults

export async function GET() {
  try {
    const ref = doc(db, 'settings', 'copper_metadata');
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};
    return NextResponse.json({ success: true, defaults: (data as any).defaults || {} });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const defaults = body?.defaults || {};
    await setDoc(doc(db, 'settings', 'copper_metadata'), { defaults, updatedAt: new Date().toISOString() }, { merge: true });
    return NextResponse.json({ success: true, saved: true, defaults });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}
