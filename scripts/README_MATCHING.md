# Copper Company Matching Script

## 🎯 Purpose

This script matches Firestore `fishbowl_customers` records to existing Copper companies and updates them with the Copper Company ID.

## 📋 Prerequisites

1. ✅ Fishbowl data imported to Firestore (done!)
2. ✅ Copper companies export in `docs/companies_10.2.xlsx` (done!)
3. ✅ Firebase service account key in root directory

## 🚀 Usage

```bash
node scripts/match-copper-companies.js
```

## 🔍 How It Works

The script uses **three matching methods** in order of reliability:

### **Method 1: Account Number** (Most Reliable)
- Matches Copper `Account Number cf_698260` to Firestore `accountId`
- Exact match required
- **Best for:** Customers with account numbers in both systems

### **Method 2: Account Order ID** (Very Reliable)
- Matches Copper `Account Order ID cf_698467` to Firestore `id` (Fishbowl customer ID)
- Exact match required
- **Best for:** Customers imported from Fishbowl with IDs

### **Method 3: Company Name** (Fuzzy Match)
- Uses Levenshtein distance algorithm
- Requires 85%+ similarity
- Only checks unmatched Firestore records
- **Best for:** Catching variations in company names

## 📊 What Gets Updated

For each matched record, the script updates Firestore with:

```javascript
{
  copperCompanyId: 12345678,           // Copper's company ID
  syncStatus: 'matched',               // Status changed from 'pending'
  lastSyncedToCopperAt: Timestamp,     // When matched
  copperMatchMethod: 'accountNumber',  // How it was matched
  updatedAt: Timestamp                 // Last update time
}
```

## 📈 Expected Results

**Target Match Rate:** 80-90%

**Why not 100%?**
- Some Firestore customers may not exist in Copper yet
- Some Copper companies may not have Fishbowl data
- Name variations that don't meet 85% threshold

## 📄 Output Files

### **Console Output:**
- Real-time progress updates
- Match statistics
- Error summary

### **JSON Results File:**
`docs/copper_matching_results.json`

Contains:
- Complete statistics
- List of all matched records
- Detailed error log
- Timestamp of run

## 🔧 Troubleshooting

### **Error: "Cannot find module 'firebase-admin'"**
```bash
cd functions
npm install
cd ..
```

### **Error: "serviceAccountKey.json not found"**
1. Download from Firebase Console
2. Place in project root
3. Add to `.gitignore` (already done)

### **Low Match Rate (<50%)**
Possible causes:
- Account numbers not populated in Copper
- Different naming conventions
- Data quality issues

**Solution:** Review unmatched records manually

### **Script Hangs**
- Large dataset (100K+ companies)
- Increase batch delay or reduce batch size
- Check Firestore quota limits

## 📝 Example Output

```
🔗 COPPER COMPANY MATCHING SCRIPT

================================================================================

📥 Reading Copper companies export...
✅ Found 100000 Copper companies
✅ Found 1606 Firestore customers

🔍 Starting matching process...

📊 Progress: 100/100000 (0.1%)
✅ Matched 50 records so far...
📊 Progress: 200/100000 (0.2%)
✅ Matched 100 records so far...
...

================================================================================
✅ MATCHING COMPLETE!

📊 STATISTICS:
--------------------------------------------------------------------------------
Total Copper Companies:     100000
Total Firestore Customers:  1606

Matched Records:            1445
  - By Account Number:      1200
  - By Account Order ID:    200
  - By Name (fuzzy):        45

Unmatched:                  161
Errors:                     0

📈 Match Rate:              90.0%

💾 Detailed results saved to: docs/copper_matching_results.json

✨ Done!
```

## 🎯 Next Steps After Matching

1. **Review Results**
   - Check `copper_matching_results.json`
   - Verify match rate is acceptable
   - Review any errors

2. **Handle Unmatched Records**
   - Query Firestore for `syncStatus: 'pending'`
   - Generate CSV import for Copper
   - Or create via API

3. **Build Sync Endpoint**
   - Create `/api/copper/sync-from-firestore`
   - Sync matched records
   - Update custom fields

4. **Ongoing Maintenance**
   - Re-run script after new Copper exports
   - Monitor match rates
   - Update matching logic as needed

## 🔐 Security Notes

- Script requires Firebase Admin SDK access
- Service account key has full Firestore access
- Never commit `serviceAccountKey.json` to git
- Run script in secure environment only

## 💡 Tips

- **First Run:** Start with a small test batch
- **Large Datasets:** Run during off-hours
- **Monitoring:** Watch Firestore console for updates
- **Backup:** Export Firestore data before running
- **Dry Run:** Add a `--dry-run` flag to test without updating

## 📚 Related Files

- `docs/COPPER_IMPORT_STRATEGY.md` - Overall strategy
- `docs/FISHBOWL_COPPER_FIELD_MAPPINGS.md` - Field mappings
- `lib/copper/field-mappings.ts` - Field ID constants
- `types/firestore-schema.ts` - Firestore schema

---

**Questions?** Check the main strategy document or review the code comments in `match-copper-companies.js`
