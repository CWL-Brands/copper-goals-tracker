# JustCall Integration Troubleshooting

## Issue: "No JustCall users found"

### Root Cause
The authentication method was incorrect. JustCall API requires:
1. **Basic Authentication** (not custom headers)
2. **Query parameters** on the `/users` endpoint

### What Was Fixed

#### 1. Authentication Method
**Before:**
```javascript
headers: {
  'Authorization': `${apiKey}:${apiSecret}`,
  'X-API-Key': apiKey,
  'X-API-Secret': apiSecret,
}
```

**After:**
```javascript
const authString = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
headers: {
  'Authorization': `Basic ${authString}`,
}
```

#### 2. Users Endpoint
**Before:**
```javascript
await this.request<{ users: JustCallUser[] }>('/users');
```

**After:**
```javascript
const queryParams = new URLSearchParams({
  available: 'false',
  page: '0',
  per_page: '50',
  order: 'desc'
});
await this.request<{ users: JustCallUser[] }>(`/users?${queryParams.toString()}`);
```

## Testing Steps

### 1. Verify Environment Variables
Check that `.env.local` has:
```env
JUSTCALL_API_KEY=your_actual_api_key
JUSTCALL_API_SECRET=your_actual_api_secret
```

### 2. Restart the Application
```bash
# Stop the dev server (Ctrl+C)
npm run dev
```

### 3. Test Authentication (Node.js)
```bash
node scripts/test-justcall-auth.js
```

Expected output:
```
✅ Authentication successful!
Found 7 users:

1. IT Kanva-Botanicals (it@kanvabotanicals.com)
2. Jared Leuzinger (jared@kanvabotanicals.com)
3. Joseph Simmons (joe@kanvabotanicals.com)
...
```

### 4. Test in Browser
1. Navigate to: `http://localhost:3000/admin/justcall`
2. Should see list of users (not "No JustCall users found")
3. Select a user to view their metrics

### 5. Test API Endpoint Directly
```bash
curl "http://localhost:3000/api/justcall/users"
```

Expected response:
```json
{
  "users": [
    {
      "id": 12345,
      "email": "jared@kanvabotanicals.com",
      "name": "Jared Leuzinger",
      "phone": "+1234567890",
      "status": "active"
    },
    ...
  ]
}
```

## Common Issues

### Issue: Still getting empty users array

**Check:**
1. API credentials are correct (copy-paste from JustCall dashboard)
2. No extra spaces in `.env.local` file
3. Application was restarted after adding credentials
4. API Key has proper permissions in JustCall

**Debug:**
```bash
# Check server logs for detailed error messages
# Look for lines starting with [JustCall]
```

### Issue: 401 Unauthorized

**Solution:**
- Regenerate API credentials in JustCall dashboard
- Update `.env.local` with new credentials
- Restart application

### Issue: 403 Forbidden

**Solution:**
- Check API Key permissions in JustCall
- Ensure the API Key has access to the Users endpoint

### Issue: Rate Limiting

**Solution:**
- Reduce refresh interval in JustCallMetrics component
- Implement caching (already done for users)
- Consider implementing webhooks for real-time updates

## Email Mapping

JustCall users must have emails matching your Firebase users:
- `@kanvabotanicals.com`
- `@cwlbrands.com`

**Current JustCall Users:**
1. it@kanvabotanicals.com
2. jared@kanvabotanicals.com
3. joe@kanvabotanicals.com
4. Derek@kanvabotanicals.com (note: capital D)
5. brandon@kanvabotanicals.com
6. ben@kanvabotanicals.com
7. kent@cwlbrands.com

**Note:** Email matching is case-insensitive in the code.

## Next Steps

### 1. Verify Users Load
After the fix, you should see all 7 users in the admin dashboard.

### 2. Test Metrics
Select a user who has made calls to verify metrics display correctly.

### 3. Test Bulk Sync Script
Open browser console on `/admin/justcall` and run:
```javascript
// Update with real emails
const users = [
  { email: 'jared@kanvabotanicals.com' },
  { email: 'joe@kanvabotanicals.com' },
  // ... add more
];
```

### 4. Future: Implement Webhooks
For real-time updates without polling:
- Create `/api/justcall/webhook` endpoint
- Configure webhook URL in JustCall dashboard
- Process `call.completed` events automatically

## Support

If issues persist:
1. Check JustCall API status: https://status.justcall.io/
2. Review JustCall API docs: https://developer.justcall.io/
3. Check server logs for detailed error messages
4. Verify API credentials in JustCall dashboard
