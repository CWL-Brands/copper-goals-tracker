'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, sendResetEmail, signOut } from '@/lib/firebase/client';
import { saveAuthToken, getStoredAuth, clearAuthData } from '@/lib/auth/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, resetPassword: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let refreshTimer: any = null;
    let sessionCheckTimer: any = null;

    const scheduleRefresh = async (u: User) => {
      try {
        const result = await u.getIdTokenResult();
        const exp = new Date(result.expirationTime).getTime();
        const oneHour = 60 * 60 * 1000;
        const now = Date.now();
        const delta = Math.max(5 * 60 * 1000, exp - now - oneHour); // refresh at least 5m from now, or 1h before expiry
        try { await saveAuthToken(result.token || null, { expiresAt: exp }); } catch {}
        if (refreshTimer) clearTimeout(refreshTimer);
        refreshTimer = setTimeout(async () => {
          try {
            await u.getIdToken(true);
            // reschedule after refresh
            scheduleRefresh(u);
          } catch {}
        }, delta);
      } catch {}
    };

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        scheduleRefresh(u);
        // Enforce session expiry using IndexedDB policy
        (async () => {
          try {
            const stored = await getStoredAuth();
            if (stored?.sessionExpiresAt && Date.now() > stored.sessionExpiresAt) {
              await clearAuthData();
              await signOut();
            }
          } catch {}
        })();
        // Start periodic check (every 5 minutes)
        if (sessionCheckTimer) clearInterval(sessionCheckTimer);
        sessionCheckTimer = setInterval(async () => {
          try {
            const stored = await getStoredAuth();
            if (stored?.sessionExpiresAt && Date.now() > stored.sessionExpiresAt) {
              await clearAuthData();
              await signOut();
            }
          } catch {}
        }, 5 * 60 * 1000);
      } else {
        if (refreshTimer) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }
        if (sessionCheckTimer) {
          clearInterval(sessionCheckTimer);
          sessionCheckTimer = null;
        }
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, resetPassword: sendResetEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);