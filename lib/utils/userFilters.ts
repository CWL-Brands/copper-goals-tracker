import { User, UserTitle } from '@/types';

/**
 * Titles that should be included in sales tracking/dashboards
 */
export const SALES_TITLES: UserTitle[] = [
  'Sales Representative',
  'Sales Manager',
];

/**
 * Titles that should be excluded from sales tracking (executives, directors, etc.)
 */
export const EXECUTIVE_TITLES: UserTitle[] = [
  'Director',
  'Vice President',
  'Executive',
];

/**
 * Check if a user should be included in sales tracking/dashboards
 * Based on their title (not role)
 */
export function isSalesUser(user: User): boolean {
  // If no title set, include them (backward compatibility)
  if (!user.title) {
    return true;
  }
  
  return SALES_TITLES.includes(user.title);
}

/**
 * Check if a user is an executive (excluded from sales tracking)
 */
export function isExecutive(user: User): boolean {
  if (!user.title) {
    return false;
  }
  
  return EXECUTIVE_TITLES.includes(user.title);
}

/**
 * Filter users to only include those who should be tracked for sales
 */
export function filterSalesUsers(users: User[]): User[] {
  return users.filter(isSalesUser);
}

/**
 * Get display name for a title
 */
export function getTitleDisplay(title?: UserTitle): string {
  if (!title) return 'No Title';
  return title;
}

/**
 * Get all available titles
 */
export function getAllTitles(): UserTitle[] {
  return [
    'Sales Representative',
    'Sales Manager',
    'Director',
    'Vice President',
    'Executive',
  ];
}
