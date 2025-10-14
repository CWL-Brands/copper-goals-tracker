# Goal System Simplification Plan

## 🎯 **Objective**

Remove daily goals and user goal creation. Users only see pace-based tracking from team goals.

---

## **Current System:**

### **Goal Periods:**
- ✅ Daily
- ✅ Weekly  
- ✅ Monthly
- ✅ Quarterly

### **User Actions:**
- ❌ Can create own goals
- ❌ Can edit goals
- ❌ Can set targets per period

### **Team Goals:**
- ✅ Admin sets org-wide targets
- ✅ Stored in `settings/team_goals`
- ✅ Used for pace calculations

---

## **New System:**

### **Goal Periods:**
- ❌ ~~Daily~~ (REMOVED - redundant with pace tiles)
- ✅ Weekly
- ✅ Monthly
- ✅ Quarterly

### **User Actions:**
- ❌ ~~Can create own goals~~ (REMOVED)
- ❌ ~~Can edit goals~~ (REMOVED)
- ✅ Only see pace-based progress

### **Team Goals:**
- ✅ Admin sets org-wide targets (unchanged)
- ✅ All users track against same targets
- ✅ Pace tiles show daily targets automatically

---

## **Changes Required:**

### **1. Remove Daily Period**

#### **Files to Update:**
- `types/index.ts` - Remove 'daily' from GoalPeriod type
- `app/dashboard/page.tsx` - Remove daily tab and calculations
- `app/page.tsx` - Remove daily references
- `components/admin/TeamGoalsTab.tsx` - Keep daily for team goals (for pace calc)
- `lib/utils/paceCalculator.ts` - Keep daily support (for pace calc)

### **2. Remove User Goal Creation**

#### **Files to Remove/Update:**
- `components/molecules/GoalSetter.tsx` - Remove or hide
- `app/dashboard/page.tsx` - Remove "Set Goals" button
- `app/admin/goals/page.tsx` - Admin only (keep for now)

### **3. Update Dashboard UI**

#### **Before:**
```
[Daily] [Weekly] [Monthly] [Quarterly]

📊 Pace Trackers
- Phone Calls: 45 / 125 (36%)
- Emails: 20 / 50 (40%)
...

[Set Goals Button]
```

#### **After:**
```
[Weekly] [Monthly] [Quarterly]

📊 Pace Trackers
- Phone Calls: 320 / 625 (51%)
  Daily Target: 89/day (to stay on pace)
- Emails: 150 / 250 (60%)
  Daily Target: 36/day (to stay on pace)
...

(No Set Goals button)
```

---

## **Implementation Steps:**

### **Step 1: Update Types**
```typescript
// types/index.ts
export type GoalPeriod = 'weekly' | 'monthly' | 'quarterly';
// Remove 'daily'
```

### **Step 2: Update Dashboard**
```typescript
// app/dashboard/page.tsx

// Remove daily state
- const [dailyProgress, setDailyProgress] = useState<Record<GoalType, number>>({});

// Remove daily calculations
- const dayStart = startOfDay(today);
- const dayEnd = endOfDay(today);
- const dayMetrics = await metricService.getMetrics(uid, goalType, dayStart, dayEnd);
- daily[goalType] = dayMetrics.reduce((sum, m) => sum + (m.value || 0), 0);

// Update period toggle
- {(['daily','weekly','monthly'] as GoalPeriod[]).map((p) => (
+ {(['weekly','monthly','quarterly'] as GoalPeriod[]).map((p) => (

// Remove goal creation UI
- <button onClick={() => setShowGoalSetter(true)}>Set Goals</button>
```

### **Step 3: Update Pace Cards**
```typescript
// components/molecules/DailyPaceCard.tsx
// Keep as-is - it calculates daily pace from weekly/monthly/quarterly goals
// Just rename to PaceCard.tsx for clarity
```

### **Step 4: Keep Team Goals Daily**
```typescript
// components/admin/TeamGoalsTab.tsx
// KEEP daily team goals - needed for pace calculations
// Admin sets daily targets, users see them in pace tiles
```

---

## **Migration Plan:**

### **Phase 1: Remove Daily Tab (Immediate)**
1. Update GoalPeriod type
2. Remove daily from dashboard toggle
3. Remove daily progress calculations
4. Test weekly/monthly/quarterly still work

### **Phase 2: Remove Goal Creation (Immediate)**
1. Hide/remove "Set Goals" button
2. Remove GoalSetter component usage
3. Users see read-only pace tracking
4. Test dashboard loads without errors

### **Phase 3: Data Migration (Optional)**
1. Existing daily goals in Firestore → ignore or delete
2. Users without weekly/monthly goals → use team goals
3. Run migration script if needed

---

## **Testing Checklist:**

- [ ] Dashboard loads without daily tab
- [ ] Weekly tab shows correct progress
- [ ] Monthly tab shows correct progress
- [ ] Quarterly tab shows correct progress
- [ ] Pace tiles calculate daily targets correctly
- [ ] No "Set Goals" button visible
- [ ] Team goals admin page still works
- [ ] Admin can set daily team goals
- [ ] Pace calculations use team goals
- [ ] No console errors
- [ ] No TypeScript errors

---

## **Rollback Plan:**

If issues arise:
1. Revert type changes
2. Re-add daily to period toggle
3. Re-add daily calculations
4. Re-show goal creation button

Git commits should be atomic for easy revert.

---

## **Benefits:**

✅ **Simpler UX** - Users don't manage goals
✅ **Consistent targets** - Everyone tracks same team goals
✅ **Less confusion** - One source of truth (team goals)
✅ **Pace-focused** - Daily targets auto-calculated
✅ **Cleaner code** - Remove unused goal creation logic

---

## **Next Steps:**

1. Review this plan
2. Get approval
3. Create feature branch
4. Implement changes
5. Test thoroughly
6. Deploy to production
