# SMS Tracking Implementation 📱

## **✅ Complete! SMS Quantity Tracking Added**

---

## **📋 Overview**

Added SMS message tracking from Copper CRM. JustCall logs SMS conversations in Copper, and we now count **SENT messages** within each conversation to track SMS activity.

---

## **🎯 What Was Added**

### **1. Type Definitions**

**Files Updated:**
- `types/index.ts`
- `types/firestore-schema.ts`

**Changes:**
```typescript
export type GoalType = 
  | 'phone_call_quantity'
  | 'email_quantity'
  | 'sms_quantity'        // ← NEW!
  | 'lead_progression_a'
  | ...
```

---

### **2. Sync Metrics Endpoint**

**File**: `app/api/sync-metrics/route.ts`

**Added SMS Sync Section:**
```typescript
// 3) SMS Messages (count SENT messages within SMS conversations)
const SMS_ACTIVITY_ID = 2160513; // SMS activity type in Copper
const smsCategory = 'user';

// Fetch SMS activities
const smsData = await fetchAll('/activities/search', {
  activity_types: [{ id: SMS_ACTIVITY_ID, category: smsCategory }],
  user_ids: [ownerId],
  minimum_activity_date: dateRange.startUnix,
  maximum_activity_date: dateRange.endUnix,
});

// Parse each SMS conversation to count SENT messages
for (const smsActivity of smsData) {
  const details = smsActivity.details || {};
  const detailsText = typeof details === 'string' ? details : JSON.stringify(details);
  
  // Count outgoing messages
  let sentCount = 0;
  
  // Method 1: Count "(Outgoing)" markers
  const outgoingMatches = detailsText.match(/\(Outgoing\)/gi);
  if (outgoingMatches) {
    sentCount = outgoingMatches.length;
  } else {
    // Method 2: Count "SMS: E" markers (E = Egress/Sent)
    const smsEMatches = detailsText.match(/SMS:\s*E/gi);
    if (smsEMatches) {
      sentCount = smsEMatches.length;
    } else {
      // Fallback: Count activity as 1 sent message
      sentCount = 1;
    }
  }
  
  // Aggregate by day
  byDay[isoDay] = (byDay[isoDay] || 0) + sentCount;
}

// Write metrics to Firestore
await logMetricAdmin({
  userId,
  type: 'sms_quantity',
  value: count,
  date: new Date(isoDay),
  source: 'copper',
  metadata: { conversations, period, bucketed: true }
});
```

---

### **3. UI Components Updated**

**Files Updated:**
- `app/dashboard/page.tsx`
- `app/page.tsx`
- `app/team-dashboard/page.tsx`
- `app/admin/goals/page.tsx`
- `app/api/public/team-trends/route.ts`

**Changes:**
```typescript
const goalTypes: GoalType[] = [
  'phone_call_quantity',
  'email_quantity',
  'sms_quantity',  // ← Added to all components
  'lead_progression_a',
  // ...
];
```

---

## **📊 How It Works**

### **SMS Activity Structure in Copper:**

```
SMS Activity (activity_type: 2160513)
├─ Associated with: Contact/Person
├─ Details field contains: Full conversation thread
└─ Messages in thread:
   ├─ (Incoming) 01:33 PM | SMS: I | [phone] | Message text
   ├─ (Outgoing) 01:34 PM | SMS: E | [phone] | Reply text
   ├─ (Incoming) 01:35 PM | SMS: I | [phone] | Another message
   └─ (Outgoing) 01:36 PM | SMS: E | [phone] | Another reply
```

**What We Count:**
- ✅ Outgoing messages (marked with "(Outgoing)" or "SMS: E")
- ❌ Incoming messages (marked with "(Incoming)" or "SMS: I")

**Example:**
- 1 SMS activity with 5 outgoing + 3 incoming = **5 SMS sent** (not 8)

---

## **🔧 Parsing Logic**

### **Method 1: Count "(Outgoing)" Markers**
```typescript
const outgoingMatches = detailsText.match(/\(Outgoing\)/gi);
if (outgoingMatches) {
  sentCount = outgoingMatches.length;
}
```

**Example Text:**
```
(Incoming) 01:33 PM | SMS: I | [+12085551234] | Hey, are you available?
(Outgoing) 01:34 PM | SMS: E | [+12085551234] | Yes, what do you need?
(Outgoing) 01:35 PM | SMS: E | [+12085551234] | I can help with that.
```
**Result**: 2 sent messages

---

### **Method 2: Count "SMS: E" Markers**
```typescript
const smsEMatches = detailsText.match(/SMS:\s*E/gi);
if (smsEMatches) {
  sentCount = smsEMatches.length;
}
```

**Why "E"?** E = Egress = Outgoing/Sent

---

### **Method 3: Fallback**
```typescript
// If we can't parse, count the activity as 1 sent message
sentCount = 1;
```

---

## **🎯 Copper Activity Type**

**SMS Activity:**
- **ID**: 2160513
- **Name**: "SMS"
- **Category**: "user"
- **Count as Interaction**: true
- **Disabled**: false

**From Copper Metadata:**
```json
{
  "id": 2160513,
  "category": "user",
  "name": "SMS",
  "is_disabled": false,
  "count_as_interaction": true
}
```

---

## **📈 Metrics Collection**

**Document ID Format:**
```
{userId}_sms_quantity_{YYYY-MM-DD}_copper
```

**Example:**
```
2NZ8OQu0zeYpZimp6YhMVK8GFkt2_sms_quantity_2025-10-10_copper
```

**Document Structure:**
```typescript
{
  id: "2NZ8OQu0zeYpZimp6YhMVK8GFkt2_sms_quantity_2025-10-10_copper",
  userId: "2NZ8OQu0zeYpZimp6YhMVK8GFkt2",
  type: "sms_quantity",
  value: 15,  // 15 SMS messages sent on this day
  date: Timestamp(2025-10-10T00:00:00.000Z),
  source: "copper",
  metadata: {
    conversations: 3,  // 3 SMS conversation activities
    period: "custom",
    bucketed: true,
    syncedAt: "2025-10-10T18:00:00.000Z",
    ownerId: 1168901,
    ownerEmail: "joe@kanvabotanicals.com"
  },
  createdAt: Timestamp(2025-10-10T18:00:00.000Z)
}
```

---

## **🚀 Usage**

### **1. Create SMS Goal**

Users can now create SMS goals:
```typescript
{
  type: 'sms_quantity',
  period: 'daily',
  target: 50,  // Send 50 SMS per day
  current: 15  // Sent 15 so far today
}
```

---

### **2. Sync SMS Data**

**Manual Sync:**
```bash
POST /api/sync-metrics
{
  "userId": "2NZ8OQu0zeYpZimp6YhMVK8GFkt2",
  "period": "custom",
  "start": "2025-10-01T00:00:00.000Z",
  "end": "2025-10-10T23:59:59.999Z"
}
```

**Auto-Sync:**
- Firebase Cloud Function runs every 10 minutes
- Automatically syncs SMS for all active users
- No manual intervention needed

---

### **3. View SMS Metrics**

**Dashboard:**
- SMS goals appear alongside phone calls and emails
- Shows current progress vs target
- Displays pace (SMS/day)

**Team Dashboard:**
- Team-wide SMS totals
- Individual SMS counts
- SMS trends over time

---

## **🧪 Testing**

### **Test 1: Manual Sync**
```bash
# Sync last 30 days for a user
POST /api/sync-metrics
{
  "userId": "2NZ8OQu0zeYpZimp6YhMVK8GFkt2",
  "period": "custom",
  "start": "2025-09-11T00:00:00.000Z",
  "end": "2025-10-11T00:00:00.000Z"
}
```

**Expected Console Logs:**
```
[Sync Metrics] Fetching SMS activities for user joe@kanvabotanicals.com (ID: 1168901)
[Sync Metrics] Found 12 SMS conversation activities
[Sync Metrics] Total sent SMS messages: 47 across 12 conversations
[Sync Metrics] SMS breakdown by day: {
  "2025-10-10T00:00:00.000Z": 15,
  "2025-10-09T00:00:00.000Z": 12,
  "2025-10-08T00:00:00.000Z": 8,
  "2025-10-07T00:00:00.000Z": 12
}
```

---

### **Test 2: Verify Metrics in Firestore**

**Query:**
```javascript
db.collection('metrics')
  .where('userId', '==', '2NZ8OQu0zeYpZimp6YhMVK8GFkt2')
  .where('type', '==', 'sms_quantity')
  .where('source', '==', 'copper')
  .orderBy('date', 'desc')
  .limit(10)
  .get()
```

**Expected Results:**
- Multiple documents with `type: 'sms_quantity'`
- Values represent sent messages per day
- Metadata includes conversation count

---

### **Test 3: Create SMS Goal**

**Steps:**
1. Go to Dashboard
2. Click "Set New Goal"
3. Select "SMS Quantity"
4. Set target (e.g., 50 per day)
5. Save

**Expected:**
- Goal appears in "My Active Goals"
- Shows current SMS count
- Shows progress bar
- Shows pace (SMS/day)

---

## **📝 Example SMS Activity**

**From Copper API:**
```json
{
  "id": 123456789,
  "activity_type_id": 2160513,
  "activity_date": 1728583200,
  "user_id": 1168901,
  "details": {
    "text": "SMS Conversation with Hansen (19855508474)\n\n(Incoming) 01:33 PM | SMS: I | [+12085551234] | Good to hear from you! If you are emailing a text or ACHII The instructions are included in the Sales Order\n(Outgoing) 01:34 PM | SMS: E | [+12085551234] | Okay thanks!\n(Incoming) 01:35 PM | SMS: I | [+12085551234] | No problem\n(Outgoing) 01:36 PM | SMS: E | [+12085551234] | Please see attached Kanva out.\n(Outgoing) 01:37 PM | SMS: E | [+12085551234] | West Sacramento, CA 95691"
  },
  "parent": {
    "type": "person",
    "id": 987654321
  }
}
```

**Parsed Result:**
- Total messages: 5
- Incoming: 2
- Outgoing: 3
- **Counted: 3 SMS sent** ✅

---

## **🔍 Troubleshooting**

### **Issue: SMS count is 0**

**Check:**
1. User has SMS activities in Copper
2. SMS activities are within date range
3. User ID is correctly mapped to Copper owner ID
4. SMS activity type (2160513) is enabled in Copper

**Debug:**
```javascript
// Check if SMS activities exist
const smsData = await fetch('/activities/search', {
  activity_types: [{ id: 2160513, category: 'user' }],
  user_ids: [1168901],
  minimum_activity_date: startUnix,
  maximum_activity_date: endUnix
});
console.log('SMS activities:', smsData.length);
```

---

### **Issue: SMS count seems too high**

**Possible Causes:**
1. Counting incoming + outgoing (should only count outgoing)
2. Parsing logic not working correctly
3. Duplicate activities

**Debug:**
```javascript
// Log each SMS activity
for (const sms of smsData) {
  const details = JSON.stringify(sms.details);
  const outgoing = details.match(/\(Outgoing\)/gi);
  console.log('Activity:', sms.id, 'Outgoing:', outgoing?.length || 0);
}
```

---

### **Issue: SMS count seems too low**

**Possible Causes:**
1. Parsing logic missing some outgoing messages
2. Different SMS format in Copper
3. Date range too narrow

**Debug:**
```javascript
// Check raw SMS activity details
console.log('SMS Activity Details:', sms.details);
// Look for patterns that indicate outgoing messages
```

---

## **✅ Success Criteria**

- [x] SMS goal type added to all components
- [x] SMS sync implemented in `/api/sync-metrics`
- [x] SMS parsing logic counts SENT messages only
- [x] SMS metrics written to Firestore
- [x] SMS goals display in dashboard
- [x] SMS included in team metrics
- [x] Firebase auto-sync supports SMS
- [ ] SMS tracking tested with real data
- [ ] SMS goal labels/display names added

---

## **🎯 Next Steps**

### **1. Test with Real Data**
- Trigger manual sync for a user with SMS activities
- Verify SMS count matches actual sent messages
- Check Firestore metrics collection

### **2. Add Display Labels**
- Update goal type labels to show "SMS Messages"
- Add SMS icon to UI components
- Update goal descriptions

### **3. Monitor Performance**
- Check sync duration with SMS included
- Verify no API rate limit issues
- Monitor Firestore write costs

---

**Date**: October 10, 2025  
**Status**: ✅ Implementation Complete  
**Version**: 1.0.0
