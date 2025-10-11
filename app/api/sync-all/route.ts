import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for long syncs

/**
 * POST /api/sync-all
 * Master sync orchestrator - syncs personal metrics (Copper + JustCall)
 * 
 * This endpoint:
 * 1. Syncs Copper (emails, calls, leads, pipeline)
 * 2. Syncs JustCall (calls, talk time)
 * 3. Updates all goals once at the end
 * 
 * Note: Fishbowl sync is separate (admin-only, manual 3-step process)
 * 
 * Benefits:
 * - Automated background sync
 * - Guaranteed order of operations
 * - Single goal update (efficient)
 * - Unified error handling
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    // Get date range from request (default: last 30 days)
    const { start, end } = await req.json().catch(() => ({}));
    const endDate = end ? new Date(end) : new Date();
    const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log(`[Sync All] Starting master sync for user ${userId}`);
    console.log(`[Sync All] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const results = {
      copper: null as any,
      justcall: null as any,
      goalsUpdated: 0,
      errors: [] as string[],
    };

    // ========================================
    // 1. SYNC COPPER (Emails, Calls, Leads)
    // ========================================
    console.log('[Sync All] Step 1/2: Syncing Copper...');
    try {
      const copperRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/sync-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          period: 'custom',
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        }),
      });

      if (copperRes.ok) {
        results.copper = await copperRes.json();
        console.log('[Sync All] ✅ Copper sync complete');
      } else {
        const error = await copperRes.text();
        results.errors.push(`Copper sync failed: ${error}`);
        console.error('[Sync All] ❌ Copper sync failed:', error);
      }
    } catch (e: any) {
      results.errors.push(`Copper sync error: ${e.message}`);
      console.error('[Sync All] ❌ Copper sync error:', e);
    }

    // ========================================
    // 2. SYNC JUSTCALL (Calls, Talk Time)
    // ========================================
    console.log('[Sync All] Step 2/2: Syncing JustCall...');
    try {
      const justcallRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/sync-justcall-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (justcallRes.ok) {
        results.justcall = await justcallRes.json();
        console.log('[Sync All] ✅ JustCall sync complete');
      } else {
        const error = await justcallRes.text();
        // Don't treat as error if user not found in JustCall
        if (error.includes('not found') || error.includes('No email')) {
          console.log('[Sync All] ⚠️  User not found in JustCall, skipping');
          results.justcall = { skipped: true, reason: 'User not found in JustCall' };
        } else {
          results.errors.push(`JustCall sync failed: ${error}`);
          console.error('[Sync All] ❌ JustCall sync failed:', error);
        }
      }
    } catch (e: any) {
      results.errors.push(`JustCall sync error: ${e.message}`);
      console.error('[Sync All] ❌ JustCall sync error:', e);
    }

    // ========================================
    // 3. UPDATE GOALS (Single Update)
    // ========================================
    console.log('[Sync All] Updating goals...');
    try {
      const goalsSnapshot = await adminDb.collection('goals').where('userId', '==', userId).get();
      
      for (const goalDoc of goalsSnapshot.docs) {
        const goal = goalDoc.data();
        
        // Calculate period boundaries
        const now = new Date();
        let periodStart: Date;
        let periodEnd: Date;

        switch (goal.period) {
          case 'daily':
            periodStart = new Date(now);
            periodStart.setHours(0, 0, 0, 0);
            periodEnd = new Date(now);
            periodEnd.setHours(23, 59, 59, 999);
            break;
          case 'weekly':
            periodStart = new Date(now);
            periodStart.setDate(now.getDate() - now.getDay() + 1);
            periodStart.setHours(0, 0, 0, 0);
            periodEnd = new Date(periodStart);
            periodEnd.setDate(periodStart.getDate() + 6);
            periodEnd.setHours(23, 59, 59, 999);
            break;
          case 'monthly':
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
          case 'quarterly':
            const quarter = Math.floor(now.getMonth() / 3);
            periodStart = new Date(now.getFullYear(), quarter * 3, 1);
            periodEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
            break;
          default:
            continue;
        }

        // Query metrics for this goal type and period
        const metricsSnapshot = await adminDb
          .collection('metrics')
          .where('userId', '==', userId)
          .where('type', '==', goal.type)
          .where('date', '>=', periodStart)
          .where('date', '<=', periodEnd)
          .get();

        // Sum up the metric values
        let totalValue = 0;
        for (const metricDoc of metricsSnapshot.docs) {
          const metric = metricDoc.data();
          totalValue += Number(metric.value || 0);
        }

        // Update the goal's current value
        await adminDb.collection('goals').doc(goalDoc.id).update({
          current: totalValue,
          updatedAt: new Date(),
        });

        results.goalsUpdated++;
      }
      
      console.log(`[Sync All] ✅ Updated ${results.goalsUpdated} goals`);
    } catch (e: any) {
      results.errors.push(`Goal update error: ${e.message}`);
      console.error('[Sync All] ❌ Goal update error:', e);
    }

    // ========================================
    // 5. RETURN RESULTS
    // ========================================
    const duration = Date.now() - startTime;
    console.log(`[Sync All] Complete in ${duration}ms`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      userId,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      results,
      summary: {
        copperSuccess: !!results.copper,
        justcallSuccess: !!results.justcall,
        goalsUpdated: results.goalsUpdated,
        errors: results.errors.length,
      },
    });

  } catch (error: any) {
    console.error('[Sync All] Fatal error:', error);
    return NextResponse.json(
      { error: error?.message || 'Master sync failed' },
      { status: 500 }
    );
  }
}
