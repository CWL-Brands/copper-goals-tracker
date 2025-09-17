'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { getRedirectResult, signInWithRedirect, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, createGoogleProvider } from '@/lib/firebase/client';
import { db, doc, getDoc, setDoc, serverTimestamp } from '@/lib/firebase/db';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'success' | 'already-signed-in' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  // Guard to prevent duplicate redirects on a single mount
  const redirectInitiated = useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        console.log('Login page: Starting auth check...');
        console.log('Login page: Checking for redirect result...');
        const result = await getRedirectResult(auth);

        if (result && result.user) {
          console.log('Login page: Redirect successful:', result.user.email);
          setStatus('success');
          try {
            const u = result.user;
            const ref = doc(db, 'users', u.uid);
            const snap = await getDoc(ref);
            if (!snap.exists()) {
              await setDoc(ref, {
                id: u.uid,
                email: u.email,
                name: u.displayName,
                photoUrl: u.photoURL,
                role: 'sales',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } else {
              await setDoc(ref, { updatedAt: serverTimestamp() }, { merge: true });
            }
          } catch (e) {
            console.warn('Failed to ensure user profile:', e);
          }

          try {
            localStorage.setItem('authStatus', 'signed-in');
            localStorage.setItem('authUser', JSON.stringify({
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
            }));
            const bc = new BroadcastChannel('auth');
            bc.postMessage({ type: 'auth-success' });
            if (window.opener) window.opener.postMessage({ type: 'auth-success' }, '*');
          } catch {}

          setTimeout(() => {
            try { if (window.opener) window.close(); } catch {}
            router.push('/dashboard');
          }, 1000);
          return;
        }

        console.log('Login page: Checking current user...');
        if (auth.currentUser) {
          console.log('Login page: User already signed in');
          setStatus('already-signed-in');
          try { localStorage.setItem('authStatus', 'signed-in'); } catch {}
          setTimeout(() => { try { if (window.opener) window.close(); } catch {}; router.push('/dashboard'); }, 800);
          return;
        }

        // Detect if URL carries redirect params; if so, wait instead of re-redirecting
        const urlParams = new URLSearchParams(window.location.search);
        const isReturning = urlParams.has('code') || urlParams.has('state') || urlParams.has('error');
        if (isReturning) {
          console.log('Login page: Detected redirect params; not initiating another redirect.');
          return;
        }

        // Initiate redirect only once
        if (!redirectInitiated.current) {
          redirectInitiated.current = true;
          console.log('Login page: Initiating redirect sign-in');
          setStatus('redirecting');
          // Try popup first; fall back to redirect for blocked popup
          try {
            await signInWithPopup(auth, createGoogleProvider());
            // after popup success, route
            router.push('/dashboard');
          } catch (e: any) {
            const msg = e?.code || e?.message || String(e);
            if (typeof msg === 'string' && msg.includes('popup')) {
              await signInWithRedirect(auth, createGoogleProvider());
            } else {
              throw e;
            }
          }
        }
      } catch (err: any) {
        console.error('Auth error:', err);
        const code = err?.code;
        if (code === 'auth/redirect-cancelled-by-user') {
          setError('Sign-in was cancelled. Please try again.');
        } else if (code === 'auth/popup-blocked') {
          setError('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
        } else {
          setError(err?.message || 'An error occurred during sign-in.');
        }
        setStatus('error');
        redirectInitiated.current = false;
      }
    };

    handleAuth();
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', backgroundColor: '#f5f5f5', padding: '1rem'
    }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <h1 style={{ color: '#93D500', marginBottom: '0.5rem' }}>Kanva Botanicals</h1>
        {status === 'checking' && (<><h2>Checking authentication…</h2><div className="spinner" /></>)}
        {status === 'redirecting' && (<><h2>Redirecting to Google…</h2><p>Please wait while we redirect you to sign in.</p><div className="spinner" /></>)}
        {status === 'success' && (<><h2 style={{ color: '#2ecc71' }}>✓ Sign-in Successful!</h2><p>You can now close this tab and return to Copper.</p><p style={{ fontSize: 12, color: '#666', marginTop: '1rem' }}>This window will close automatically…</p></>)}
        {status === 'already-signed-in' && (<><h2 style={{ color: '#2ecc71' }}>Already Signed In</h2><p>You're already authenticated. Returning…</p></>)}
        {status === 'error' && (<><h2 style={{ color: '#e74c3c' }}>Authentication Error</h2><p style={{ color: '#666', marginBottom: '1rem' }}>{error}</p><button onClick={() => window.location.reload()} style={{ backgroundColor: '#93D500', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>Try Again</button></>)}
      </div>
      <style jsx>{`
        .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #93D500; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
