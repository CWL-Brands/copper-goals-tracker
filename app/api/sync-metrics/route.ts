import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  getOpportunityValue,
  getOpportunityStageId,
  getSaleType,
  PIPELINE_CONFIG,
  ACTIVITY_TYPE_IDS,
} from '@/lib/copper/field-mappings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COPPER_API_BASE = 'https://api.copper.com/developer_api/v1';
const COPPER_API_KEY = process.env.COPPER_API_KEY!;
const COPPER_USER_EMAIL = process.env.COPPER_USER_EMAIL!;

function getDateRange(period: 'today' | 'week' | 'month' = 'today', startISO?: string, endISO?: string) {
  const now = new Date();
  const start = startISO ? new Date(startISO) : new Date(now);
  const end = endISO ? new Date(endISO) : now;
  if (!startISO) {
    if (period === 'today') start.setHours(0, 0, 0, 0);
    if (period === 'week') start.setDate(now.getDate() - 7);
    if (period === 'month') start.setMonth(now.getMonth() - 1);
  }
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    startUnix: Math.floor(start.getTime() / 1000),
    endUnix: Math.floor(end.getTime() / 1000),
  };
}

// POST /api/sync-metrics - Sync metrics from Copper
export async function POST(request: NextRequest) {
  try {
    const { userId: providedUserId, period = 'today', start, end, copperUserEmail } = await request.json();
    
    // Look up user by email if userId not provided
    let userId = providedUserId;
    if (!userId && copperUserEmail) {
      const usersSnapshot = await adminDb.collection('users')
        .where('email', '==', copperUserEmail)
        .limit(1)
        .get();
      
      if (!usersSnapshot.empty) {
        userId = usersSnapshot.docs[0].id;
        console.log(`[Sync Metrics] Found user ${userId} for email ${copperUserEmail}`);
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID or email required' }, { status: 400 });
    }

    // Helper: robust fetch with retry/backoff on 429/5xx
    async function fetchWithRetry(url: string, init: RequestInit, retries = 4, baseDelayMs = 400): Promise<Response> {
      let attempt = 0;
      let lastErr: any = null;
      while (attempt <= retries) {
        const res = await fetch(url, init);
        if (res.ok) return res;
        // Retry on 429 or 5xx
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          const delay = Math.min(5000, baseDelayMs * Math.pow(2, attempt));
          await new Promise(r => setTimeout(r, delay));
          attempt++;
          continue;
        }
        lastErr = new Error(`${url} -> ${res.status}`);
        break;
      }
      throw lastErr || new Error('Copper request failed');
    }

    // Helper: load Copper users map (email -> id) and cache in Firestore
    async function getCopperUsersMap(): Promise<Record<string, number>> {
      const mapDoc = adminDb.collection('settings').doc('copper_users_map');
      try {
        const snap = await mapDoc.get();
        const data = snap.exists ? (snap.data() as any) : null;
        const byEmail: Record<string, number> = data?.byEmail || {};
        const updatedAt = data?.updatedAt ? new Date(data.updatedAt) : null;
        const fresh = updatedAt ? (Date.now() - updatedAt.getTime()) < 24*60*60*1000 : false; // 24h cache
        if (Object.keys(byEmail).length && fresh) return byEmail;
      } catch {}

      // Refresh from Copper
      const res = await fetchWithRetry(`${COPPER_API_BASE}/users`, {
        method: 'GET',
        headers: {
          'X-PW-AccessToken': COPPER_API_KEY,
          'X-PW-Application': 'developer_api',
          'X-PW-UserEmail': pwUserEmail,
        },
      });
      const arr = res.ok ? await res.json() : [];
      const byEmail: Record<string, number> = {};
      if (Array.isArray(arr)) {
        for (const u of arr) {
          const em = String(u?.email || '').toLowerCase().trim();
          const id = Number(u?.id);
          if (em && id) byEmail[em] = id;
        }
      }
      try {
        await mapDoc.set({ byEmail, updatedAt: new Date().toISOString() }, { merge: true });
      } catch {}
      return byEmail;
    }

    // Defer resolving owner until after userSettings and results are defined

    // Optional SYNC_SECRET check for privileged calls (e.g., Cloud Scheduler)
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const secretOk = !!process.env.SYNC_SECRET && token === process.env.SYNC_SECRET;

    // Load org-wide defaults (Admin SDK)
    let orgDefaults: any = {};
    try {
      const orgSnap = await adminDb.collection('settings').doc('copper_metadata').get();
      if (orgSnap.exists) orgDefaults = (orgSnap.data() as any)?.defaults || {};
    } catch {}

    // Load per-user settings (overrides) via Admin SDK
    let userSettings: any = {};
    try {
      const settingsSnap = await adminDb.collection('settings').doc(userId).get();
      if (settingsSnap.exists) userSettings = settingsSnap.data();
    } catch {}

    const dateRange = getDateRange(period, start, end);
    const results = {
      emails: 0,
      calls: 0,
      talkTime: 0,
      stages: {} as Record<string, number>,
      sales: { wholesale: 0, distribution: 0, total: 0 },
      warnings: [] as string[],
    };

    // Use ORG-WIDE identity for Copper calls for consistent visibility
    // Prefer orgDefaults.copperUserEmail or env COPPER_USER_EMAIL; ignore per-user overrides for identity
    let pwUserEmail = String(orgDefaults?.copperUserEmail || COPPER_USER_EMAIL || '').trim();
    if (!pwUserEmail) {
      // fallback to request-provided override only if env/default is missing
      pwUserEmail = String(copperUserEmail || '').trim();
    }

    // Resolve activity type IDs from settings (fallback defaults)
    let emailActivityId = Number(
      userSettings?.emailActivityId ?? orgDefaults?.emailActivityId ?? 0
    );
    let phoneCallActivityId = Number(
      userSettings?.phoneCallActivityId ?? orgDefaults?.phoneCallActivityId ?? 0
    );

    // Track categories for filters (Copper expects id + category)
    let emailCategory: 'user' | 'system' | undefined = (orgDefaults?.emailActivityCategory as any) || undefined;
    let phoneCategory: 'user' | 'system' | undefined = (orgDefaults?.phoneCallActivityCategory as any) || undefined;

    // Fallback: derive from Copper activity_types when not configured
    if (!emailActivityId || !phoneCallActivityId) {
      try {
        const res = await fetchWithRetry(`${COPPER_API_BASE}/activity_types`, {
          method: 'GET',
          headers: {
            'X-PW-AccessToken': COPPER_API_KEY,
            'X-PW-Application': 'developer_api',
            'X-PW-UserEmail': pwUserEmail,
          },
        });
        const types = await res.json();
        if (Array.isArray(types)) {
          const nameMatch = (t: any, kw: RegExp) => kw.test(String(t?.name || '').toLowerCase());
          if (!emailActivityId) {
            const sysEmail = types.find((t: any) => nameMatch(t,/email/) && String(t?.category)==='system');
            const userEmail = types.find((t: any) => nameMatch(t,/email/) && String(t?.category)==='user');
            emailActivityId = Number((sysEmail?.id ?? userEmail?.id) || 0) || 0;
            emailCategory = (sysEmail ? 'system' : (userEmail ? 'user' : undefined)) as any;
          }
          if (!phoneCallActivityId) {
            const userCall = types.find((t: any) => nameMatch(t,/phone|call/) && String(t?.category)==='user');
            phoneCallActivityId = Number((userCall?.id) || 0) || 0;
            phoneCategory = userCall ? 'user' : undefined;
          }
          // If defaults existed but categories unknown, try to map by id
          if (!emailCategory && emailActivityId) {
            const t = types.find((t:any)=> Number(t?.id)===emailActivityId);
            if (t) emailCategory = t.category;
          }
          if (!phoneCategory && phoneCallActivityId) {
            const t = types.find((t:any)=> Number(t?.id)===phoneCallActivityId);
            if (t) phoneCategory = t.category;
          }
        }
      } catch {
        // keep defaults; email/call sync may warn if still 0
      }
    }

    // pwUserEmail already resolved above

    // Map Firebase user -> Copper owner id using cached users map
    const usersMap = await getCopperUsersMap();
    let ownerEmail = String(userSettings?.copperUserEmail || copperUserEmail || '').trim().toLowerCase();
    if (!ownerEmail) {
      try {
        const uSnap = await adminDb.collection('users').doc(userId).get();
        ownerEmail = String((uSnap.data()?.email || '')).toLowerCase().trim();
      } catch {}
    }
    const ownerId: number | undefined = ownerEmail ? usersMap[ownerEmail] : undefined;
    if (!ownerId) {
      results.warnings.push(`⚠️ No Copper user ID found for ${ownerEmail || 'unknown email'}`);
    }

    // Helper: idempotent metric write using deterministic doc id per user+type+day+source
    async function logMetricAdmin(metric: { userId: string; type: string; value: number; date: Date; source?: string; metadata?: any; }) {
      const src = metric.source || 'copper';
      const d = new Date(metric.date);
      // Store at noon UTC to avoid timezone issues (consistent with JustCall sync)
      const dayKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const [year, month, day] = dayKey.split('-').map(Number);
      const metricDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      
      const docId = `${metric.userId}_${metric.type}_${dayKey}_${src}`;
      const ref = adminDb.collection('metrics').doc(docId);
      await ref.set({
        id: docId,
        userId: metric.userId,
        type: metric.type,
        value: metric.value,
        date: Timestamp.fromDate(metricDate),
        source: src,
        metadata: metric.metadata || {},
        // Only set createdAt if not present; merge keeps existing
        createdAt: Timestamp.fromDate(new Date()),
      }, { merge: true });
      return docId;
    }

    // Helper to perform paginated search POSTs to Copper
    async function fetchAll(endpoint: string, body: any) {
      const all: any[] = [];
      const pageSize = Number(body?.page_size) || 200;
      let page = 1;
      while (true) {
        const res = await fetchWithRetry(`${COPPER_API_BASE}${endpoint}`, {
          method: 'POST',
          headers: {
            'X-PW-AccessToken': COPPER_API_KEY,
            'X-PW-Application': 'developer_api',
            'X-PW-UserEmail': pwUserEmail,
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
        if (page > 50) break; // safety cap
      }
      return all;
    }

    // Normalize activity timestamp (prefer activity_date seconds; fallback to created/modified)
    function activitySeconds(a: any): number | undefined {
      const sec = typeof a?.activity_date === 'number' ? a.activity_date : undefined;
      if (typeof sec === 'number' && sec > 0) return sec;
      if (a?.date_created) return Math.floor(new Date(a.date_created).getTime() / 1000);
      if (a?.date_modified) return Math.floor(new Date(a.date_modified).getTime() / 1000);
      return undefined;
    }

    // 1) Emails
    try {
      if (!ownerId) throw new Error(`Skip emails: no Copper owner mapped for ${ownerEmail || 'unknown'}`);
      // Safety: if we cannot resolve an email activity id + category, skip to avoid counting ALL activities as emails
      if (!emailActivityId) throw new Error('Skip emails: emailActivityId not configured or discovered');
      if (!emailCategory) {
        // Default to system for emails if unknown; if still unknown, skip
        emailCategory = 'system' as any;
      }
      if (!emailCategory) throw new Error('Skip emails: email activity category unknown');
      
      console.log(`[Sync Metrics] Fetching emails for user ${ownerEmail} (ID: ${ownerId})`);
      console.log(`[Sync Metrics] Email activity type: ${emailActivityId} (${emailCategory})`);
      console.log(`[Sync Metrics] Date range: ${new Date(dateRange.startUnix * 1000).toISOString()} to ${new Date(dateRange.endUnix * 1000).toISOString()}`);
      
      const emailData = await fetchAll('/activities/search', {
        sort_by: 'activity_date',
        sort_direction: 'desc',
        full_result: true,
        activity_types: [{ id: emailActivityId, category: emailCategory }],
        user_ids: [ownerId], // Filter by user who performed the activity
        minimum_activity_date: dateRange.startUnix,
        maximum_activity_date: dateRange.endUnix,
      });
      
      console.log(`[Sync Metrics] Found ${emailData.length} email activities`);
      
      if (Array.isArray(emailData)) {
        results.emails = emailData.length || 0;
        if (results.emails > 0) {
          const byDay: Record<string, number> = {};
          for (const a of emailData) {
            const tsSec = activitySeconds(a);
            if (!tsSec) continue;
            const d = new Date(tsSec * 1000);
            d.setHours(0, 0, 0, 0);
            const key = d.toISOString();
            byDay[key] = (byDay[key] || 0) + 1;
          }
          console.log(`[Sync Metrics] Email breakdown by day:`, byDay);
          for (const [isoDay, count] of Object.entries(byDay)) {
            await logMetricAdmin({
              userId,
              type: 'email_quantity',
              value: count,
              date: new Date(isoDay),
              source: 'copper',
              metadata: { period, bucketed: true, syncedAt: new Date().toISOString(), ownerId, ownerEmail },
            });
          }
        }
      }
    } catch (e:any) {
      console.error(`[Sync Metrics] Email sync error:`, e);
      results.warnings.push(`⚠️ Email sync failed: ${e?.message}`);
    }

    // 2) Calls (count and minutes)
    try {
      if (!ownerId) throw new Error(`Skip calls: no Copper owner mapped for ${ownerEmail || 'unknown'}`);
      // Safety: if we cannot resolve a phone call activity id + category, skip to avoid miscounting
      if (!phoneCallActivityId) throw new Error('Skip calls: phoneCallActivityId not configured or discovered');
      if (!phoneCategory) phoneCategory = 'user';
      if (!phoneCategory) throw new Error('Skip calls: phone call activity category unknown');
      const callData = await fetchAll('/activities/search', {
        sort_by: 'activity_date',
        sort_direction: 'desc',
        full_result: true,
        activity_types: [{ id: phoneCallActivityId, category: phoneCategory }],
        ...(ownerId ? { user_ids: [ownerId] } : {}),
        minimum_activity_date: dateRange.startUnix,
        maximum_activity_date: dateRange.endUnix,
      });
      if (Array.isArray(callData)) {
        results.calls = callData.length || 0;
        const byDay: Record<string, { count: number; minutes: number }> = {};
        for (const call of callData) {
          const tsSec = activitySeconds(call);
          if (!tsSec) continue;
          const d = new Date(tsSec * 1000);
          d.setHours(0, 0, 0, 0);
          const key = d.toISOString();
          const dur = typeof call.duration === 'number' ? call.duration : 0;
          byDay[key] = byDay[key] || { count: 0, minutes: 0 };
          byDay[key].count += 1;
          byDay[key].minutes += dur;
        }
        for (const [isoDay, info] of Object.entries(byDay)) {
          await logMetricAdmin({
            userId,
            type: 'phone_call_quantity' as any,
            value: info.count,
            date: new Date(isoDay),
            source: 'copper',
            metadata: { minutes: info.minutes, period, bucketed: true, syncedAt: new Date().toISOString() },
          });
          if (info.minutes > 0) {
            await logMetricAdmin({
              userId,
              type: 'talk_time_minutes' as any,
              value: info.minutes,
              date: new Date(isoDay),
              source: 'copper',
              metadata: { callCount: info.count, period, bucketed: true, syncedAt: new Date().toISOString() },
            });
          }
        }
        results.talkTime = results.calls;
      } else {
        results.warnings.push('Call sync unavailable');
      }
    } catch (e:any) {
      results.warnings.push(e?.message || 'Call sync failed');
    }

    // 3) Pipeline stages and sales
    try {
      if (!ownerId) throw new Error(`Skip pipeline: no Copper owner mapped for ${ownerEmail || 'unknown'}`);
      const baseBody: any = {
        sort_by: 'name', // Copper doesn't support sort_by close_date, use name instead
        sort_direction: 'asc',
        pipeline_ids: [Number(orgDefaults?.SALES_PIPELINE_ID ?? PIPELINE_CONFIG.SALES_PIPELINE_ID)],
        // Filter by close_date within the sync window
        minimum_close_date: dateRange.startUnix,
        maximum_close_date: dateRange.endUnix,
      };

      async function searchOpps(body: any) {
        const res = await fetch(`${COPPER_API_BASE}/opportunities/search`, {
          method: 'POST',
          headers: {
            'X-PW-AccessToken': COPPER_API_KEY,
            'X-PW-Application': 'developer_api',
            'X-PW-UserEmail': pwUserEmail,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text().catch(()=> '');
          const err = new Error(`${COPPER_API_BASE}/opportunities/search -> ${res.status} ${text}`);
          // Bubble up for fallback
          // @ts-ignore
          err.status = res.status;
          throw err;
        }
        const arr = await res.json().catch(()=>[]);
        return Array.isArray(arr) ? arr : [];
      }

      let opps: any[] = [];
      
      // Try multiple filter strategies - Copper API is inconsistent
      const filterStrategies = [
        { name: 'assignee_ids', body: { ...baseBody, assignee_ids: [ownerId] } },
        { name: 'owner_id', body: { ...baseBody, owner_id: ownerId } },
      ];
      
      let filterUsed = 'none';
      for (const strategy of filterStrategies) {
        try {
          opps = await searchOpps(strategy.body);
          filterUsed = strategy.name;
          break; // Success!
        } catch (e: any) {
          if (e?.status !== 422) throw e; // Real error, not just wrong param
          // 422 = wrong parameter, try next strategy
        }
      }
      
      if (filterUsed === 'none') {
        // All filters failed, get all opportunities and filter manually
        const allOpps = await searchOpps(baseBody);
        opps = allOpps.filter((o: any) => {
          const oppOwnerId = o?.assignee_id || o?.owner_id || o?.user_id;
          return oppOwnerId === ownerId;
        });
        filterUsed = 'manual_filter';
        results.warnings.push(`⚠️ API filters failed - manually filtered ${allOpps.length} opps to ${opps.length} for user ${ownerId}`);
      }

      if (Array.isArray(opps)) {
        // Build stage id -> name map from /pipelines for reliable naming
        let stageMap: Record<string, string> = {};
        try {
          const resP = await fetchWithRetry(`${COPPER_API_BASE}/pipelines`, {
            method: 'GET',
            headers: {
              'X-PW-AccessToken': COPPER_API_KEY,
              'X-PW-Application': 'developer_api',
              'X-PW-UserEmail': pwUserEmail,
            },
          });
          const pipelines = await resP.json().catch(() => []);
          if (Array.isArray(pipelines)) {
            const targetPipelineId = Number(orgDefaults?.SALES_PIPELINE_ID ?? PIPELINE_CONFIG.SALES_PIPELINE_ID);
            const targetPipeline = pipelines.find((p: any) => Number(p?.id) === targetPipelineId);
            const stages = targetPipeline?.stages || [];
            for (const s of stages) {
              if (s?.id && s?.name) stageMap[String(s.id)] = String(s.name);
            }
          }
        } catch (e: any) {
          results.warnings.push(`⚠️ Failed to load pipeline stages: ${e?.message}`);
        }
        const stageCounts: Record<string, number> = {
          lead_progression_a: 0,
          lead_progression_b: 0,
          lead_progression_c: 0,
        };
        let wholesale = 0;
        let distribution = 0;
        let directToConsumer = 0;
        for (const opp of opps) {
          // Use helper function to get stage ID
          const sid = getOpportunityStageId(opp);
          const candidateName = opp?.stage_name ?? opp?.stage?.name;
          const stageName = (sid && stageMap[sid]) ? stageMap[sid] : (candidateName ? String(candidateName) : undefined);
          
          const STAGE_MAPPING = orgDefaults?.STAGE_MAPPING || PIPELINE_CONFIG.STAGE_MAPPING;
          if (stageName && STAGE_MAPPING[stageName]) {
            const metricType = STAGE_MAPPING[stageName];
            stageCounts[metricType] = (stageCounts[metricType] || 0) + 1;
          }
          
          const CLOSED_WON_STAGES: string[] = Array.isArray(orgDefaults?.CLOSED_WON_STAGES)
            ? orgDefaults.CLOSED_WON_STAGES
            : PIPELINE_CONFIG.CLOSED_WON_STAGES;
          
          if (stageName && CLOSED_WON_STAGES.includes(stageName)) {
            // Use helper function to get value
            const value = getOpportunityValue(opp);
            const oppName = opp?.name || 'Unknown';
            
            if (value > 0) {
              // Use helper function to get Sale Type
              const saleType = getSaleType(opp);
              
              if (saleType === 'wholesale') {
                wholesale += value;
              } else if (saleType === 'distribution') {
                distribution += value;
              } else if (saleType === 'direct-to-consumer') {
                directToConsumer += value;
              } else {
                results.warnings.push(`⚠️ Opp "${oppName}" ($${value}) missing Sale Type - not counted`);
              }
            }
          }
        }
        for (const [metricType, count] of Object.entries(stageCounts)) {
          if (count > 0) {
            await logMetricAdmin({ userId, type: metricType as any, value: count, date: new Date(dateRange.end), source: 'copper', metadata: { period, syncedAt: new Date().toISOString() } });
          }
        }
        if (wholesale > 0) {
          await logMetricAdmin({ userId, type: 'new_sales_wholesale', value: Math.round(wholesale), date: new Date(dateRange.end), source: 'copper', metadata: { period, syncedAt: new Date().toISOString() } });
        }
        if (distribution > 0) {
          await logMetricAdmin({ userId, type: 'new_sales_distribution', value: Math.round(distribution), date: new Date(dateRange.end), source: 'copper', metadata: { period, syncedAt: new Date().toISOString() } });
        }
        results.stages = stageCounts;
        results.sales = { wholesale: Math.round(wholesale), distribution: Math.round(distribution), total: Math.round(wholesale + distribution) };
      } else {
        results.warnings.push('Pipeline sync unavailable');
      }
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : 'Pipeline sync failed';
      results.warnings.push(msg);
    }

    // Persist lastSyncAt per user
    try {
      await adminDb.collection('settings').doc(userId).set({ lastSyncAt: new Date().toISOString() }, { merge: true });
    } catch {}

    return NextResponse.json({ success: true, userId, period, start: dateRange.start, end: dateRange.end, metrics: results });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Sync failed' }, { status: 500 });
  }
}