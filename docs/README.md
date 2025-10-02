# Documentation Directory

**Organized:** October 2, 2025

## 📁 Directory Structure

### `/implementation-docs/` - Active Implementation Guides
Current implementation documentation and strategies:
- `COPPER_IMPORT_STRATEGY.md` - Copper data import and sync strategy
- `FIELD_MAPPING_STRATEGY.md` - Field mapping between systems
- `FISHBOWL_COPPER_FIELD_MAPPINGS.md` - Detailed Fishbowl ↔ Copper mappings
- `INTEGRATION_ARCHITECTURE.md` - Overall integration architecture

### `/copper-data/` - Copper CRM Exports
Copper data exports and analysis:
- `companies_10.2.xlsx` - Copper companies export (64 MB)
- `leads_10.2.xlsx` - Copper leads export
- `opportunities_10.2.xlsx` - Copper opportunities export
- `people_10.2.xlsx` - Copper contacts export (25 MB)
- `tasks_10.2.xlsx` - Copper tasks export
- `copper_*.json` - Analysis files for each export
- `COPPER_EXPORT_ANALYSIS.json` - Complete analysis summary
- `copper_matching_results.json` - Results from matching script

### `/fishbowl-data/` - Fishbowl ERP Exports
Fishbowl data exports and schemas:
- `FishBowl_Customers.xlsx` - Fishbowl customers export (281 KB)
- `Fishbowl_SalesOrders.xlsx` - Fishbowl sales orders export (7.9 MB)
- `fishbowl_customers_schema.json` - Customer data schema
- `fishbowl_sales_orders_schema.json` - Sales order data schema

### `/session-summaries/` - Development Session Notes
Daily session summaries and progress notes:
- `SESSION_SUMMARY_2025-09-30.md`
- `SESSION_SUMMARY_2025-10-01.md`

### `/archived/` - Completed/Historical Documentation
Archived documentation from completed features:
- Admin UI redesigns
- Dashboard implementations
- JustCall integration docs
- Team leaderboard implementation
- Historical setup guides

### `/analysis/` - Data Analysis Scripts & Results
Reserved for analysis outputs and temporary files

---

## 🎯 Quick Reference

### **For Fishbowl Integration:**
1. Start with: `/implementation-docs/COPPER_IMPORT_STRATEGY.md`
2. Field mappings: `/implementation-docs/FISHBOWL_COPPER_FIELD_MAPPINGS.md`
3. Data files: `/fishbowl-data/` and `/copper-data/`

### **For Copper Sync:**
1. Strategy: `/implementation-docs/COPPER_IMPORT_STRATEGY.md`
2. Data exports: `/copper-data/`
3. Matching results: `/copper-data/copper_matching_results.json`

### **For Architecture:**
1. Overall design: `/implementation-docs/INTEGRATION_ARCHITECTURE.md`
2. Field mappings: `/implementation-docs/FIELD_MAPPING_STRATEGY.md`

---

## 📊 Data File Sizes

| File | Size | Records | Purpose |
|------|------|---------|---------|
| `companies_10.2.xlsx` | 64 MB | ~100K | Copper companies |
| `people_10.2.xlsx` | 25 MB | 75,339 | Copper contacts |
| `Fishbowl_SalesOrders.xlsx` | 7.9 MB | 20,227 | Fishbowl orders |
| `leads_10.2.xlsx` | 1.3 MB | 4,861 | Copper leads |
| `FishBowl_Customers.xlsx` | 281 KB | 1,606 | Fishbowl customers |

---

## 🔄 Maintenance

**When to update:**
- Add new exports to appropriate data folders
- Move completed implementation docs to `/archived/`
- Add session summaries to `/session-summaries/`
- Keep `/implementation-docs/` current with active work

**Cleanup:**
- Archive old exports after successful imports
- Remove duplicate analysis files
- Compress large historical files

---

## 📝 Notes

- All Excel files are exports from their respective systems
- JSON files contain analysis and schema information
- Markdown files are human-readable documentation
- Keep active implementation docs in root `/implementation-docs/`
- Archive completed work to prevent clutter

---

**Last Updated:** October 2, 2025
