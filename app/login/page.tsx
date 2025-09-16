'use client';

import { useEffect, useState } from 'react';
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function LoginPage() {
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'success' | 'already-signed-in' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check if returning from redirect
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          // Successful sign-in
          try {
            localStorage.setItem('authStatus', 'signed-in');
            localStorage.setItem('authUser', JSON.stringify({
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
            }));
          } catch {}

          // Broadcast success event
          try { window.dispatchEvent(new Event('authSuccess')); } catch {}

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
        if (auth.currentUser) {
          setStatus('already-signed-in');
          try { localStorage.setItem('authStatus', 'signed-in'); } catch {}
          setTimeout(() => {
            window.close();
            window.location.href = '/auth-success';
          }, 800);
          return;
        }

        // Initiate redirect sign-in
        setStatus('redirecting');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
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
