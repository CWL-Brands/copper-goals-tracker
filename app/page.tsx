'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChange, auth, signOut } from '@/lib/firebase/client';
import { userService, goalService, metricService, settingsService } from '@/lib/firebase/services';
import { Goal, GoalPeriod, GoalType, Metric, User } from '@/types';
// Copper SSO removed: standalone login only
import GoalGrid from '@/components/organisms/GoalGrid';
import GoalSetter from '@/components/molecules/GoalSetter';
import toast from 'react-hot-toast';
import { eachDayOfInterval, endOfMonth, format, startOfMonth, subDays } from 'date-fns';
import Link from 'next/link';

const goalTypes: GoalType[] = [
  'talk_time',
  'email_quantity',
  'lead_progression_a',
  'lead_progression_b',
  'lead_progression_c',
  'new_sales_wholesale',
  'new_sales_distribution',
];

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [period, setPeriod] = useState<GoalPeriod>('daily');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  // Public team overview state
  const [teamGoals, setTeamGoals] = useState<Record<string, any> | null>(null);
  const [teamTotals, setTeamTotals] = useState<Record<string, number>>({});
  const [showSetter, setShowSetter] = useState(false);
  const [setterType, setSetterType] = useState<GoalType | null>(null);
  const [calendarMarks, setCalendarMarks] = useState<Record<string, boolean>>({});
  const [saw, setSaw] = useState<{ skills?: string; training?: string; reading?: string; habits?: string }>({});

  // Copper SSO removed

  // Auth and initial data (standalone login only)
  useEffect(() => {
    const unsub = onAuthStateChange(async (u) => {
      try {
        if (!u) throw new Error('unauth');

        const profile = await userService.getUser(u.uid);
        if (profile) setUser(profile); else {
          // Fallback to Firebase auth user for display if profile doc missing
          setUser({ id: u.uid, email: u.email || '', name: u.displayName || (u.email ? u.email.split('@')[0] : 'Sales Representative'), role: 'sales' } as any);
        }
        const g = await goalService.getUserGoals(u.uid, period);
        setGoals(g);
        metricService.subscribeToMetrics(u.uid, setMetrics);
        const today = new Date();
        const start = subDays(today, 29);
        const perDay: Record<string, boolean> = {};
        for (const t of goalTypes) {
          const ms = await metricService.getMetrics(u.uid, t, start, today);
          ms.forEach(m => { const k = format(m.date, 'yyyy-MM-dd'); perDay[k] = true; });
        }
        setCalendarMarks(perDay);
        const s = await settingsService.getSettings(u.uid);
        if (s?.saw) setSaw(s.saw);
      } catch {
        // Not authenticated: leave state cleared; standalone login page will handle auth
        setUser(null);
        setGoals([]);
        setMetrics([]);
        setCalendarMarks({});
      }
    });
    return () => unsub();
  }, [period]);

  // Load public team aggregates (no auth required)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [gRes, mRes] = await Promise.all([
          fetch('/api/public/team-goals', { cache: 'no-store' }),
          fetch(`/api/public/team-metrics?period=${period}`, { cache: 'no-store' }),
        ]);
        const gData = await gRes.json();
        const mData = await mRes.json();
        if (!gRes.ok) throw new Error(gData?.error || 'Failed team goals');
        if (!mRes.ok) throw new Error(mData?.error || 'Failed team metrics');
        if (!cancelled) {
          setTeamGoals(gData?.teamGoals || {});
          setTeamTotals(mData?.totals || {});
        }
      } catch (e) {
        if (!cancelled) { setTeamGoals(null); setTeamTotals({}); }
      }
    })();
    return () => { cancelled = true; };
  }, [period]);

  // Calendar for current month
  const calendarDays = useMemo(() => {
    const now = new Date();
    const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
    return days.map((d) => ({
      date: d,
      key: format(d, 'yyyy-MM-dd'),
    }));
  }, []);

  const handleEditGoal = (type: GoalType) => {
    setSetterType(type);
    setShowSetter(true);
  };

  const handleSaveSaw = async () => {
    if (!user) return;
    try {
      await settingsService.updateSettings(user.id, { saw });
      toast.success('Saved');
    } catch (e) {
      toast.error('Failed to save');
    }
  };

  const syncCopper = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/sync-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, period }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Sync failed');
      toast.success('Sync complete');
    } catch (e: any) {
      toast.error(e.message || 'Sync error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Overview (Public) */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Team Overview</h3>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {(['daily','weekly','monthly'] as GoalPeriod[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-md text-sm ${period===p?'bg-white text-kanva-green shadow-sm':'text-gray-600'}`}>{p[0].toUpperCase()+p.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goalTypes.map((t) => {
            const value = Number(teamTotals[t] || 0);
            const target = Number(teamGoals?.[period]?.[t] ?? 0);
            const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
            const label = t === 'talk_time' ? 'Phone Calls' : t.replace(/_/g, ' ').replace(/\b\w/g, (l)=>l.toUpperCase());
            const isMoney = t.startsWith('new_sales_');
            return (
              <div key={t} className="rounded-lg border border-gray-100 p-4">
                <div className="text-sm text-gray-500">{label} ({period})</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {isMoney ? `$${value.toLocaleString()}` : value}
                  <span className="text-sm text-gray-500 ml-2">of {isMoney ? `$${target.toLocaleString()}` : target}</span>
                </div>
                <div className="mt-3 h-2 bg-gray-100 rounded">
                  <div className="h-2 bg-kanva-green rounded" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-right">
          <Link href={`/team-dashboard${typeof window!=='undefined'?window.location.search:''}`} className="text-sm text-kanva-green hover:underline">Open Full Team Dashboard →</Link>
        </div>
      </div>
      {/* A. Header / Navigation-like strip */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-kanva-green text-white grid place-items-center">🌿</div>
            <div>
              <div className="text-sm text-gray-500">Kanva Botanicals</div>
              <div className="font-semibold">{user?.name || (user?.email ? user.email.split('@')[0] : 'Sales Rep')}</div>
              <div className="text-xs text-gray-500">{user?.email || ''}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {(['daily','weekly','monthly'] as GoalPeriod[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-md text-sm ${period===p?'bg-white text-kanva-green shadow-sm':'text-gray-600'}`}>{p[0].toUpperCase()+p.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={async()=>{ try { await signOut(); } catch {} finally { window.location.reload(); } }} className="px-3 py-1.5 rounded-md text-xs bg-gray-100 hover:bg-gray-200">Reload Session</button>
        </div>
      </div>

      {/* B. Goals Calendar Widget */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Goals Calendar</h3>
          <div className="text-sm text-gray-500">{format(new Date(), 'MMMM yyyy')}</div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map(({ date, key }) => {
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const hit = !!calendarMarks[key];
            return (
              <div key={key} className={`h-16 rounded-lg border flex flex-col items-center justify-center text-sm relative ${isToday?'border-kanva-green':''}`}>
                <div className="text-gray-800">{format(date, 'd')}</div>
                {hit && <span className="absolute bottom-1 w-2 h-2 rounded-full bg-kanva-green" />}
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-xs text-gray-500">Green dot = activity logged.</div>
      </div>

      {/* C. Weekly Schedule Overview (compact metrics per day) */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-lg font-semibold mb-3">Weekly Overview</h3>
        <div className="grid grid-cols-7 gap-3">
          {eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() }).map((d) => {
            const dayKey = format(d, 'yyyy-MM-dd');
            const dailyEmails = metrics.filter(m=>m.type==='email_quantity' && format(m.date,'yyyy-MM-dd')===dayKey).reduce((a,b)=>a+b.value,0);
            const dailyTalk = metrics.filter(m=>m.type==='talk_time' && format(m.date,'yyyy-MM-dd')===dayKey).reduce((a,b)=>a+b.value,0);
            const dailyLeads = metrics.filter(m=>m.type==='lead_progression_a' || m.type==='lead_progression_b' || m.type==='lead_progression_c').filter(m=>format(m.date,'yyyy-MM-dd')===dayKey).reduce((a,b)=>a+b.value,0);
            const maxBar = Math.max(1, dailyEmails, dailyTalk, dailyLeads);
            const isToday = format(d,'yyyy-MM-dd')===format(new Date(),'yyyy-MM-dd');
            return (
              <div key={dayKey} className={`p-3 rounded-lg border ${isToday?'border-kanva-green':''}`}>
                <div className="text-xs text-gray-600 mb-1">{format(d, 'EEE')}</div>
                <div className="space-y-1">
                  <div className="h-1.5 bg-gray-100 rounded"><div className="h-1.5 bg-kanva-green rounded" style={{width:`${Math.round(dailyEmails/maxBar*100)}%`}}/></div>
                  <div className="h-1.5 bg-gray-100 rounded"><div className="h-1.5 bg-blue-500 rounded" style={{width:`${Math.round(dailyTalk/maxBar*100)}%`}}/></div>
                  <div className="h-1.5 bg-gray-100 rounded"><div className="h-1.5 bg-amber-500 rounded" style={{width:`${Math.round(dailyLeads/maxBar*100)}%`}}/></div>
                </div>
                <div className="mt-1 text-[10px] text-gray-500">E:{dailyEmails} • P:{dailyTalk} • L:{dailyLeads}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-gray-500">Bars: Emails (green), Phone Calls (blue), Leads (amber)</div>
      </div>

      {/* D. Active Goals Dashboard */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Active Goals</h3>
          <button onClick={()=>{ setSetterType('email_quantity'); setShowSetter(true); }} className="px-3 py-1.5 rounded-lg bg-kanva-green text-white text-sm">Set New Goal</button>
        </div>
        <GoalGrid
          goalTypes={goalTypes}
          goals={goals}
          selectedPeriod={period}
          onAddGoal={handleEditGoal}
          onEditGoal={handleEditGoal}
        />
      </div>

      {/* E. Sharpening the Saw */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-lg font-semibold mb-3">Sharpening the Saw</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Skills / Training</label>
            <textarea value={saw.training || ''} onChange={(e)=>setSaw({...saw, training:e.target.value})} className="w-full border rounded-md px-3 py-2 h-24" placeholder="Certifications, trainings, courses"/>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Reading List / Resources</label>
            <textarea value={saw.reading || ''} onChange={(e)=>setSaw({...saw, reading:e.target.value})} className="w-full border rounded-md px-3 py-2 h-24" placeholder="Books, articles, podcasts"/>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Habits Tracker</label>
            <textarea value={saw.habits || ''} onChange={(e)=>setSaw({...saw, habits:e.target.value})} className="w-full border rounded-md px-3 py-2 h-24" placeholder="Daily/weekly growth habits"/>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Skills Notes</label>
            <textarea value={saw.skills || ''} onChange={(e)=>setSaw({...saw, skills:e.target.value})} className="w-full border rounded-md px-3 py-2 h-24" placeholder="Notes and progress"/>
          </div>
        </div>
        <div className="mt-3">
          <button onClick={handleSaveSaw} className="px-4 py-2 rounded-lg bg-kanva-green text-white">Save</button>
        </div>
      </div>

      {/* F. Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={()=>{ setSetterType('email_quantity'); setShowSetter(true); }} className="px-4 py-2 rounded-lg bg-kanva-green text-white">Set New Goal</button>
          <Link href={`/team-dashboard${typeof window!=='undefined'?window.location.search:''}`} className="px-4 py-2 rounded-lg bg-gray-100">View Reports</Link>
          <button onClick={syncCopper} className="px-4 py-2 rounded-lg bg-gray-100">Sync with Copper</button>
        </div>
      </div>

      {showSetter && setterType && user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <GoalSetter
              userId={user.id}
              goalType={setterType}
              period={period}
              existingGoal={goals.find(g=>g.type===setterType) || undefined}
              onSave={(goal)=>{ setGoals(prev=>[...prev.filter(g=>g.id!==goal.id), goal]); setShowSetter(false); setSetterType(null); }}
              onCancel={()=>{ setShowSetter(false); setSetterType(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}