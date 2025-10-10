# Fishbowl Sales Integration Design

## 🎯 **OBJECTIVE**
Automatically track sales from Fishbowl instead of relying on manual pipeline management (lead_progression_a/b/c).

## 📊 **CURRENT STATE**

### **Manual Pipeline (Current)**
- Sales reps manually update pipeline stages:
  - `lead_progression_a` - Fact Finding
  - `lead_progression_b` - Contact Stage  
  - `lead_progression_c` - Closing Stage
- **Problem:** Can be mismanaged, forgotten, or inaccurate
- **Source:** Manual entry by sales reps

### **Fishbowl Data (Available)**
- Collection: `fishbowl_sales_orders`
- Key Fields:
  - `totalPrice` - Revenue amount
  - `salesman` - Sales rep name
  - `salesmanId` - Sales rep ID
  - `dateIssued` - Order date
  - `dateCompleted` - Completion date
  - `status` - Order status
  - `customerId` - Customer link

---

## 🏗️ **PROPOSED SOLUTION: DUAL-SOURCE SALES TRACKING**

### **Option 1: Replace Manual with Fishbowl (Recommended)**

**Pros:**
- ✅ Single source of truth
- ✅ Automatic updates
- ✅ No manual entry required
- ✅ Accurate revenue tracking

**Cons:**
- ❌ Loses pipeline visibility (A/B/C stages)
- ❌ Only tracks closed deals, not in-progress

**Implementation:**
1. Create new metric type: `sales_revenue_fishbowl`
2. Sync Fishbowl orders daily
3. Map `salesman` → Firebase user
4. Create metrics from `totalPrice`
5. Deprecate manual pipeline tracking

---

### **Option 2: Hybrid Approach (Best of Both Worlds)**

**Keep Both Systems:**
- **Manual Pipeline (A/B/C):** Track deal progression
- **Fishbowl Sales:** Track actual closed revenue

**Pros:**
- ✅ Pipeline visibility (where deals are)
- ✅ Accurate revenue (from Fishbowl)
- ✅ Can compare pipeline vs actual
- ✅ Sales reps still manage leads

**Cons:**
- ❌ Two systems to maintain
- ❌ More complex

**Implementation:**
1. Keep existing `lead_progression_a/b/c`
2. Add new metric types:
   - `sales_revenue_wholesale` (from Fishbowl)
   - `sales_revenue_distribution` (from Fishbowl)
3. Dashboard shows BOTH:
   - Pipeline health (A/B/C stages)
   - Actual revenue (Fishbowl)

---

### **Option 3: Fishbowl-Driven Pipeline (Automated)**

**Automatically update pipeline from Fishbowl:**
- Fishbowl order status → Pipeline stage
- No manual updates needed

**Mapping:**
```
Fishbowl Status → Pipeline Stage
─────────────────────────────────
"Quote"         → lead_progression_a (Fact Finding)
"Open"          → lead_progression_b (Contact)
"Completed"     → lead_progression_c (Closing)
"Shipped"       → Closed/Won
```

**Pros:**
- ✅ Automatic pipeline updates
- ✅ Accurate revenue
- ✅ Single source of truth

**Cons:**
- ❌ Fishbowl statuses may not match sales process
- ❌ Less flexibility for sales reps

---

## 🎯 **RECOMMENDED APPROACH: OPTION 2 (HYBRID)**

### **Why Hybrid?**
1. **Sales reps still manage their pipeline** (A/B/C stages)
   - Helps them stay organized
   - Tracks deals in progress
   - Forecasting tool

2. **Fishbowl provides actual revenue**
   - No manual entry errors
   - Automatic updates
   - Source of truth for commissions

3. **Dashboard shows both**
   - "Pipeline Health" section (manual)
   - "Actual Sales" section (Fishbowl)
   - Compare forecast vs actual

---

## 🔧 **IMPLEMENTATION PLAN**

### **Phase 1: Add Fishbowl Sales Metrics**

**New Metric Types:**
```typescript
type GoalType = 
  // ... existing types
  | 'sales_revenue_wholesale'      // From Fishbowl
  | 'sales_revenue_distribution'   // From Fishbowl
  | 'sales_revenue_total';         // Combined
```

**Sync Endpoint:**
```
POST /api/sync-fishbowl-sales
- Query fishbowl_sales_orders
- Filter by date range
- Map salesman → userId
- Create metrics with source: 'fishbowl'
- Group by day (like email sync)
```

### **Phase 2: Map Fishbowl Users to Firebase Users**

**Add to users collection:**
```typescript
interface User {
  // ... existing fields
  fishbowlSalesmanId?: string;    // Link to Fishbowl
  fishbowlSalesmanName?: string;  // For display
}
```

**Mapping Logic:**
```typescript
// Option A: By email (if Fishbowl has email)
fishbowlOrder.salesman → user.email

// Option B: Manual mapping (admin tool)
settings/fishbowl_users_map: {
  byName: {
    "Joe Simmons": "user_id_123",
    "Derek Whitworth": "user_id_456"
  }
}
```

### **Phase 3: Update Dashboard**

**New Section: "Actual Sales (Fishbowl)"**
```tsx
<div className="bg-white rounded-xl shadow-sm p-5">
  <h3>💰 Actual Sales (Fishbowl)</h3>
  <div className="grid grid-cols-3 gap-4">
    <div>
      <p>Wholesale</p>
      <p className="text-2xl font-bold">
        ${wholesaleSales.toLocaleString()}
      </p>
      <p className="text-xs">From Fishbowl</p>
    </div>
    <div>
      <p>Distribution</p>
      <p className="text-2xl font-bold">
        ${distributionSales.toLocaleString()}
      </p>
      <p className="text-xs">From Fishbowl</p>
    </div>
    <div>
      <p>Total Revenue</p>
      <p className="text-2xl font-bold">
        ${totalSales.toLocaleString()}
      </p>
      <p className="text-xs">From Fishbowl</p>
    </div>
  </div>
</div>
```

**Keep Existing: "Pipeline Health"**
```tsx
<div className="bg-white rounded-xl shadow-sm p-5">
  <h3>📊 Pipeline Health (Manual)</h3>
  <div className="grid grid-cols-3 gap-4">
    <div>
      <p>Fact Finding (A)</p>
      <p className="text-2xl font-bold">{leadsA}</p>
    </div>
    <div>
      <p>Contact Stage (B)</p>
      <p className="text-2xl font-bold">{leadsB}</p>
    </div>
    <div>
      <p>Closing Stage (C)</p>
      <p className="text-2xl font-bold">{leadsC}</p>
    </div>
  </div>
</div>
```

### **Phase 4: Pace Tracking for Fishbowl Sales**

**Sales reps can set goals:**
```
Monthly Goal: $50,000 in sales
Current Progress: $32,000 (from Fishbowl)
Days Remaining: 20
Adjusted Target: $900/day

Message: "You need $900 in sales per day to hit your goal!"
```

---

## 🔍 **DATA FLOW**

### **Fishbowl → Metrics**
```
1. Cron job runs daily (2am)
2. Query fishbowl_sales_orders
   - WHERE dateIssued >= startDate
   - WHERE dateIssued <= endDate
3. Group by salesman + day
4. Map salesman → userId
5. Create metrics:
   - type: 'sales_revenue_wholesale' or 'sales_revenue_distribution'
   - value: totalPrice
   - date: dateIssued (normalized to midnight)
   - source: 'fishbowl'
6. Use deterministic doc IDs (no duplicates)
```

### **Determining Wholesale vs Distribution**
```typescript
// Option A: By customer type (if available in Fishbowl)
if (order.customerType === 'wholesale') {
  type = 'sales_revenue_wholesale';
} else {
  type = 'sales_revenue_distribution';
}

// Option B: By custom field
if (order.customFields?.salesType === 'wholesale') {
  type = 'sales_revenue_wholesale';
}

// Option C: By customer name pattern
if (order.customerName.includes('Wholesale')) {
  type = 'sales_revenue_wholesale';
}

// Option D: Manual mapping in settings
const wholesaleCustomers = settings.wholesaleCustomerIds;
if (wholesaleCustomers.includes(order.customerId)) {
  type = 'sales_revenue_wholesale';
}
```

---

## 🚀 **MIGRATION STRATEGY**

### **Step 1: Add Fishbowl Sales (No Breaking Changes)**
- Add new metric types
- Create sync endpoint
- Add to dashboard (new section)
- Sales reps see both systems

### **Step 2: Test & Validate (1-2 weeks)**
- Compare Fishbowl data vs manual entries
- Verify salesman mapping is correct
- Ensure no duplicates
- Get sales rep feedback

### **Step 3: Decide on Pipeline**
- **Option A:** Keep both (recommended)
- **Option B:** Deprecate manual pipeline
- **Option C:** Make pipeline optional

---

## 📋 **ADMIN TOOLS NEEDED**

### **1. Fishbowl User Mapping Tool**
```
Admin → Tools → Map Fishbowl Users
- Show all Fishbowl salesman names
- Dropdown to select Firebase user
- Save mapping to settings
```

### **2. Fishbowl Sync Tool**
```
Admin → Tools → Sync Fishbowl Sales
- Date range picker
- Select users (or all)
- Run sync
- Show results
```

### **3. Sales Diagnostic Tool**
```
Admin → Tools → Diagnose Sales
- Select user
- Show Fishbowl orders
- Show created metrics
- Compare totals
```

---

## 🎯 **NEXT STEPS**

1. **Confirm approach** with team (Hybrid recommended)
2. **Map Fishbowl users** to Firebase users
3. **Determine wholesale vs distribution** logic
4. **Implement sync endpoint**
5. **Add to dashboard**
6. **Test with real data**
7. **Train sales reps**

---

## ❓ **QUESTIONS TO ANSWER**

1. **How to distinguish wholesale vs distribution?**
   - Customer type field?
   - Custom field?
   - Manual mapping?

2. **Which Fishbowl status = closed sale?**
   - "Completed"?
   - "Shipped"?
   - Both?

3. **Should we deprecate manual pipeline?**
   - Keep both?
   - Phase out manual?
   - Make optional?

4. **How to handle returns/refunds?**
   - Negative metrics?
   - Separate metric type?
   - Ignore?

5. **Date to use for metrics?**
   - `dateIssued`?
   - `dateCompleted`?
   - `dateFirstShip`?
