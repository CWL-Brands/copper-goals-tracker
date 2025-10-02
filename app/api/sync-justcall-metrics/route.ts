import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { createJustCallClient } from '@/lib/justcall/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Helper: Idempotent metric write using deterministic doc id per user+type+day+source
 * Pattern copied from sync-metrics/route.ts for consistency
 */
async function logMetricAdmin(metric: {
  userId: string;
  type: string;
  value: number;
  date: Date;
  source?: string;
  metadata?: any;
}) {
  const src = metric.source || 'justcall';
  const d = new Date(metric.date);
  d.setHours(0, 0, 0, 0);
  const dayKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
  const docId = `${metric.userId}_${metric.type}_${dayKey}_${src}`;
  const ref = adminDb.collection('metrics').doc(docId);
  
  await ref.set(
    {
      id: docId,
      userId: metric.userId,
      type: metric.type,
      value: metric.value,
      date: Timestamp.fromDate(d),
      source: src,
      metadata: metric.metadata || {},
      createdAt: Timestamp.fromDate(new Date()),
    },
    { merge: true }
  );
  
  return docId;
}

/**
 * POST /api/sync-justcall-metrics
 * Syncs JustCall call data to Firestore metrics collection
 * 
 * Body: {
 *   userId: string (required)
 *   startDate?: string (ISO format, defaults to 30 days ago)
 *   endDate?: string (ISO format, defaults to now)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, startDate, endDate } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Initialize JustCall client
    const justCallClient = createJustCallClient();
    if (!justCallClient) {
      return NextResponse.json(
        { error: 'JustCall API not configured' },
        { status: 500 }
      );
    }

    // Get user email from Firestore
    let userEmail: string | null = null;
    try {
      const userSnap = await adminDb.collection('users').doc(userId).get();
      if (userSnap.exists) {
        userEmail = String(userSnap.data()?.email || '').toLowerCase().trim();
      }
    } catch (error) {
      console.error('[JustCall Sync] Error fetching user:', error);
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      );
    }

    // Parse date range (default: last 30 days)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];

    console.log(`[JustCall Sync] Syncing calls for ${userEmail} from ${startDateStr} to ${endDateStr}`);

    // Fetch calls from JustCall
    const calls = await justCallClient.getCallsByUserEmail(
      userEmail,
      startDateStr,
      endDateStr
    );

    console.log(`[JustCall Sync] Found ${calls.length} calls for ${userEmail}`);

    // Results tracking
    const results = {
      userId,
      userEmail,
      startDate: startDateStr,
      endDate: endDateStr,
      totalCalls: calls.length,
      callsProcessed: 0,
      metricsWritten: 0,
      errors: [] as string[],
    };

    if (calls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No calls found for date range',
        ...results,
      });
    }

    // Bucket calls by day (same pattern as Copper sync)
    const byDay: Record<string, { count: number; seconds: number }> = {};

    for (const call of calls) {
      try {
        // Use call_user_date (user's timezone) instead of call_date (UTC)
        // This gives us the date the call actually happened in the user's local time
        const dateToUse = call.call_user_date || call.call_date;
        
        // Parse date - JustCall returns YYYY-MM-DD format
        // Extract just the date part (YYYY-MM-DD) in case there's time info
        const dayKey = dateToUse.split(' ')[0]; // Handle "YYYY-MM-DD HH:MM:SS" format
        
        console.log(`[JustCall Sync] Processing call ${call.id}: call_date=${call.call_date}, call_user_date=${call.call_user_date}, using=${dayKey}`);

        // Initialize day bucket
        if (!byDay[dayKey]) {
          byDay[dayKey] = { count: 0, seconds: 0 };
        }

        // Increment count
        byDay[dayKey].count += 1;

        // Add duration (total_duration is in seconds)
        const duration = call.call_duration?.total_duration || 0;
        byDay[dayKey].seconds += duration;

        results.callsProcessed += 1;
      } catch (error) {
        console.error('[JustCall Sync] Error processing call:', error);
        results.errors.push(`Failed to process call ${call.id}`);
      }
    }

    // Write metrics to Firestore (one per day per type)
    for (const [dayKey, info] of Object.entries(byDay)) {
      try {
        // Create date object from YYYY-MM-DD string
        const metricDate = new Date(dayKey + 'T00:00:00Z');
        
        // Write phone_call_quantity metric
        await logMetricAdmin({
          userId,
          type: 'phone_call_quantity',
          value: info.count,
          date: metricDate,
          source: 'justcall',
          metadata: {
            totalSeconds: info.seconds,
            averageSeconds: Math.round(info.seconds / info.count),
            syncedAt: new Date().toISOString(),
          },
        });
        results.metricsWritten += 1;

        // Write talk_time_minutes metric (convert seconds to minutes)
        if (info.seconds > 0) {
          const minutes = Math.round(info.seconds / 60);
          await logMetricAdmin({
            userId,
            type: 'talk_time_minutes',
            value: minutes,
            date: metricDate,
            source: 'justcall',
            metadata: {
              callCount: info.count,
              totalSeconds: info.seconds,
              syncedAt: new Date().toISOString(),
            },
          });
          results.metricsWritten += 1;
        }
      } catch (error) {
        console.error('[JustCall Sync] Error writing metrics for day:', dayKey, error);
        results.errors.push(`Failed to write metrics for ${dayKey}`);
      }
    }

    // Update goal progress from metrics
    try {
      // Get user's goals for current period
      const goalsSnapshot = await adminDb
        .collection('goals')
        .where('userId', '==', userId)
        .get();

      for (const goalDoc of goalsSnapshot.docs) {
        const goal = goalDoc.data();
        const goalType = goal.type;
        
        // Only update phone_call_quantity and talk_time_minutes goals
        if (goalType === 'phone_call_quantity' || goalType === 'talk_time_minutes') {
          // Get all metrics for this goal type in the goal's date range
          const metricsSnapshot = await adminDb
            .collection('metrics')
            .where('userId', '==', userId)
            .where('type', '==', goalType)
            .where('date', '>=', goal.startDate)
            .where('date', '<=', goal.endDate)
            .get();

          // Sum up the metric values
          let total = 0;
          metricsSnapshot.docs.forEach(doc => {
            total += Number(doc.data().value || 0);
          });

          // Update goal's current value
          await goalDoc.ref.update({
            current: total,
            updatedAt: Timestamp.now(),
          });

          console.log(`[JustCall Sync] Updated goal ${goalType} current value to ${total}`);
        }
      }
    } catch (error) {
      console.error('[JustCall Sync] Error updating goal progress:', error);
    }

    // Update lastSyncAt in user settings
    try {
      await adminDb
        .collection('settings')
        .doc(userId)
        .set(
          {
            lastJustCallSyncAt: new Date().toISOString(),
          },
          { merge: true }
        );
    } catch (error) {
      console.error('[JustCall Sync] Error updating lastSyncAt:', error);
    }

    console.log(`[JustCall Sync] Complete: ${results.metricsWritten} metrics written`);

    return NextResponse.json({
      success: true,
      message: `Synced ${results.callsProcessed} calls, wrote ${results.metricsWritten} metrics`,
      ...results,
    });
  } catch (error: any) {
    console.error('[JustCall Sync] Error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to sync JustCall metrics',
        details: error?.stack,
      },
      { status: 500 }
    );
  }
}
