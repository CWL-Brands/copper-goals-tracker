'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Goal, Metric, GoalType, GoalPeriod } from '@/types';
import { userService, goalService, metricService } from '@/lib/firebase/services';
import { signInWithGoogle, onAuthStateChange } from '@/lib/firebase/client';
import { copperIntegration } from '@/lib/copper/integration';
import GoalCard from '@/components/molecules/GoalCard';
import GoalSetter from '@/components/molecules/GoalSetter';
import MetricsToolbar from '@/components/organisms/MetricsToolbar';
import GoalGrid from '@/components/organisms/GoalGrid';
import TeamPerformance from '@/components/organisms/TeamPerformance';
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

  // Initialize data
  useEffect(() => {
    // Subscribe to Firebase Auth state and load data for the signed-in user
    const unsubscribeAuth = onAuthStateChange(async (firebaseUser) => {
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
      const userData = await userService.getUser(firebaseUser.uid);
      if (userData) {
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

  const initializeCopperIntegration = async () => {
    try {
      await copperIntegration.init();
      const context = await copperIntegration.getContext();
      if (context) {
        console.log('Copper context loaded:', context);
        // Could auto-update metrics based on Copper data
      }
    } catch (error) {
      console.error('Copper integration error:', error);
    }
  };

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
          <p className="text-sm text-gray-600 mb-6">Use your Kanva Botanicals Google account to access your goals.</p>
          <button
            onClick={async () => {
              try {
                // Detect iframe context
                let inIframe = false;
                try { inIframe = window.self !== window.top; } catch { inIframe = true; }

                if (inIframe) {
                  // Open top-level login flow in a separate window/tab
                  const width = 520;
                  const height = 640;
                  const left = window.screen.width / 2 - width / 2;
                  const top = window.screen.height / 2 - height / 2;
                  window.open(
                    `${window.location.origin}/login`,
                    'KanvaAuth',
                    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
                  );
                } else {
                  // Not in iframe: navigate to login route which performs redirect flow
                  window.location.href = '/login';
                }
              } catch (e) {
                console.error('Sign-in failed', e);
                toast.error('Sign-in failed');
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-kanva-green text-white hover:bg-green-600 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.7 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.2-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.4 16.2 18.8 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.7 29.6 4 24 4 16 4 9.2 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.4l-6.3-5.2C29 35.2 26.6 36 24 36c-5.2 0-9.6-3.6-11.3-8.3l-6.5 5C8.9 39.7 15.9 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.9-4.9 7.5-9.3 7.5-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.7 29.6 4 24 4c-7.1 0-13.1 3.8-17.7 9.9l-6 4.8z"/></svg>
            Continue with Google
          </button>
          <p className="text-xs text-gray-500 mt-3">Make sure Google sign-in is enabled for the Firebase project and localhost is an authorized domain.</p>
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
                {user?.name || 'Sales Representative'}
              </h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
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