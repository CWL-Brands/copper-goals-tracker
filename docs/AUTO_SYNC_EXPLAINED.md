# Auto-Sync System - Complete Explanation 🔄

## **📋 Overview**

The auto-sync system automatically syncs Copper and JustCall metrics for all active users **every 10 minutes** in the background. Users never need to manually sync - their data is always fresh!

---

## **🎯 How It Works**

### **High-Level Flow:**

```
Every 10 minutes:
  │
  ├─> Vercel Cron triggers /api/cron/sync-metrics
  │
  ├─> Get all active users from Firestore
  │
  ├─> For each user:
  │   ├─> Sync Copper (emails, calls, leads)
  │   ├─> Sync JustCall (calls, talk time)
  │   ├─> Update all goals
  │   └─> Wait 500ms (rate limiting)
  │
  └─> Return results (success/failure per user)
```

---

## **🔧 Technical Details**

### **1. Vercel Cron Configuration**

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-metrics",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**What this means**:
- `*/10` = Every 10 minutes
- `* * * *` = Every hour, every day, every month, every day of week
- Vercel automatically calls the endpoint with this schedule

**Cron Schedule Format**: `minute hour day month dayOfWeek`
- `*/10 * * * *` = Every 10 minutes
- `0 * * * *` = Every hour (at :00)
- `0 0 * * *` = Every day at midnight
- `0 2 * * 1` = Every Monday at 2 AM

---

### **2. Cron Endpoint**

**File**: `app/api/cron/sync-metrics/route.ts`

**Security**:
```typescript
// Requires CRON_SECRET in Authorization header
const authHeader = req.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**How to set CRON_SECRET**:
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add: `CRON_SECRET` = `your-random-secret-here` (generate a strong random string)
3. Vercel automatically passes this in the Authorization header when calling cron endpoints

---

### **3. User Sync Process**

**Step 1: Get Active Users**
```typescript
const usersSnapshot = await adminDb
  .collection('users')
  .where('isActive', '==', true)
  .get();
```

**Result**: Array of users like:
```javascript
[
  { id: "2NZ8OQu0zeYpZimp6YhMVK8GFkt2", email: "joe@kanvabotanicals.com", name: "Joe Simmons" },
  { id: "abc123", email: "derek@kanvabotanicals.com", name: "Derek Whitworth" },
  // ... more users
]
```

---

**Step 2: Sync Each User**

For each user, the system:

#### **2a. Sync Copper**
```typescript
POST /api/sync-metrics
Body: {
  userId: "2NZ8OQu0zeYpZimp6YhMVK8GFkt2",
  period: "custom",
  start: "2025-09-11T00:00:00.000Z",  // 30 days ago
  end: "2025-10-11T00:00:00.000Z"     // now
}
```

**What it syncs**:
- Emails (activity_type=6)
- Calls (activity_type=2160510)
- Leads (pipeline stages A, B, C)

**Metrics created**:
```javascript
{
  id: "userId_email_quantity_2025-10-10_copper",
  userId: "2NZ8OQu0zeYpZimp6YhMVK8GFkt2",
  type: "email_quantity",
  value: 17,
  date: "2025-10-10T00:00:00.000Z",
  source: "copper",
  metadata: { /* activity details */ }
}
```

---

#### **2b. Sync JustCall**
```typescript
POST /api/sync-justcall-metrics
Body: {
  userId: "2NZ8OQu0zeYpZimp6YhMVK8GFkt2",
  startDate: "2025-09-11T00:00:00.000Z",
  endDate: "2025-10-11T00:00:00.000Z"
}
```

**How it works**:
1. Get user email from Firestore
2. Fetch JustCall users list
3. Match by email (case-insensitive)
4. Fetch calls for matched user
5. Aggregate by date
6. Write metrics

**Metrics created**:
```javascript
{
  id: "userId_phone_call_quantity_2025-10-10_justcall",
  userId: "2NZ8OQu0zeYpZimp6YhMVK8GFkt2",
  type: "phone_call_quantity",
  value: 10,
  date: "2025-10-10T00:00:00.000Z",
  source: "justcall",
  metadata: { totalDuration: 1234 }
}
```

---

#### **2c. Update Goals**

For each goal:
1. Calculate current period boundaries (daily/weekly/monthly)
2. Query metrics for that period
3. Sum metric values
4. Update `goal.current` field

**Example**:
```typescript
// Monthly email goal
const periodStart = new Date(2025, 9, 1);  // Oct 1
const periodEnd = new Date(2025, 9, 31);   // Oct 31

// Query all email metrics in October
const metrics = await db.collection('metrics')
  .where('userId', '==', userId)
  .where('type', '==', 'email_quantity')
  .where('date', '>=', periodStart)
  .where('date', '<=', periodEnd)
  .get();

// Sum: 17 + 15 + 19 = 51 emails
const total = metrics.docs.reduce((sum, doc) => sum + doc.data().value, 0);

// Update goal
await db.collection('goals').doc(goalId).update({
  current: 51,
  updatedAt: new Date()
});
```

---

**Step 3: Rate Limiting**

After each user, wait 500ms:
```typescript
await new Promise(resolve => setTimeout(resolve, 500));
```

**Why?**
- Prevents API throttling (Copper, JustCall have rate limits)
- Spreads load over time
- More reliable syncing

**Math**:
- 5 users × 500ms = 2.5 seconds total
- Well within 10-minute window
- Even 100 users = 50 seconds (still plenty of time)

---

## **📊 Example Execution**

### **Scenario**: 5 active users, auto-sync runs at 2:00 PM

```
[2:00:00 PM] Vercel Cron triggers
[2:00:00 PM] [Cron Sync] Starting auto-sync for all active users
[2:00:00 PM] [Cron Sync] Found 5 active users

[2:00:01 PM] [Cron Sync] Syncing joe@kanvabotanicals.com...
[2:00:03 PM]   - Copper: 17 emails, 10 calls synced
[2:00:05 PM]   - JustCall: 10 calls, 45 minutes synced
[2:00:06 PM]   - Goals: 21 goals updated
[2:00:06 PM] [Cron Sync] ✅ joe@kanvabotanicals.com synced successfully

[2:00:07 PM] [Cron Sync] Syncing derek@kanvabotanicals.com...
[2:00:09 PM]   - Copper: 12 emails, 8 calls synced
[2:00:11 PM]   - JustCall: 15 calls, 67 minutes synced
[2:00:12 PM]   - Goals: 21 goals updated
[2:00:12 PM] [Cron Sync] ✅ derek@kanvabotanicals.com synced successfully

[2:00:13 PM] [Cron Sync] Syncing brandon@kanvabotanicals.com...
[2:00:15 PM]   - Copper: 8 emails, 5 calls synced
[2:00:17 PM]   - JustCall: 3 calls, 12 minutes synced
[2:00:18 PM]   - Goals: 21 goals updated
[2:00:18 PM] [Cron Sync] ✅ brandon@kanvabotanicals.com synced successfully

[2:00:19 PM] [Cron Sync] Syncing ben@kanvabotanicals.com...
[2:00:21 PM]   - Copper: 5 emails, 3 calls synced
[2:00:23 PM]   - JustCall: 2 calls, 8 minutes synced
[2:00:24 PM]   - Goals: 21 goals updated
[2:00:24 PM] [Cron Sync] ✅ ben@kanvabotanicals.com synced successfully

[2:00:25 PM] [Cron Sync] Syncing jared@kanvabotanicals.com...
[2:00:27 PM]   - Copper: 3 emails, 2 calls synced
[2:00:29 PM]   - JustCall: 1 call, 5 minutes synced
[2:00:30 PM]   - Goals: 21 goals updated
[2:00:30 PM] [Cron Sync] ✅ jared@kanvabotanicals.com synced successfully

[2:00:30 PM] [Cron Sync] Complete in 30000ms - 5 success, 0 failed
```

**Total Time**: 30 seconds for 5 users

---

## **🎯 What Gets Synced**

### **✅ Copper (API-based)**
- Emails (last 30 days)
- Calls (last 30 days)
- Leads (pipeline stages)

### **✅ JustCall (API-based)**
- Call records (last 30 days)
- Talk time duration

### **❌ Fishbowl (NOT synced)**
- Fishbowl sync is **manual only**
- Admin-only, 3-step process
- Separate workflow at `/admin/tools/sync-fishbowl-copper`

---

## **🔒 Security**

### **1. Cron Secret**
```typescript
// Only Vercel can call this endpoint
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return 401 Unauthorized
}
```

### **2. Admin Privileges**
```typescript
// Uses Firebase Admin SDK (server-side only)
import { adminDb } from '@/lib/firebase/admin';
```

### **3. No User Tokens Needed**
- Cron runs with admin privileges
- No need for user authentication
- Secure server-to-server communication

---

## **📈 Monitoring**

### **Check Cron Logs**

**Vercel Dashboard**:
1. Go to your project
2. Click "Deployments"
3. Click latest deployment
4. Click "Functions"
5. Find `/api/cron/sync-metrics`
6. View logs

**Expected logs**:
```
[Cron Sync] Starting auto-sync for all active users
[Cron Sync] Found 5 active users
[Cron Sync] Syncing joe@kanvabotanicals.com...
[Cron Sync] ✅ joe@kanvabotanicals.com synced successfully
...
[Cron Sync] Complete in 30000ms - 5 success, 0 failed
```

---

### **Check Sync Results**

**API Response**:
```json
{
  "success": true,
  "duration": "30000ms",
  "totalUsers": 5,
  "successCount": 5,
  "failCount": 0,
  "results": [
    {
      "userId": "2NZ8OQu0zeYpZimp6YhMVK8GFkt2",
      "email": "joe@kanvabotanicals.com",
      "success": true,
      "copper": { /* copper results */ },
      "justcall": { /* justcall results */ },
      "goalsUpdated": 21,
      "errors": []
    },
    // ... more users
  ]
}
```

---

## **🚨 Error Handling**

### **User Not Found in JustCall**
```
[Cron Sync] Syncing newuser@kanvabotanicals.com...
[Cron Sync] ⚠️  User not found in JustCall, skipping
[Cron Sync] ✅ newuser@kanvabotanicals.com synced successfully
```
**Result**: Not treated as error, just skips JustCall sync

---

### **Copper API Error**
```
[Cron Sync] Syncing joe@kanvabotanicals.com...
[Cron Sync] ❌ Copper sync failed: Rate limit exceeded
[Cron Sync] ❌ Error syncing joe@kanvabotanicals.com
```
**Result**: Marked as failed, continues with next user

---

### **Complete Failure**
```
[Cron Sync] Fatal error: Database connection failed
```
**Result**: Returns 500 error, Vercel will retry

---

## **⚙️ Configuration**

### **Environment Variables**

**Required**:
```bash
CRON_SECRET=your-random-secret-here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Optional**:
```bash
COPPER_API_KEY=your-copper-key
COPPER_USER_EMAIL=your-email
JUSTCALL_API_KEY=your-justcall-key
JUSTCALL_API_SECRET=your-justcall-secret
```

---

### **Change Sync Frequency**

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-metrics",
      "schedule": "*/5 * * * *"  // Every 5 minutes
    }
  ]
}
```

**Options**:
- `*/5 * * * *` = Every 5 minutes
- `*/15 * * * *` = Every 15 minutes
- `*/30 * * * *` = Every 30 minutes
- `0 * * * *` = Every hour

**Recommendation**: 10 minutes is optimal
- Frequent enough for fresh data
- Not too aggressive on API limits
- Good balance

---

## **🎯 Benefits**

### **For Users**:
- ✅ Data always fresh (no manual sync)
- ✅ Cleaner UI (no sync buttons)
- ✅ No waiting for sync to complete
- ✅ Goals automatically updated

### **For Admins**:
- ✅ Automated background processing
- ✅ Reliable scheduling (Vercel Cron)
- ✅ Detailed logging
- ✅ Error handling
- ✅ Rate limiting built-in

### **For System**:
- ✅ Consistent data across all users
- ✅ Reduced API load (spread over time)
- ✅ No user interaction needed
- ✅ Scalable (works for 100+ users)

---

## **🔄 Data Flow Diagram**

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL CRON                          │
│              (Triggers every 10 minutes)                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            GET /api/cron/sync-metrics                   │
│              (Secured with CRON_SECRET)                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Query Firestore: Get Active Users              │
│          WHERE isActive == true                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FOR EACH USER:                             │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │  1. Sync Copper                            │        │
│  │     POST /api/sync-metrics                 │        │
│  │     ├─> Fetch emails from Copper API       │        │
│  │     ├─> Fetch calls from Copper API        │        │
│  │     ├─> Fetch leads from Copper API        │        │
│  │     └─> Write to metrics collection        │        │
│  └────────────────────────────────────────────┘        │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐        │
│  │  2. Sync JustCall                          │        │
│  │     POST /api/sync-justcall-metrics        │        │
│  │     ├─> Match user by email                │        │
│  │     ├─> Fetch calls from JustCall API      │        │
│  │     ├─> Aggregate by date                  │        │
│  │     └─> Write to metrics collection        │        │
│  └────────────────────────────────────────────┘        │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐        │
│  │  3. Update Goals                           │        │
│  │     ├─> Query user's goals                 │        │
│  │     ├─> For each goal:                     │        │
│  │     │   ├─> Calculate period boundaries    │        │
│  │     │   ├─> Query metrics for period       │        │
│  │     │   ├─> Sum metric values              │        │
│  │     │   └─> Update goal.current            │        │
│  │     └─> Return goals updated count         │        │
│  └────────────────────────────────────────────┘        │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐        │
│  │  4. Rate Limit (wait 500ms)                │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Return Results                             │
│  {                                                       │
│    success: true,                                       │
│    totalUsers: 5,                                       │
│    successCount: 5,                                     │
│    failCount: 0,                                        │
│    results: [...]                                       │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## **🧪 Testing**

### **Manual Test (Development)**

```bash
# Set environment variable
export CRON_SECRET="test-secret-123"

# Call the endpoint
curl -X GET http://localhost:3001/api/cron/sync-metrics \
  -H "Authorization: Bearer test-secret-123"
```

**Expected Response**:
```json
{
  "success": true,
  "duration": "30000ms",
  "totalUsers": 5,
  "successCount": 5,
  "failCount": 0,
  "results": [...]
}
```

---

### **Production Test**

**Option 1: Wait for next cron run**
- Check Vercel logs in 10 minutes
- Look for `[Cron Sync]` logs

**Option 2: Trigger manually**
```bash
curl -X GET https://your-app.vercel.app/api/cron/sync-metrics \
  -H "Authorization: Bearer your-production-cron-secret"
```

---

## **📝 Summary**

### **What Happens Every 10 Minutes**:
1. ✅ Vercel Cron triggers endpoint
2. ✅ Get all active users
3. ✅ Sync Copper + JustCall for each user
4. ✅ Update all goals
5. ✅ Return detailed results

### **What Users See**:
- ✅ Dashboard always shows fresh data
- ✅ No sync buttons (cleaner UI)
- ✅ Note: "💡 Data syncs automatically every 10 minutes"

### **What Admins See**:
- ✅ Detailed logs in Vercel
- ✅ Success/failure per user
- ✅ Sync duration and timing
- ✅ Error messages if any

### **What Doesn't Change**:
- ❌ Fishbowl sync (still manual, admin-only)
- ❌ Fishbowl collections (untouched)
- ❌ Fishbowl endpoints (untouched)

---

**Date**: October 10, 2025  
**Status**: ✅ Complete & Working  
**Version**: 1.0.0
