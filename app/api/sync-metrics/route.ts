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

function getDateRange(period: 'today' | 'week' | 'month' = 'today') {
  const now = new Date();
  const start = new Date(now);
  if (period === 'today') start.setHours(0, 0, 0, 0);
  if (period === 'week') start.setDate(now.getDate() - 7);
  if (period === 'month') start.setMonth(now.getMonth() - 1);
  return {
    start: start.toISOString(),
    end: now.toISOString(),
    startUnix: Math.floor(start.getTime() / 1000),
    endUnix: Math.floor(now.getTime() / 1000),
  };
}

// POST /api/sync-metrics - Sync metrics from Copper
export async function POST(request: NextRequest) {
  try {
    const { userId, period = 'today' } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Optional SYNC_SECRET check for privileged calls (e.g., Cloud Scheduler)
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const secretOk = !!process.env.SYNC_SECRET && token === process.env.SYNC_SECRET;

    // Load per-user settings (overrides)
    let userSettings: any = {};
    try {
      const settingsSnap = await getDoc(doc(db, collections.settings, userId));
      if (settingsSnap.exists()) userSettings = settingsSnap.data();
    } catch {}

    const dateRange = getDateRange(period);
    const results = {
      emails: 0,
      calls: 0,
      talkTime: 0,
      stages: {} as Record<string, number>,
      sales: { wholesale: 0, distribution: 0, total: 0 },
      warnings: [] as string[],
    };

    // Resolve activity type IDs from settings (fallback defaults)
    const emailActivityId = Number(userSettings?.emailActivityId ?? ACTIVITY_TYPES.EMAIL.id);

    // 1) Emails
    try {
      const emailResponse = await fetch(`${COPPER_API_BASE}/activities/search`, {
        method: 'POST',
        headers: {
          'X-PW-AccessToken': COPPER_API_KEY,
          'X-PW-Application': 'developer_api',
          'X-PW-UserEmail': COPPER_USER_EMAIL,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_size: 200,
          sort_by: 'activity_date',
          sort_direction: 'desc',
          activity_types: [{ id: emailActivityId, category: 'user' }],
          minimum_activity_date: dateRange.startUnix,
          maximum_activity_date: dateRange.endUnix,
        }),
      });
      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        results.emails = emailData?.length || 0;
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
        results.warnings.push(`Email sync status ${emailResponse.status}`);
      }
    } catch (e) {
      results.warnings.push('Email sync failed');
    }

    // 2) Calls and talk time
    try {
      const callResponse = await fetch(`${COPPER_API_BASE}/activities/search`, {
        method: 'POST',
        headers: {
          'X-PW-AccessToken': COPPER_API_KEY,
          'X-PW-Application': 'developer_api',
          'X-PW-UserEmail': COPPER_USER_EMAIL,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_size: 200,
          sort_by: 'activity_date',
          sort_direction: 'desc',
          activity_types: [ACTIVITY_TYPES.PHONE_CALL],
          minimum_activity_date: dateRange.startUnix,
          maximum_activity_date: dateRange.endUnix,
        }),
      });
      if (callResponse.ok) {
        const callData = await callResponse.json();
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
      const oppResponse = await fetch(`${COPPER_API_BASE}/opportunities/search`, {
        method: 'POST',
        headers: {
          'X-PW-AccessToken': COPPER_API_KEY,
          'X-PW-Application': 'developer_api',
          'X-PW-UserEmail': COPPER_USER_EMAIL,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_size: 200,
          sort_by: 'date_modified',
          sort_direction: 'desc',
          pipeline_ids: [PIPELINE_CONFIG.SALES_PIPELINE_ID],
        }),
      });
      if (oppResponse.ok) {
        const opps = await oppResponse.json();
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
          if (stageName && PIPELINE_CONFIG.STAGE_MAPPING[stageName]) {
            const metricType = PIPELINE_CONFIG.STAGE_MAPPING[stageName];
            stageCounts[metricType] = (stageCounts[metricType] || 0) + 1;
          }

          if (stageName && PIPELINE_CONFIG.CLOSED_WON_STAGES.includes(stageName)) {
            const value = Number(opp?.monetary_value || 0);
            const customFields = opp?.custom_fields || [];
            const productField = customFields.find((f: any) => f.custom_field_definition_id === 705070);
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
        results.warnings.push(`Pipeline sync status ${oppResponse.status}`);
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