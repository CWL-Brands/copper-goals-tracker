import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

const COPPER_API_BASE = 'https://api.copper.com/developer_api/v1';
const COPPER_API_KEY = process.env.COPPER_API_KEY!;
const COPPER_USER_EMAIL = process.env.COPPER_USER_EMAIL!;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function fetchAll(endpoint: string, body: any) {
  const all: any[] = [];
  const pageSize = Number(body?.page_size) || 200;
  let page = 1;
  while (true) {
    const res = await fetch(`${COPPER_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-PW-AccessToken': COPPER_API_KEY,
        'X-PW-Application': 'developer_api',
        'X-PW-UserEmail': COPPER_USER_EMAIL,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, page_number: page, page_size: pageSize }),
    });
    if (!res.ok) break;
    const chunk = await res.json();
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    all.push(...chunk);
    if (chunk.length < pageSize) break;
    page += 1;
    if (page > 10) break; // safety cap
  }
  return all;
}

async function gatherMetadata() {
  const userMe = await fetchJson(`${COPPER_API_BASE}/users/me`, {
    headers: {
      'X-PW-AccessToken': COPPER_API_KEY,
      'X-PW-Application': 'developer_api',
      'X-PW-UserEmail': COPPER_USER_EMAIL,
      'Content-Type': 'application/json',
    },
  });

  const customFieldDefinitions = await fetchJson(`${COPPER_API_BASE}/custom_field_definitions`, {
    headers: {
      'X-PW-AccessToken': COPPER_API_KEY,
      'X-PW-Application': 'developer_api',
      'X-PW-UserEmail': COPPER_USER_EMAIL,
      'Content-Type': 'application/json',
    },
  });

  // Sample recent activities (last 30 days) to discover activity_type_id values
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 30);
  const sampleActivities = await fetchAll('/activities/search', {
    sort_by: 'activity_date',
    sort_direction: 'desc',
    minimum_activity_date: Math.floor(start.getTime() / 1000),
    maximum_activity_date: Math.floor(now.getTime() / 1000),
    page_size: 100,
  });

  const activityTypeSummary: Record<string, number> = {};
  for (const a of sampleActivities) {
    const id = String(a?.activity_type_id ?? 'unknown');
    activityTypeSummary[id] = (activityTypeSummary[id] || 0) + 1;
  }

  return {
    fetchedAt: new Date().toISOString(),
    user: userMe,
    customFieldDefinitions,
    sampleActivitiesCount: Array.isArray(sampleActivities) ? sampleActivities.length : 0,
    activityTypeSummary,
  };
}

export async function GET(_req: NextRequest) {
  try {
    if (!COPPER_API_KEY || !COPPER_USER_EMAIL) {
      return NextResponse.json({ success: false, error: 'Server missing COPPER_API_KEY/COPPER_USER_EMAIL' }, { status: 500 });
    }
    const data = await gatherMetadata();
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(_req: NextRequest) {
  try {
    if (!COPPER_API_KEY || !COPPER_USER_EMAIL) {
      return NextResponse.json({ success: false, error: 'Server missing COPPER_API_KEY/COPPER_USER_EMAIL' }, { status: 500 });
    }
    const data = await gatherMetadata();
    // Save to Firestore org-wide metadata document using Admin SDK
    await adminDb.collection('settings').doc('copper_metadata').set(data, { merge: true });
    return NextResponse.json({ success: true, saved: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}
