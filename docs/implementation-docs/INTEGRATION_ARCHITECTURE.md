# Integration Architecture - Complete Data Flow

## 🎯 **THE MASTER PLAN**

**Goal:** All external data flows through Copper CRM, Goals App reads from Copper consistently.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COMPLETE DATA ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────┘

EXTERNAL SOURCES          COPPER CRM                    GOALS APP
════════════════          ══════════                    ═════════

┌──────────────┐         ┌─────────────────┐          ┌──────────────┐
│  Fishbowl    │         │  CUSTOM FIELDS  │          │  Dashboard   │
│  ERP         │────────>│  (Account Mgmt) │─────────>│  (Metrics)   │
│              │         │                 │          │              │
│ • Orders     │  Map    │ • Total Orders  │  Read    │ • Sales $    │
│ • Customers  │  ────>  │ • Total Spent   │  ────>   │ • Rankings   │
│ • Products   │         │ • Last Order    │          │ • Progress   │
└──────────────┘         │ • Avg Order $   │          └──────────────┘
                         └─────────────────┘
┌──────────────┐         ┌─────────────────┐          ┌──────────────┐
│ ShipStation  │         │  CUSTOM FIELDS  │          │  Team Page   │
│              │────────>│  (Fulfillment)  │─────────>│  (Activity)  │
│ • Shipments  │  Map    │                 │  Read    │              │
│ • Tracking   │  ────>  │ • Ship Date     │  ────>   │ • Calls      │
│ • Status     │         │ • Tracking #    │          │ • Emails     │
└──────────────┘         │ • Carrier       │          └──────────────┘
                         └─────────────────┘
┌──────────────┐         ┌─────────────────┐          ┌──────────────┐
│  JustCall    │         │  ACTIVITIES     │          │  User Page   │
│              │────────>│  (Native)       │─────────>│  (Goals)     │
│ • Calls      │  Create │                 │  Read    │              │
│ • Duration   │  ────>  │ • Phone Call    │  ────>   │ • Personal   │
│ • Recording  │         │ • Meeting       │          │ • Targets    │
└──────────────┘         └─────────────────┘          └──────────────┘

┌──────────────┐         ┌─────────────────┐
│  Copper      │         │  OPPORTUNITIES  │
│  Direct      │────────>│  (Native)       │
│              │  Native │                 │
│ • Emails     │  ────>  │ • Pipeline      │
│ • Opps       │         │ • Stages        │
│ • Contacts   │         │ • Values        │
└──────────────┘         └─────────────────┘

                    ALL DATA FLOWS THROUGH COPPER
                    ═══════════════════════════════
```

---

## 📊 **COPPER FIELD MAPPING STRATEGY**

### **1. Fishbowl → Copper Mapping**

#### **Company/Account Fields:**
```typescript
Fishbowl Field              →  Copper Field (Custom)
══════════════                 ═══════════════════════
Customer ID                 →  Account Order ID (698467)
Total Orders                →  Total Orders (698403)
Total Revenue               →  Total Spent (698404)
First Order Date            →  First Order Date (698405)
Last Order Date             →  Last Order Date (698406)
Average Order Value         →  Average Order Value (698407)
```

#### **Opportunity/Order Fields:**
```typescript
Fishbowl Field              →  Copper Field (Custom)
══════════════                 ═══════════════════════
SO Number                   →  SO Number (698395)
Order Date                  →  Date Issued (698396)
Order Status                →  Order Status (698397)
Order Total                 →  Order Total (698441)
Subtotal                    →  Subtotal (698438)
Tax Amount                  →  Tax Amount (698439)
Shipping Amount             →  Shipping Amount (698427)
```

#### **Product/SKU Fields:**
```typescript
Fishbowl Field              →  Copper Field (Custom)
══════════════                 ═══════════════════════
Focus+Flow Singles          →  Focus+Flow Single Bottles (698411)
Focus+Flow 12PK             →  Focus+Flow 12PM (698412)
Mango Extract Singles       →  Mango Extract Single (698420)
Mango Extract 12PK          →  Mango Extract 12PK (698421)
```

### **2. ShipStation → Copper Mapping**

#### **Shipment Fields:**
```typescript
ShipStation Field           →  Copper Field (Custom)
═════════════                  ═══════════════════════
Order Number                →  ShipStation Order # (706512)
Carrier                     →  Carrier (706513)
Service                     →  Service (706514)
Tracking Number             →  Tracking # (706515)
Ship Date                   →  Ship Date (698436)
Delivery Date               →  Delivery Date (706517)
Shipping Status             →  Shipping Status (706518)
```

#### **Company Aggregates:**
```typescript
ShipStation Aggregate       →  Copper Field (Custom)
═════════════════              ═══════════════════════
Lifetime Shipments          →  Lifetime Shipments (Company) (706521)
Lifetime Shipping Cost      →  Lifetime Shipping Spend (Company) (706522)
Last Shipped Date           →  Last Shipped Date (706523)
```

### **3. JustCall → Copper Mapping**

#### **Activity Fields:**
```typescript
JustCall Field              →  Copper Field (Native)
══════════════                 ═══════════════════════
Call Duration               →  Activity (Phone Call)
Call Date                   →  activity_date
Call Recording              →  Activity Notes
Caller ID                   →  Related Contact
```

---

## 🔄 **SYNC FLOW ARCHITECTURE**

### **Phase 1: Inbound Sync (External → Copper)**

```typescript
// lib/fishbowl/sync.ts
export async function syncFishbowlToCopper(orders: FishbowlOrder[]) {
  for (const order of orders) {
    // 1. Find or create Copper company by Account Order ID
    const company = await findOrCreateCompany(order.customerId);
    
    // 2. Update company custom fields
    await updateCompanyFields(company.id, {
      [CUSTOM_FIELD_IDS.TOTAL_ORDERS]: company.totalOrders + 1,
      [CUSTOM_FIELD_IDS.TOTAL_SPENT]: company.totalSpent + order.total,
      [CUSTOM_FIELD_IDS.LAST_ORDER_DATE]: order.date,
      [CUSTOM_FIELD_IDS.AVERAGE_ORDER_VALUE]: calculateAverage(company),
    });
    
    // 3. Create or update opportunity for this order
    const opp = await findOrCreateOpportunity(order.soNumber);
    await updateOpportunityFields(opp.id, {
      [CUSTOM_FIELD_IDS.SO_NUMBER]: order.soNumber,
      [CUSTOM_FIELD_IDS.ORDER_TOTAL]: order.total,
      [CUSTOM_FIELD_IDS.ORDER_STATUS]: mapFishbowlStatus(order.status),
      [CUSTOM_FIELD_IDS.SALE_TYPE]: determineSaleType(order),
    });
  }
}
```

### **Phase 2: Outbound Sync (Copper → Goals App)**

```typescript
// app/api/sync-metrics/route.ts (ALREADY DONE!)
export async function syncCopperToGoals(userId: string) {
  // 1. Read from Copper using field-mappings helpers
  const opps = await fetchOpportunities(userId);
  
  for (const opp of opps) {
    const value = getOpportunityValue(opp);  // ✅ Using helper
    const stageId = getOpportunityStageId(opp);  // ✅ Using helper
    const saleType = getSaleType(opp);  // ✅ Using helper
    
    // 2. Write to Firebase metrics
    await logMetric({
      userId,
      type: 'new_sales_wholesale',
      value: saleType === 'wholesale' ? value : 0,
    });
  }
}
```

---

## 🏗️ **IMPLEMENTATION PHASES**

### **Phase 1: Complete Copper Refactor** ✅ DONE
- [x] Create field-mappings.ts
- [x] Refactor sync-metrics endpoint
- [x] Fix validate-pipeline endpoint
- [x] Test with real data

### **Phase 2: Fishbowl Integration** 🔄 NEXT
```typescript
// lib/fishbowl/field-mappings.ts
export const FISHBOWL_TO_COPPER_MAP = {
  // Company fields
  company: {
    customerId: CUSTOM_FIELD_IDS.ACCOUNT_ORDER_ID,
    totalOrders: CUSTOM_FIELD_IDS.TOTAL_ORDERS,
    totalSpent: CUSTOM_FIELD_IDS.TOTAL_SPENT,
    // ... etc
  },
  
  // Order fields
  order: {
    soNumber: CUSTOM_FIELD_IDS.SO_NUMBER,
    orderTotal: CUSTOM_FIELD_IDS.ORDER_TOTAL,
    orderStatus: CUSTOM_FIELD_IDS.ORDER_STATUS,
    // ... etc
  },
};

export function mapFishbowlOrderToCopper(order: FishbowlOrder): CopperOpportunityUpdate {
  return {
    custom_fields: [
      { custom_field_definition_id: FISHBOWL_TO_COPPER_MAP.order.soNumber, value: order.soNum },
      { custom_field_definition_id: FISHBOWL_TO_COPPER_MAP.order.orderTotal, value: order.total },
      // ... etc
    ],
  };
}
```

### **Phase 3: ShipStation Integration** 🔄 FUTURE
```typescript
// lib/shipstation/field-mappings.ts
export const SHIPSTATION_TO_COPPER_MAP = {
  shipment: {
    orderNumber: CUSTOM_FIELD_IDS.SHIPSTATION_ORDER_NUM,
    trackingNumber: CUSTOM_FIELD_IDS.TRACKING_NUM,
    carrier: CUSTOM_FIELD_IDS.CARRIER,
    // ... etc
  },
};
```

### **Phase 4: Dashboard Enhancement** 🔄 FUTURE
- Dashboard already reads from Firebase metrics ✅
- Metrics are populated by sync-metrics endpoint ✅
- No changes needed! Just ensure sync runs regularly

---

## 🔐 **DATA CONSISTENCY RULES**

### **Rule 1: Copper is the Source of Truth**
- All external data must be synced TO Copper first
- Goals App ONLY reads FROM Copper (via Firebase metrics)
- Never bypass Copper to write directly to Goals App

### **Rule 2: Use Field Mappings Everywhere**
```typescript
// ❌ BAD - Hardcoded field access
const value = opp.monetary_value || opp.value || 0;

// ✅ GOOD - Use helper function
import { getOpportunityValue } from '@/lib/copper/field-mappings';
const value = getOpportunityValue(opp);
```

### **Rule 3: Map External IDs to Copper Custom Fields**
```typescript
// Fishbowl Customer ID → Copper Account Order ID
// ShipStation Order # → Copper ShipStation Order #
// This enables bidirectional sync and prevents duplicates
```

### **Rule 4: Aggregate at Copper Level**
```typescript
// Calculate aggregates when syncing TO Copper:
// - Total Orders (count of SOs)
// - Total Spent (sum of order totals)
// - Average Order Value (total / count)
// - Days Since Last Order (today - last order date)

// Goals App just reads these pre-calculated values
```

---

## 📋 **INTEGRATION CHECKLIST**

### **For Each New Integration:**
- [ ] Create `lib/[source]/field-mappings.ts`
- [ ] Map source fields to Copper custom fields
- [ ] Create sync endpoint `/api/[source]/sync`
- [ ] Implement bidirectional ID mapping
- [ ] Calculate aggregates during sync
- [ ] Test with real data
- [ ] Update Goals App sync to read new fields
- [ ] Document field mappings

---

## 🎯 **SUCCESS CRITERIA**

### **How We Know It's Working:**
1. ✅ All external data visible in Copper CRM
2. ✅ Goals App dashboard matches Copper data exactly
3. ✅ No hardcoded field names in business logic
4. ✅ New integrations follow same pattern
5. ✅ Bidirectional sync works (Copper ↔ External)
6. ✅ No duplicate records
7. ✅ Aggregates calculated correctly

---

## 🚀 **IMMEDIATE NEXT STEPS**

1. **Commit validate-pipeline fix** ✅
2. **Design Fishbowl sync flow**
3. **Create Fishbowl field mappings**
4. **Implement Fishbowl → Copper sync**
5. **Test with real Fishbowl data**
6. **Update Goals App to show Fishbowl metrics**

---

**This architecture ensures ALL data flows consistently through Copper!** 🎉
