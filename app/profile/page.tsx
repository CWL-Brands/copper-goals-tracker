'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { onAuthStateChange, signOut } from '@/lib/firebase/client';
import { userService, settingsService } from '@/lib/firebase/services';

export default function ProfilePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChange(async (u) => {
      setUid(u?.uid ?? null);
      setMessage(null);
      if (u?.uid) {
        setLoading(true);
        const user = await userService.getUser(u.uid);
        if (user) {
          setName(user.name || '');
          setPhotoUrl(user.photoUrl || '');
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const save = async () => {
    if (!uid) return;
    setSaving(true);
    setMessage(null);
    try {
      await userService.updateUser(uid, { name, photoUrl });
      setMessage('Saved');
    } catch (e: any) {
      setMessage(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (!uid) return <div className="p-6">Please sign in to view your profile.</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">My Profile</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <label className="block">
          <span className="text-sm text-gray-600">Display Name</span>
          <input className="mt-1 w-full border rounded-md px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">Photo URL</span>
          <input className="mt-1 w-full border rounded-md px-3 py-2" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
        </label>
        <div className="flex gap-3">
          <button onClick={save} disabled={saving} className={`px-4 py-2 rounded-lg text-white ${saving ? 'bg-gray-400' : 'bg-kanva-green hover:bg-green-600'}`}>{saving ? 'Saving…' : 'Save'}</button>
          <button onClick={() => signOut()} className="px-4 py-2 rounded-lg bg-gray-100">Sign out</button>
        </div>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
}
