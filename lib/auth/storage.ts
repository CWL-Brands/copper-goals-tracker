import { openDB, IDBPDatabase } from 'idb';

// IndexedDB storage for auth data to work inside iframes
// Stores: refresh token, user profile data, remember me preference

export type AuthProfile = {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  role?: string;
};

export type StoredAuth = {
  refreshToken?: string | null;
  profile?: AuthProfile | null;
  rememberMe?: boolean;
  // token expiry in epoch millis, optional helper for refresh scheduling
  expiresAt?: number | null;
  // custom session expiry policy (e.g. 30d or 24h) in epoch millis
  sessionExpiresAt?: number | null;
};

const DB_NAME = 'auth-db';
const DB_VERSION = 1;
const STORE = 'auth';
const AUTH_KEY = 'current';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveSessionExpiry(epochMillis: number | null) {
  try {
    const db = await getDb();
    const existing = (await db.get(STORE, AUTH_KEY)) as StoredAuth | undefined;
    const next: StoredAuth = {
      ...(existing || {}),
      sessionExpiresAt: epochMillis,
    };
    await db.put(STORE, next, AUTH_KEY);
  } catch (e) {
    console.warn('[auth/storage] saveSessionExpiry failed', e);
  }
}

export async function saveAuthToken(token: string | null, opts?: { expiresAt?: number | null; rememberMe?: boolean }) {
  try {
    const db = await getDb();
    const existing = (await db.get(STORE, AUTH_KEY)) as StoredAuth | undefined;
    const next: StoredAuth = {
      ...(existing || {}),
      refreshToken: token,
      expiresAt: opts?.expiresAt ?? (existing?.expiresAt ?? null),
      rememberMe: opts?.rememberMe ?? (existing?.rememberMe ?? false),
    };
    await db.put(STORE, next, AUTH_KEY);
  } catch (e) {
    console.warn('[auth/storage] saveAuthToken failed', e);
  }
}

export async function saveAuthProfile(profile: AuthProfile | null) {
  try {
    const db = await getDb();
    const existing = (await db.get(STORE, AUTH_KEY)) as StoredAuth | undefined;
    const next: StoredAuth = {
      ...(existing || {}),
      profile,
    };
    await db.put(STORE, next, AUTH_KEY);
  } catch (e) {
    console.warn('[auth/storage] saveAuthProfile failed', e);
  }
}

export async function saveRememberMe(remember: boolean) {
  try {
    const db = await getDb();
    const existing = (await db.get(STORE, AUTH_KEY)) as StoredAuth | undefined;
    const next: StoredAuth = {
      ...(existing || {}),
      rememberMe: remember,
    };
    await db.put(STORE, next, AUTH_KEY);
  } catch (e) {
    console.warn('[auth/storage] saveRememberMe failed', e);
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const db = await getDb();
    const stored = (await db.get(STORE, AUTH_KEY)) as StoredAuth | undefined;
    return stored?.refreshToken ?? null;
  } catch (e) {
    console.warn('[auth/storage] getAuthToken failed', e);
    return null;
  }
}

export async function getStoredAuth(): Promise<StoredAuth | null> {
  try {
    const db = await getDb();
    const stored = (await db.get(STORE, AUTH_KEY)) as StoredAuth | undefined;
    return stored || null;
  } catch (e) {
    console.warn('[auth/storage] getStoredAuth failed', e);
    return null;
  }
}

export async function clearAuthData() {
  try {
    const db = await getDb();
    await db.delete(STORE, AUTH_KEY);
  } catch (e) {
    console.warn('[auth/storage] clearAuthData failed', e);
  }
}
