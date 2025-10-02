# Fishbowl Schema Analysis Script

## 🎯 **Purpose**

This script analyzes Fishbowl Excel exports and:
1. **Extracts all field names** from Customers and Sales Orders
2. **Detects data types** (string, integer, float, date, currency, boolean)
3. **Stores schemas in Firebase** for reference
4. **Auto-suggests Copper field mappings** based on name/type similarity
5. **Creates mapping documents** for integration development

---

## 📋 **Prerequisites**

```bash
# Install required packages
npm install xlsx firebase-admin

# Make sure your .env.local has Firebase credentials:
# FIREBASE_PROJECT_ID=...
# FIREBASE_CLIENT_EMAIL=...
# FIREBASE_PRIVATE_KEY=...
```

---

## 🚀 **Usage**

```bash
# Run the analyzer
node scripts/analyze-fishbowl-schema.js
```

---

## 📊 **What It Does**

### **Step 1: Analyze Fishbowl Files**
```
Reading: docs/FishBowl_Customers.xlsx
Reading: docs/Fishbowl_SalesOrders.xlsx

Extracting:
- Column headers (field names)
- Data types (by sampling first 100 rows)
- Null/empty value detection
- Unique value counts
- Sample values
```

### **Step 2: Store in Firebase**
```
Collection: integration_schemas
Documents:
  - fishbowl_customers
  - fishbowl_sales_orders

Structure:
{
  sourceName: "Fishbowl Customers",
  fileName: "FishBowl_Customers.xlsx",
  analyzedAt: "2025-10-01T...",
  totalRows: 1234,
  fields: [
    {
      name: "Customer ID",
      dataType: "integer",
      hasNulls: false,
      uniqueValues: 1234,
      sampleValues: [1, 2, 3, 4, 5]
    },
    // ... more fields
  ]
}
```

### **Step 3: Auto-Map to Copper**
```
Collection: integration_mappings
Documents:
  - fishbowl_customers_to_copper
  - fishbowl_sales_orders_to_copper

Structure:
{
  sourceName: "Fishbowl Customers",
  targetName: "Copper CRM",
  mappings: [
    {
      fishbowlField: "Customer ID",
      fishbowlType: "integer",
      copperFieldId: 698467,
      copperFieldName: "Account Order ID",
      copperFieldType: "String",
      confidence: 80
    },
    {
      fishbowlField: "Total Orders",
      fishbowlType: "integer",
      copperFieldId: 698403,
      copperFieldName: "Total Orders",
      copperFieldType: "Float",
      confidence: 100
    },
    // ... more mappings
  ]
}
```

---

## 🔍 **Expected Output**

```
🚀 Fishbowl Schema Analyzer

📊 Analyzing Fishbowl Customers...
✅ Found 25 fields
✅ 1234 rows of data

💾 Storing Fishbowl Customers schema in Firebase...
✅ Schema stored successfully

📋 Customer Fields:
  - Customer ID (integer)
  - Customer Name (string)
  - Email (string)
  - Phone (string)
  - Total Orders (integer)
  - Total Spent (currency)
  - First Order Date (date)
  - Last Order Date (date)
  - ... etc

📊 Analyzing Fishbowl Sales Orders...
✅ Found 30 fields
✅ 5678 rows of data

💾 Storing Fishbowl Sales Orders schema in Firebase...
✅ Schema stored successfully

📋 Sales Order Fields:
  - SO Number (string)
  - Customer ID (integer)
  - Order Date (date)
  - Order Total (currency)
  - Status (string)
  - ... etc

🔗 Customer → Copper Mappings:
  ✅ Customer ID → Account Order ID (80% confidence)
  ✅ Total Orders → Total Orders (100% confidence)
  ✅ Total Spent → Total Spent (100% confidence)
  ✅ First Order Date → First Order Date (100% confidence)
  ⚠️  Some Custom Field → CREATE_NEW_CUSTOM_FIELD

🔗 Sales Orders → Copper Mappings:
  ✅ SO Number → SO Number (100% confidence)
  ✅ Order Total → Order Total (100% confidence)
  ✅ Order Date → Date Issued (90% confidence)
  ⚠️  Some Field → CREATE_NEW_CUSTOM_FIELD

✅ Analysis complete!

📊 Schemas stored in Firebase:
  - integration_schemas/fishbowl_customers
  - integration_schemas/fishbowl_sales_orders

🔗 Mappings stored in Firebase:
  - integration_mappings/fishbowl_customers_to_copper
  - integration_mappings/fishbowl_sales_orders_to_copper
```

---

## 🎯 **Next Steps After Running**

1. **Review mappings in Firebase Console**
   - Check `integration_schemas` collection
   - Review `integration_mappings` collection

2. **Create missing Copper custom fields**
   - Any mapping with `CREATE_NEW_CUSTOM_FIELD`
   - Add to Copper CRM manually
   - Re-run script to update mappings

3. **Implement sync logic**
   - Use mappings to build `lib/fishbowl/field-mappings.ts`
   - Create `app/api/fishbowl/sync` endpoint
   - Test with real data

---

## 📝 **Manual Review Checklist**

After running the script, review:

- [ ] All Fishbowl fields detected correctly
- [ ] Data types make sense
- [ ] Copper mappings are accurate
- [ ] Missing fields identified
- [ ] Create new Copper custom fields if needed
- [ ] Update confidence scores if needed
- [ ] Document any special transformation logic

---

## 🔧 **Troubleshooting**

### **Error: Cannot find module 'xlsx'**
```bash
npm install xlsx
```

### **Error: Cannot read Excel file**
```bash
# Check file paths
ls docs/FishBowl_Customers.xlsx
ls docs/Fishbowl_SalesOrders.xlsx
```

### **Error: Firebase permission denied**
```bash
# Ensure serviceAccountKey.json exists
# Check Firebase rules allow admin access
```

---

## 🚀 **Future Enhancements**

- [ ] Support for other file formats (CSV, JSON)
- [ ] Auto-create Copper custom fields via API
- [ ] Bidirectional mapping (Copper → Fishbowl)
- [ ] Data validation rules
- [ ] Transformation logic suggestions
- [ ] ShipStation schema analysis
- [ ] QuickBooks schema analysis

---

**This script is the foundation for ALL future integrations!** 🎉
