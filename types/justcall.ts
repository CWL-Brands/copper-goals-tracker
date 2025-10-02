/**
 * JustCall API Types
 */

export interface JustCallUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
  status?: string;
}

export interface JustCallCallRecord {
  id: number;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  duration: number; // in seconds
  status: 'completed' | 'missed' | 'rejected' | 'busy' | 'no-answer';
  recording_url?: string;
  started_at: string; // ISO timestamp
  ended_at?: string; // ISO timestamp
  agent_id?: number;
  agent_email?: string;
  agent_name?: string;
  contact_name?: string;
  disposition?: string;
  notes?: string;
}

export interface JustCallMetrics {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  completedCalls: number;
  missedCalls: number;
  totalDuration: number; // in seconds
  averageDuration: number; // in seconds
  callsByDay: Record<string, number>;
  callsByStatus: Record<string, number>;
}

export interface JustCallCallsParams {
  agent_id?: number;
  agent_email?: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  direction?: 'inbound' | 'outbound';
  status?: string;
  limit?: number;
  offset?: number;
}

export interface JustCallApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
