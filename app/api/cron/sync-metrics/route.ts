import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * GET /api/cron/sync-metrics
 * Auto-sync endpoint - runs every 10 minutes via Vercel Cron
 * 
 * This endpoint:
 * 1. Gets all active users
 * 2. Syncs Copper + JustCall for each user
 * 3. Updates all goals
 * 
 * Security: Requires CRON_SECRET in Authorization header
 * 
 * Note: Fishbowl sync is separate (admin-only, manual)
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('[Cron Sync] CRON_SECRET not configured');
      return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron Sync] Unauthorized - invalid secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron Sync] Starting auto-sync for all active users');

    // Get all active users
    const usersSnapshot = await adminDb
      .collection('users')
      .where('isActive', '==', true)
      .get();

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      name: doc.data().name,
    }));

    console.log(`[Cron Sync] Found ${users.length} active users`);

    const results = [];
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    // Sync each user
    for (const user of users) {
      try {
        console.log(`[Cron Sync] Syncing ${user.email}...`);
        
        // Create a custom token for this user
        const customToken = await adminAuth.createCustomToken(user.id);
        
        // Exchange custom token for ID token
        // Note: In production, this would need Firebase Auth REST API
        // For now, we'll call the sync endpoint directly with admin privileges
        
        const result = await syncUserMetrics(user.id, startDate, endDate);
        
        results.push({
          userId: user.id,
          email: user.email,
          success: true,
          ...result,
        });
        
        console.log(`[Cron Sync] ✅ ${user.email} synced successfully`);
        
        // Rate limit: 500ms between users to avoid API throttling
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (e: any) {
        console.error(`[Cron Sync] ❌ Error syncing ${user.email}:`, e.message);
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: e.message,
        });
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[Cron Sync] Complete in ${duration}ms - ${successCount} success, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      totalUsers: users.length,
      successCount,
      failCount,
      results,
    });

  } catch (error: any) {
    console.error('[Cron Sync] Fatal error:', error);
    return NextResponse.json(
      { error: error?.message || 'Cron sync failed' },
      { status: 500 }
    );
  }
}

/**
 * Sync metrics for a single user (Copper + JustCall)
 */
async function syncUserMetrics(userId: string, startDate: Date, endDate: Date) {
  const results = {
    copper: null as any,
    justcall: null as any,
    goalsUpdated: 0,
    errors: [] as string[],
  };

  // ========================================
  // 1. SYNC COPPER
  // ========================================
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
    } else {
      const error = await copperRes.text();
      results.errors.push(`Copper: ${error}`);
    }
  } catch (e: any) {
    results.errors.push(`Copper: ${e.message}`);
  }

  // ========================================
  // 2. SYNC JUSTCALL
  // ========================================
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
    } else {
      const error = await justcallRes.text();
      // Don't treat as error if user not found
      if (!error.includes('not found') && !error.includes('No email')) {
        results.errors.push(`JustCall: ${error}`);
      }
    }
  } catch (e: any) {
    results.errors.push(`JustCall: ${e.message}`);
  }

  // ========================================
  // 3. UPDATE GOALS
  // ========================================
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
  } catch (e: any) {
    results.errors.push(`Goals: ${e.message}`);
  }

  return results;
}
