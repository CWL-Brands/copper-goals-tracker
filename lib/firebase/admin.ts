import { getApps, getApp, initializeApp, applicationDefault, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK.
// In Firebase Hosting/Functions/Cloud Run, initializeApp() picks up the default service account.
// In local dev, ensure GOOGLE_APPLICATION_CREDENTIALS is set, or applicationDefault() will use it.
let app: App;
try {
  if (getApps().length) {
    app = getApp();
  } else {
    try { console.info('[firebase-admin] initializeApp() with default credentials'); } catch {}
    app = initializeApp();
  }
} catch (e1) {
  // Fallback to explicit applicationDefault for local dev
  try { console.warn('[firebase-admin] default initializeApp() failed, falling back to applicationDefault()'); } catch {}
  try {
    app = initializeApp({ credential: applicationDefault() });
  } catch (e2: any) {
    try { console.error('[firebase-admin] initializeApp fallback failed:', e2?.stack || e2?.message || e2); } catch {}
    throw e2;
  }
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
