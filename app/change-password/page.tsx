'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/client';
import { updatePassword } from 'firebase/auth';
import { db, doc, setDoc, serverTimestamp } from '@/lib/firebase/db';
import { useRouter } from 'next/navigation';

function validatePassword(pw: string) {
  if (!pw || pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[0-9]/.test(pw)) return 'Password must include at least one number';
  if (!/[!@#$%^&*(),.?":{}|<>_\-\[\]\\/]/.test(pw)) return 'Password must include at least one special character';
  const blacklist = ['password', '12345678', 'qwerty123', 'kanva123', 'letmein'];
  if (blacklist.includes(pw.toLowerCase())) return 'Please choose a stronger password';
  return null;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) router.replace('/login');
    });
    return () => unsub();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw1 !== pw2) return setError('Passwords do not match');
    const pErr = validatePassword(pw1);
    if (pErr) return setError(pErr);

    const u = auth.currentUser;
    if (!u) return setError('You are not signed in');

    setSaving(true);
    try {
      await updatePassword(u, pw1);
      // Mark password changed in Firestore
      await setDoc(doc(db, 'users', u.uid), { passwordChanged: true, updatedAt: serverTimestamp() }, { merge: true });
      router.replace('/dashboard');
    } catch (e: any) {
      const msg = e?.code === 'auth/requires-recent-login'
        ? 'Please sign out and sign back in, then change your password.'
        : (e?.message || 'Failed to change password');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-kanva-green">Set a new password</h1>
          <p className="text-sm text-gray-600">For security, please set a new password to continue.</p>
        </div>
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kanva-green" value={pw1} onChange={(e)=>setPw1(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input type="password" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kanva-green" value={pw2} onChange={(e)=>setPw2(e.target.value)} required />
          </div>
          <button type="submit" disabled={saving} className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-md text-white ${saving ? 'bg-gray-400' : 'bg-kanva-green hover:bg-green-600'}`}>{saving ? 'Saving…' : 'Save new password'}</button>
        </form>
      </div>
    </div>
  );
}
