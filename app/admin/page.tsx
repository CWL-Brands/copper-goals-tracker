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
  const [copperUserEmail, setCopperUserEmail] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [wholesaleKeywords, setWholesaleKeywords] = useState<string>('Focus+Flow, Zoom');
  const [distributionKeywords, setDistributionKeywords] = useState<string>('');
  // Copper metadata/defaults state
  const [metaLoading, setMetaLoading] = useState(false);
  const [meta, setMeta] = useState<any>(null);
  const [defaultsLoading, setDefaultsLoading] = useState(false);
  const [defaults, setDefaults] = useState<any>({
    emailActivityId: '',
    phoneCallActivityId: '',
    SALES_PIPELINE_ID: '',
    PRODUCT_FIELD_ID: '',
    CLOSED_WON_STAGES: '', // comma-separated
    STAGE_MAPPING: '{"Fact Finding":"lead_progression_a","Contact Stage":"lead_progression_b","Closing Stage":"lead_progression_c"}',
  });
  const [teamGoals, setTeamGoals] = useState<Record<string, any>>({
    daily: {
      talk_time: 0,
      email_quantity: 0,
      lead_progression_a: 0,
      lead_progression_b: 0,
      lead_progression_c: 0,
      new_sales_wholesale: 0,
      new_sales_distribution: 0,
    },
    weekly: {
      talk_time: 0,
      email_quantity: 0,
      lead_progression_a: 0,
      lead_progression_b: 0,
      lead_progression_c: 0,
      new_sales_wholesale: 0,
      new_sales_distribution: 0,
    },
    monthly: {
      talk_time: 0,
      email_quantity: 0,
      lead_progression_a: 0,
      lead_progression_b: 0,
      lead_progression_c: 0,
      new_sales_wholesale: 0,
      new_sales_distribution: 0,
    },
  });
  const [showPwd, setShowPwd] = useState(false);
  const [pwdInput, setPwdInput] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);

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
          // Load team goals via public API to avoid client Firestore permission issues
          try {
            const res = await fetch('/api/public/team-goals');
            const data = await res.json();
            if (res.ok && data?.teamGoals) {
              setTeamGoals((prev) => ({ ...prev, ...data.teamGoals }));
            }
          } catch {}
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
      const body: any = { userId: uid, period } as any;
      if (startDate) body.start = new Date(startDate).toISOString();
      if (endDate) body.end = new Date(endDate).toISOString();
      if (copperUserEmail) body.copperUserEmail = copperUserEmail;

      const res = await fetch('/api/sync-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const handleGoalChange = (periodKey: 'daily'|'weekly'|'monthly', field: string, value: number) => {
    setTeamGoals(prev => ({
      ...prev,
      [periodKey]: { ...prev[periodKey], [field]: value }
    }));
  };

  const saveTeamGoals = async () => {
    // Open password modal first (inline client-side guard)
    setPwdInput('');
    setPwdError(null);
    setShowPwd(true);
  };

  const confirmTeamGoalsSave = async () => {
    if (!pwdInput) {
      setPwdError('Passcode required.');
      return;
    }
    setShowPwd(false);
    setSettingsLoading(true);
    setSettingsMsg(null);
    try {
      const res = await fetch('/api/admin/team-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pass': pwdInput,
        },
        body: JSON.stringify(teamGoals),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save team goals');
      setSettingsMsg('Team goals saved');
    } catch (e: any) {
      setSettingsMsg(e.message || 'Failed to save team goals');
    } finally {
      setSettingsLoading(false);
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
          {/* Team Goals */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium mb-2">Team Goals</h2>
            <p className="text-sm text-gray-600 mb-4">Set organization-wide targets. Users will still have individual goals.</p>
            {(['daily','weekly','monthly'] as const).map(periodKey => (
              <div key={periodKey} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 capitalize">{periodKey}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="block">
                    <span className="text-sm text-gray-600">Phone Calls</span>
                    <input type="number" className="mt-1 w-full border rounded-md px-3 py-2" value={teamGoals[periodKey].talk_time}
                      onChange={(e)=>handleGoalChange(periodKey,'talk_time',Number(e.target.value))} />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-600">Emails</span>
                    <input type="number" className="mt-1 w-full border rounded-md px-3 py-2" value={teamGoals[periodKey].email_quantity}
                      onChange={(e)=>handleGoalChange(periodKey,'email_quantity',Number(e.target.value))} />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-600">Fact Finding (A)</span>
                    <input type="number" className="mt-1 w-full border rounded-md px-3 py-2" value={teamGoals[periodKey].lead_progression_a}
                      onChange={(e)=>handleGoalChange(periodKey,'lead_progression_a',Number(e.target.value))} />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-600">Contact Stage (B)</span>
                    <input type="number" className="mt-1 w-full border rounded-md px-3 py-2" value={teamGoals[periodKey].lead_progression_b}
                      onChange={(e)=>handleGoalChange(periodKey,'lead_progression_b',Number(e.target.value))} />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-600">Closing Stage (C)</span>
                    <input type="number" className="mt-1 w-full border rounded-md px-3 py-2" value={teamGoals[periodKey].lead_progression_c}
                      onChange={(e)=>handleGoalChange(periodKey,'lead_progression_c',Number(e.target.value))} />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-600">Wholesale Sales ($)</span>
                    <input type="number" className="mt-1 w-full border rounded-md px-3 py-2" value={teamGoals[periodKey].new_sales_wholesale}
                      onChange={(e)=>handleGoalChange(periodKey,'new_sales_wholesale',Number(e.target.value))} />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-600">Distribution Sales ($)</span>
                    <input type="number" className="mt-1 w-full border rounded-md px-3 py-2" value={teamGoals[periodKey].new_sales_distribution}
                      onChange={(e)=>handleGoalChange(periodKey,'new_sales_distribution',Number(e.target.value))} />
                  </label>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <button onClick={saveTeamGoals} disabled={settingsLoading} className={`px-4 py-2 rounded-lg text-white ${settingsLoading ? 'bg-gray-400' : 'bg-kanva-green hover:bg-green-600'}`}>{settingsLoading ? 'Saving…' : 'Save Team Goals'}</button>
              {settingsMsg && <span className="text-sm text-gray-600">{settingsMsg}</span>}
            </div>
          </section>

          {/* Copper Metadata & Defaults */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium">Copper Metadata</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={async()=>{
                    setMetaLoading(true);
                    try {
                      const res = await fetch('/api/copper/metadata', { method: 'GET' });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data?.error || 'Failed to load metadata');
                      setMeta(data?.data || data);
                    } catch (e:any) {
                      setMeta({ error: e.message || 'Failed to load metadata' });
                    } finally {
                      setMetaLoading(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm"
                >Load</button>
                <button
                  onClick={async()=>{
                    setMetaLoading(true);
                    try {
                      const res = await fetch('/api/copper/metadata', { method: 'POST' });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data?.error || 'Failed to fetch & save metadata');
                      setMeta(data?.data || data);
                    } catch (e:any) {
                      setMeta({ error: e.message || 'Failed to save metadata' });
                    } finally {
                      setMetaLoading(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm"
                >Fetch & Save</button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">Discover activity type IDs and custom field definitions, and store org-wide defaults used by the sync.</p>
            {metaLoading && <div className="text-sm text-gray-600">Loading metadata…</div>}
            {meta && (
              <pre className="p-3 bg-gray-50 border rounded text-xs overflow-auto max-h-64">{JSON.stringify(meta, null, 2)}</pre>
            )}

            <h3 className="text-md font-medium mt-4 mb-2">Org Defaults</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm text-gray-600">Email Activity Type ID</span>
                <input value={defaults.emailActivityId} onChange={(e)=>setDefaults({...defaults, emailActivityId:e.target.value})} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="e.g. 1" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Phone Call Activity Type ID</span>
                <input value={defaults.phoneCallActivityId} onChange={(e)=>setDefaults({...defaults, phoneCallActivityId:e.target.value})} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="e.g. 0" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Sales Pipeline ID</span>
                <input value={defaults.SALES_PIPELINE_ID} onChange={(e)=>setDefaults({...defaults, SALES_PIPELINE_ID:e.target.value})} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="e.g. 1084986" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Product Field ID (custom field)</span>
                <input value={defaults.PRODUCT_FIELD_ID} onChange={(e)=>setDefaults({...defaults, PRODUCT_FIELD_ID:e.target.value})} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="e.g. 705070" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm text-gray-600">Closed Won Stages (comma-separated)</span>
                <input value={defaults.CLOSED_WON_STAGES} onChange={(e)=>setDefaults({...defaults, CLOSED_WON_STAGES:e.target.value})} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="Payment Received/Invoice Created" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm text-gray-600">Stage Mapping (JSON object of stageName → metricType)</span>
                <textarea value={defaults.STAGE_MAPPING} onChange={(e)=>setDefaults({...defaults, STAGE_MAPPING:e.target.value})} className="mt-1 w-full border rounded-md px-3 py-2 h-28 font-mono text-xs" />
              </label>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={async()=>{
                  setDefaultsLoading(true);
                  try {
                    // Build payload
                    let payload:any = { ...defaults };
                    try { payload.SALES_PIPELINE_ID = Number(payload.SALES_PIPELINE_ID)||undefined; } catch {}
                    try { payload.PRODUCT_FIELD_ID = Number(payload.PRODUCT_FIELD_ID)||undefined; } catch {}
                    try { payload.emailActivityId = Number(payload.emailActivityId)||undefined; } catch {}
                    try { payload.phoneCallActivityId = Number(payload.phoneCallActivityId)||undefined; } catch {}
                    try { if (typeof payload.CLOSED_WON_STAGES === 'string') payload.CLOSED_WON_STAGES = payload.CLOSED_WON_STAGES.split(',').map((s:string)=>s.trim()).filter(Boolean); } catch {}
                    try { if (typeof payload.STAGE_MAPPING === 'string') payload.STAGE_MAPPING = JSON.parse(payload.STAGE_MAPPING); } catch {}

                    const res = await fetch('/api/copper/defaults', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ defaults: payload }) });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data?.error || 'Failed to save defaults');
                    setSettingsMsg('Org defaults saved');
                  } catch (e:any) {
                    setSettingsMsg(e.message || 'Failed to save defaults');
                  } finally {
                    setDefaultsLoading(false);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-white ${defaultsLoading ? 'bg-gray-400' : 'bg-kanva-green hover:bg-green-600'}`}
              >{defaultsLoading ? 'Saving…' : 'Save Org Defaults'}</button>

              <button
                onClick={async()=>{
                  setDefaultsLoading(true);
                  try {
                    const res = await fetch('/api/copper/defaults');
                    const data = await res.json();
                    if (!res.ok) throw new Error(data?.error || 'Failed to load defaults');
                    const d = data?.defaults || {};
                    setDefaults({
                      emailActivityId: d.emailActivityId ? String(d.emailActivityId) : '',
                      phoneCallActivityId: d.phoneCallActivityId ? String(d.phoneCallActivityId) : '',
                      SALES_PIPELINE_ID: d.SALES_PIPELINE_ID ? String(d.SALES_PIPELINE_ID) : '',
                      PRODUCT_FIELD_ID: d.PRODUCT_FIELD_ID ? String(d.PRODUCT_FIELD_ID) : '',
                      CLOSED_WON_STAGES: Array.isArray(d.CLOSED_WON_STAGES) ? d.CLOSED_WON_STAGES.join(', ') : (d.CLOSED_WON_STAGES||''),
                      STAGE_MAPPING: d.STAGE_MAPPING ? JSON.stringify(d.STAGE_MAPPING) : defaults.STAGE_MAPPING,
                    });
                    setSettingsMsg('Org defaults loaded');
                  } catch (e:any) {
                    setSettingsMsg(e.message || 'Failed to load defaults');
                  } finally {
                    setDefaultsLoading(false);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm"
              >Load Org Defaults</button>
            </div>
          </section>
          {/* Password Modal */}
          {showPwd && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-kanva-green text-white grid place-items-center shadow-kanva">🔒</div>
                  <h3 className="text-lg font-semibold">Confirm Admin Action</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">Enter the admin passcode to save Team Goals.</p>
                <input
                  type="password"
                  value={pwdInput}
                  onChange={(e)=>{ setPwdInput(e.target.value); setPwdError(null);} }
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Admin passcode"
                  autoFocus
                />
                {pwdError && <p className="mt-2 text-sm text-red-600">{pwdError}</p>}
                <div className="mt-5 flex items-center justify-end gap-3">
                  <button onClick={()=>setShowPwd(false)} className="px-4 py-2 rounded-lg bg-gray-100">Cancel</button>
                  <button onClick={confirmTeamGoalsSave} className="px-4 py-2 rounded-lg text-white bg-kanva-green hover:bg-green-600">Confirm</button>
                </div>
              </div>
            </div>
          )}
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
            {/* Optional overrides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <label className="block">
                <span className="text-sm text-gray-600">Copper User Email (override)</span>
                <input value={copperUserEmail} onChange={(e)=>setCopperUserEmail(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" placeholder="user@kanvabotanicals.com" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Start Date (optional)</span>
                <input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">End Date (optional)</span>
                <input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => {
                  const end = new Date();
                  const start = new Date(); start.setDate(end.getDate() - 90);
                  setStartDate(start.toISOString().slice(0,10));
                  setEndDate(end.toISOString().slice(0,10));
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm"
              >
                Last 90 days
              </button>
              <button
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm"
              >
                Clear Dates
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
