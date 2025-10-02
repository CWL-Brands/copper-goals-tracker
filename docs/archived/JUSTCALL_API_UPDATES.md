# JustCall API Implementation Updates

## Changes Made Based on Official API Documentation

After reviewing the official JustCall API v2.1 documentation, the following updates were made to ensure correct integration:

### 1. Base URL Updated
- **Changed from:** `https://api.justcall.io/v1`
- **Changed to:** `https://api.justcall.io/v2.1`
- **Reason:** JustCall v2.1 is the current API version with enhanced features

### 2. Authentication Headers
Updated authentication to include all required headers:
```javascript
{
  'Authorization': `${apiKey}:${apiSecret}`,
  'X-API-Key': apiKey,
  'X-API-Secret': apiSecret,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}
```

### 3. Call Record Data Structure
Updated `JustCallCallRecord` interface to match actual API response:

**Key Changes:**
- `direction`: Changed from `'inbound' | 'outbound'` to `'Incoming' | 'Outgoing'`
- `status`: Removed (not a top-level field)
- Added `call_info` object containing:
  - `direction`: 'Incoming' | 'Outgoing'
  - `type`: Call type (Answered, Missed, Unanswered, Voicemail, etc.)
  - `disposition`, `notes`, `rating`, `recording`, etc.
- Added `call_duration` object containing:
  - `total_duration`: Total call duration in seconds
  - `conversation_time`: Duration without hold time
  - `friendly_duration`: Human-readable format (HH:MM:SS)
  - `ring_time`, `hold_time`, `wrap_up_time`, `handle_time`
- Changed timestamp fields:
  - `started_at` → `call_date` (YYYY-MM-DD) + `call_time` (HH:MM:SS)
  - Separate fields for user timezone: `call_user_date`, `call_user_time`
- Added additional fields:
  - `call_sid`: Unique SID for webhook mapping
  - `justcall_number`: JustCall number used
  - `justcall_line_name`: Line name if configured
  - `queue_callback`: Queue callback data
  - `ivr_info`: IVR interaction data
  - `justcall_ai`: AI-powered insights
  - `tags`: User-added tags
  - `call_summary`: AI-generated summary

### 4. Query Parameters
Updated `JustCallCallsParams` interface:

**Changed:**
- `direction`: Now accepts `'Incoming' | 'Outgoing'` (capitalized)
- `status`: Removed (use `type` instead)
- `type`: Added for call type filtering (Answered, Missed, etc.)
- `page`: Added for pagination support

### 5. Metrics Calculation
Updated `calculateMetrics()` function to work with new structure:

**Changes:**
- Direction check: `call.call_info.direction === 'Incoming'`
- Status check: Uses `call.call_info.type` instead of `call.status`
- Duration: Uses `call.call_duration.total_duration`
- Date extraction: Uses `call.call_date` directly (already in YYYY-MM-DD format)

### 6. API Limitations Documented

**Important Constraints:**
- **History Access:** Last 3 months only via API
- **Agent Analytics:** 
  - Maximum 4 months total date range
  - Maximum 1 month per request
  - Data refreshed every ~15 minutes
- **Rate Limits:** Standard API rate limits apply

### 7. User Data Structure
Updated `JustCallUser` interface:
- Added `active` boolean field
- Maintained `id`, `email`, `name`, `phone`, `status`

## API Endpoints Used

### Primary Endpoints
1. **GET /v2.1/users** - List all users/agents
2. **GET /v2.1/calls** - List all calls with filters
3. **GET /v2.1/calls/{id}** - Get specific call details

### Query Parameters Supported
- `agent_id` - Filter by agent ID
- `agent_email` - Filter by agent email
- `start_date` - Start date (YYYY-MM-DD)
- `end_date` - End date (YYYY-MM-DD)
- `direction` - Incoming or Outgoing
- `type` - Call type filter
- `limit` - Results per page
- `offset` - Pagination offset
- `page` - Page number

## Response Format

All API responses follow this structure:
```json
{
  "users": [...],  // For /users endpoint
  "calls": [...],  // For /calls endpoint
  // Additional metadata may be included
}
```

## Testing Recommendations

1. **Test with Recent Data:** Use date ranges within the last 3 months
2. **Verify User Emails:** Ensure JustCall users have matching emails
3. **Check API Credentials:** Verify both API Key and Secret are correct
4. **Monitor Rate Limits:** Implement appropriate delays between requests
5. **Handle Pagination:** For large datasets, use pagination parameters

## Migration Notes

If you have existing code using the old structure:

1. **Update direction checks:**
   ```javascript
   // Old
   if (call.direction === 'inbound')
   
   // New
   if (call.call_info.direction === 'Incoming')
   ```

2. **Update status checks:**
   ```javascript
   // Old
   if (call.status === 'completed')
   
   // New
   if (call.call_info.type.includes('Answered'))
   ```

3. **Update duration access:**
   ```javascript
   // Old
   const duration = call.duration
   
   // New
   const duration = call.call_duration.total_duration
   ```

4. **Update date parsing:**
   ```javascript
   // Old
   const date = call.started_at.split('T')[0]
   
   // New
   const date = call.call_date // Already in YYYY-MM-DD format
   ```

## Additional Features Available

The JustCall API v2.1 provides additional data that can be leveraged:

- **AI Insights:** `justcall_ai` object with sentiment, call score, moments
- **IVR Data:** `ivr_info` for IVR interactions
- **Queue Callbacks:** `queue_callback` for queue management
- **Call Traits:** Array of traits (Queue, Callback, Forwarded, Transfer, etc.)
- **Recordings:** Direct links to call recordings
- **Voicemail Transcriptions:** Text transcriptions of voicemails

These can be integrated into the dashboard for enhanced analytics.

## Security Notes

- API credentials are server-side only
- Never expose API Key/Secret to client-side code
- Rotate credentials periodically (every 90 days recommended)
- Monitor API usage for unusual patterns

## Support

For issues or questions:
- JustCall API Documentation: https://developer.justcall.io/
- JustCall Support: [[email protected]](mailto:[email protected])
- Internal: Check environment variables and API configuration
