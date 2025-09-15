import { NextRequest, NextResponse } from 'next/server';
import { metricService } from '@/lib/firebase/services';

const COPPER_API_BASE = 'https://api.copper.com/developer_api/v1';
const COPPER_API_KEY = process.env.COPPER_API_KEY!;
const COPPER_USER_EMAIL = process.env.COPPER_USER_EMAIL!;

// POST /api/sync-metrics - Sync metrics from Copper
export async function POST(request: NextRequest) {
  try {
    const { userId, date } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Fetch email activities from Copper
    const emailResponse = await fetch(`${COPPER_API_BASE}/activities/search`, {
      method: 'POST',
      headers: {
        'X-PW-AccessToken': COPPER_API_KEY,
        'X-PW-Application': 'developer_api',
        'X-PW-UserEmail': COPPER_USER_EMAIL,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 100,
        sort_by: 'activity_date',
        sort_direction: 'desc',
        activity_types: [
          { id: 1, category: 'user' }, // Email type
        ]
      })
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to fetch email activities');
    }

    const emailData = await emailResponse.json();
    const emailCount = emailData.length || 0;

    // Log email metric
    if (emailCount > 0) {
      await metricService.logMetric({
        userId,
        type: 'email_quantity',
        value: emailCount,
        date: new Date(),
        source: 'copper',
        metadata: { syncedAt: new Date().toISOString() }
      });
    }

    // Fetch pipeline progression from Copper
    const opportunitiesResponse = await fetch(`${COPPER_API_BASE}/opportunities/search`, {
      method: 'POST',
      headers: {
        'X-PW-AccessToken': COPPER_API_KEY,
        'X-PW-Application': 'developer_api',
        'X-PW-UserEmail': COPPER_USER_EMAIL,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 200,
        sort_by: 'date_modified',
        sort_direction: 'desc'
      })
    });

    if (!opportunitiesResponse.ok) {
      throw new Error('Failed to fetch opportunities');
    }

    const opportunities = await opportunitiesResponse.json();
    
    // Count opportunities by stage
    const stageCountsMap = {
      'Fact Finding': 'lead_progression_a',
      'Contact Stage': 'lead_progression_b',
      'Closing Stage': 'lead_progression_c'
    };

    const stageCounts: Record<string, number> = {};
    
    opportunities.forEach((opp: any) => {
      const stageName = opp.stage_name;
      if (stageName && stageCountsMap[stageName as keyof typeof stageCountsMap]) {
        const metricType = stageCountsMap[stageName as keyof typeof stageCountsMap];
        stageCounts[metricType] = (stageCounts[metricType] || 0) + 1;
      }
    });

    // Log pipeline metrics
    for (const [metricType, count] of Object.entries(stageCounts)) {
      if (count > 0) {
        await metricService.logMetric({
          userId,
          type: metricType as any,
          value: count,
          date: new Date(),
          source: 'copper',
          metadata: { syncedAt: new Date().toISOString() }
        });
      }
    }

    return NextResponse.json({
      success: true,
      metrics: {
        emails: emailCount,
        stages: stageCounts
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync metrics' },
      { status: 500 }
    );
  }
}