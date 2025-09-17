"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, type User as FirebaseUser, signOut as signOutFn, setPersistence, inMemoryPersistence, browserLocalPersistence } from 'firebase/auth';
import { db, doc, getDoc, setDoc, serverTimestamp, Timestamp } from './db';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App (client-side safe)
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth
const auth = getAuth(app);
// Configure persistence: in iframe use in-memory to bypass third‑party storage restrictions
try {
  let inIframe = false;
  try { inIframe = typeof window !== 'undefined' && window.self !== window.top; } catch { inIframe = true; }
  setPersistence(auth, inIframe ? inMemoryPersistence : browserLocalPersistence).catch(() => {});
} catch {}

// Helper to create a properly configured Google provider (kept consistent across app)
export const createGoogleProvider = () => {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({
    hd: 'kanvabotanicals.com', // Restrict to company domain
    prompt: 'select_account',
  });
  return p;
};

// Auth Functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, createGoogleProvider());
    const user = result.user as FirebaseUser;
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        name: user.displayName,
        photoUrl: user.photoURL,
        role: 'sales', // Default role
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return user;
  } catch (error: any) {
    // Fallback to redirect flow for popup/network issues
    const code = error?.code || error?.message || String(error);
    console.warn('Popup sign-in failed, attempting redirect. Reason:', code);
    await signInWithRedirect(auth, createGoogleProvider());
    // Do not rethrow for known popup/network failures; redirect flow will continue
    if (
      typeof code === 'string' && (
        code.includes('auth/network-request-failed') ||
        code.includes('auth/popup-blocked') ||
        code.includes('auth/popup-closed-by-user')
      )
    ) {
      return null as any;
    }
    throw error;
  }
};

export const signOut = async () => {
  try {
    await signOutFn(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Real-time Auth State Observer
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore Collections
export const collections = {
  users: 'users',
  goals: 'goals',
  metrics: 'metrics',
  pipelines: 'pipelines',
  settings: 'settings'
};

// Export instances
export { auth, db, serverTimestamp, Timestamp };

// Note: Firestore converters are defined in lib/firebase/db.ts and reused in services.