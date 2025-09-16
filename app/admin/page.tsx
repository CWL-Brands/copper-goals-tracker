'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChange } from '@/lib/firebase/client';

const periods = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
] as const;

type Period = (typeof periods)[number]['value'];

export default function AdminPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('today');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChange((u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  const syncNow = async () => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/sync-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, period }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Sync failed');
      setResult(data);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">My Settings</h1>
      {!uid && (
        <p className="text-sm text-gray-600">Sign in to manage your settings.</p>
      )}

      {uid && (
        <div className="space-y-6">
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium mb-2">Data Sync</h2>
            <p className="text-sm text-gray-600 mb-4">
              Trigger a manual sync from Copper for the selected period.
            </p>
            <div className="flex items-center gap-3">
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
              >
                {periods.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <button
                onClick={syncNow}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white ${loading ? 'bg-gray-400' : 'bg-kanva-green hover:bg-green-600'}`}
              >
                {loading ? 'Syncing…' : 'Sync Now'}
              </button>
            </div>
            {(error || result) && (
              <pre className="mt-4 p-3 bg-gray-50 border rounded text-xs overflow-auto max-h-64">
                {error ? `Error: ${error}` : JSON.stringify(result, null, 2)}
              </pre>
            )}
          </section>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium mb-2">Coming Soon</h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Daily auto-sync schedule</li>
              <li>Per-goal targets and defaults</li>
              <li>Notification preferences</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
