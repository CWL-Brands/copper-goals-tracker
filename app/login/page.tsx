'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, emailPasswordSignIn } from '@/lib/firebase/client';
import { setPersistence, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import { saveAuthProfile, saveRememberMe, saveSessionExpiry } from '@/lib/auth/storage';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedDomains = ['kanvabotanicals.com', 'cwlbrands.com'];

function validateEmail(email: string) {
  if (!emailRegex.test(email)) return 'Invalid email format';
  const lower = email.toLowerCase();
  const hasValidDomain = allowedDomains.some(domain => lower.endsWith(`@${domain}`));
  if (!hasValidDomain) return `Email must be @kanvabotanicals.com or @cwlbrands.com`;
  return null;
}

function validatePassword(pw: string) {
  if (!pw || pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[0-9]/.test(pw)) return 'Password must include at least one number';
  if (!/[!@#$%^&*(),.?":{}|<>_\-\[\]\\/]/.test(pw)) return 'Password must include at least one special character';
  const blacklist = ['password', '12345678', 'qwerty123', 'kanva123', 'letmein'];
  if (blacklist.includes(pw.toLowerCase())) return 'Please choose a stronger password';
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already signed in, go to dashboard
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) router.replace('/dashboard');
    });
    return () => unsub();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const em = email.trim().toLowerCase();
    const eErr = validateEmail(em);
    if (eErr) return setError(eErr);
    const pErr = validatePassword(password);
    if (pErr) return setError(pErr);

    setSubmitting(true);
    try {
      // Persistence choice based on remember me
      try {
        await setPersistence(auth, remember ? browserLocalPersistence : inMemoryPersistence);
      } catch {}

      const user = await emailPasswordSignIn(em, password);

      // Save minimal profile in IndexedDB for iframe contexts
      await saveAuthProfile({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
      });
      await saveRememberMe(remember);
      // Set custom session expiry policy
      const now = Date.now();
      const expiry = remember ? now + 30 * 24 * 60 * 60 * 1000 : now + 24 * 60 * 60 * 1000;
      await saveSessionExpiry(expiry);

      router.replace('/dashboard');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (code === 'auth/user-not-found') {
        setError('No account found for this email');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(err?.message || 'Sign-in failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-kanva-green">Kanva Botanicals</h1>
          <p className="text-sm text-gray-600">Sales Goals Tracker</p>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kanva-green"
              placeholder="name@kanvabotanicals.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kanva-green"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-gray-500">8+ characters, include a number and a special character</p>
          </div>
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="rounded" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember me
            </label>
            <a href="/reset-password" className="text-sm text-kanva-green hover:underline">Forgot password?</a>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-md text-white ${submitting ? 'bg-gray-400' : 'bg-kanva-green hover:bg-green-600'}`}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-xs text-gray-500 text-center">Use your @kanvabotanicals.com or @cwlbrands.com email</p>
        </form>
      </div>
    </div>
  );
}