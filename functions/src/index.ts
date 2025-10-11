import * as functions from 'firebase-functions';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Admin SDK once per cold start
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

function getAdminEmails(): string[] {
  const env = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '';
  return env.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

/**
 * When a Firebase Auth user is created (via console, API, or app),
 * create/merge a Firestore profile at users/{uid}.
 */
export const syncUserOnCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;
  const admins = getAdminEmails();
  const em = (email || '').toLowerCase();
  const role = em && admins.includes(em) ? 'admin' : 'sales';

  const docRef = db.collection('users').doc(uid);
  await docRef.set(
    {
      id: uid,
      email: (email || '').toLowerCase(),
      name: displayName || (email ? email.split('@')[0] : 'Sales Representative'),
      photoUrl: photoURL || null,
      role,
      passwordChanged: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
});

/**
 * When a Firebase Auth user is deleted, remove their Firestore profile.
 * If you prefer soft-deletes, replace with a flag like { disabled: true }.
 */
export const syncUserOnDelete = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;

  const docRef = db.collection('users').doc(uid);
  await docRef.delete().catch(() => void 0);
});

/**
 * Backfill: Iterate all Auth users and ensure users/{uid} exists in Firestore.
 * Secure with SYNC_SECRET header to prevent public access.
 * Usage: POST with header `x-sync-secret: <SYNC_SECRET>`
 */
export const backfillAuthUsers = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }
    const secret = process.env.SYNC_SECRET || '';
    const provided = (req.headers['x-sync-secret'] || req.headers['authorization'] || '').toString().replace(/^Bearer\s+/i, '');
    if (!secret || provided !== secret) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const auth = getAuth();
    let nextPageToken: string | undefined = undefined;
    let processed = 0;
    let created = 0;
    let updated = 0;

    do {
      const page = await auth.listUsers(1000, nextPageToken);
      for (const u of page.users) {
        const { uid, email, displayName, photoURL } = u;
        const ref = db.collection('users').doc(uid);
        const snap = await ref.get();
        const admins = getAdminEmails();
        const em = (email || '').toLowerCase();
        const role = em && admins.includes(em) ? 'admin' : 'sales';
        const data = {
          id: uid,
          email: (email || '').toLowerCase(),
          name: displayName || (email ? email.split('@')[0] : 'Sales Representative'),
          photoUrl: photoURL || null,
          role,
          passwordChanged: false,
          updatedAt: FieldValue.serverTimestamp(),
          ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
        } as any;
        await ref.set(data, { merge: true });
        processed++;
        if (snap.exists) updated++; else created++;
      }
      nextPageToken = page.pageToken;
    } while (nextPageToken);

    res.json({ ok: true, processed, created, updated });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Backfill failed' });
  }
});

/**
 * Scheduled function: Auto-sync all active users every 10 minutes
 * Syncs Copper + JustCall metrics and updates goals
 * 
 * Schedule: Every 10 minutes
 * Region: us-central1 (change if needed)
 */
export const autoSyncMetrics = functions
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .pubsub.schedule('every 10 minutes')
  .timeZone('America/Denver') // Mountain Time
  .onRun(async (context) => {
    const startTime = Date.now();
    console.log('[Auto-Sync] Starting scheduled sync for all active users');

    try {
      // Get all active users
      const usersSnapshot = await db.collection('users')
        .where('isActive', '==', true)
        .get();

      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email,
        name: doc.data().name,
      }));

      console.log(`[Auto-Sync] Found ${users.length} active users`);

      const results = [];
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

      // Sync each user
      for (const user of users) {
        try {
          console.log(`[Auto-Sync] Syncing ${user.email}...`);
          
          const result = await syncUserMetrics(user.id, startDate, endDate);
          
          results.push({
            userId: user.id,
            email: user.email,
            success: true,
            ...result,
          });
          
          console.log(`[Auto-Sync] ✅ ${user.email} synced successfully`);
          
          // Rate limit: 500ms between users
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (e: any) {
          console.error(`[Auto-Sync] ❌ Error syncing ${user.email}:`, e.message);
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

      console.log(`[Auto-Sync] Complete in ${duration}ms - ${successCount} success, ${failCount} failed`);

      return { success: true, duration, successCount, failCount };

    } catch (error: any) {
      console.error('[Auto-Sync] Fatal error:', error);
      throw error;
    }
  });

/**
 * Helper: Sync metrics for a single user (Copper + JustCall)
 */
async function syncUserMetrics(userId: string, startDate: Date, endDate: Date) {
  const results = {
    copper: null as any,
    justcall: null as any,
    goalsUpdated: 0,
    errors: [] as string[],
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.web.app';

  // ========================================
  // 1. SYNC COPPER
  // ========================================
  try {
    const copperRes = await fetch(`${appUrl}/api/sync-metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const justcallRes = await fetch(`${appUrl}/api/sync-justcall-metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const goalsSnapshot = await db.collection('goals').where('userId', '==', userId).get();
    
    for (const goalDoc of goalsSnapshot.docs) {
      const goal = goalDoc.data();
      
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

      const metricsSnapshot = await db.collection('metrics')
        .where('userId', '==', userId)
        .where('type', '==', goal.type)
        .where('date', '>=', Timestamp.fromDate(periodStart))
        .where('date', '<=', Timestamp.fromDate(periodEnd))
        .get();

      let totalValue = 0;
      for (const metricDoc of metricsSnapshot.docs) {
        const metric = metricDoc.data();
        totalValue += Number(metric.value || 0);
      }

      await db.collection('goals').doc(goalDoc.id).update({
        current: totalValue,
        updatedAt: FieldValue.serverTimestamp(),
      });

      results.goalsUpdated++;
    }
  } catch (e: any) {
    results.errors.push(`Goals: ${e.message}`);
  }

  return results;
}
