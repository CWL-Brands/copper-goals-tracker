'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { User, Goal, Metric, GoalType, GoalPeriod } from '@/types';
import { userService, goalService, metricService } from '@/lib/firebase/services';
import { auth, onAuthStateChange, signOut } from '@/lib/firebase/client';
import { db, doc, getDoc, setDoc, serverTimestamp } from '@/lib/firebase/db';
import GoalCard from '@/components/molecules/GoalCard';
import GoalSetter from '@/components/molecules/GoalSetter';
import MetricsToolbar from '@/components/organisms/MetricsToolbar';
import GoalGrid from '@/components/organisms/GoalGrid';
import TeamPerformance from '@/components/organisms/TeamPerformance';
import Link from 'next/link';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { eachDayOfInterval, subDays, format } from 'date-fns';
import { 
  BarChart3, 
  Users, 
  TrendingUp,
  Plus,
  RefreshCw,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const goalTypes: GoalType[] = [
  'talk_time',
  'email_quantity',
  'lead_progression_a',
  'lead_progression_b', 
  'lead_progression_c',
  'new_sales_wholesale',
  'new_sales_distribution'
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<GoalPeriod>('daily');
  const [isLoading, setIsLoading] = useState(true);
  const [showGoalSetter, setShowGoalSetter] = useState(false);
  const [selectedGoalType, setSelectedGoalType] = useState<GoalType | null>(null);
  const [teamView, setTeamView] = useState(false);
  const goalsUnsubRef = useRef<null | (() => void)>(null);
  const metricsUnsubRef = useRef<null | (() => void)>(null);
  const [email7d, setEmail7d] = useState<{ date: string; value: number }[]>([]);
  const [email30d, setEmail30d] = useState<{ date: string; value: number }[]>([]);
  const [talk7d, setTalk7d] = useState<{ date: string; value: number }[]>([]);
  const [talk30d, setTalk30d] = useState<{ date: string; value: number }[]>([]);

  // Initialize data
  useEffect(() => {
    // Subscribe to Firebase Auth state and load data for the signed-in user
    const unsubscribeAuth = onAuthStateChange(async (firebaseUser) => {
      console.log('[Dashboard] onAuthStateChange fired. user:', !!firebaseUser, firebaseUser?.email);
      if (!firebaseUser) {
        setUser(null);
        setGoals([]);
        setMetrics([]);
        setIsLoading(false);
        // cleanup any existing listeners
        if (goalsUnsubRef.current) { goalsUnsubRef.current(); goalsUnsubRef.current = null; }
        if (metricsUnsubRef.current) { metricsUnsubRef.current(); metricsUnsubRef.current = null; }
        return;
      }

      // Ensure a corresponding Firestore user doc exists and fetch it
      let userData = await userService.getUser(firebaseUser.uid);
      if (!userData) {
        console.warn('[Dashboard] No user doc found; creating profile…');
        try {
          const ref = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photoUrl: firebaseUser.photoURL,
              role: 'sales',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          userData = await userService.getUser(firebaseUser.uid);
        } catch (e) {
          console.error('[Dashboard] Failed to create user profile:', e);
        }
      }
      if (userData) {
        // If first login, force password change
        if (userData.passwordChanged === false) {
          window.location.href = '/change-password';
          return;
        }
        setUser(userData);
        await loadDashboardData(firebaseUser.uid);
      } else {
        // If no user doc (and not in DEV_MODE fallback), stop loading
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [selectedPeriod]);

  // Remove Google OAuth cross-window listeners; email/password flow relies on standard auth state
  useEffect(() => {
    // No-op effect kept to preserve prior structure; all updates driven by onAuthStateChange
  }, [user?.id]);

  const loadDashboardData = async (uid?: string) => {
    setIsLoading(true);
    try {
      // Use provided uid (from Auth) or current state's user id
      const userId = uid || user?.id;
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      // Load user data
      const userData = await userService.getUser(userId);
      if (userData) {
        setUser(userData);
        
        // Load goals
        const userGoals = await goalService.getUserGoals(userId, selectedPeriod);
        setGoals(userGoals);
        
        // Cleanup previous listeners before attaching new ones
        if (goalsUnsubRef.current) { goalsUnsubRef.current(); }
        if (metricsUnsubRef.current) { metricsUnsubRef.current(); }

        goalsUnsubRef.current = goalService.subscribeToGoals(userId, (updatedGoals) => {
          setGoals(updatedGoals.filter(g => g.period === selectedPeriod));
        });

        metricsUnsubRef.current = metricService.subscribeToMetrics(userId, setMetrics);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load series for sparklines (7d and 30d) for emails and talk time
  useEffect(() => {
    const loadSeries = async () => {
      try {
        const uid = user?.id;
        if (!uid) return;
        const today = new Date();
        const start7 = subDays(today, 6); // include today -> 7 points
        const start30 = subDays(today, 29);

        const buildDailySeries = (metrics: any[], start: Date, end: Date) => {
          const days = eachDayOfInterval({ start, end });
          const map = new Map<string, number>();
          for (const m of metrics) {
            const key = format(m.date, 'yyyy-MM-dd');
            map.set(key, (map.get(key) || 0) + (m.value || 0));
          }
          return days.map((d) => {
            const key = format(d, 'yyyy-MM-dd');
            return { date: key, value: map.get(key) || 0 };
          });
        };

        // Emails
        const emails7 = await metricService.getMetrics(uid, 'email_quantity', start7, today);
        const emails30 = await metricService.getMetrics(uid, 'email_quantity', start30, today);
        setEmail7d(buildDailySeries(emails7, start7, today));
        setEmail30d(buildDailySeries(emails30, start30, today));

        // Talk Time
        const tt7 = await metricService.getMetrics(uid, 'talk_time', start7, today);
        const tt30 = await metricService.getMetrics(uid, 'talk_time', start30, today);
        setTalk7d(buildDailySeries(tt7, start7, today));
        setTalk30d(buildDailySeries(tt30, start30, today));
      } catch (e) {
        console.warn('Failed loading sparkline data', e);
      }
    };
    loadSeries();
  }, [user?.id]);

  // Copper integration removed (standalone login only)

  const handleAddGoal = (type: GoalType) => {
    setSelectedGoalType(type);
    setShowGoalSetter(true);
  };

  const handleGoalSaved = (goal: Goal) => {
    setGoals(prev => [...prev.filter(g => g.id !== goal.id), goal]);
    setShowGoalSetter(false);
    setSelectedGoalType(null);
  };

  const handleManualEntry = async (type: GoalType, value: number) => {
    if (!user) return;
    
    try {
      await metricService.logMetric({
        userId: user.id,
        type,
        value,
        date: new Date(),
        source: 'manual'
      });
      
      // Update goal progress
      const goal = goals.find(g => g.type === type);
      if (goal) {
        await goalService.upsertGoal({
          ...goal,
          current: goal.current + value
        });
      }
      
      toast.success('Progress updated!');
    } catch (error) {
      console.error('Error logging metric:', error);
      toast.error('Failed to update progress');
    }
  };

  const calculateTeamRank = (goalType: GoalType): number => {
    // This would calculate actual rank from team data
    return Math.floor(Math.random() * 10) + 1;
  };

  const toTitle = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-kanva-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white shadow-sm rounded-xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to continue</h2>
          <p className="text-sm text-gray-600 mb-6">Use your Kanva Botanicals email and password to access your goals.</p>
          <a href="/login" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-kanva-green text-white hover:bg-green-600 transition-colors">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Controls */}
      <MetricsToolbar
        period={selectedPeriod}
        onChangePeriod={setSelectedPeriod}
        onRefresh={() => loadDashboardData()}
        teamView={teamView}
        onToggleTeamView={() => setTeamView(!teamView)}
      />
      <div className="mt-2 flex justify-end">
        <button
          onClick={async()=>{ try { await signOut(); } catch {} finally { window.location.reload(); } }}
          className="px-3 py-1.5 rounded-md text-xs bg-gray-100 hover:bg-gray-200"
        >Reload Session</button>
      </div>

      {/* User Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user?.photoUrl ? (
              <img 
                src={user.photoUrl} 
                alt={user.name}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 bg-kanva-green rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {user?.name || (user?.email ? user.email.split('@')[0] : 'Sales Representative')}
              </h2>
              <p className="text-sm text-gray-500">{user?.email || ''}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-kanva-green">
                {goals.filter(g => g.current >= g.target).length}
              </p>
              <p className="text-xs text-gray-500">Goals Met</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {goals.length}
              </p>
              <p className="text-xs text-gray-500">Total Goals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {goals.length > 0 
                  ? Math.round(goals.reduce((acc, g) => acc + (g.current / g.target * 100), 0) / goals.length)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500">Avg Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* At a glance */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">At a glance</h3>
          <Link href={`/team-dashboard${typeof window !== 'undefined' ? window.location.search : ''}`} className="text-sm text-kanva-green hover:underline">View Team Dashboard →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Sales */}
          {(() => {
            const ws = goals.find(g => g.type === 'new_sales_wholesale');
            const ds = goals.find(g => g.type === 'new_sales_distribution');
            const current = (ws?.current || 0) + (ds?.current || 0);
            const target = (ws?.target || 0) + (ds?.target || 0);
            const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
            return (
              <div className="rounded-lg border border-gray-100 p-4">
                <div className="text-sm text-gray-500">Total Sales ({selectedPeriod})</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  ${current.toLocaleString()} <span className="text-sm text-gray-500 ml-2">of ${target.toLocaleString()}</span>
                </div>
                <div className="mt-3 h-2 bg-gray-100 rounded">
                  <div className="h-2 bg-kanva-green rounded" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })()}
          {(['email_quantity','talk_time','new_sales_wholesale','new_sales_distribution'] as GoalType[]).map((t) => {
            const g = goals.find(g => g.type === t);
            const current = g?.current ?? 0;
            const target = g?.target ?? 0;
            const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
            const isMoney = t.startsWith('new_sales_');
            const label = t.replace(/_/g,' ').replace(/\b\w/g, l=>l.toUpperCase());
            return (
              <div key={t} className="rounded-lg border border-gray-100 p-4">
                <div className="text-sm text-gray-500">{label} ({selectedPeriod})</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {isMoney ? `$${current.toLocaleString()}` : current}
                  <span className="text-sm text-gray-500 ml-2">of {isMoney ? `$${target.toLocaleString()}` : target}</span>
                </div>
                <div className="mt-3 h-2 bg-gray-100 rounded">
                  <div className="h-2 bg-kanva-green rounded" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights: Sparklines */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Emails – last 7 days</span>
              <span className="text-sm text-gray-900 font-medium">{email7d.reduce((a,b)=>a+b.value,0)}</span>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={email7d} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip formatter={(v)=>[v as number,'Emails']} labelFormatter={(l)=>l} cursor={{ stroke: '#e5e7eb' }} />
                  <Area type="monotone" dataKey="value" stroke="#16a34a" fillOpacity={1} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-3 mb-2">
              <span className="text-sm text-gray-600">Emails – last 30 days</span>
              <span className="text-sm text-gray-900 font-medium">{email30d.reduce((a,b)=>a+b.value,0)}</span>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={email30d} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip formatter={(v)=>[v as number,'Emails']} labelFormatter={(l)=>l} cursor={{ stroke: '#e5e7eb' }} />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" fillOpacity={1} fill="url(#g2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Talk Time – last 7 days</span>
              <span className="text-sm text-gray-900 font-medium">{talk7d.reduce((a,b)=>a+b.value,0)}m</span>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={talk7d} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip formatter={(v)=>[v as number,'Minutes']} labelFormatter={(l)=>l} cursor={{ stroke: '#e5e7eb' }} />
                  <Area type="monotone" dataKey="value" stroke="#ea580c" fillOpacity={1} fill="url(#g3)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-3 mb-2">
              <span className="text-sm text-gray-600">Talk Time – last 30 days</span>
              <span className="text-sm text-gray-900 font-medium">{talk30d.reduce((a,b)=>a+b.value,0)}m</span>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={talk30d} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="g4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip formatter={(v)=>[v as number,'Minutes']} labelFormatter={(l)=>l} cursor={{ stroke: '#e5e7eb' }} />
                  <Area type="monotone" dataKey="value" stroke="#7c3aed" fillOpacity={1} fill="url(#g4)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <GoalGrid
        goalTypes={goalTypes}
        goals={goals}
        selectedPeriod={selectedPeriod}
        onAddGoal={handleAddGoal}
        onEditGoal={handleAddGoal}
      />

      {/* Team Comparison (if enabled) */}
      {teamView && <TeamPerformance goals={goals.filter(g => goalTypes.includes(g.type))} />}

      {/* Goal Setter Modal */}
      {showGoalSetter && selectedGoalType && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <GoalSetter
              userId={user.id}
              goalType={selectedGoalType}
              period={selectedPeriod}
              existingGoal={goals.find(g => g.type === selectedGoalType)}
              onSave={handleGoalSaved}
              onCancel={() => {
                setShowGoalSetter(false);
                setSelectedGoalType(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}