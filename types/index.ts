// User and Authentication Types
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'sales' | 'manager' | 'admin';
    title?: UserTitle; // Job title for filtering and display
    copperId?: string;
    photoUrl?: string;
    passwordChanged?: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  export type UserTitle = 
    | 'Sales Representative'
    | 'Sales Manager'
    | 'Director'
    | 'Vice President'
    | 'Executive';
  
  // Goal Types
  export interface Goal {
    id: string;
    userId: string;
    type: GoalType;
    period: GoalPeriod;
    target: number;
    current: number;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export type GoalType = 
    | 'phone_call_quantity' // Count of phone calls
    | 'talk_time_minutes'   // Minutes of calls (not typically a goal, but tracked)
    | 'email_quantity'      // Count of emails sent
    | 'sms_quantity'        // Count of SMS messages sent
    | 'lead_progression_a'  // Fact Finding Stage
    | 'lead_progression_b'  // Contact Stage
    | 'lead_progression_c'  // Closing Stage
    | 'new_sales_wholesale' // Dollar amount
    | 'new_sales_distribution'; // Dollar amount
  
  export type GoalPeriod = 'weekly' | 'monthly' | 'quarterly';
  
  // Metric Types
  export interface Metric {
    id: string;
    userId: string;
    type: GoalType;
    value: number;
    date: Date;
    source: 'manual' | 'copper' | 'justcall' | 'fishbowl';
    metadata?: Record<string, any>;
    createdAt: Date;
  }
  
  // Pipeline Types (from Copper)
  export interface PipelineStage {
    id: string;
    name: string;
    pipelineId: string;
    order: number;
  }
  
  export interface Pipeline {
    id: string;
    name: string;
    stages: PipelineStage[];
  }
  
  // Dashboard Types
  export interface DashboardData {
    user: User;
    goals: Goal[];
    metrics: Metric[];
    teamComparison?: TeamComparison[];
  }
  
  export interface TeamComparison {
    userId: string;
    userName: string;
    goalType: GoalType;
    achievement: number; // Percentage
    rank: number;
  }

  // Team Member Performance (for leaderboard)
  export interface TeamMemberPerformance {
    userId: string;
    userName: string;
    userEmail: string;
    photoUrl?: string;
    totalSales: number;
    phoneCalls: number;
    emails: number;
    leadProgression: number;
    overallScore: number;
    rank: number;
    trend: 'up' | 'down' | 'stable';
  }
  
  // Copper Integration Types
  export interface CopperContext {
    type: 'person' | 'company' | 'opportunity' | 'lead';
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    customFields?: Record<string, any>;
  }
  
  export interface CopperActivity {
    type: 'note' | 'call' | 'meeting' | 'email';
    details: string;
    date: Date;
    parentType: string;
    parentId: string;
  }
  
  // Achievement Calculations
  export interface Achievement {
    goalId: string;
    percentage: number;
    remaining: number;
    pace: 'ahead' | 'on-track' | 'behind';
    projectedEnd: number;
  }
  
  // Settings
  export interface UserSettings {
    userId: string;
    notifications: {
      dailyReminder: boolean;
      goalAchieved: boolean;
      weeklyReport: boolean;
    };
    defaultView: 'dashboard' | 'goals' | 'team';
    timezone: string;
  }