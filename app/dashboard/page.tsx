'use client';

import React, { useState, useEffect } from 'react';
import { User, Goal, Metric, GoalType, GoalPeriod } from '@/types';
import { userService, goalService, metricService } from '@/lib/firebase/services';
import { copperIntegration } from '@/lib/copper/integration';
import GoalCard from '@/components/molecules/GoalCard';
import GoalSetter from '@/components/molecules/GoalSetter';
import { 
  BarChart3, 
  Users, 
  Target, 
  TrendingUp,
  Calendar,
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

  // Initialize data
  useEffect(() => {
    loadDashboardData();
    initializeCopperIntegration();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // For demo, using a mock user ID - replace with actual auth
      const userId = 'demo-user-1';
      
      // Load user data
      const userData = await userService.getUser(userId);
      if (userData) {
        setUser(userData);
        
        // Load goals
        const userGoals = await goalService.getUserGoals(userId, selectedPeriod);
        setGoals(userGoals);
        
        // Subscribe to real-time updates
        const unsubscribeGoals = goalService.subscribeToGoals(userId, (updatedGoals) => {
          setGoals(updatedGoals.filter(g => g.period === selectedPeriod));
        });
        
        const unsubscribeMetrics = metricService.subscribeToMetrics(userId, setMetrics);
        
        // Cleanup on unmount
        return () => {
          unsubscribeGoals();
          unsubscribeMetrics();
        };
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-kanva-green rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Goals Tracker</h1>
              </div>
              
              {/* Period Selector */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['daily', 'weekly', 'monthly'] as GoalPeriod[]).map(period => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? 'bg-white text-kanva-green shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setTeamView(!teamView)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  teamView
                    ? 'bg-kanva-green text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Team View
              </button>
              
              <button
                onClick={loadDashboardData}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goalTypes.map(type => {
            const goal = goals.find(g => g.type === type);
            
            if (goal) {
              return (
                <GoalCard
                  key={type}
                  goal={goal}
                  onEdit={() => handleAddGoal(type)}
                />
              );
            }
            
            // Empty goal slot
            return (
              <button
                key={type}
                onClick={() => handleAddGoal(type)}
                className="bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-kanva-green p-6 transition-colors group"
              >
                <div className="text-center">
                  <Plus className="w-8 h-8 text-gray-400 group-hover:text-kanva-green mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                    Set {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Goal
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedPeriod} target
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Team Comparison (if enabled) */}
        {teamView && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-kanva-green" />
              Team Performance
            </h3>
            <div className="space-y-3">
              {goalTypes.map(type => {
                const goal = goals.find(g => g.type === type);
                if (!goal) return null;
                
                const rank = calculateTeamRank(type);
                return (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${rank <= 3 ? 'text-kanva-green' : 'text-gray-600'}`}>
                        #{rank}
                      </span>
                      <span className="text-sm text-gray-700">
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {((goal.current / goal.target) * 100).toFixed(0)}%
                      </span>
                      {rank <= 3 && <TrendingUp className="w-4 h-4 text-kanva-green" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

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
    </div>
  );
}