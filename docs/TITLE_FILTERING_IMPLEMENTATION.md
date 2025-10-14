# Title-Based Filtering Implementation

**Date**: October 14, 2025  
**Purpose**: Exclude executives from sales dashboards while keeping them in the users collection

---

## 🎯 **Problem Solved**

**Kevin** (`kevin@cwlbrands.com`) is a Vice President who:
- ✅ Needs access to the **commissions app** (requires user record)
- ❌ Should NOT appear on **sales dashboards** (not a sales rep)
- ❌ Should NOT be counted in **team metrics** (executive)

**Solution**: Add `title` field to filter users by job title, not role.

---

## 📊 **User Title System**

### **Title Types:**

```typescript
export type UserTitle = 
  | 'Sales Representative'  // ✅ Included in sales tracking
  | 'Sales Manager'          // ✅ Included in sales tracking
  | 'Director'               // ❌ Excluded from sales tracking
  | 'Vice President'         // ❌ Excluded from sales tracking
  | 'Executive';             // ❌ Excluded from sales tracking
```

### **Filtering Logic:**

```typescript
// Sales titles (shown on dashboards)
const SALES_TITLES = ['Sales Representative', 'Sales Manager'];

// Executive titles (excluded from dashboards)
const EXECUTIVE_TITLES = ['Director', 'Vice President', 'Executive'];

// Check if user should be included
function isSalesUser(user: User): boolean {
  if (!user.title) return true; // Backward compatibility
  return SALES_TITLES.includes(user.title);
}
```

---

## 🔧 **Implementation Details**

### **1. Updated User Interface**

```typescript
// types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'sales' | 'manager' | 'admin';  // For permissions
  title?: UserTitle;                     // For filtering/display
  // ... other fields
}
```

**Key Point**: `role` controls permissions, `title` controls dashboard visibility.

### **2. Created Filter Utilities**

```typescript
// lib/utils/userFilters.ts
export function isSalesUser(user: User): boolean
export function isExecutive(user: User): boolean
export function filterSalesUsers(users: User[]): User[]
```

### **3. Updated Team API Endpoints**

#### **team-leaderboard**
```typescript
// Fetch all users
const allUsers = usersSnapshot.docs.map(doc => ({
  id: doc.id,
  title: data.title,
  role: data.role,
  // ...
}));

// Filter to sales users only
const users = allUsers.filter(isSalesUser);
```

#### **team-metrics**
```typescript
// Get sales user IDs
const salesUserIds = allUsers.filter(isSalesUser).map(u => u.id);

// Only aggregate metrics from sales users
snap.docs.forEach((d) => {
  const userId = d.data().userId;
  if (!salesUserIds.includes(userId)) return; // Skip executives
  // ... aggregate
});
```

#### **team-trends**
```typescript
// Same filtering as team-metrics
const salesUserIds = allUsers.filter(isSalesUser).map(u => u.id);

// Only include sales user metrics in trends
snap.docs.forEach((d) => {
  const userId = d.data().userId;
  if (!salesUserIds.includes(userId)) return;
  // ... bucket by day
});
```

---

## 🚀 **Deployment Steps**

### **Step 1: Deploy Code**
```bash
npm run build
firebase deploy
```

### **Step 2: Update Kevin's User Record**

**Option A: Run Script**
```bash
node scripts/update-kevin-title.js
```

**Option B: Manual Update (Firebase Console)**
1. Go to Firestore Database
2. Find `users` collection
3. Find kevin@cwlbrands.com document
4. Update fields:
   - `title`: `"Vice President"`
   - `role`: `"admin"`
   - `updatedAt`: (current timestamp)

**Option C: Admin UI**
1. Login as admin
2. Go to Admin → Users
3. Edit Kevin's profile
4. Set Title: Vice President
5. Set Role: admin
6. Save

### **Step 3: Verify**

**Check Team Dashboard:**
```
Visit: /team-dashboard
Expected: Kevin should NOT appear in leaderboard
```

**Check Team Metrics:**
```
Visit: /api/public/team-metrics?period=weekly
Expected: Kevin's metrics NOT included in totals
```

**Check Kevin's Access:**
```
Login as kevin@cwlbrands.com
Expected: Can access commissions app
Expected: Can access admin features
```

---

## 📋 **User Configuration Guide**

### **Sales Representatives**
```
Role: sales
Title: Sales Representative
Result: ✅ Appears on dashboards, metrics counted
```

### **Sales Managers**
```
Role: manager
Title: Sales Manager
Result: ✅ Appears on dashboards, metrics counted
Note: Future org chart will show their team aggregate
```

### **Directors**
```
Role: manager or admin
Title: Director
Result: ❌ Excluded from sales dashboards
```

### **Vice Presidents**
```
Role: admin
Title: Vice President
Result: ❌ Excluded from sales dashboards
Example: Kevin
```

### **Executives (C-Level)**
```
Role: admin
Title: Executive
Result: ❌ Excluded from sales dashboards
```

---

## 🔄 **Backward Compatibility**

**Users without a title:**
- Default behavior: **Included** in sales tracking
- This ensures existing users continue to work
- Gradually add titles as needed

**Migration:**
```javascript
// Optional: Add default titles to existing users
const users = await db.collection('users').get();
for (const doc of users.docs) {
  const data = doc.data();
  if (!data.title) {
    // Set default based on role
    let title = 'Sales Representative';
    if (data.role === 'manager') title = 'Sales Manager';
    if (data.role === 'admin') title = 'Executive';
    
    await doc.ref.update({ title });
  }
}
```

---

## 🧪 **Testing**

### **Test 1: Kevin Excluded**
```javascript
// In browser console
const response = await fetch('/api/public/team-leaderboard?period=weekly');
const data = await response.json();
const kevinInList = data.leaderboard.some(m => m.userEmail === 'kevin@cwlbrands.com');
console.log('Kevin in leaderboard:', kevinInList); // Should be false
```

### **Test 2: Sales Users Included**
```javascript
const response = await fetch('/api/public/team-leaderboard?period=weekly');
const data = await response.json();
console.log('Team members:', data.leaderboard.length);
// Should only show sales reps and managers
```

### **Test 3: Metrics Aggregation**
```javascript
const response = await fetch('/api/public/team-metrics?period=weekly');
const data = await response.json();
console.log('Team totals:', data.totals);
// Should NOT include Kevin's metrics
```

---

## 📝 **Future Enhancements**

### **1. Org Chart Integration**
- Use titles for hierarchy display
- Show manager's team aggregates
- Link to commissions app org chart

### **2. Title-Based Permissions**
```typescript
// Example: Only VPs can see executive dashboard
if (user.title === 'Vice President' || user.title === 'Executive') {
  // Show executive dashboard
}
```

### **3. Custom Dashboards by Title**
- Sales Reps: Individual goals
- Managers: Team performance
- Directors: Multi-team overview
- VPs: Company-wide metrics

---

## ⚠️ **Important Notes**

1. **Role vs Title**:
   - `role`: Controls **permissions** (what they can do)
   - `title`: Controls **visibility** (what dashboards show)

2. **Kevin's Configuration**:
   - `role: 'admin'` → Full access to all features
   - `title: 'Vice President'` → Excluded from sales tracking

3. **Don't Delete Users**:
   - Keep all users in the users collection
   - Use title filtering instead of deletion
   - Maintains data integrity across apps

4. **Backward Compatibility**:
   - Users without title are included by default
   - Add titles gradually as needed
   - No breaking changes to existing users

---

## 📚 **Related Files**

- `types/index.ts` - User and UserTitle types
- `lib/utils/userFilters.ts` - Filtering utilities
- `app/api/public/team-leaderboard/route.ts` - Leaderboard filtering
- `app/api/public/team-metrics/route.ts` - Metrics aggregation
- `app/api/public/team-trends/route.ts` - Trends filtering
- `scripts/update-kevin-title.js` - Update script

---

## ✅ **Summary**

**What Changed:**
- ✅ Added `title` field to User type
- ✅ Created filtering utilities
- ✅ Updated team dashboards to filter by title
- ✅ Kevin excluded from sales tracking
- ✅ Kevin retains admin access

**What Didn't Change:**
- ✅ User collection structure (just added optional field)
- ✅ Individual user dashboards (users see their own data)
- ✅ Admin features (Kevin still has full access)
- ✅ Commissions app (Kevin can still use it)

**Result:**
🎉 **Kevin appears nowhere on sales dashboards but retains full admin access!**
