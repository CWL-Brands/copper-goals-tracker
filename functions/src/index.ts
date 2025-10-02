import * as functions from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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
