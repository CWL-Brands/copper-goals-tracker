# Quick Reference Card

## 🎯 **What Changed Today**

### **Daily Goals → REMOVED**
- Users now see: **Weekly | Monthly | Quarterly**
- Default period: **Weekly**
- Pace tiles still show daily targets (auto-calculated)

---

## 🧪 **Testing Endpoints**

### **Test JustCall Connection**
```bash
# Local
curl http://localhost:3001/api/test-justcall

# Production
curl https://your-app.web.app/api/test-justcall
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "usersFound": 5,
    "recentCalls": 10,
    "callSample": [...]
  }
}
```

---

## 🔍 **Verify Period Data**

### **In Browser Console (on Dashboard):**
```javascript
// Check today's metrics
const uid = user.id; // or your user ID
const today = new Date();
const dayStart = new Date(today.setHours(0,0,0,0));
const dayEnd = new Date(today.setHours(23,59,59,999));

const metrics = await metricService.getMetrics(uid, 'phone_call_quantity', dayStart, dayEnd);

console.log({
  count: metrics.length,
  total: metrics.reduce((sum, m) => sum + m.value, 0),
  sources: [...new Set(metrics.map(m => m.source))],
  details: metrics
});
```

---

## 📊 **Firestore Structure**

### **Metrics Collection:**
```
metrics/
  └── userId_phone_call_quantity_2025-10-14_copper
      ├── id: "userId_phone_call_quantity_2025-10-14_copper"
      ├── userId: "..."
      ├── type: "phone_call_quantity"
      ├── value: 15
      ├── date: Timestamp (2025-10-14 12:00:00 UTC)
      ├── source: "copper"
      └── metadata: {...}
  
  └── userId_phone_call_quantity_2025-10-14_justcall
      ├── id: "userId_phone_call_quantity_2025-10-14_justcall"
      ├── value: 8
      ├── source: "justcall"
      └── ...
```

**Total for day = 15 + 8 = 23 calls**

---

## 🔄 **Sync Endpoints**

### **Manual Sync (Copper)**
```javascript
fetch('/api/sync-metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'YOUR_USER_ID',
    startDate: '2025-10-07',
    endDate: '2025-10-14'
  })
}).then(r => r.json()).then(console.log);
```

### **Manual Sync (JustCall)**
```javascript
fetch('/api/sync-justcall-metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'YOUR_USER_ID',
    startDate: '2025-10-07',
    endDate: '2025-10-14'
  })
}).then(r => r.json()).then(console.log);
```

---

## 📅 **Period Calculations**

### **Weekly:**
- Start: Monday of current week
- End: Sunday of current week
- Uses `startOfWeek(today, { weekStartsOn: 1 })`

### **Monthly:**
- Start: 1st of current month
- End: Last day of current month
- Uses `startOfMonth(today)` and `endOfMonth(today)`

### **Quarterly:**
- Q1: Jan-Mar
- Q2: Apr-Jun
- Q3: Jul-Oct
- Q4: Oct-Dec
- Calculated: `Math.floor(today.getMonth() / 3)`

---

## 🚀 **Deployment**

```bash
# Build and check for errors
npm run build

# Deploy to Firebase
firebase deploy

# Deploy functions only
firebase deploy --only functions

# Deploy hosting only
firebase deploy --only hosting
```

---

## 🐛 **Common Issues**

### **"No metrics showing"**
1. Check if sync has run: Look for `lastSyncAt` in settings
2. Check Firestore: `metrics` collection for user
3. Run manual sync endpoint
4. Check date ranges match

### **"Wrong totals"**
1. Check for duplicate metrics (same docId)
2. Verify timezone handling
3. Run verification script
4. Check if multiple sources are being summed

### **"JustCall not working"**
1. Test endpoint: `/api/test-justcall`
2. Check credentials in `.env.local`
3. Verify user email matches JustCall
4. Check API rate limits

---

## 📱 **User IDs**

From Fishbowl sync:
- **Jared**: `qwmWXpAqybSfwusSAB49QYTpvkv1`
- **DerekW**: `iV3us7cyr6drTZv5z15NUX5uYJr1`
- **BrandonG**: `mFhxPEAw8QgTCmEJFpl8v7jh2zh1`
- **BenW**: `mtjr4VgVIDcMWl9liox2oM3SI4B3`

---

## 🔐 **Environment Variables**

```env
# JustCall
JUSTCALL_API_KEY=882854de1e42e5b3856c5d3eae7a924e052f102a
JUSTCALL_API_SECRET=61e2a915e687e18921d4911b04893e72ea460a83

# Copper
COPPER_API_KEY=...
COPPER_USER_EMAIL=...

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

---

## 📚 **Documentation Files**

- `JUSTCALL_WEBHOOK_STATUS.md` - JustCall integration details
- `PERIOD_DATA_ANALYSIS.md` - Timezone and data analysis
- `GOAL_SYSTEM_SIMPLIFICATION.md` - Goal system changes
- `PRIORITIES_1-3_SUMMARY.md` - Complete summary
- `QUICK_REFERENCE.md` - This file

---

## ✅ **Quick Health Check**

```bash
# 1. Check build
npm run build

# 2. Test JustCall
curl http://localhost:3001/api/test-justcall

# 3. Check Firebase
firebase projects:list

# 4. View logs
firebase functions:log

# 5. Check Firestore
# Go to Firebase Console → Firestore Database
```

---

## 🎨 **UI Changes**

### **Before:**
```
[Daily] [Weekly] [Monthly] [Quarterly]
```

### **After:**
```
[Weekly] [Monthly] [Quarterly]
```

### **Pace Tiles (Unchanged):**
```
📊 Pace Trackers

Phone Calls: 320 / 625 (51%)
  ⏱️ Daily Target: 89/day (to stay on pace)
  📈 On track to hit 625 by end of period

Emails: 150 / 250 (60%)
  ⏱️ Daily Target: 36/day (to stay on pace)
  📈 Ahead of pace!
```

---

**Last Updated**: October 14, 2025
