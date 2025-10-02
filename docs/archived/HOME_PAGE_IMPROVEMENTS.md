# Home Page Improvements - Implementation Plan

## Completed ✅
1. **Moved "Sharpening the Saw"** from home page to dashboard page
2. **JustCall Integration** - All 7 team members now visible in admin dashboard

## In Progress 🔄

### 2. Fix Team Overview Phone Calls
**Problem:** Phone calls showing 0 - not tracking from JustCall
**Solution:** Create aggregate JustCall metrics API endpoint

**Files to modify:**
- `app/api/public/team-justcall-metrics/route.ts` (NEW)
- `app/page.tsx` (update Team Overview to fetch from JustCall)

**Implementation:**
```typescript
// New endpoint: /api/public/team-justcall-metrics
// Aggregates call data from all JustCall users
// Returns: { totalCalls, totalDuration, callsByUser }
```

## Pending 📋

### 3. Enhanced Goals Calendar
**Current:** Simple calendar with green dots for activity
**New Features:**
- **Color coding:** Red (0% goals met) → Yellow (50%) → Green (100%)
- **Interactive tiles:** Click to see daily summary
- **Sales data:** Show total sales amount on each day
- **Compact view:** Smaller tiles to save space

**Color Scale Logic:**
```
Red: 0-33% of goals met
Yellow: 34-66% of goals met  
Green: 67-100% of goals met
```

**Files to modify:**
- `app/page.tsx` - Calendar component
- Need to calculate daily goal completion %

### 4. Replace Copper Calling Metrics with JustCall

**Current Copper Metrics:**
- `phone_call_quantity` - from Copper activities
- `talk_time_minutes` - from Copper activities

**New JustCall Metrics:**
- Fetch from `/api/justcall/calls` endpoint
- Calculate daily/weekly/monthly totals
- Store in Firestore metrics collection

**Migration Strategy:**
1. Create JustCall sync endpoint
2. Fetch calls for date range
3. Convert to metrics format
4. Store in existing metrics structure
5. Update all dashboards to use JustCall data

**Files to modify:**
- `app/api/sync-justcall-to-metrics/route.ts` (NEW)
- `app/dashboard/page.tsx` - Update sparklines
- `app/team-dashboard/page.tsx` - Update team metrics
- `app/page.tsx` - Update Team Overview

## API Endpoints Needed

### 1. Team JustCall Aggregate
```
GET /api/public/team-justcall-metrics?period=daily
Response: {
  totalCalls: number,
  totalDuration: number,
  callsByUser: { [email]: { calls: number, duration: number } }
}
```

### 2. JustCall to Metrics Sync
```
POST /api/sync-justcall-to-metrics
Body: { userId, startDate, endDate }
Response: { synced: number, calls: number }
```

### 3. Daily Goal Completion
```
GET /api/user/daily-goal-completion?userId=xxx&date=2025-09-30
Response: {
  date: string,
  goalsCompleted: number,
  totalGoals: number,
  percentage: number,
  totalSales: number
}
```

## Implementation Order

1. ✅ Move Sharpening the Saw
2. 🔄 Create team JustCall metrics endpoint
3. 🔄 Update Team Overview to show JustCall data
4. ⏳ Create daily goal completion API
5. ⏳ Enhance calendar with colors and interactivity
6. ⏳ Create JustCall sync endpoint
7. ⏳ Replace all Copper calling metrics

## Testing Checklist

- [ ] Team Overview shows accurate call counts
- [ ] Calendar colors reflect goal completion
- [ ] Calendar tiles are clickable
- [ ] Daily summaries display correctly
- [ ] JustCall sync creates metrics
- [ ] Dashboard sparklines show JustCall data
- [ ] Team dashboard shows JustCall data

## Notes

- **JustCall API Limit:** 3 months history
- **Rate Limiting:** Implement delays between requests
- **Caching:** Cache JustCall user list
- **Fallback:** Keep Copper metrics as backup during transition
