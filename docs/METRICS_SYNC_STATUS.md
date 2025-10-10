# 📊 Metrics Sync Status & Implementation Guide

**Last Updated:** October 10, 2025  
**Status:** ✅ Ready for Testing

---

## 🎯 **OBJECTIVE**

Sync 90 days of sales activity metrics from **Copper CRM** and **JustCall** to establish accurate performance benchmarks for all sales representatives.

---

## 📈 **METRICS TRACKED**

### **Activity Metrics:**
| Metric | Source | Type | Description |
|--------|--------|------|-------------|
| `email_quantity` | Copper | Count | Number of emails sent |
| `phone_call_quantity` | Copper + JustCall | Count | Number of phone calls made |
| `talk_time_minutes` | Copper + JustCall | Minutes | Total talk time on calls |

### **Lead Progression:**
| Metric | Source | Type | Description |
|--------|--------|------|-------------|
| `lead_progression_a` | Copper | Count | Leads in Stage A |
| `lead_progression_b` | Copper | Count | Leads in Stage B |
| `lead_progression_c` | Copper | Count | Leads in Stage C |

### **Sales Revenue:**
| Metric | Source | Type | Description |
|--------|--------|------|-------------|
| `new_sales_wholesale` | Copper | Currency | New wholesale sales |
| `new_sales_distribution` | Copper | Currency | New distribution sales |

---

## 🔧 **IMPLEMENTATION STATUS**

### ✅ **COMPLETED:**

1. **Authentication Fixed**
   - `AdminUtilitiesTab.tsx` now passes Firebase auth token
   - Backfill endpoint properly validates admin users
   - Uses `ADMIN_EMAILS` from `.env.local`

2. **Dual Sync Integration**
   - Backfill calls `/api/sync-metrics` (Copper)
   - Backfill calls `/api/sync-justcall-metrics` (JustCall)
   - Both sources write to same `metrics` collection
   - Idempotent writes using deterministic doc IDs

3. **Error Handling**
   - Per-user warnings collected
   - Copper failures don't block JustCall sync
   - Detailed response with success/failure counts

---

## 🚀 **HOW TO USE**

### **Step 1: Navigate to Admin Panel**
```
https://your-app.com/admin
→ Click "Admin Tools" tab
```

### **Step 2: Run Backfill**
```
1. Scroll to "Backfill Sales Metrics (90d)"
2. Click "Backfill Sales Metrics (90d)" button
3. Confirm the dialog
4. Wait for completion (approx 1-2 minutes for 4 users)
```

### **Step 3: Verify Results**
```
Check browser console for detailed results:
{
  "success": true,
  "processed": 4,
  "ok": 4,
  "failed": 0,
  "window": {
    "start": "2025-07-12T00:00:00.000Z",
    "end": "2025-10-10T00:00:00.000Z"
  },
  "details": [
    {
      "userId": "abc123",
      "email": "brandon@kanvabotanicals.com",
      "status": 200,
      "warnings": []
    },
    ...
  ]
}
```

---

## 📊 **DATA FLOW**

```
┌─────────────────────────────────────────────────────────┐
│  Admin Panel: Click "Backfill Sales Metrics"           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  /api/admin/backfill-sales-metrics                     │
│  • Validates admin auth token                           │
│  • Queries all users with role='sales'                  │
│  • Loops through each user (90-day window)              │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│ /api/sync-metrics│    │/api/sync-justcall│
│   (Copper CRM)   │    │    -metrics      │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│  Firestore: metrics/{docId}             │
│  docId = userId_type_date_source        │
│  • Idempotent writes (merge: true)      │
│  • Date normalized to noon UTC          │
└─────────────────────────────────────────┘
```

---

## 🔍 **COPPER SYNC DETAILS**

**Endpoint:** `/api/sync-metrics`

**What it syncs:**
1. **Emails** - Activity type: "Email" (system)
2. **Phone Calls** - Activity type: "Phone Call" (user)
3. **Talk Time** - Duration from call activities
4. **Lead Progression** - Opportunities by pipeline stage
5. **Sales Revenue** - Closed opportunities by sale type

**User Mapping:**
- Uses `copperUserEmail` to find Copper user ID
- Filters activities by `user_ids: [ownerId]`
- Caches Copper users map in Firestore for 24h

**Date Handling:**
- Uses `activity_date` (Unix timestamp)
- Buckets by day (midnight UTC)
- Writes one metric doc per user+type+day+source

---

## 📞 **JUSTCALL SYNC DETAILS**

**Endpoint:** `/api/sync-justcall-metrics`

**What it syncs:**
1. **Phone Call Quantity** - Count of calls
2. **Talk Time Minutes** - Total duration in minutes

**User Mapping:**
- Looks up user email from Firestore `users/{userId}`
- Calls JustCall API with email filter
- Aggregates calls by day

**Data Source:**
- JustCall API: `/v2/calls`
- Filters by date range and user email
- Converts seconds to minutes for talk time

---

## ⚙️ **CONFIGURATION**

### **Environment Variables Required:**

```bash
# Copper CRM
COPPER_API_KEY=your_copper_api_key
COPPER_USER_EMAIL=ben@kanvabotanicals.com

# JustCall
JUSTCALL_API_KEY=your_justcall_api_key
JUSTCALL_API_SECRET=your_justcall_api_secret

# Admin Auth
ADMIN_EMAILS=ben@kanvabotanicals.com,it@cwlbrands.com,rob@kanvabotanicals.com,kent@kanvabotanicals.com

# Firebase Admin SDK
FIREBASE_PROJECT_ID=kanvaportal
FIREBASE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### **Firestore Collections:**

```
users/
  {userId}/
    email: string
    role: 'sales' | 'admin' | 'manager'
    copperUserEmail?: string (override)

metrics/
  {userId}_{type}_{YYYY-MM-DD}_{source}/
    userId: string
    type: 'email_quantity' | 'phone_call_quantity' | 'talk_time_minutes' | ...
    value: number
    date: Timestamp (noon UTC)
    source: 'copper' | 'justcall'
    metadata: object
    createdAt: Timestamp

settings/
  copper_users_map/
    byEmail: { [email]: copperId }
    updatedAt: string
```

---

## 🐛 **TROUBLESHOOTING**

### **401 Unauthorized**
- ✅ **FIXED:** AdminUtilitiesTab now passes auth token
- Verify you're logged in as admin user
- Check `ADMIN_EMAILS` includes your email

### **No Copper Data**
- Verify `COPPER_API_KEY` and `COPPER_USER_EMAIL`
- Check Copper activity type IDs are configured
- Ensure user email matches Copper user

### **No JustCall Data**
- Verify `JUSTCALL_API_KEY` and `JUSTCALL_API_SECRET`
- Check user email exists in JustCall
- Ensure calls exist in date range

### **Metrics Not Appearing in Dashboard**
- Check Firestore `metrics` collection
- Verify date range matches dashboard filter
- Ensure `type` field matches expected values

---

## 📋 **TESTING CHECKLIST**

- [ ] Login as admin user (ben@kanvabotanicals.com)
- [ ] Navigate to Admin → Admin Tools
- [ ] Click "Backfill Sales Metrics (90d)"
- [ ] Confirm dialog
- [ ] Wait for success toast
- [ ] Check browser console for details
- [ ] Navigate to Dashboard
- [ ] Verify metrics appear in charts
- [ ] Compare totals with pivot table data
- [ ] Check each sales rep's metrics

---

## 🎯 **EXPECTED RESULTS**

Based on your pivot table:

| Sales Rep | Emails | Calls | Talk Time (min) | Lead Prog | Sales |
|-----------|--------|-------|-----------------|-----------|-------|
| brandon@  | 1      | 440   | 22              | 10        | 15,409|
| derek@    | 1      | 517   | 111             | 20        | 5,992 |
| jared@    | 1      | 420   | 11              | 11        | 15,368|
| joe@      | 1      | 343   | 72              | 13        | 15,362|
| **TOTAL** | **4**  | **1,720** | **216**     | **54**    | **52,131** |

---

## 🚦 **NEXT STEPS**

1. ✅ **Test Backfill** - Run for all sales reps
2. ⏳ **Verify Accuracy** - Compare with pivot table
3. ⏳ **Fix Discrepancies** - Adjust mapping if needed
4. ⏳ **Schedule Auto-Sync** - Daily cron job
5. ⏳ **Monitor Performance** - Track sync duration

---

## 📝 **NOTES**

- **Rate Limiting:** 800ms delay between users
- **Idempotent:** Safe to run multiple times
- **Merge Strategy:** Existing metrics are preserved
- **Date Normalization:** All dates stored at noon UTC
- **Source Tracking:** Copper vs JustCall distinguished

---

**Ready to test!** 🚀
