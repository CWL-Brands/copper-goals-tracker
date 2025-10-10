/**
 * Pace Calculator Utility
 * Calculates targets based on goal progress (daily, weekly, monthly)
 */

import { 
  startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek,
  startOfDay, endOfDay,
  differenceInDays, 
  differenceInHours,
  isToday 
} from 'date-fns';

export interface PaceCalculation {
  // Period info
  period: 'daily' | 'weekly' | 'monthly';
  periodTarget: number;
  currentProgress: number;
  totalUnits: number; // days in month, days in week, hours in day
  unitsElapsed: number;
  unitsRemaining: number;
  unitLabel: string; // 'day', 'hour', etc.
  
  // Pace calculations
  expectedProgress: number; // Where you should be by now
  progressDelta: number; // How far ahead/behind (positive = ahead)
  progressPercentage: number; // % of goal completed
  pacePercentage: number; // % of time elapsed
  
  // Targets
  originalUnitTarget: number; // Goal / total units
  adjustedUnitTarget: number; // Remaining goal / units remaining
  currentTarget: number; // What you need NOW to stay on pace
  
  // Status
  status: 'ahead' | 'on-pace' | 'behind';
  statusMessage: string;
}

/**
 * Calculate pace for any goal period (daily, weekly, monthly)
 */
export function calculatePace(
  period: 'daily' | 'weekly' | 'monthly',
  target: number,
  currentProgress: number,
  referenceDate: Date = new Date()
): PaceCalculation {
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;
  let totalUnits: number;
  let unitsElapsed: number;
  let unitLabel: string;
  
  switch (period) {
    case 'daily':
      periodStart = startOfDay(referenceDate);
      periodEnd = endOfDay(referenceDate);
      // For daily: use hours (24 hours in a day)
      const hoursInDay = 24;
      const currentHour = now.getHours();
      totalUnits = hoursInDay;
      unitsElapsed = currentHour + 1; // Include current hour
      unitLabel = 'hour';
      break;
      
    case 'weekly':
      periodStart = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Monday
      periodEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
      totalUnits = 7; // days in week
      unitsElapsed = differenceInDays(now, periodStart) + 1;
      unitLabel = 'day';
      break;
      
    case 'monthly':
    default:
      periodStart = startOfMonth(referenceDate);
      periodEnd = endOfMonth(referenceDate);
      totalUnits = differenceInDays(periodEnd, periodStart) + 1;
      unitsElapsed = differenceInDays(now, periodStart) + 1;
      unitLabel = 'day';
      break;
  }
  
  const unitsRemaining = Math.max(totalUnits - unitsElapsed, 1); // At least 1 unit
  
  // Calculate original unit target
  const originalUnitTarget = target / totalUnits;
  
  // Calculate expected progress (where you should be by now)
  const expectedProgress = originalUnitTarget * unitsElapsed;
  
  // Calculate delta (positive = ahead, negative = behind)
  const progressDelta = currentProgress - expectedProgress;
  
  // Calculate percentages
  const progressPercentage = target > 0 ? (currentProgress / target) * 100 : 0;
  const pacePercentage = (unitsElapsed / totalUnits) * 100;
  
  // Calculate adjusted unit target for remaining time
  const remainingGoal = Math.max(target - currentProgress, 0);
  const adjustedUnitTarget = remainingGoal / unitsRemaining;
  
  // Calculate current target (what you need NOW to stay on pace)
  const currentTarget = Math.max(adjustedUnitTarget, 0);
  
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
  const deltaRounded = Math.abs(Math.round(progressDelta));
  if (status === 'ahead') {
    statusMessage = `You're ${deltaRounded} ahead of pace! 🎉`;
  } else if (status === 'on-pace') {
    statusMessage = `You're on pace to hit your goal! 🎯`;
  } else {
    statusMessage = `You're ${deltaRounded} behind pace`;
  }
  
  return {
    period,
    periodTarget: target,
    currentProgress,
    totalUnits,
    unitsElapsed,
    unitsRemaining,
    unitLabel,
    expectedProgress,
    progressDelta,
    progressPercentage,
    pacePercentage,
    originalUnitTarget,
    adjustedUnitTarget,
    currentTarget,
    status,
    statusMessage,
  };
}

/**
 * Legacy function for backward compatibility
 */
export function calculateMonthlyPace(
  monthlyTarget: number,
  currentProgress: number,
  referenceDate: Date = new Date()
): PaceCalculation {
  return calculatePace('monthly', monthlyTarget, currentProgress, referenceDate);
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
