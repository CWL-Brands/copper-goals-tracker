'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isInIframe = (() => {
      try { return typeof window !== 'undefined' && window.self !== window.top; } catch { return true; }
    })();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);

      if (u && isInIframe) {
        try {
          window.parent.postMessage({
            type: 'copper-goals-auth-state',
            authenticated: true,
            userEmail: u.email
          }, '*');
        } catch {}
      }
    });

    if (isInIframe) {
      const handleAuthRestore = async (event: MessageEvent) => {
        try {
          const data: any = (event as any).data;
          if (data?.type === 'restore-auth' && data?.credential && !auth.currentUser) {
            const cred = GoogleAuthProvider.credential(data.credential.idToken, data.credential.accessToken);
            if (cred) await signInWithCredential(auth, cred);
          }
        } catch (e) {
          console.error('Failed to restore auth from parent:', e);
        }
      };
      window.addEventListener('message', handleAuthRestore);
      try { window.parent.postMessage({ type: 'request-auth-state' }, '*'); } catch {}
      return () => {
        unsubscribe();
        window.removeEventListener('message', handleAuthRestore);
      };
    }

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
