'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChange } from '@/lib/firebase/client';
import { settingsService } from '@/lib/firebase/services';

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
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [emailActivityId, setEmailActivityId] = useState<string>('1');
  const [wholesaleKeywords, setWholesaleKeywords] = useState<string>('Focus+Flow, Zoom');
  const [distributionKeywords, setDistributionKeywords] = useState<string>('');

  useEffect(() => {
    const unsub = onAuthStateChange(async (u) => {
      setUid(u?.uid ?? null);
      if (u?.uid) {
        setSettingsLoading(true);
        setSettingsMsg(null);
        try {
          const s = await settingsService.getSettings(u.uid);
          if (s) {
            if (s.emailActivityId != null) setEmailActivityId(String(s.emailActivityId));
            if (s.wholesaleKeywords) setWholesaleKeywords(Array.isArray(s.wholesaleKeywords) ? s.wholesaleKeywords.join(', ') : String(s.wholesaleKeywords));
            if (s.distributionKeywords) setDistributionKeywords(Array.isArray(s.distributionKeywords) ? s.distributionKeywords.join(', ') : String(s.distributionKeywords));
          }
        } finally {
          setSettingsLoading(false);
        }
      }
    });
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

  const saveSettings = async () => {
    if (!uid) return;
    setSettingsLoading(true);
    setSettingsMsg(null);
    try {
      await settingsService.updateSettings(uid, {
        emailActivityId: Number(emailActivityId) || 1,
        wholesaleKeywords: wholesaleKeywords,
        distributionKeywords: distributionKeywords,
      });
      setSettingsMsg('Settings saved');
    } catch (e: any) {
      setSettingsMsg(e.message || 'Failed to save settings');
    } finally {
      setSettingsLoading(false);
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
            <h2 className="text-lg font-medium mb-2">My Sync Settings</h2>
            <p className="text-sm text-gray-600 mb-4">These settings control how your data is synced from Copper.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm text-gray-600">Email Activity ID</span>
                <input value={emailActivityId} onChange={(e) => setEmailActivityId(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="e.g. 1" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm text-gray-600">Wholesale Keywords (comma-separated)</span>
                <input value={wholesaleKeywords} onChange={(e) => setWholesaleKeywords(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="Focus+Flow, Zoom" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm text-gray-600">Distribution Keywords (comma-separated)</span>
                <input value={distributionKeywords} onChange={(e) => setDistributionKeywords(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="Pallet, Distributor" />
              </label>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button onClick={saveSettings} disabled={settingsLoading} className={`px-4 py-2 rounded-lg text-white ${settingsLoading ? 'bg-gray-400' : 'bg-kanva-green hover:bg-green-600'}`}>{settingsLoading ? 'Saving…' : 'Save Settings'}</button>
              {settingsMsg && <span className="text-sm text-gray-600">{settingsMsg}</span>}
            </div>
          </section>
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
