import { getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK using Application Default Credentials.
// In local dev, set GOOGLE_APPLICATION_CREDENTIALS to your service account key file.
// In production (Firebase Hosting/Cloud Functions), ADC is provided automatically.

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
