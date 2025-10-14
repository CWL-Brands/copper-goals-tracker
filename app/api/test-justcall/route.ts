import { NextRequest, NextResponse } from 'next/server';
import { createJustCallClient } from '@/lib/justcall/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/test-justcall
 * Test JustCall API connection and recent calls
 */
export async function GET(req: NextRequest) {
  try {
    const client = createJustCallClient();
    
    if (!client) {
      return NextResponse.json({
        status: 'error',
        message: 'JustCall API not configured',
        credentials: {
          apiKey: !!process.env.JUSTCALL_API_KEY,
          apiSecret: !!process.env.JUSTCALL_API_SECRET,
        }
      }, { status: 500 });
    }

    // Test 1: Fetch users
    console.log('[Test JustCall] Fetching users...');
    const users = await client.getUsers();
    
    // Test 2: Fetch recent calls (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`[Test JustCall] Fetching calls from ${startDateStr} to ${endDateStr}...`);
    const calls = await client.getCalls({
      start_date: startDateStr,
      end_date: endDateStr,
      limit: 10,
    });

    // Test 3: Get metrics for first user (if available)
    let userMetrics = null;
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`[Test JustCall] Getting metrics for ${testUser.email}...`);
      userMetrics = await client.getUserMetrics(testUser.email, startDateStr, endDateStr);
    }

    return NextResponse.json({
      status: 'success',
      message: 'JustCall API is working',
      data: {
        usersFound: users.length,
        users: users.map(u => ({ id: u.id, email: u.email, name: u.name })),
        recentCalls: calls.length,
        callSample: calls.slice(0, 3).map(c => ({
          id: c.id,
          date: c.call_date,
          agent: c.agent_email,
          direction: c.call_info.direction,
          type: c.call_info.type,
          duration: c.call_duration?.total_duration,
        })),
        testUserMetrics: userMetrics,
      },
      dateRange: {
        start: startDateStr,
        end: endDateStr,
      }
    });
  } catch (error: any) {
    console.error('[Test JustCall] Error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Failed to test JustCall API',
      error: error.stack,
    }, { status: 500 });
  }
}
