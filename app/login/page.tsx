'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { db, doc, getDoc, setDoc, serverTimestamp } from '@/lib/firebase/db';

export default function LoginPage() {
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'success' | 'already-signed-in' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        console.log('Login page: Starting auth check...');
        console.log('Login page: Firebase auth instance:', auth);
        console.log('Login page: Firebase config check:', {
          apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        });
        
        // Check if returning from redirect
        const result = await getRedirectResult(auth);
        console.log('Login page: Redirect result:', result);
        if (result && result.user) {
          // Successful sign-in
          try {
            // Ensure Firestore user profile exists (prevents dashboard from thinking user is unauthenticated)
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
              // touch updatedAt so first read reflects freshness
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
          } catch {}

          // Broadcast success event
          try {
            // Same-window event (for direct navigations)
            window.dispatchEvent(new Event('authSuccess'));
          } catch {}
          try {
            // Cross-window broadcast for iframe/opener
            const bc = new BroadcastChannel('auth');
            const cred = GoogleAuthProvider.credentialFromResult(result);
            bc.postMessage({ type: 'auth-success' });
            if (cred?.idToken || cred?.accessToken) {
              bc.postMessage({ type: 'auth-google-credential', idToken: cred?.idToken, accessToken: cred?.accessToken });
            }
          } catch {}
          try {
            if (window.opener) {
              const cred = GoogleAuthProvider.credentialFromResult(result);
              window.opener.postMessage({ type: 'auth-success' }, '*');
              if (cred?.idToken || cred?.accessToken) {
                window.opener.postMessage({ type: 'auth-google-credential', idToken: cred?.idToken, accessToken: cred?.accessToken }, '*');
              }
            }
          } catch {}
          try {
            // Trigger storage event for other tabs/frames
            localStorage.setItem('auth:status', JSON.stringify({ state: 'signed-in', ts: Date.now() }));
          } catch {}

          setStatus('success');

          setTimeout(() => {
            // Try to close if opened by script
            window.close();
            // If window didn't close (e.g., blocked), navigate to success page
            window.location.href = '/auth-success';
          }, 1200);
          return;
        }

        // If already logged in without redirect result
        console.log('Login page: Current user:', auth.currentUser);
        if (auth.currentUser) {
          console.log('Login page: User already signed in');
          setStatus('already-signed-in');
          try { localStorage.setItem('authStatus', 'signed-in'); } catch {}
          try { const bc = new BroadcastChannel('auth'); bc.postMessage({ type: 'auth-success' }); } catch {}
          try { if (window.opener) window.opener.postMessage({ type: 'auth-success' }, '*'); } catch {}
          try { localStorage.setItem('auth:status', JSON.stringify({ state: 'signed-in', ts: Date.now() })); } catch {}
          setTimeout(() => {
            window.close();
            window.location.href = '/auth-success';
          }, 800);
          return;
        }

        // Initiate redirect sign-in
        console.log('Login page: Initiating redirect sign-in');
        setStatus('redirecting');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ 
          hd: 'kanvabotanicals.com', // Restrict to company domain
          prompt: 'select_account' 
        });
        await signInWithRedirect(auth, provider);
      } catch (err: any) {
        console.error('Auth error:', err);
        setError(err?.message || String(err));
        setStatus('error');
      }
    };

    handleAuth();
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      backgroundColor: '#f5f5f5',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#93D500', marginBottom: '0.5rem' }}>Kanva Botanicals</h1>
        {status === 'checking' && (
          <>
            <h2>Checking authentication…</h2>
            <div className="spinner" />
          </>
        )}
        {status === 'redirecting' && (
          <>
            <h2>Redirecting to Google…</h2>
            <p>Please wait while we redirect you to sign in.</p>
            <div className="spinner" />
          </>
        )}
        {status === 'success' && (
          <>
            <h2 style={{ color: '#2ecc71' }}>✓ Sign-in Successful!</h2>
            <p>You can now close this tab and return to Copper.</p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>This window will close automatically…</p>
          </>
        )}
        {status === 'already-signed-in' && (
          <>
            <h2 style={{ color: '#2ecc71' }}>Already Signed In</h2>
            <p>You're already authenticated. Returning…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 style={{ color: '#e74c3c' }}>Authentication Error</h2>
            <p style={{ color: '#666', marginBottom: '1rem' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#93D500',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </>
        )}
      </div>
      <style jsx>{`
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #93D500;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
