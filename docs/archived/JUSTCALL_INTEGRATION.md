# JustCall Integration

This document describes the JustCall API integration for real-time calling metrics.

## Overview

The JustCall integration provides real-time calling metrics by user, tracking:
- Total calls (inbound/outbound)
- Call duration and averages
- Call status (completed, missed, etc.)
- Daily activity patterns

**Important**: This integration does NOT replace the existing Copper metadata integration. It supplements it by providing real-time calling metrics that can be displayed within the Copper dashboard.

## Setup

### 1. Get JustCall API Credentials

1. Log in to your JustCall account
2. Navigate to **Settings → Integrations → API** (or visit https://app.justcall.io/app/developers)
3. Generate an **API Key** and **API Secret**
4. Copy both credentials

**Authentication Method:** Basic Auth
- The API uses Basic Authentication with your API Key and Secret
- Format: `Authorization: Basic base64(apiKey:apiSecret)`

### 2. Configure Environment Variables

Add the following to your `.env.local` and `.env.production` files:

```env
# JustCall API Configuration
JUSTCALL_API_KEY=your_api_key_here
JUSTCALL_API_SECRET=your_api_secret_here
```

**Important:** Restart your application after adding these credentials.

### 3. User Email Mapping

JustCall users must have the same email addresses as your Copper/Firebase users:
- `user@kanvabotanicals.com`
- `user@cwlbrands.com`


Both domains are now supported for authentication and user management.

## API Endpoints

### GET /api/justcall/users
Fetch all JustCall users/agents.

**Response:**
```json
{
  "users": [
    {
      "id": 12345,
      "email": "user@kanvabotanicals.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "status": "active"
    }
  ]
}
```

### GET /api/justcall/calls
Fetch call records with optional filters.

**Query Parameters:**
- `email` - Filter by agent email
- `start_date` - Start date (YYYY-MM-DD)
- `end_date` - End date (YYYY-MM-DD)
- `direction` - Call direction: `Incoming` or `Outgoing`
- `type` - Call type: `Answered`, `Missed`, `Unanswered`, `Voicemail`, etc.

**Note:** History for the last 3 months can be accessed via API.

**Response:**
```json
{
  "calls": [
    {
      "id": 67890,
      "contact_number": "+1234567890",
      "justcall_number": "+0987654321",
      "agent_email": "user@kanvabotanicals.com",
      "agent_name": "John Doe",
      "call_date": "2025-09-30",
      "call_time": "10:30:00",
      "call_info": {
        "direction": "Outgoing",
        "type": "Answered",
        "disposition": "Interested",
        "notes": "Follow up next week",
        "recording": "https://..."
      },
      "call_duration": {
        "total_duration": 180,
        "conversation_time": 165,
        "friendly_duration": "00:03:00"
      }
    }
  ]
}
```

### GET /api/justcall/metrics
Get aggregated metrics for a specific user.

**Query Parameters:**
- `email` - User email (required)
- `start_date` - Start date (YYYY-MM-DD, optional)
- `end_date` - End date (YYYY-MM-DD, optional)

**Response:**
```json
{
  "email": "user@kanvabotanicals.com",
  "metrics": {
    "totalCalls": 150,
    "inboundCalls": 80,
    "outboundCalls": 70,
    "completedCalls": 130,
    "missedCalls": 20,
    "totalDuration": 18000,
    "averageDuration": 120,
    "callsByDay": {
      "2025-09-30": 25,
      "2025-09-29": 30
    },
    "callsByStatus": {
      "completed": 130,
      "missed": 20
    }
  }
}
```

## Components

### JustCallMetrics Component

Display real-time call metrics for a user.

**Usage:**
```tsx
import JustCallMetrics from '@/components/JustCallMetrics';

<JustCallMetrics
  userEmail="user@kanvabotanicals.com"
  startDate="2025-09-01"
  endDate="2025-09-30"
  autoRefresh={true}
  refreshInterval={60000}
/>
```

**Props:**
- `userEmail` (string, required) - User's email address
- `startDate` (string, optional) - Start date in YYYY-MM-DD format
- `endDate` (string, optional) - End date in YYYY-MM-DD format
- `autoRefresh` (boolean, optional) - Enable auto-refresh (default: true)
- `refreshInterval` (number, optional) - Refresh interval in ms (default: 60000)

## Admin Dashboard

Access the JustCall admin dashboard at `/admin/justcall` to:
- View all JustCall users
- Select a user to view their metrics
- Filter by date range
- See real-time updates

## Integration with Copper

The JustCall metrics can be embedded within Copper using the existing iframe integration:

1. The metrics component auto-refreshes every minute
2. Data is fetched directly from JustCall API (not through Copper activities)
3. Provides real-time visibility without relying on Copper's activity sync

## Troubleshooting

### "JustCall API not configured" Error
- Verify `JUSTCALL_API_KEY` and `JUSTCALL_API_SECRET` are set in environment variables
- Restart the application after adding credentials

### "User not found" Error
- Ensure the user exists in JustCall with the same email
- Check that email domains match (@kanvabotanicals.com or @cwlbrands.com)

### No metrics showing
- Verify the user has call activity in the selected date range
- Check JustCall API credentials are valid
- Review browser console for API errors

## Rate Limits

JustCall API has rate limits. The integration:
- Caches user lists
- Implements 1-minute refresh intervals by default
- Fetches up to 1000 calls per request

Adjust `refreshInterval` prop if you encounter rate limiting issues.

## Webhooks (Future Enhancement)

JustCall supports webhooks for real-time call events. To implement:

### Webhook Events Available:
- `call.completed` - Triggered when a call ends
- `call.missed` - Triggered when a call is missed
- `sms.received` - Triggered when an SMS is received
- And more...

### Sample Webhook Payload (call.completed):
```json
{
  "type": "call.completed",
  "data": {
    "id": 178632100,
    "agent_email": "john.smith@kanvabotanicals.com",
    "contact_number": "1681381XXXX",
    "call_date": "2024-01-18",
    "call_time": "14:34:13",
    "call_info": {
      "direction": "Incoming",
      "type": "answered"
    },
    "call_duration": {
      "total_duration": 633,
      "conversation_time": 600
    }
  }
}
```

### Implementation Steps:
1. Create webhook endpoint: `/api/justcall/webhook`
2. Configure webhook URL in JustCall dashboard
3. Validate webhook signature for security
4. Process events and update metrics in real-time

**Note:** Currently, the integration uses polling (API requests). Webhooks would provide real-time updates without polling.

## Security Notes

- API credentials are server-side only (not exposed to client)
- All API calls are authenticated with Basic Auth
- User email validation ensures data privacy
- Admin access required for user management endpoints
- Webhook endpoints should validate request signatures
