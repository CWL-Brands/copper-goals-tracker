/**
 * Pace Calculator Utility
 * Calculates daily targets based on monthly goal progress
 */

import { startOfMonth, endOfMonth, differenceInDays, isToday } from 'date-fns';

export interface PaceCalculation {
  // Monthly goal info
  monthlyTarget: number;
  currentProgress: number;
  daysInMonth: number;
  daysElapsed: number;
  daysRemaining: number;
  
  // Pace calculations
  expectedProgress: number; // Where you should be by now
  progressDelta: number; // How far ahead/behind (positive = ahead)
  progressPercentage: number; // % of monthly goal completed
  pacePercentage: number; // % of time elapsed
  
  // Daily targets
  originalDailyTarget: number; // Monthly goal / days in month
  adjustedDailyTarget: number; // Remaining goal / days remaining
  todayTarget: number; // What you need TODAY to stay on pace
  
  // Status
  status: 'ahead' | 'on-pace' | 'behind';
  statusMessage: string;
}

/**
 * Calculate pace for a monthly goal
 */
export function calculateMonthlyPace(
  monthlyTarget: number,
  currentProgress: number,
  referenceDate: Date = new Date()
): PaceCalculation {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const now = new Date();
  
  // Calculate days
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
  const daysElapsed = differenceInDays(now, monthStart) + 1;
  const daysRemaining = Math.max(differenceInDays(monthEnd, now), 1); // At least 1 day
  
  // Calculate original daily target
  const originalDailyTarget = monthlyTarget / daysInMonth;
  
  // Calculate expected progress (where you should be by now)
  const expectedProgress = originalDailyTarget * daysElapsed;
  
  // Calculate delta (positive = ahead, negative = behind)
  const progressDelta = currentProgress - expectedProgress;
  
  // Calculate percentages
  const progressPercentage = monthlyTarget > 0 ? (currentProgress / monthlyTarget) * 100 : 0;
  const pacePercentage = (daysElapsed / daysInMonth) * 100;
  
  // Calculate adjusted daily target for remaining days
  const remainingGoal = Math.max(monthlyTarget - currentProgress, 0);
  const adjustedDailyTarget = remainingGoal / daysRemaining;
  
  // Calculate today's target (what you need to hit today to stay on pace)
  const todayTarget = Math.max(adjustedDailyTarget, 0);
  
  // Determine status (within 5% tolerance = on-pace)
  let status: 'ahead' | 'on-pace' | 'behind';
  const tolerance = 0.05; // 5%
  
  if (progressPercentage >= pacePercentage + (tolerance * 100)) {
    status = 'ahead';
  } else if (progressPercentage >= pacePercentage - (tolerance * 100)) {
    status = 'on-pace';
  } else {
    status = 'behind';
  }
  
  // Generate status message
  let statusMessage = '';
  if (status === 'ahead') {
    statusMessage = `You're ${Math.abs(Math.round(progressDelta))} ahead of pace! 🎉`;
  } else if (status === 'on-pace') {
    statusMessage = `You're on pace to hit your goal! 🎯`;
  } else {
    statusMessage = `You're ${Math.abs(Math.round(progressDelta))} behind pace`;
  }
  
  return {
    monthlyTarget,
    currentProgress,
    daysInMonth,
    daysElapsed,
    daysRemaining,
    expectedProgress,
    progressDelta,
    progressPercentage,
    pacePercentage,
    originalDailyTarget,
    adjustedDailyTarget,
    todayTarget,
    status,
    statusMessage,
  };
}

/**
 * Format a number for display (e.g., 1234 -> "1,234" or "$1,234")
 */
export function formatMetricValue(value: number, isCurrency: boolean = false): string {
  const formatted = Math.round(value).toLocaleString();
  return isCurrency ? `$${formatted}` : formatted;
}

/**
 * Get color class based on pace status
 */
export function getPaceColor(status: 'ahead' | 'on-pace' | 'behind'): string {
  switch (status) {
    case 'ahead':
      return 'text-green-600';
    case 'on-pace':
      return 'text-blue-600';
    case 'behind':
      return 'text-orange-600';
  }
}

/**
 * Get background color class based on pace status
 */
export function getPaceBgColor(status: 'ahead' | 'on-pace' | 'behind'): string {
  switch (status) {
    case 'ahead':
      return 'bg-green-50 border-green-200';
    case 'on-pace':
      return 'bg-blue-50 border-blue-200';
    case 'behind':
      return 'bg-orange-50 border-orange-200';
  }
}

/**
 * Get icon for pace status
 */
export function getPaceIcon(status: 'ahead' | 'on-pace' | 'behind'): string {
  switch (status) {
    case 'ahead':
      return '🚀';
    case 'on-pace':
      return '🎯';
    case 'behind':
      return '⚡';
  }
}
