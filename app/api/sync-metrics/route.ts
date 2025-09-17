import { NextRequest, NextResponse } from 'next/server';
import { metricService } from '@/lib/firebase/services';
import { db, doc, getDoc } from '@/lib/firebase/db';
import { collections } from '@/lib/firebase/db';

const COPPER_API_BASE = 'https://api.copper.com/developer_api/v1';
const COPPER_API_KEY = process.env.COPPER_API_KEY!;
const COPPER_USER_EMAIL = process.env.COPPER_USER_EMAIL!;

// User-provided pipeline configuration
const PIPELINE_CONFIG = {
  SALES_PIPELINE_ID: 1084986,
  STAGE_MAPPING: {
    'Fact Finding': 'lead_progression_a',
    'Contact Stage': 'lead_progression_b',
    'Closing Stage': 'lead_progression_c',
  } as Record<string, 'lead_progression_a' | 'lead_progression_b' | 'lead_progression_c'>,
  CLOSED_WON_STAGES: ['Payment Received/Invoice Created'],
  ACTIVE_SALES_STAGES: ['Order Confirmed', 'Closing Stage'],
  EARLY_STAGES: ['Opportunity', 'Fact Finding'],
  MID_STAGES: ['Present', 'Contact Stage', 'Samples'],
  LATE_STAGES: ['Onboarding', 'Closing Stage', 'Order Confirmed'],
};

const ACTIVITY_TYPES = {
  EMAIL: { id: 1, category: 'user' },
  PHONE_CALL: { id: 0, category: 'user' },
  MEETING: { id: 2, category: 'user' },
};

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
    const { userId, period = 'today', start, end, copperUserEmail } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Optional SYNC_SECRET check for privileged calls (e.g., Cloud Scheduler)
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const secretOk = !!process.env.SYNC_SECRET && token === process.env.SYNC_SECRET;

    // Load org-wide defaults
    let orgDefaults: any = {};
    try {
      const orgSnap = await getDoc(doc(db, 'settings', 'copper_metadata'));
      if (orgSnap.exists()) orgDefaults = (orgSnap.data() as any)?.defaults || {};
    } catch {}

    // Load per-user settings (overrides)
    let userSettings: any = {};
    try {
      const settingsSnap = await getDoc(doc(db, collections.settings, userId));
      if (settingsSnap.exists()) userSettings = settingsSnap.data();
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

    // Resolve activity type IDs from settings (fallback defaults)
    const emailActivityId = Number(
      userSettings?.emailActivityId ?? orgDefaults?.emailActivityId ?? ACTIVITY_TYPES.EMAIL.id
    );
    const phoneCallActivityId = Number(
      userSettings?.phoneCallActivityId ?? orgDefaults?.phoneCallActivityId ?? ACTIVITY_TYPES.PHONE_CALL.id
    );

    // Determine which Copper user email to query as (per-user override > request > env)
    let pwUserEmail = String(copperUserEmail || userSettings?.copperUserEmail || orgDefaults?.copperUserEmail || COPPER_USER_EMAIL || '').trim();
    if (!pwUserEmail) {
      try {
        const uSnap = await getDoc(doc(db, 'users', userId));
        pwUserEmail = String(uSnap.data()?.email || COPPER_USER_EMAIL || '').trim();
      } catch {}
    }

    // Helper to perform paginated search POSTs to Copper
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

    // 1) Emails
    try {
      const emailData = await fetchAll('/activities/search', {
        sort_by: 'activity_date',
        sort_direction: 'desc',
        activity_types: [{ id: emailActivityId, category: 'user' }],
        minimum_activity_date: dateRange.startUnix,
        maximum_activity_date: dateRange.endUnix,
      });
      if (Array.isArray(emailData)) {
        results.emails = emailData.length || 0;
        if (results.emails > 0) {
          await metricService.logMetric({
            userId,
            type: 'email_quantity',
            value: results.emails,
            date: new Date(),
            source: 'copper',
            metadata: { period, syncedAt: new Date().toISOString() },
          });
        }
      } else {
        results.warnings.push('Email sync unavailable');
      }
    } catch (e) {
      results.warnings.push('Email sync failed');
    }

    // 2) Calls and talk time
    try {
      const callData = await fetchAll('/activities/search', {
        sort_by: 'activity_date',
        sort_direction: 'desc',
        activity_types: [{ id: phoneCallActivityId, category: 'user' }],
        minimum_activity_date: dateRange.startUnix,
        maximum_activity_date: dateRange.endUnix,
      });
      if (Array.isArray(callData)) {
        results.calls = callData?.length || 0;
        let talk = 0;
        for (const call of callData || []) {
          const duration = typeof call.duration === 'number' ? call.duration : 5; // minutes fallback
          talk += duration;
        }
        results.talkTime = talk;
        if (talk > 0) {
          await metricService.logMetric({
            userId,
            type: 'talk_time',
            value: talk,
            date: new Date(),
            source: 'copper',
            metadata: { callCount: results.calls, period, syncedAt: new Date().toISOString() },
          });
        }
      } else {
        results.warnings.push('Call sync unavailable');
      }
    } catch (e) {
      results.warnings.push('Call sync failed');
    }

    // 3) Pipeline stages and sales
    try {
      const opps = await fetchAll('/opportunities/search', {
        sort_by: 'date_modified',
        sort_direction: 'desc',
        pipeline_ids: [Number(orgDefaults?.SALES_PIPELINE_ID ?? PIPELINE_CONFIG.SALES_PIPELINE_ID)],
      });
      if (Array.isArray(opps)) {
        const stageCounts: Record<string, number> = {
          lead_progression_a: 0,
          lead_progression_b: 0,
          lead_progression_c: 0,
        };
        let wholesale = 0;
        let distribution = 0;

        // Keyword-based channel mapping from settings
        const wholesaleKeywords: string[] = Array.isArray(userSettings?.wholesaleKeywords)
          ? userSettings.wholesaleKeywords
          : (typeof userSettings?.wholesaleKeywords === 'string'
            ? String(userSettings.wholesaleKeywords).split(',').map((s) => s.trim()).filter(Boolean)
            : ['Focus+Flow', 'Zoom']);
        const distributionKeywords: string[] = Array.isArray(userSettings?.distributionKeywords)
          ? userSettings.distributionKeywords
          : (typeof userSettings?.distributionKeywords === 'string'
            ? String(userSettings.distributionKeywords).split(',').map((s) => s.trim()).filter(Boolean)
            : []);

        for (const opp of opps || []) {
          const stageName = opp?.stage_name as string | undefined;
          const STAGE_MAPPING = orgDefaults?.STAGE_MAPPING || PIPELINE_CONFIG.STAGE_MAPPING;
          if (stageName && STAGE_MAPPING[stageName]) {
            const metricType = STAGE_MAPPING[stageName];
            stageCounts[metricType] = (stageCounts[metricType] || 0) + 1;
          }

          const CLOSED_WON_STAGES: string[] = Array.isArray(orgDefaults?.CLOSED_WON_STAGES) ? orgDefaults.CLOSED_WON_STAGES : PIPELINE_CONFIG.CLOSED_WON_STAGES;
          if (stageName && CLOSED_WON_STAGES.includes(stageName)) {
            const value = Number(opp?.monetary_value || 0);
            const customFields = opp?.custom_fields || [];
            const PRODUCT_FIELD_ID = Number(orgDefaults?.PRODUCT_FIELD_ID ?? 705070);
            const productField = customFields.find((f: any) => f.custom_field_definition_id === PRODUCT_FIELD_ID);
            if (value > 0) {
              if (productField?.value) {
                const pv = String(productField.value).toLowerCase();
                const isWholesale = wholesaleKeywords.some((k) => pv.includes(String(k).toLowerCase()));
                const isDistribution = distributionKeywords.some((k) => pv.includes(String(k).toLowerCase()));
                if (isWholesale && !isDistribution) {
                  wholesale += value;
                } else if (isDistribution && !isWholesale) {
                  distribution += value;
                } else {
                  // ambiguous or none matched: keep simple split
                  wholesale += value * 0.6;
                  distribution += value * 0.4;
                }
              } else {
                wholesale += value * 0.6;
                distribution += value * 0.4;
              }
            }
          }
        }

        // Log pipeline stage metrics
        for (const [metricType, count] of Object.entries(stageCounts)) {
          if (count > 0) {
            await metricService.logMetric({
              userId,
              type: metricType as any,
              value: count,
              date: new Date(),
              source: 'copper',
              metadata: { period, syncedAt: new Date().toISOString() },
            });
          }
        }

        if (wholesale > 0) {
          await metricService.logMetric({
            userId,
            type: 'new_sales_wholesale',
            value: Math.round(wholesale),
            date: new Date(),
            source: 'copper',
            metadata: { period, syncedAt: new Date().toISOString() },
          });
        }
        if (distribution > 0) {
          await metricService.logMetric({
            userId,
            type: 'new_sales_distribution',
            value: Math.round(distribution),
            date: new Date(),
            source: 'copper',
            metadata: { period, syncedAt: new Date().toISOString() },
          });
        }

        results.stages = stageCounts;
        results.sales = {
          wholesale: Math.round(wholesale),
          distribution: Math.round(distribution),
          total: Math.round(wholesale + distribution),
        };
      } else {
        results.warnings.push('Pipeline sync unavailable');
      }
    } catch (e) {
      results.warnings.push('Pipeline sync failed');
    }

    return NextResponse.json({
      success: true,
      metrics: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync metrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}