'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { getRedirectResult, signInWithRedirect, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, createGoogleProvider } from '@/lib/firebase/client';
import { db, doc, getDoc, setDoc, serverTimestamp } from '@/lib/firebase/db';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'success' | 'already-signed-in' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  // Guard to prevent duplicate redirects on a single mount
  const redirectInitiated = useRef(false);
  const authChecked = useRef(false);

  useEffect(() => {
    // Add auth state listener to handle auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!authChecked.current) {
        authChecked.current = true;
        
        if (user) {
          console.log('Auth state changed - User signed in:', user.email);
          setStatus('success');
          const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
          
          // Ensure user profile exists
          try {
            const ref = doc(db, 'users', user.uid);
            const snap = await getDoc(ref);
            if (!snap.exists()) {
              await setDoc(ref, {
                id: user.uid,
                email: user.email,
                name: user.displayName,
                photoUrl: user.photoURL,
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

          // Store auth status
          try {
            localStorage.setItem('authStatus', 'signed-in');
            localStorage.setItem('authUser', JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
            }));
            const bc = new BroadcastChannel('auth');
            bc.postMessage({ type: 'auth-success' });
            // Also post Google credential (at least idToken) so iframes can restore auth via signInWithCredential
            try {
              const idToken = await user.getIdToken();
              bc.postMessage({ type: 'auth-google-credential', idToken });
              try { window.opener?.postMessage({ type: 'auth-google-credential', idToken }, '*'); } catch {}
              if (isInIframe) {
                try { window.parent?.postMessage({ type: 'auth-google-credential', idToken }, '*'); } catch {}
              }
            } catch {}
          } catch {}

          // Navigate to dashboard
          setTimeout(() => {
            // Do not auto-close when running inside an iframe to ensure messages are delivered
            try { const inIframe = window.self !== window.top; if (window.opener && !inIframe) window.close(); } catch {}
            router.push('/dashboard');
          }, 1000);
        } else {
          handleNoUser();
        }
      }
    });

    const handleNoUser = async () => {
      try {
        console.log('Login page: No authenticated user, checking for redirect result...');
        
        // Check for redirect result first
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
          console.log('Login page: Redirect result found, processing...');
          // Broadcast credential to allow iframe restoration
          try {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const idToken = credential?.idToken || (await result.user.getIdToken());
            const accessToken = (credential as any)?.accessToken;
            const payload: any = { type: 'auth-google-credential' };
            if (idToken) payload.idToken = idToken;
            if (accessToken) payload.accessToken = accessToken;
            try { window.opener?.postMessage(payload, '*'); } catch {}
            try { new BroadcastChannel('auth').postMessage(payload); } catch {}
            try { const inIframe = window.self !== window.top; if (inIframe) window.parent?.postMessage(payload, '*'); } catch {}
          } catch {}
          // The onAuthStateChanged will handle this
          return;
        }

        // Detect if we're returning from a redirect
        const urlParams = new URLSearchParams(window.location.search);
        const isReturning = urlParams.has('code') || urlParams.has('state') || urlParams.has('error') || urlParams.has('authuser');
        
        if (isReturning) {
          console.log('Login page: Detected redirect params, waiting for auth to complete...');
          setStatus('checking');
          // Give Firebase time to process the redirect
          setTimeout(() => {
            if (auth.currentUser) {
              console.log('Auth completed after redirect');
            } else {
              console.log('Auth did not complete, showing error');
              setError('Authentication did not complete. Please try again.');
              setStatus('error');
              redirectInitiated.current = false;
            }
          }, 3000);
          return;
        }

        // Only initiate sign-in if we haven't already
        if (!redirectInitiated.current && !auth.currentUser) {
          redirectInitiated.current = true;
          console.log('Login page: Initiating sign-in...');
          setStatus('redirecting');
          
          // Try popup first
          try {
            const popupResult = await signInWithPopup(auth, createGoogleProvider());
            console.log('Popup sign-in successful:', popupResult.user.email);
            // Send credentials to opener/iframe contexts for restoration
            try {
              const credential = GoogleAuthProvider.credentialFromResult(popupResult);
              const idToken = credential?.idToken || (await popupResult.user.getIdToken());
              const accessToken = (credential as any)?.accessToken;
              const payload: any = { type: 'auth-google-credential' };
              if (idToken) payload.idToken = idToken;
              if (accessToken) payload.accessToken = accessToken;
              try { window.opener?.postMessage(payload, '*'); } catch {}
              try { new BroadcastChannel('auth').postMessage(payload); } catch {}
              try { const inIframe = window.self !== window.top; if (inIframe) window.parent?.postMessage(payload, '*'); } catch {}
            } catch {}
            // The onAuthStateChanged will handle the rest
          } catch (popupError: any) {
            console.log('Popup failed:', popupError.code);
            
            // If popup fails, try redirect
            if (popupError.code === 'auth/popup-blocked' || 
                popupError.code === 'auth/popup-closed-by-user' ||
                popupError.code === 'auth/cancelled-popup-request') {
              console.log('Falling back to redirect flow...');
              await signInWithRedirect(auth, createGoogleProvider());
            } else if (popupError.code === 'auth/unauthorized-domain') {
              setError('This domain is not authorized for authentication. Please contact your administrator.');
              setStatus('error');
              redirectInitiated.current = false;
            } else {
              setError(popupError.message || 'Sign-in failed. Please try again.');
              setStatus('error');
              redirectInitiated.current = false;
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
        } else if (code === 'auth/unauthorized-domain') {
          setError('This domain is not authorized. Please contact your administrator.');
        } else {
          setError(err?.message || 'An error occurred during sign-in.');
        }
        setStatus('error');
        redirectInitiated.current = false;
      }
    };

    // Debug logging
    console.log('Current URL:', window.location.href);
    console.log('Initial auth state:', auth.currentUser);
    console.log('Local storage auth:', localStorage.getItem('authStatus'));

    return () => {
      unsubscribe();
    };
  }, [router]);

  // Manual sign-in button handler
  const handleManualSignIn = async () => {
    setError(null);
    setStatus('redirecting');
    redirectInitiated.current = false;
    
    try {
      // Try popup first
      const result = await signInWithPopup(auth, createGoogleProvider());
      console.log('Manual popup sign-in successful:', result.user.email);
    } catch (popupError: any) {
      console.log('Manual popup failed, using redirect:', popupError.code);
      try {
        await signInWithRedirect(auth, createGoogleProvider());
      } catch (redirectError: any) {
        setError(redirectError.message || 'Sign-in failed. Please try again.');
        setStatus('error');
      }
    }
  };

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
        borderRadius: 10, 
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)', 
        maxWidth: 420, 
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
            <p>Redirecting to dashboard...</p>
            <p style={{ fontSize: 12, color: '#666', marginTop: '1rem' }}>
              This window will close automatically…
            </p>
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
              onClick={handleManualSignIn} 
              style={{ 
                backgroundColor: '#93D500', 
                color: 'white', 
                border: 'none', 
                padding: '10px 20px', 
                borderRadius: 6, 
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Try Again
            </button>
            <p style={{ fontSize: 12, color: '#666', marginTop: '1rem' }}>
              Make sure pop-ups are enabled and you're using a @kanvabotanicals.com email
            </p>
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
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}