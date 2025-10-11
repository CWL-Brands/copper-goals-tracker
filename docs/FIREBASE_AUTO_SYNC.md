# Firebase Auto-Sync Setup 🔥

## **✅ CORRECTED: Using Firebase Cloud Functions**

You're using **Firebase for everything**, so we use **Firebase Cloud Scheduler** (not Vercel).

---

## **📋 What Was Added**

### **Firebase Cloud Function: `autoSyncMetrics`**

**File**: `functions/src/index.ts`

**What it does**:
- Runs automatically every 10 minutes
- Syncs Copper + JustCall for all active users
- Updates all goals
- Rate limited (500ms between users)

---

## **🚀 Deployment Steps**

### **Step 1: Deploy the Function**

```bash
cd functions
npm install
firebase deploy --only functions:autoSyncMetrics
```

**Expected output**:
```
✔ functions[autoSyncMetrics(us-central1)] Successful create operation.
Function URL: https://us-central1-your-project.cloudfunctions.net/autoSyncMetrics
```

---

### **Step 2: Verify Cloud Scheduler Created**

1. Go to **Google Cloud Console**
2. Navigate to **Cloud Scheduler**
3. You should see: `firebase-schedule-autoSyncMetrics-us-central1`
4. Schedule: `every 10 minutes`
5. Timezone: `America/Denver`

---

### **Step 3: Set Environment Variable**

```bash
firebase functions:config:set app.url="https://your-app.web.app"
firebase deploy --only functions:autoSyncMetrics
```

**Or** set in Firebase Console:
1. Go to Functions → autoSyncMetrics → Configuration
2. Add: `NEXT_PUBLIC_APP_URL` = `https://your-app.web.app`

---

## **📊 How It Works**

### **Every 10 Minutes:**

```
1. Cloud Scheduler triggers autoSyncMetrics function
   │
2. Function gets all active users (isActive == true)
   │
3. For each user:
   ├─> Call /api/sync-metrics (Copper)
   ├─> Call /api/sync-justcall-metrics (JustCall)
   ├─> Update goals in Firestore
   └─> Wait 500ms (rate limiting)
   │
4. Log results and return
```

---

## **📈 Monitoring**

### **View Logs:**

**Firebase Console**:
1. Go to **Functions**
2. Click **autoSyncMetrics**
3. Click **Logs** tab

**Expected logs**:
```
[Auto-Sync] Starting scheduled sync for all active users
[Auto-Sync] Found 5 active users
[Auto-Sync] Syncing joe@kanvabotanicals.com...
[Auto-Sync] ✅ joe@kanvabotanicals.com synced successfully
[Auto-Sync] Syncing derek@kanvabotanicals.com...
[Auto-Sync] ✅ derek@kanvabotanicals.com synced successfully
...
[Auto-Sync] Complete in 30000ms - 5 success, 0 failed
```

---

### **Manual Trigger (Testing):**

```bash
# Trigger the function manually
gcloud functions call autoSyncMetrics --region=us-central1
```

**Or** in Firebase Console:
1. Go to Functions → autoSyncMetrics
2. Click **Testing** tab
3. Click **Test the function**

---

## **⚙️ Configuration**

### **Change Schedule:**

**File**: `functions/src/index.ts`

```typescript
export const autoSyncMetrics = functions
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .pubsub.schedule('every 5 minutes')  // ← Change here
  .timeZone('America/Denver')
  .onRun(async (context) => {
    // ...
  });
```

**Options**:
- `every 5 minutes`
- `every 15 minutes`
- `every 30 minutes`
- `every 1 hours`
- `0 */2 * * *` (every 2 hours)
- `0 0 * * *` (daily at midnight)

**After changing**: `firebase deploy --only functions:autoSyncMetrics`

---

### **Change Timezone:**

```typescript
.timeZone('America/Denver')  // Mountain Time
.timeZone('America/New_York')  // Eastern Time
.timeZone('America/Los_Angeles')  // Pacific Time
.timeZone('America/Chicago')  // Central Time
```

---

### **Change Memory/Timeout:**

```typescript
.runWith({ 
  timeoutSeconds: 540,  // 9 minutes (max for scheduled functions)
  memory: '1GB'         // 256MB, 512MB, 1GB, 2GB
})
```

---

## **💰 Pricing**

### **Firebase Cloud Functions (Blaze Plan)**

**Free Tier (per month)**:
- 2 million invocations
- 400,000 GB-seconds
- 200,000 CPU-seconds

**Your Usage**:
- 6 invocations/hour × 24 hours × 30 days = **4,320 invocations/month**
- Well within free tier! ✅

**Estimated Cost**: **$0/month** (within free tier)

---

## **🔒 Security**

### **Function runs with admin privileges:**
- Uses Firebase Admin SDK
- No user authentication needed
- Secure server-side execution

### **Rate limiting:**
- 500ms delay between users
- Prevents API throttling
- Spreads load over time

---

## **🎯 What Gets Synced**

### **✅ Copper (API-based):**
- Emails (last 30 days)
- Calls (last 30 days)
- Leads (pipeline stages)

### **✅ JustCall (API-based):**
- Call records (last 30 days)
- Talk time duration

### **❌ Fishbowl (NOT synced):**
- Fishbowl sync is manual only
- Admin-only, 3-step process
- Separate workflow

---

## **🧪 Testing**

### **Test Locally (Emulator):**

```bash
cd functions
npm run serve

# In another terminal:
firebase functions:shell

# In the shell:
autoSyncMetrics()
```

---

### **Test in Production:**

```bash
# Trigger manually
gcloud functions call autoSyncMetrics --region=us-central1

# View logs
firebase functions:log --only autoSyncMetrics
```

---

## **🚨 Troubleshooting**

### **Function not running?**

**Check Cloud Scheduler**:
```bash
gcloud scheduler jobs list
```

**Should see**:
```
NAME: firebase-schedule-autoSyncMetrics-us-central1
SCHEDULE: every 10 minutes
STATE: ENABLED
```

---

### **Function timing out?**

**Increase timeout**:
```typescript
.runWith({ timeoutSeconds: 540 })  // Max for scheduled functions
```

---

### **API rate limits?**

**Increase delay between users**:
```typescript
await new Promise(resolve => setTimeout(resolve, 1000));  // 1 second
```

---

### **Function not finding users?**

**Check Firestore query**:
```typescript
const usersSnapshot = await db.collection('users')
  .where('isActive', '==', true)  // Make sure users have isActive: true
  .get();
```

---

## **📝 Summary**

### **Deployment:**
```bash
cd functions
firebase deploy --only functions:autoSyncMetrics
```

### **What happens:**
- ✅ Function deployed to Firebase
- ✅ Cloud Scheduler automatically created
- ✅ Runs every 10 minutes
- ✅ Syncs all active users
- ✅ No manual intervention needed

### **Monitoring:**
- Firebase Console → Functions → Logs
- Look for `[Auto-Sync]` logs
- Check success/failure counts

### **Cost:**
- ✅ Free (within free tier)
- ✅ ~4,320 invocations/month
- ✅ Well below 2 million limit

---

**Date**: October 10, 2025  
**Status**: ✅ Ready to Deploy  
**Platform**: Firebase Cloud Functions  
**Version**: 1.0.0
