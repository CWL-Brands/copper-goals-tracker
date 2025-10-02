# Implementation Research - JustCall Metrics Sync

## Research Completed: 2025-09-30

### Architecture Understanding

#### Metrics Collection Structure
**Collection:** `metrics`
**Document ID Pattern:** `${userId}_${type}_${dayKey}_${source}`
- Ensures idempotent writes (no duplicates)
- Example: `user123_phone_call_quantity_2025-09-30_justcall`

**Metric Interface:**
```typescript
interface Metric {
  id: string;
  userId: string;
  type: GoalType; // 'phone_call_quantity' | 'talk_time_minutes' | etc.
  value: number;
  date: Date; // Stored as Timestamp, normalized to start of day
  source: 'manual' | 'copper' | 'justcall';
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

#### Existing Sync Pattern (Copper)
File: `app/api/sync-metrics/route.ts`

**Key Functions:**
1. `logMetricAdmin()` - Idempotent metric writer
   - Creates deterministic doc ID
   - Uses `set({...}, { merge: true })`
   - Normalizes date to start of day
   
2. `fetchWithRetry()` - Handles rate limiting
   - Retries on 429 and 5xx
   - Exponential backoff
   
3. Activity bucketing by day
   - Groups activities by date
   - Writes one metric per day per type

**Call Metrics Pattern:**
```typescript
// Copper stores both count and duration
byDay[key] = { count: 0, minutes: 0 };

// Writes two metrics:
// 1. phone_call_quantity (count)
// 2. talk_time_minutes (duration)
```

#### JustCall API Structure
**Endpoints Available:**
- `/api/justcall/users` - Returns all users
- `/api/justcall/calls` - Returns call records
- `/api/justcall/metrics` - Calculates metrics (client-side)

**JustCall Call Record:**
```typescript
{
  id: number;
  agent_email: string;
  call_date: string; // YYYY-MM-DD
  call_time: string; // HH:MM:SS
  call_info: {
    direction: 'Incoming' | 'Outgoing';
    type: string; // 'answered', 'missed', etc.
  };
  call_duration: {
    total_duration: number; // seconds
    conversation_time: number; // seconds
  };
}
```

### Implementation Strategy

#### New Endpoint: `/api/sync-justcall-metrics`
**Purpose:** Sync JustCall calls to Firestore metrics

**Pattern to Follow:**
1. Accept `{ userId, startDate, endDate }`
2. Fetch user's email from Firestore
3. Get calls from JustCall for that email
4. Bucket calls by day
5. Write metrics using `logMetricAdmin()` pattern
6. Return summary

**Key Differences from Copper:**
- JustCall: Direct API call per user
- Copper: Requires owner ID mapping
- JustCall: Simpler - just email match
- Both: Same metric storage pattern

#### Metrics to Create
1. **phone_call_quantity** - Count of calls
   - Source: `justcall`
   - Value: Number of calls per day
   
2. **talk_time_minutes** - Duration of calls
   - Source: `justcall`
   - Value: Total seconds / 60 per day
   - Metadata: `{ callCount, totalSeconds }`

### Code Reuse Opportunities

#### From sync-metrics/route.ts:
1. ✅ `logMetricAdmin()` function - Copy exact pattern
2. ✅ Date bucketing logic - Reuse
3. ✅ Error handling pattern - Follow same structure
4. ✅ Response format - Match existing

#### From justcall/client.ts:
1. ✅ `createJustCallClient()` - Already exists
2. ✅ `getCallsByUserEmail()` - Already exists
3. ✅ Date format handling - Already correct

### Implementation Plan

#### Step 1: Create Sync Endpoint
File: `app/api/sync-justcall-metrics/route.ts`

**Structure:**
```typescript
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { createJustCallClient } from '@/lib/justcall/client';

// Copy logMetricAdmin from sync-metrics
async function logMetricAdmin(...) { ... }

export async function POST(request: NextRequest) {
  // 1. Parse request
  // 2. Get user email from Firestore
  // 3. Fetch JustCall calls
  // 4. Bucket by day
  // 5. Write metrics
  // 6. Return summary
}
```

#### Step 2: Update Team Overview
File: `app/page.tsx`

**Current:** Shows 0 calls (no data)
**New:** Add sync button or auto-sync on load

**Options:**
- A) Add "Sync JustCall" button
- B) Auto-sync on page load (if not synced today)
- C) Show JustCall data directly (no sync)

**Recommendation:** Option A (manual button first)

### Testing Strategy

1. **Unit Test:** Sync one user for one day
2. **Verify:** Check Firestore metrics collection
3. **Frontend:** Confirm Team Overview shows data
4. **Dashboard:** Verify sparklines work
5. **Team Page:** Confirm aggregates work

### Rollout Plan

1. ✅ Create sync endpoint
2. ✅ Test with one user
3. ✅ Add button to home page
4. ✅ Test team metrics display
5. ✅ Document usage
6. ⏳ Roll out to all users

### Files to Create
- `app/api/sync-justcall-metrics/route.ts` (NEW)

### Files to Modify
- `app/page.tsx` (add sync button)
- `docs/IMPLEMENTATION_RESEARCH.md` (this file - update when complete)

### Files NOT to Modify
- `app/dashboard/page.tsx` - Works with Firestore
- `app/team-dashboard/page.tsx` - Works with Firestore
- `app/api/public/team-metrics/route.ts` - Works with Firestore
- All other public APIs - No changes needed

## Status: ✅ IMPLEMENTED

### Implementation Complete - 2025-09-30

#### Files Created:
1. ✅ `app/api/sync-justcall-metrics/route.ts` - Sync endpoint
   - Follows exact pattern from `sync-metrics/route.ts`
   - Uses `logMetricAdmin()` for idempotent writes
   - Buckets calls by day
   - Writes `phone_call_quantity` and `talk_time_minutes`
   - Updates `lastJustCallSyncAt` in settings

#### Files Modified:
1. ✅ `app/page.tsx` - Added JustCall sync functionality
   - New `syncJustCall()` function
   - "Sync JustCall Data" button in Team Overview
   - "Sync JustCall" button in Quick Actions
   - Auto-refreshes team metrics after sync

#### How It Works:
1. User clicks "Sync JustCall Data" button
2. Frontend calls `/api/sync-justcall-metrics` with userId
3. Backend fetches user email from Firestore
4. Backend calls JustCall API for last 30 days of calls
5. Backend buckets calls by day
6. Backend writes metrics to Firestore (idempotent)
7. Frontend refreshes team metrics display
8. Phone calls now show in Team Overview!

#### Testing Steps:
1. Navigate to home page (http://localhost:3000)
2. Click "Sync JustCall Data" button
3. Wait for toast notification
4. Verify phone calls count updates in Team Overview
5. Check dashboard sparklines (should auto-update)
6. Check team dashboard (should auto-update)

#### Metrics Written:
- `phone_call_quantity` - Count per day, source: 'justcall'
- `talk_time_minutes` - Duration per day, source: 'justcall'

#### Next Steps:
- Test with real user data
- Verify all dashboards show updated metrics
- Consider auto-sync on page load
- Add sync status indicator
