'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChange } from '@/lib/firebase/client';
import toast from 'react-hot-toast';

export default function TeamGoalsTab() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pwdInput, setPwdInput] = useState('');
  const [teamGoals, setTeamGoals] = useState<Record<string, any>>({
    daily: {
      phone_call_quantity: 125,
      email_quantity: 50,
      sms_quantity: 50,
      lead_progression_a: 15,
      lead_progression_b: 10,
      lead_progression_c: 5,
      new_sales_wholesale: 5000,
      new_sales_distribution: 10000,
    },
    weekly: {
      phone_call_quantity: 625,
      email_quantity: 250,
      sms_quantity: 250,
      lead_progression_a: 75,
      lead_progression_b: 50,
      lead_progression_c: 25,
      new_sales_wholesale: 25000,
      new_sales_distribution: 50000,
    },
    monthly: {
      phone_call_quantity: 2500,
      email_quantity: 1000,
      sms_quantity: 1000,
      lead_progression_a: 300,
      lead_progression_b: 200,
      lead_progression_c: 100,
      new_sales_wholesale: 100000,
      new_sales_distribution: 200000,
    },
    quarterly: {
      phone_call_quantity: 7500,
      email_quantity: 3000,
      sms_quantity: 3000,
      lead_progression_a: 900,
      lead_progression_b: 600,
      lead_progression_c: 300,
      new_sales_wholesale: 300000,
      new_sales_distribution: 600000,
    },
  });

  useEffect(() => {
    const unsub = onAuthStateChange((u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  const saveTeamGoals = async () => {
    if (!uid) return;
    if (!pwdInput) {
      toast.error('Password required');
      return;
    }
    setShowPwd(false);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/team-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamGoals, password: pwdInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save team goals');
      toast.success('Team goals saved');
      setPwdInput('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save team goals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Team Goals</h2>
        <p className="text-sm text-gray-600">Set organization-wide targets. Users will still have individual goals.</p>
      </div>

      {['daily', 'weekly', 'monthly', 'quarterly'].map((period) => (
        <div key={period} className="border-t pt-6">
          <h3 className="text-md font-medium mb-4 capitalize">{period}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Phone Calls</label>
              <input
                type="number"
                value={teamGoals[period].phone_call_quantity}
                onChange={(e) => setTeamGoals({
                  ...teamGoals,
                  [period]: { ...teamGoals[period], phone_call_quantity: Number(e.target.value) }
                })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Emails</label>
              <input
                type="number"
                value={teamGoals[period].email_quantity}
                onChange={(e) => setTeamGoals({
                  ...teamGoals,
                  [period]: { ...teamGoals[period], email_quantity: Number(e.target.value) }
                })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Text Messages</label>
              <input
                type="number"
                value={teamGoals[period].sms_quantity}
                onChange={(e) => setTeamGoals({
                  ...teamGoals,
                  [period]: { ...teamGoals[period], sms_quantity: Number(e.target.value) }
                })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Fact Finding (A)</label>
              <input
                type="number"
                value={teamGoals[period].lead_progression_a}
                onChange={(e) => setTeamGoals({
                  ...teamGoals,
                  [period]: { ...teamGoals[period], lead_progression_a: Number(e.target.value) }
                })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Contact Stage (B)</label>
              <input
                type="number"
                value={teamGoals[period].lead_progression_b}
                onChange={(e) => setTeamGoals({
                  ...teamGoals,
                  [period]: { ...teamGoals[period], lead_progression_b: Number(e.target.value) }
                })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Closing Stage (C)</label>
              <input
                type="number"
                value={teamGoals[period].lead_progression_c}
                onChange={(e) => setTeamGoals({
                  ...teamGoals,
                  [period]: { ...teamGoals[period], lead_progression_c: Number(e.target.value) }
                })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Wholesale Sales ($)</label>
              <input
                type="number"
                value={teamGoals[period].new_sales_wholesale}
                onChange={(e) => setTeamGoals({
                  ...teamGoals,
                  [period]: { ...teamGoals[period], new_sales_wholesale: Number(e.target.value) }
                })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Distribution Sales ($)</label>
              <input
                type="number"
                value={teamGoals[period].new_sales_distribution}
                onChange={(e) => setTeamGoals({
                  ...teamGoals,
                  [period]: { ...teamGoals[period], new_sales_distribution: Number(e.target.value) }
                })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-4 border-t">
        <button
          onClick={() => setShowPwd(true)}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-kanva-green text-white hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : 'Save Team Goals'}
        </button>
      </div>

      {/* Password Modal */}
      {showPwd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Changes</h3>
            <p className="text-sm text-gray-600 mb-4">Enter your password to save team goals:</p>
            <input
              type="password"
              value={pwdInput}
              onChange={(e) => setPwdInput(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mb-4"
              placeholder="Password"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={saveTeamGoals}
                className="flex-1 px-4 py-2 rounded-lg bg-kanva-green text-white hover:bg-green-600"
              >
                Confirm
              </button>
              <button
                onClick={() => { setShowPwd(false); setPwdInput(''); }}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
