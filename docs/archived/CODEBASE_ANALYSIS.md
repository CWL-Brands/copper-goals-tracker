# Codebase Analysis - Before JustCall Migration

## Current Architecture

### Existing API Endpoints

#### Public Endpoints (No Auth Required)
- `/api/public/team-metrics` - Aggregates metrics from Firestore by period
- `/api/public/team-goals` - Returns team-wide goals
- `/api/public/team-kpis` - Calculates KPIs with projections
- `/api/public/team-trends` - Returns sparkline data
- `/api/public/user-overview` - User-specific overview

#### JustCall Endpoints (Already Created)
- `/api/justcall/users` - Fetches all JustCall users (✅ Working)
- `/api/justcall/calls` - Fetches call records with filters
- `/api/justcall/metrics` - Calculates metrics for a user

#### Sync Endpoints
- `/api/sync-metrics` - Syncs from Copper to Firestore metrics

### Current Metrics Flow

```
Copper API → /api/sync-metrics → Firestore metrics collection → Public APIs → Frontend
```

### Metrics Stored in Firestore

Collection: `metrics`
Fields:
- `userId` - User ID
- `type` - Metric type (phone_call_quantity, email_quantity, etc.)
- `value` - Numeric value
- `date` - Timestamp
- `source` - 'copper', 'manual', etc.

### Current Metric Types

1. `phone_call_quantity` - Call count (from Copper activities)
2. `talk_time_minutes` - Call duration (from Copper activities)
3. `email_quantity` - Email count
4. `lead_progression_a` - Fact Finding stage
5. `lead_progression_b` - Contact Stage
6. `lead_progression_c` - Closing Stage
7. `new_sales_wholesale` - Wholesale sales $
8. `new_sales_distribution` - Distribution sales $

## Files That Reference Phone Calls

### Frontend Pages
1. `app/page.tsx` - Team Overview (shows 0 calls)
2. `app/dashboard/page.tsx` - User dashboard with sparklines
3. `app/team-dashboard/page.tsx` - Team metrics display

### API Routes
1. `app/api/public/team-metrics/route.ts` - Aggregates from Firestore
2. `app/api/sync-metrics/route.ts` - Syncs from Copper
3. `app/api/public/team-kpis/route.ts` - Calculates KPIs
4. `app/api/public/team-trends/route.ts` - Generates sparklines

## Migration Strategy

### Phase 1: Create JustCall Sync Endpoint
**New File:** `app/api/sync-justcall-metrics/route.ts`
- Fetches calls from JustCall for all users
- Converts to Firestore metrics format
- Stores with `source: 'justcall'`

### Phase 2: Update Team Metrics
**Modify:** `app/api/public/team-metrics/route.ts`
- Add option to fetch from JustCall directly
- Or rely on synced Firestore metrics

### Phase 3: Update Frontend
**Modify:** `app/page.tsx`
- Team Overview to show JustCall data
- Keep existing structure, just change data source

### Phase 4: Dashboard Updates
**Modify:** `app/dashboard/page.tsx`
- Update sparklines to use JustCall metrics
- Replace Copper call data

## Key Decisions

### Option A: Sync to Firestore (Recommended)
**Pros:**
- Consistent with existing architecture
- Works with all existing endpoints
- Historical data preserved
- Easy rollback

**Cons:**
- Requires sync process
- Slight delay in real-time data

### Option B: Direct JustCall Queries
**Pros:**
- Real-time data
- No sync needed

**Cons:**
- Different from existing pattern
- Rate limiting concerns
- More API calls

## Recommendation: Hybrid Approach

1. **Create sync endpoint** - Runs daily/on-demand
2. **Store in Firestore** - Use existing metrics collection
3. **Add `source` field** - Track 'copper' vs 'justcall'
4. **Gradual migration** - Keep both sources during transition
5. **Frontend unchanged** - Existing endpoints still work

## Implementation Files

### New Files to Create
- `app/api/sync-justcall-metrics/route.ts` - Sync JustCall → Firestore

### Files to Modify
- `app/page.tsx` - Update Team Overview display
- `app/api/public/team-metrics/route.ts` - Add JustCall source filter (optional)

### Files to Keep As-Is
- `app/dashboard/page.tsx` - Works with Firestore metrics
- `app/team-dashboard/page.tsx` - Works with Firestore metrics
- All other public APIs - Work with Firestore metrics

## Next Steps

1. Create `/api/sync-justcall-metrics` endpoint
2. Test syncing for one user
3. Update Team Overview to trigger sync
4. Verify metrics appear correctly
5. Roll out to all users
