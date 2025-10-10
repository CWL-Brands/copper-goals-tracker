import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';

/**
 * POST /api/update-goal-progress
 * Recalculate goal progress from metrics
 * This should be called after syncing metrics to update goal.current values
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const { userId, goalId } = await req.json();

    const targetUserId = userId || decoded.uid;

    console.log('[Update Goal Progress] Starting for user:', targetUserId);

    // Get all active goals for this user
    const goalsSnapshot = await adminDb
      .collection('goals')
      .where('userId', '==', targetUserId)
      .get();

    if (goalsSnapshot.empty) {
      console.log('[Update Goal Progress] No goals found');
      return NextResponse.json({ 
        message: 'No goals to update',
        updated: 0 
      });
    }

    const now = new Date();
    let updated = 0;

    for (const goalDoc of goalsSnapshot.docs) {
      const goal = goalDoc.data();
      
      // Skip if specific goalId requested and this isn't it
      if (goalId && goalDoc.id !== goalId) continue;

      // Determine period boundaries
      let periodStart: Date;
      let periodEnd: Date;

      switch (goal.period) {
        case 'daily':
          periodStart = startOfDay(now);
          periodEnd = endOfDay(now);
          break;
        case 'weekly':
          periodStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
          periodEnd = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'monthly':
          periodStart = startOfMonth(now);
          periodEnd = endOfMonth(now);
          break;
        case 'quarterly':
          periodStart = startOfQuarter(now);
          periodEnd = endOfQuarter(now);
          break;
        default:
          console.warn('[Update Goal Progress] Unknown period:', goal.period);
          continue;
      }

      console.log(`[Update Goal Progress] Goal ${goalDoc.id} (${goal.type}, ${goal.period})`);
      console.log(`[Update Goal Progress] Period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);

      // Query metrics for this goal type and period
      const metricsSnapshot = await adminDb
        .collection('metrics')
        .where('userId', '==', targetUserId)
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

      console.log(`[Update Goal Progress] Found ${metricsSnapshot.docs.length} metrics, total value: ${totalValue}`);

      // Update the goal's current value
      await adminDb.collection('goals').doc(goalDoc.id).update({
        current: totalValue,
        updatedAt: new Date(),
      });

      updated++;
    }

    console.log(`[Update Goal Progress] Updated ${updated} goals`);

    return NextResponse.json({
      success: true,
      updated,
      message: `Updated ${updated} goal(s)`
    });

  } catch (error: any) {
    console.error('[Update Goal Progress] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update goal progress' },
      { status: 500 }
    );
  }
}
