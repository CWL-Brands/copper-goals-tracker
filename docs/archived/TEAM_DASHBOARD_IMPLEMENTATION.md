# Team Dashboard Redesign - Implementation Plan

## Date: 2025-09-30

## Status: IN PROGRESS

---

## Completed So Far

### ✅ Phase 1: Type Updates
1. Added `'quarterly'` to `GoalPeriod` type
2. Added `TeamMemberPerformance` interface
3. Updated period labels to include Quarterly
4. Added quarterly date calculation in services

### ✅ Phase 2: Service Updates
1. Updated `metricService.getMetricsForPeriod()` to handle quarterly
2. Quarterly calculation: Current quarter based on month (Q1: Jan-Mar, Q2: Apr-Jun, etc.)

---

## Next Steps

### Phase 3: Team Dashboard Redesign
**File:** `app/team-dashboard/page.tsx`

#### New Features Needed:
1. **Leaderboard API Endpoint** - `/api/public/team-leaderboard`
   - Fetches all users from Firestore
   - Aggregates metrics per user for period
   - Calculates overall score (weighted)
   - Ranks users
   - Returns sorted array

2. **Leaderboard UI Component**
   - Table with columns: Rank, Name, Sales, Calls, Emails, Leads, Score
   - Top 3 highlighted with medals (🥇🥈🥉)
   - Progress bars for each metric
   - Trend indicators (↑↓→)
   - Responsive design

3. **Team Metrics Grid**
   - Aggregate totals for team
   - Same tiles as before but enhanced
   - Color-coded by performance

4. **Performance Charts**
   - Team activity trends
   - Top performers chart
   - Period comparison

---

### Phase 4: Admin Settings Page
**File:** `app/admin/goals/page.tsx` (NEW)

#### Features:
1. **Team Goal Management**
   - View all team members
   - Set goals for each member
   - Bulk goal setting
   - Period selector (including Quarterly)

2. **Quarterly Target Management**
   - Set quarterly sales targets
   - Set quarterly activity targets
   - Track quarterly progress

3. **Goal Templates**
   - Create goal templates
   - Apply to multiple users
   - Save common goal sets

---

## API Endpoints Needed

### 1. `/api/public/team-leaderboard`
**Method:** GET
**Query:** `?period=daily|weekly|monthly|quarterly`

**Response:**
```json
{
  "leaderboard": [
    {
      "userId": "user123",
      "userName": "Jared Smith",
      "userEmail": "jared@kanva.com",
      "photoUrl": "...",
      "totalSales": 5000,
      "phoneCalls": 50,
      "emails": 100,
      "leadProgression": 15,
      "overallScore": 95.5,
      "rank": 1,
      "trend": "up"
    }
  ],
  "period": "daily",
  "lastUpdated": "2025-09-30T15:00:00Z"
}
```

### 2. `/api/admin/team-goals`
**Method:** GET/POST/PUT
**Purpose:** Manage team goals

**GET Response:**
```json
{
  "teamGoals": [
    {
      "userId": "user123",
      "goals": {
        "daily": {...},
        "weekly": {...},
        "monthly": {...},
        "quarterly": {...}
      }
    }
  ]
}
```

**POST Body:**
```json
{
  "userId": "user123",
  "period": "quarterly",
  "goals": {
    "phone_call_quantity": 500,
    "email_quantity": 1000,
    "new_sales_wholesale": 50000
  }
}
```

---

## Ranking Algorithm

```typescript
function calculateOverallScore(member: TeamMember): number {
  // Weighted scoring
  const salesWeight = 0.4;
  const callsWeight = 0.2;
  const emailsWeight = 0.2;
  const leadsWeight = 0.2;
  
  // Normalize each metric (0-100 scale)
  const salesScore = normalizeToTarget(member.totalSales, salesTarget);
  const callsScore = normalizeToTarget(member.phoneCalls, callsTarget);
  const emailsScore = normalizeToTarget(member.emails, emailsTarget);
  const leadsScore = normalizeToTarget(member.leadProgression, leadsTarget);
  
  // Calculate weighted average
  return (
    salesScore * salesWeight +
    callsScore * callsWeight +
    emailsScore * emailsWeight +
    leadsScore * leadsWeight
  );
}

function normalizeToTarget(value: number, target: number): number {
  if (target === 0) return 0;
  return Math.min((value / target) * 100, 100);
}
```

---

## UI Design

### Leaderboard Table
```
┌────┬──────────────┬────────────┬────────┬────────┬────────┬────────┐
│ #  │ Team Member  │ Total Sales│ Calls  │ Emails │ Leads  │ Score  │
├────┼──────────────┼────────────┼────────┼────────┼────────┼────────┤
│ 🥇 │ Jared Smith  │ $5,000     │ 50     │ 100    │ 15     │ 95.5%  │
│    │ [Progress bars showing % of target]                           │
├────┼──────────────┼────────────┼────────┼────────┼────────┼────────┤
│ 🥈 │ Joe Johnson  │ $4,500     │ 45     │ 95     │ 12     │ 90.2%  │
│    │ [Progress bars]                                               │
├────┼──────────────┼────────────┼────────┼────────┼────────┼────────┤
│ 🥉 │ Sarah Lee    │ $4,000     │ 40     │ 90     │ 10     │ 85.8%  │
│    │ [Progress bars]                                               │
└────┴──────────────┴────────────┴────────┴────────┴────────┴────────┘
```

### Team Metrics Grid
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Total Sales     │ Total Calls     │ Total Emails    │ Total Leads     │
│ $13,500         │ 135             │ 285             │ 37              │
│ of $15,000      │ of 150          │ of 300          │ of 45           │
│ [90% Progress]  │ [90% Progress]  │ [95% Progress]  │ [82% Progress]  │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

## Implementation Steps

### Step 1: Create Leaderboard API ✅ TODO
```bash
app/api/public/team-leaderboard/route.ts
```

### Step 2: Update Team Dashboard UI ✅ TODO
- Add leaderboard component
- Add team metrics grid
- Add performance charts
- Add period selector with Quarterly

### Step 3: Create Admin Goals Page ✅ TODO
```bash
app/admin/goals/page.tsx
```

### Step 4: Test Integration ✅ TODO
- Test with real data
- Verify JustCall metrics
- Verify Copper metrics
- Test quarterly calculations

---

## Testing Checklist

- [ ] Quarterly period works in all components
- [ ] Leaderboard displays correctly
- [ ] Rankings are accurate
- [ ] Scores calculate properly
- [ ] Team metrics aggregate correctly
- [ ] Admin page allows goal editing
- [ ] Quarterly targets save/load
- [ ] All APIs return correct data
- [ ] UI is responsive
- [ ] No console errors

---

## Next Session Tasks

1. Create `/api/public/team-leaderboard` endpoint
2. Redesign team dashboard UI with leaderboard
3. Create admin goals management page
4. Test end-to-end
5. Document ShipStation integration plan
6. Document Fishbowl data migration plan

---

## Ready for Next Phase!
