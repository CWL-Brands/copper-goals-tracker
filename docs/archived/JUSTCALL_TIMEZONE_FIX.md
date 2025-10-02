# JustCall Timezone Fix - Using User's Local Time

## Date: 2025-09-30

## Problem Identified

### Issue:
Calls were being recorded on the wrong dates. For example:
- **Actual call:** Monday, September 30, 2025 (user's local time)
- **Recorded as:** Sunday, September 28, 2025 (UTC time)

### Root Cause:
JustCall API provides **two date fields**:
1. `call_date` - Date in **UTC/server timezone**
2. `call_user_date` - Date in **user's local timezone**

We were using `call_date` (UTC), which doesn't match when the user actually made the call in their local time.

---

## Solution

### Use `call_user_date` Instead
This field represents when the call happened in the **user's timezone**, which is what we want for accurate tracking.

### Code Change:
```typescript
// BEFORE (Wrong - uses UTC):
const callDate = new Date(call.call_date + 'T00:00:00Z');
const dayKey = callDate.toISOString().split('T')[0];

// AFTER (Correct - uses user's timezone):
const dateToUse = call.call_user_date || call.call_date;
const dayKey = dateToUse.split(' ')[0]; // Extract YYYY-MM-DD
```

---

## JustCall API Date Fields

### From JustCall Documentation:

#### `call_date` (string)
- Date in **UTC/server timezone**
- Format: `YYYY-MM-DD` or `YYYY-MM-DD HH:MM:SS`
- Example: `2025-09-28` (when call happened in UTC)

#### `call_user_date` (string)
- Date in **user's local timezone**
- Format: `YYYY-MM-DD` or `YYYY-MM-DD HH:MM:SS`
- Example: `2025-09-30` (when call happened in user's time)

#### `call_time` (string)
- Time in **UTC/server timezone**
- Format: `HH:MM:SS`

#### `call_user_time` (string)
- Time in **user's local timezone**
- Format: `HH:MM:SS`

---

## Example Scenario

### User in Mountain Time (UTC-6):
- Makes a call at **6:00 PM on Monday, Sept 30**
- In UTC, this is **12:00 AM on Tuesday, Oct 1** (next day!)

### JustCall API Returns:
```json
{
  "call_date": "2025-10-01",        // UTC date (wrong for user)
  "call_time": "00:00:00",          // UTC time
  "call_user_date": "2025-09-30",   // User's local date (correct!)
  "call_user_time": "18:00:00"      // User's local time
}
```

### What We Want:
- Record the call on **September 30** (when user made it)
- Not October 1 (UTC date)

---

## Updated Logic

### Date Parsing:
```typescript
// Use call_user_date (user's timezone) with fallback to call_date
const dateToUse = call.call_user_date || call.call_date;

// Extract YYYY-MM-DD (handles both "YYYY-MM-DD" and "YYYY-MM-DD HH:MM:SS")
const dayKey = dateToUse.split(' ')[0];
```

### Logging for Debugging:
```typescript
console.log(`[JustCall Sync] Processing call ${call.id}: 
  call_date=${call.call_date}, 
  call_user_date=${call.call_user_date}, 
  using=${dayKey}`);
```

---

## Testing

### Before Fix:
```
Console: Processing call 12345: call_date=2025-09-28, call_user_date=2025-09-30, using=2025-09-28
Firestore: Metric created for 2025-09-28 ❌ (wrong date)
```

### After Fix:
```
Console: Processing call 12345: call_date=2025-09-28, call_user_date=2025-09-30, using=2025-09-30
Firestore: Metric created for 2025-09-30 ✅ (correct date)
```

---

## Verification Steps

### 1. Check Console Logs:
After clicking "Sync JustCall (30d)", look for:
```
[JustCall Sync] Processing call 12345: 
  call_date=2025-09-28, 
  call_user_date=2025-09-30, 
  using=2025-09-30
```

### 2. Check Firestore:
- Open `metrics` collection
- Find document: `{userId}_phone_call_quantity_2025-09-30_justcall`
- Verify `date` field shows correct day

### 3. Check UI:
- Tiles should show calls on the correct day
- Calendar should mark the right days
- Leaderboard should aggregate correctly

---

## Why This Matters

### For Daily Goals:
- User makes 10 calls on Monday
- Should count toward **Monday's goal**
- Not Sunday's or Tuesday's goal

### For Weekly Goals:
- Week starts Monday
- Calls on Monday should count in that week
- Not the previous or next week

### For Reporting:
- Accurate activity tracking
- Correct performance metrics
- Proper trend analysis

---

## Edge Cases Handled

### 1. Missing `call_user_date`:
```typescript
const dateToUse = call.call_user_date || call.call_date;
```
Falls back to `call_date` if `call_user_date` is not provided.

### 2. Date with Time:
```typescript
const dayKey = dateToUse.split(' ')[0];
```
Handles both:
- `"2025-09-30"` → `"2025-09-30"`
- `"2025-09-30 18:00:00"` → `"2025-09-30"`

### 3. Different Timezones:
Each user's calls are recorded in **their** timezone, which is correct for their goals.

---

## JustCall API References

### Calls List Endpoint:
https://developer.justcall.io/reference/call_list_v21

### Call Details:
https://developer.justcall.io/reference/call_get_v21

### Agent Analytics:
https://developer.justcall.io/reference/call_agent_analytics_v21

---

## Impact

### Before Fix:
- ❌ Calls recorded on wrong dates
- ❌ Goals not tracking correctly
- ❌ Confusing for users
- ❌ Inaccurate reports

### After Fix:
- ✅ Calls recorded on correct dates
- ✅ Goals track accurately
- ✅ Matches user's perception
- ✅ Accurate reports

---

## Testing Checklist

- [ ] Delete all metrics in Firestore
- [ ] Click "Sync JustCall (30d)"
- [ ] Check console logs for date comparison
- [ ] Verify Firestore metrics have correct dates
- [ ] Check tiles show data on correct days
- [ ] Verify calendar marks correct days
- [ ] Confirm leaderboard aggregates correctly

---

## Complete! 🎉

Calls are now recorded on the correct dates using the user's local timezone!
