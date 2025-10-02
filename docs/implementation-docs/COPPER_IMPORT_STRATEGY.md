# Copper Import & Integration Strategy

## 📊 **COPPER DATA ANALYSIS COMPLETE**

### **Export Summary:**
- ✅ **People (Contacts):** 75,339 records
- ✅ **Opportunities:** 393 records
- ✅ **Leads:** 4,861 records
- ✅ **Tasks:** 1,339 records
- ✅ **Companies:** ~100,000+ records (109 MB file)

---

## 🔑 **KEY DISCOVERY: Custom Field Format**

Copper exports use this format for custom fields:
```
[Field Name] cf_[Field ID]
```

**Examples:**
- `Account Number cf_698260`
- `SO Number cf_698395`
- `Account Order ID cf_698467`
- `Date Issued cf_698396`
- `Order Status cf_698397`

**This is PERFECT because:**
1. ✅ We can extract field IDs automatically
2. ✅ We can validate our existing field mappings
3. ✅ We can generate import templates
4. ✅ We can build API payloads dynamically

---

## 📋 **COPPER IMPORT METHODS**

### **Method 1: CSV Import (Manual/Bulk)**
**URL:** https://support.copper.com/en/articles/8823353-update-records-on-import

**How it works:**
1. Export template from Copper
2. Fill in data
3. Upload CSV
4. Copper matches by unique identifier
5. Updates existing or creates new

**Pros:**
- ✅ Bulk updates (thousands at once)
- ✅ No API rate limits
- ✅ Can update existing records
- ✅ Simple for one-time migrations

**Cons:**
- ❌ Manual process
- ❌ No automation
- ❌ Requires Copper UI access

**Best for:** Initial data load, bulk corrections

---

### **Method 2: API Integration (Automated)**
**Copper API Docs:** https://developer.copper.com/

**How it works:**
1. Query Copper API for existing records
2. POST/PUT to create/update records
3. Use custom field IDs in payload
4. Handle rate limits (600 req/min)

**Pros:**
- ✅ Fully automated
- ✅ Real-time sync
- ✅ Programmatic control
- ✅ Can integrate with webhooks

**Cons:**
- ❌ Rate limits (600/min)
- ❌ More complex
- ❌ Requires error handling

**Best for:** Ongoing sync, automation, integrations

---

### **Method 3: Custom Web App (Hybrid)**
**Our Current Approach**

**How it works:**
1. Store data in Firestore (done ✅)
2. Build admin UI for mapping/review
3. Sync to Copper via API
4. Track sync status in Firestore

**Pros:**
- ✅ Best of both worlds
- ✅ Review before sync
- ✅ Audit trail
- ✅ Flexible and scalable

**Cons:**
- ❌ Most development work
- ✅ But we're already halfway there!

**Best for:** Our use case! ✨

---

## 🗺️ **FIELD MAPPING VALIDATION**

### **Companies (Accounts) - Key Fields:**

| Copper Export Field | Field ID | Fishbowl Field | Match |
|---|---|---|---|
| `Account Number cf_698260` | 698260 | `accountId` | ✅ |
| `Account Order ID cf_698467` | 698467 | `id` | ✅ |
| `Active Customer cf_712751` | 712751 | `activeFlag` | ✅ |
| `Credit Limit cf_712752` | 712752 | `creditLimit` | ✅ |
| `Customer Since cf_712753` | 712753 | `dateCreated` | ✅ |
| `Last Modified Date cf_712754` | 712754 | `dateLastModified` | ✅ |
| `Total Orders cf_698403` | 698403 | (calculated) | ✅ |
| `Total Spent cf_698404` | 698404 | (calculated) | ✅ |
| `First Order Date cf_698405` | 698405 | (calculated) | ✅ |
| `Last Order Date cf_698406` | 698406 | (calculated) | ✅ |
| `Average Order Value cf_698407` | 698407 | (calculated) | ✅ |

**Standard Fields:**
- `Company` (name) → Fishbowl `name`
- `Street` → Fishbowl `billToAddress`
- `City` → Fishbowl `billToCity`
- `State` → Fishbowl `billToStateID`
- `Postal Code` → Fishbowl `billToZip`
- `Email` → Fishbowl `email`
- `Phone Number` → Fishbowl `phone`

---

### **Opportunities (Pipeline Records) - Key Fields:**

| Copper Export Field | Field ID | Fishbowl Field | Match |
|---|---|---|---|
| `SO Number cf_698395` | 698395 | `num` | ✅ |
| `Date Issued cf_698396` | 698396 | `dateIssued` | ✅ |
| `Order Status cf_698397` | 698397 | `status` | ✅ |
| `Order Total cf_698441` | 698441 | `totalPrice` | ✅ |
| `Subtotal cf_698438` | 698438 | `subtotal` | ✅ |
| `Tax Amount cf_698439` | 698439 | `totalTax` | ✅ |
| `Tax Included cf_712757` | 712757 | `totalIncludesTax` | ✅ |
| `Cost cf_712758` | 712758 | `cost` | ✅ |
| `Date Completed cf_712759` | 712759 | `dateCompleted` | ✅ |
| `Date Created cf_712760` | 712760 | `dateCreated` | ✅ |
| `Last Modified cf_712761` | 712761 | `dateLastModified` | ✅ |
| `Salesman cf_712762` | 712762 | `salesman` | ✅ |
| `Salesman ID cf_712763` | 712763 | `salesmanId` | ✅ |
| `Customer PO cf_712764` | 712764 | `customerPO` | ✅ |
| `Ship To Name cf_712767` | 712767 | `shipToName` | ✅ |
| `Ship To Address cf_712768` | 712768 | `shipToAddress` | ✅ |
| `Ship To City cf_712769` | 712769 | `shipToCity` | ✅ |
| `Ship To Zip cf_712770` | 712770 | `shipToZip` | ✅ |
| `Residential Delivery cf_712771` | 712771 | `shipToResidential` | ✅ |
| `FOB Point cf_712772` | 712772 | `fobPointId` | ✅ |

**Standard Fields:**
- `Name` → Generated from SO Number
- `Company Id` → Linked to Copper Company
- `Value` → Fishbowl `totalPrice`
- `Status` → Mapped from Fishbowl status

---

## 🔄 **SYNC STRATEGY**

### **Phase 1: Match Existing Records** (Next!)

**Goal:** Link Firestore records to existing Copper records

**Method:**
1. Read Copper Companies export
2. Match by `Account Number cf_698260` or `Account Order ID cf_698467`
3. Update Firestore with `copperCompanyId`
4. Mark as `syncStatus: 'matched'`

**Script:** `scripts/match-copper-companies.js`

```javascript
// Pseudo-code
for each Copper company:
  accountNumber = company["Account Number cf_698260"]
  copperCompanyId = company["Company Id"]
  
  // Find in Firestore
  firestoreCustomer = findByAccountNumber(accountNumber)
  
  if found:
    update firestoreCustomer.copperCompanyId = copperCompanyId
    update firestoreCustomer.syncStatus = 'matched'
```

---

### **Phase 2: Sync New Records**

**Goal:** Create Copper records for Fishbowl customers not in Copper

**Method:**
1. Query Firestore for `syncStatus: 'pending'`
2. Create via Copper API
3. Update Firestore with new Copper ID
4. Mark as `syncStatus: 'synced'`

---

### **Phase 3: Update Existing Records**

**Goal:** Keep Copper data fresh with Fishbowl updates

**Method:**
1. Query Firestore for `syncStatus: 'matched'` AND `updatedAt > lastSyncedAt`
2. Update via Copper API
3. Update `lastSyncedToCopperAt`

---

### **Phase 4: Ongoing Automation**

**Options:**
1. **Manual trigger** - Admin clicks "Sync Now"
2. **Scheduled** - Daily/weekly cron job
3. **Webhook** - When Fishbowl data changes (future)

---

## 📝 **COPPER CSV IMPORT FORMAT**

### **Companies Template:**

```csv
Company,Street,City,State,Postal Code,Email,Phone Number,Account Number cf_698260,Account Order ID cf_698467,Active Customer cf_712751,Credit Limit cf_712752
"ACME Corp","123 Main St","New York","NY","10001","info@acme.com","555-1234","C12345","1","checked","50000"
```

### **Opportunities Template:**

```csv
Name,Company,Value,SO Number cf_698395,Date Issued cf_698396,Order Status cf_698397,Order Total cf_698441,Subtotal cf_698438,Tax Amount cf_698439
"SO-12345","ACME Corp","5000","SO-12345","1/15/2025","Complete","5000","4500","500"
```

---

## 🛠️ **IMPLEMENTATION ROADMAP**

### **✅ COMPLETED:**
1. Firestore schema design
2. Fishbowl import tool
3. Data imported (1,606 customers, 20,227 orders)
4. Copper data analysis
5. Field mapping validation

### **🔄 NEXT STEPS:**

**Step 1: Match Existing Records** (Today!)
- Build matching script
- Read Copper companies export
- Match by Account Number
- Update Firestore with Copper IDs

**Step 2: Generate CSV for Missing Records**
- Query unmatched Firestore records
- Generate Copper import CSV
- Manual import to Copper
- Update Firestore with new IDs

**Step 3: Build API Sync Endpoint**
- Create `/api/copper/sync-from-firestore`
- Implement create/update logic
- Add rate limiting
- Error handling

**Step 4: Sync Dashboard**
- Show sync status
- Manual trigger button
- Error logs
- Sync history

**Step 5: Automation**
- Schedule daily sync
- Webhook integration (future)
- Alert on errors

---

## 💡 **KEY INSIGHTS**

### **1. Copper's Import Update Logic:**
From the support article, Copper updates records by matching on:
- **Company Name** (for companies)
- **Email** (for people)
- **Custom unique field** (if specified)

**Our Strategy:**
- Use `Account Number cf_698260` as unique identifier
- This ensures we update the right record
- No duplicates!

### **2. Custom Field IDs are Consistent:**
- Field IDs don't change
- Safe to hardcode in our app
- Already done in `lib/copper/field-mappings.ts` ✅

### **3. Checkbox Fields:**
- Format: `"checked"` or `"unchecked"`
- NOT `true`/`false`
- Important for `Active Customer`, `Tax Included`, etc.

### **4. Currency Fields:**
- Just the number, no currency symbol
- Example: `5000` not `$5,000`

### **5. Date Fields:**
- Format: `M/D/YYYY` (e.g., `1/15/2025`)
- NOT ISO format

---

## 🎯 **SUCCESS METRICS**

**Phase 1 (Matching):**
- Target: Match 80%+ of Firestore customers to Copper
- Metric: `matchedRecords / totalFirestoreRecords`

**Phase 2 (Sync):**
- Target: Sync 100% of unmatched records
- Metric: `syncedRecords / unmatchedRecords`

**Phase 3 (Ongoing):**
- Target: Daily sync with <1% error rate
- Metric: `successfulSyncs / totalSyncs`

---

## 📚 **RESOURCES**

- **Copper Import Guide:** https://support.copper.com/en/articles/8823353-update-records-on-import
- **Copper API Docs:** https://developer.copper.com/
- **Our Field Mappings:** `lib/copper/field-mappings.ts`
- **Copper Metadata:** Stored in Firestore `settings/copper_metadata`
- **Analysis Scripts:** `scripts/analyze-copper-exports.js`

---

**Ready to build the matching script!** 🚀
