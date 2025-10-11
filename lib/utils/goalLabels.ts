import { GoalType } from '@/types';

/**
 * Human-readable labels for goal types
 */
export const goalTypeLabels: Record<GoalType, string> = {
  phone_call_quantity: 'Phone Calls',
  talk_time_minutes: 'Talk Time (Minutes)',
  email_quantity: 'Emails',
  sms_quantity: 'Text Messages',
  lead_progression_a: 'Lead Progression A',
  lead_progression_b: 'Lead Progression B',
  lead_progression_c: 'Lead Progression C',
  new_sales_wholesale: 'New Sales (Wholesale)',
  new_sales_distribution: 'New Sales (Distribution)',
};

/**
 * Short labels for goal types (used in compact displays)
 */
export const goalTypeShortLabels: Record<GoalType, string> = {
  phone_call_quantity: 'Calls',
  talk_time_minutes: 'Talk Time',
  email_quantity: 'Emails',
  sms_quantity: 'Texts',
  lead_progression_a: 'Lead A',
  lead_progression_b: 'Lead B',
  lead_progression_c: 'Lead C',
  new_sales_wholesale: 'Wholesale',
  new_sales_distribution: 'Distribution',
};

/**
 * Get human-readable label for a goal type
 */
export function getGoalTypeLabel(type: GoalType, short: boolean = false): string {
  return short ? goalTypeShortLabels[type] : goalTypeLabels[type];
}

/**
 * Format goal type for display (replaces underscores with spaces and title cases)
 */
export function formatGoalType(type: string): string {
  // Check if we have a predefined label
  if (type in goalTypeLabels) {
    return goalTypeLabels[type as GoalType];
  }
  
  // Fallback: format the string
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
