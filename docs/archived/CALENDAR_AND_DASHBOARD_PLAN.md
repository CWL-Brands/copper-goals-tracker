# Calendar Color Coding & Dashboard Redesign Plan

## Date: 2025-09-30

## Task 1: Calendar Color Coding (Red/Yellow/Green)

### Goal
Add color coding to calendar tiles based on daily goal completion percentage:
- 🔴 Red: 0-33% of goals met
- 🟡 Yellow: 34-66% of goals met  
- 🟢 Green: 67-100% of goals met

### Implementation Steps

#### 1. Calculate Daily Goal Completion
For each calendar day, we need to:
1. Get all goals for that day's period
2. Get all metrics for that day
3. Calculate completion % for each goal
4. Average the percentages
5. Apply color based on average

#### 2. Data Structure Needed
```typescript
interface DayCompletion {
  date: string; // YYYY-MM-DD
  goalsCompleted: number;
  totalGoals: number;
  percentage: number;
  color: 'red' | 'yellow' | 'green' | 'gray'; // gray = no data
}
```

#### 3. Color Logic
```typescript
function getColorForPercentage(pct: number): string {
  if (pct === 0) return 'bg-gray-100'; // No data
  if (pct < 34) return 'bg-red-100 border-red-300';
  if (pct < 67) return 'bg-yellow-100 border-yellow-300';
  return 'bg-green-100 border-green-300';
}
```

#### 4. Update Calendar Component
- Fetch daily completion data on mount
- Apply background colors to tiles
- Add tooltip showing details
- Keep green dot for "has activity"

---

## Task 2: Dashboard Page Redesign

### Current Issues (from screenshots)
1. ❌ Period selector at top (redundant with toolbar)
2. ❌ "At a glance" section too prominent
3. ❌ Sparklines take too much space
4. ❌ Goal cards at bottom (should be higher)
5. ❌ Missing "Sharpening the Saw" section
6. ❌ No quick actions
7. ❌ "Team" button visible but not useful for personal page

### New Dashboard Flow

```
1. User Header (who am I, last sync)
2. Quick Actions (sync, set goal, view team)
3. At a Glance (key metrics - compact)
4. My Active Goals (goal cards)
5. Insights (sparklines - compact)
6. Sharpening the Saw (personal development)
```

### Detailed Design

#### 1. User Header
```
┌─────────────────────────────────────────┐
│ [Avatar] Name                           │
│ ben@kanvabotanicals.com                 │
│ Last Sync: 9/30/2025 8:03 AM            │
│                                         │
│ [Daily|Weekly|Monthly]  [Sync] [Sign Out]│
└─────────────────────────────────────────┘
```

#### 2. Quick Actions
```
┌─────────────────────────────────────────┐
│ Quick Actions                           │
│ [Set Goal] [Sync JustCall] [Sync Copper]│
│ [View Team Dashboard]                   │
└─────────────────────────────────────────┘
```

#### 3. At a Glance (Compact)
```
┌─────────────────────────────────────────┐
│ At a Glance                             │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│ │ 0    │ │ 8    │ │ 0%   │ │ $0   │   │
│ │Goals │ │Total │ │Avg   │ │Sales │   │
│ │Met   │ │Goals │ │Prog  │ │Total │   │
│ └──────┘ └──────┘ └──────┘ └──────┘   │
└─────────────────────────────────────────┘
```

#### 4. My Active Goals
```
┌─────────────────────────────────────────┐
│ My Active Goals                         │
│ [Goal Card Grid - 3 columns]            │
└─────────────────────────────────────────┘
```

#### 5. Insights (Compact - 2 rows max)
```
┌─────────────────────────────────────────┐
│ Insights                                │
│ Emails - 7d  [sparkline]     182        │
│ Emails - 30d [sparkline]     2270       │
│ Calls - 7d   [sparkline]     50         │
│ Calls - 30d  [sparkline]     236        │
└─────────────────────────────────────────┘
```

#### 6. Sharpening the Saw
```
┌─────────────────────────────────────────┐
│ Sharpening the Saw                      │
│ ┌──────────┐ ┌──────────┐              │
│ │ Skills/  │ │ Reading  │              │
│ │ Training │ │ List     │              │
│ │ [textarea│ │ [textarea│              │
│ └──────────┘ └──────────┘              │
│ ┌──────────┐ ┌──────────┐              │
│ │ Habits   │ │ Skills   │              │
│ │ Tracker  │ │ Notes    │              │
│ │ [textarea│ │ [textarea│              │
│ └──────────┘ └──────────┘              │
│ [Save]                                  │
└─────────────────────────────────────────┘
```

### Removed Elements
- ❌ Team view toggle (not needed on personal dashboard)
- ❌ Redundant period selector in toolbar
- ❌ Excessive vertical spacing

### Color Scheme
- Primary actions: Green
- Sync actions: Blue
- Secondary: Gray
- Metrics: Existing colors

---

## Implementation Order

### Phase 1: Calendar Color Coding
1. Create daily completion calculation function
2. Update calendar state to include completion data
3. Apply colors to calendar tiles
4. Add tooltip with details
5. Test with real data

### Phase 2: Dashboard Redesign
1. Add User Header section
2. Add Quick Actions section
3. Compact "At a Glance"
4. Reorder sections (Goals higher)
5. Compact Insights section
6. Add Sharpening the Saw section
7. Remove redundant elements
8. Test all functionality

---

## Files to Modify

### Calendar Color Coding
- `app/page.tsx` - Update calendar rendering

### Dashboard Redesign
- `app/dashboard/page.tsx` - Complete redesign
- Add state for "Sharpening the Saw" fields

---

## Success Criteria

### Calendar
- ✅ Colors reflect goal completion
- ✅ Visual feedback is immediate
- ✅ Tooltip shows details
- ✅ No performance issues

### Dashboard
- ✅ Better visual hierarchy
- ✅ Personal focus maintained
- ✅ Quick actions accessible
- ✅ Sharpening the Saw functional
- ✅ Compact but informative
- ✅ All existing features work

---

## Ready to Implement!
