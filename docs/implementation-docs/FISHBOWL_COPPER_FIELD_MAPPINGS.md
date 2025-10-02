# Fishbowl → Copper Field Mappings

## 🎯 **OBJECTIVE**

Map Fishbowl ERP data to existing Copper CRM custom fields for automatic data synchronization.

**Key Principle:** Fishbowl data automatically populates existing Copper records using custom field IDs.

---

## 📋 **COPPER OBJECT TYPES**

Copper uses these object types for custom fields:
- **👤 Contacts** - Individual people
- **🏢 Accounts** - Companies/Organizations
- **🔍 Prospects** - Potential customers (leads)
- **💰 Pipeline Records** - Opportunities/Deals
- **✅ Tasks** - To-dos and activities

---

## 🏢 **FISHBOWL CUSTOMERS → COPPER ACCOUNTS**

### **Existing Copper Account Custom Fields:**

| Fishbowl Field | Copper Field Name | Copper Field ID | Object Type | Status |
|---|---|---|---|---|
| `id` | Account Order ID | 698467 | Account | ✅ EXISTS |
| `name` | Name | (native) | Account | ✅ NATIVE |
| `billToAddress` | Address | (native) | Account | ✅ NATIVE |
| `billToCity` | City | (native) | Account | ✅ NATIVE |
| `billToStateID` | State | (native) | Account | ✅ NATIVE |
| `billToZip` | Postal Code | (native) | Account | ✅ NATIVE |
| `email` | Email | (native) | Account | ✅ NATIVE |
| `phone` | Phone | (native) | Account | ✅ NATIVE |
| `accountId` | Account Number | 698260 | Account | ✅ EXISTS |
| (calculated) | Total Orders | 698403 | Account | ✅ EXISTS |
| (calculated) | Total Spent | 698404 | Account | ✅ EXISTS |
| (calculated) | First Order Date | 698405 | Account | ✅ EXISTS |
| (calculated) | Last Order Date | 698406 | Account | ✅ EXISTS |
| (calculated) | Average Order Value | 698407 | Account | ✅ EXISTS |

### **New Fields Needed for Accounts:**

| Fishbowl Field | Suggested Copper Field | Data Type | Priority |
|---|---|---|---|
| `activeFlag` | Active Customer | Checkbox | HIGH |
| `creditLimit` | Credit Limit | Currency | MEDIUM |
| `dateCreated` | Customer Since | Date | MEDIUM |
| `dateLastModified` | Last Modified Date | Date | LOW |
| `customerContact` | Primary Contact Name | String | MEDIUM |
| `carrierServiceId` | Preferred Carrier | Dropdown | LOW |
| `customFields` | (parse JSON) | Multiple | LOW |

---

## 💰 **FISHBOWL SALES ORDERS → COPPER PIPELINE RECORDS**

### **Existing Copper Pipeline Record Custom Fields:**

| Fishbowl Field | Copper Field Name | Copper Field ID | Object Type | Status |
|---|---|---|---|---|
| `num` | SO Number | 698395 | Pipeline Record | ✅ EXISTS |
| `status` | Order Status | 698397 | Pipeline Record | ✅ EXISTS |
| `totalPrice` | Order Total | 698441 | Pipeline Record | ✅ EXISTS |
| `subtotal` | Subtotal | 698438 | Pipeline Record | ✅ EXISTS |
| `totalTax` | Tax Amount | 698439 | Pipeline Record | ✅ EXISTS |
| `totalIncludesTax` | Tax Included | (new) | Pipeline Record | ❌ NEW |
| `cost` | Cost | (new) | Pipeline Record | ❌ NEW |
| `dateIssued` | Date Issued | 698396 | Pipeline Record | ✅ EXISTS |
| `dateCompleted` | Date Completed | (new) | Pipeline Record | ❌ NEW |
| `dateCreated` | Date Created | (new) | Pipeline Record | ❌ NEW |
| `dateLastModified` | Last Modified | (new) | Pipeline Record | ❌ NEW |
| `salesman` | Salesman | (new) | Pipeline Record | ❌ NEW |
| `salesmanId` | Salesman ID | (new) | Pipeline Record | ❌ NEW |
| `customerPO` | Customer PO | (new) | Pipeline Record | ❌ NEW |
| `locationGroupId` | Location | (new) | Pipeline Record | ❌ NEW |
| `priorityId` | Priority | (new) | Pipeline Record | ❌ NEW |
| `qbClassId` | QB Class | (new) | Pipeline Record | ❌ NEW |
| `shipToName` | Ship To Name | (new) | Pipeline Record | ❌ NEW |
| `shipToAddress` | Ship To Address | (new) | Pipeline Record | ❌ NEW |
| `shipToCity` | Ship To City | (new) | Pipeline Record | ❌ NEW |
| `shipToStateID` | Ship To State | (new) | Pipeline Record | ❌ NEW |
| `shipToZip` | Ship To Zip | (new) | Pipeline Record | ❌ NEW |
| `shipToResidential` | Residential Delivery | (new) | Pipeline Record | ❌ NEW |
| `carrierServiceId` | Shipping Method | (new) | Pipeline Record | ❌ NEW |
| `taxRate` | Tax Rate | (new) | Pipeline Record | ❌ NEW |
| `taxRateName` | Tax Rate Name | (new) | Pipeline Record | ❌ NEW |
| `paymentTermsId` | Payment Terms | (new) | Pipeline Record | ❌ NEW |
| `fobPointId` | FOB Point | (new) | Pipeline Record | ❌ NEW |
| `note` | Order Notes | (new) | Pipeline Record | ❌ NEW |
| `customFields` | (parse JSON) | Multiple | ❌ NEW |

### **Shipping Amount:**

| Fishbowl Field | Copper Field Name | Copper Field ID | Object Type | Status |
|---|---|---|---|---|
| (calculated from items) | Shipping Amount | 698427 | Pipeline Record | ✅ EXISTS |

---

## 🔗 **OBJECT RELATIONSHIPS**

### **How Data Links Together:**

```
Fishbowl Customer (id: 123)
    ↓
Copper Account (custom_field: Account Order ID = 123)
    ↓ (company_id)
Copper Pipeline Record (linked to account)
    ↓ (custom_field: SO Number = "SO-456")
Fishbowl Sales Order (num: "SO-456")
```

### **Sync Logic:**

```typescript
// 1. Find or create Copper Account by Fishbowl Customer ID
const account = await findAccountByCustomField(
  CUSTOM_FIELD_IDS.ACCOUNT_ORDER_ID,
  fishbowlCustomer.id
);

if (!account) {
  // Create new account
  account = await createAccount({
    name: fishbowlCustomer.name,
    address: {
      street: fishbowlCustomer.billToAddress,
      city: fishbowlCustomer.billToCity,
      state: fishbowlCustomer.billToStateID,
      postal_code: fishbowlCustomer.billToZip,
    },
    custom_fields: [
      {
        custom_field_definition_id: CUSTOM_FIELD_IDS.ACCOUNT_ORDER_ID,
        value: fishbowlCustomer.id
      },
      {
        custom_field_definition_id: CUSTOM_FIELD_IDS.ACCOUNT_NUMBER,
        value: fishbowlCustomer.accountId
      }
    ]
  });
}

// 2. Find or create Copper Opportunity by Fishbowl SO Number
  CUSTOM_FIELD_IDS.SO_NUMBER,
  fishbowlSO.num
);

if (!opportunity) {
  // 2. Sales Order → Pipeline Record (linked to Account)
  const pipelineRecord = await createOrUpdatePipelineRecord({
    name: `SO ${fishbowlSO.num}`,
    company_id: account.id,  // Link to account!
    // Custom fields (Pipeline Record object)
    custom_fields: [
      { custom_field_definition_id: 698395, value: fishbowlSO.num },
      { custom_field_definition_id: 698441, value: fishbowlSO.totalPrice },
      { custom_field_definition_id: 698438, value: fishbowlSO.subtotal },
      { custom_field_definition_id: 698439, value: fishbowlSO.totalTax }
    ]
  });

---

## 📊 **CALCULATED FIELDS**

Some Copper fields are calculated from Fishbowl data:

### **Company Aggregates:**
```typescript
// Calculate from all customer's sales orders
const orders = await getFishbowlOrdersByCustomerId(customerId);

const aggregates = {
  totalOrders: orders.length,
  totalSpent: orders.reduce((sum, o) => sum + o.totalPrice, 0),
  firstOrderDate: Math.min(...orders.map(o => o.dateIssued)),
  lastOrderDate: Math.max(...orders.map(o => o.dateIssued)),
  averageOrderValue: totalSpent / totalOrders,
};

// Update Copper company
await updateCompanyCustomFields(company.id, [
  { custom_field_definition_id: CUSTOM_FIELD_IDS.TOTAL_ORDERS, value: aggregates.totalOrders },
  { custom_field_definition_id: CUSTOM_FIELD_IDS.TOTAL_SPENT, value: aggregates.totalSpent },
  { custom_field_definition_id: CUSTOM_FIELD_IDS.FIRST_ORDER_DATE, value: aggregates.firstOrderDate },
  { custom_field_definition_id: CUSTOM_FIELD_IDS.LAST_ORDER_DATE, value: aggregates.lastOrderDate },
  { custom_field_definition_id: CUSTOM_FIELD_IDS.AVERAGE_ORDER_VALUE, value: aggregates.averageOrderValue },
]);
```

---

## 🔍 **SPECIAL HANDLING**

### **1. Fishbowl customFields (JSON String):**

Fishbowl stores custom fields as JSON:
```json
{
  "1": {"name": "Shopify Order Identity 1", "type": "Long Text", "value": ""},
  "18": {"name": "Reseller Permit Number", "type": "Text"},
  "19": {"name": "Reseller Permit State", "type": "Text"},
  "21": {"name": "Payment Pending", "type": "Checkbox", "value": "false"}
}
```

**Strategy:**
- Parse JSON
- Map important fields to dedicated Copper custom fields
- Store full JSON in a "Fishbowl Custom Data" text field for reference

### **2. Status Mapping:**

Fishbowl order statuses need to map to Copper pipeline stages:

```typescript
const STATUS_TO_STAGE = {
  'Issued': 'Opportunity',
  'In Progress': 'Contact Stage',
  'Fulfilled': 'Closing Stage',
  'Closed': 'Payment Received',
  'Voided': 'Lost',
};
```

### **3. Sale Type Detection:**

Determine sale type from Fishbowl data:
```typescript
function determineSaleType(fishbowlSO) {
  // Check customer type, order attributes, etc.
  if (fishbowlSO.customerType === 'Wholesale') return 'wholesale';
  if (fishbowlSO.customerType === 'Distributor') return 'distribution';
  return 'direct-to-consumer';
}
```

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Phase 1: Create Missing Copper Fields**
- [ ] Create 7 new Company custom fields
- [ ] Create 25+ new Opportunity custom fields
- [ ] Document new field IDs
- [ ] Update `lib/copper/field-mappings.ts`

### **Phase 2: Build Sync Logic**
- [ ] Create `lib/fishbowl/client.ts` (Fishbowl API client)
- [ ] Create `lib/fishbowl/field-mappings.ts` (field mapping logic)
- [ ] Create `app/api/fishbowl/sync/route.ts` (sync endpoint)
- [ ] Implement customer → company sync
- [ ] Implement sales order → opportunity sync
- [ ] Calculate aggregate fields

### **Phase 3: Test & Validate**
- [ ] Test with sample Fishbowl data
- [ ] Verify company linking works
- [ ] Verify opportunity linking works
- [ ] Verify aggregates calculate correctly
- [ ] Test duplicate prevention

### **Phase 4: Production**
- [ ] Schedule automated syncs
- [ ] Add error handling & logging
- [ ] Monitor sync performance
- [ ] Document for team

---

## 🎯 **SUCCESS CRITERIA**

1. ✅ Fishbowl customers automatically create/update Copper companies
2. ✅ Fishbowl sales orders automatically create/update Copper opportunities
3. ✅ Opportunities correctly link to companies
4. ✅ No duplicate records created
5. ✅ Aggregate fields calculate correctly
6. ✅ Goals app dashboard shows Fishbowl data

---

**This mapping ensures ALL Fishbowl data flows into existing Copper structure!** 🎉
