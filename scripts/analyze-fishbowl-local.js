/**
 * Fishbowl Schema Analyzer (Local Version - No Firebase)
 * 
 * This script analyzes Fishbowl Excel files and prints results to console
 * No Firebase required - just reads and analyzes
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * Detect data type from sample values
 */
function detectDataType(samples) {
  const nonNull = samples.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNull.length === 0) return 'unknown';
  
  // Check if all are numbers
  if (nonNull.every(v => typeof v === 'number' || !isNaN(Number(v)))) {
    const hasDecimals = nonNull.some(v => String(v).includes('.'));
    return hasDecimals ? 'float' : 'integer';
  }
  
  // Check if dates
  if (nonNull.some(v => {
    const str = String(v);
    return str.match(/^\d{1,2}\/\d{1,2}\/\d{4}/) || str.match(/^\d{4}-\d{2}-\d{2}/);
  })) {
    return 'date';
  }
  
  // Check if currency
  if (nonNull.some(v => String(v).match(/^\$[\d,]+\.?\d*$/))) {
    return 'currency';
  }
  
  // Check if boolean
  if (nonNull.every(v => v === true || v === false || v === 'true' || v === 'false' || v === 'yes' || v === 'no')) {
    return 'boolean';
  }
  
  return 'string';
}

/**
 * Analyze Excel file and extract schema
 */
function analyzeExcelSchema(filePath, sourceName) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 Analyzing: ${sourceName}`);
  console.log(`${'='.repeat(70)}\n`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return null;
  }
  
  // Read Excel file
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON to analyze
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  if (data.length === 0) {
    console.log('❌ No data found in file');
    return null;
  }
  
  // Extract field names from first row
  const fields = Object.keys(data[0]);
  
  console.log(`✅ File: ${path.basename(filePath)}`);
  console.log(`✅ Sheet: ${sheetName}`);
  console.log(`✅ Total Rows: ${data.length.toLocaleString()}`);
  console.log(`✅ Total Fields: ${fields.length}\n`);
  
  // Analyze each field
  const schema = {
    sourceName,
    fileName: path.basename(filePath),
    sheetName,
    analyzedAt: new Date().toISOString(),
    totalRows: data.length,
    fields: fields.map((fieldName, index) => {
      // Sample first 100 rows to detect type
      const samples = data.slice(0, 100).map(row => row[fieldName]);
      const dataType = detectDataType(samples);
      const hasNulls = samples.some(v => v === null || v === undefined || v === '');
      const uniqueCount = new Set(samples.filter(v => v !== null && v !== undefined && v !== '')).size;
      
      return {
        index: index + 1,
        name: fieldName,
        dataType,
        hasNulls,
        uniqueValues: uniqueCount,
        sampleValues: samples.filter(v => v !== null && v !== undefined && v !== '').slice(0, 3),
      };
    }),
  };
  
  // Print field details
  console.log('📋 FIELD ANALYSIS:\n');
  console.log('  #  | Field Name                          | Type      | Nulls | Unique | Sample Values');
  console.log('─────┼─────────────────────────────────────┼───────────┼───────┼────────┼──────────────────────');
  
  schema.fields.forEach(f => {
    const name = f.name.padEnd(35).substring(0, 35);
    const type = f.dataType.padEnd(9);
    const nulls = (f.hasNulls ? 'Yes' : 'No').padEnd(5);
    const unique = String(f.uniqueValues).padStart(6);
    const samples = f.sampleValues.slice(0, 2).map(v => String(v).substring(0, 20)).join(', ');
    
    console.log(`  ${String(f.index).padStart(2)} | ${name} | ${type} | ${nulls} | ${unique} | ${samples}`);
  });
  
  return schema;
}

/**
 * Suggest Copper field mappings
 */
function suggestCopperMappings(schema) {
  console.log(`\n\n${'='.repeat(70)}`);
  console.log(`🔗 COPPER FIELD MAPPING SUGGESTIONS`);
  console.log(`${'='.repeat(70)}\n`);
  
  // Known Copper custom field mappings
  const copperFields = {
    // Account/Company fields
    'Customer ID': { id: 698467, name: 'Account Order ID', type: 'String' },
    'Total Orders': { id: 698403, name: 'Total Orders', type: 'Float' },
    'Total Spent': { id: 698404, name: 'Total Spent', type: 'Currency' },
    'First Order Date': { id: 698405, name: 'First Order Date', type: 'Date' },
    'Last Order Date': { id: 698406, name: 'Last Order Date', type: 'Date' },
    'Average Order Value': { id: 698407, name: 'Average Order Value', type: 'Currency' },
    
    // Order fields
    'SO Number': { id: 698395, name: 'SO Number', type: 'String' },
    'Order Date': { id: 698396, name: 'Date Issued', type: 'Date' },
    'Order Status': { id: 698397, name: 'Order Status', type: 'Dropdown' },
    'Order Total': { id: 698441, name: 'Order Total', type: 'Currency' },
    'Subtotal': { id: 698438, name: 'Subtotal', type: 'Currency' },
    'Tax Amount': { id: 698439, name: 'Tax Amount', type: 'Currency' },
    'Shipping Amount': { id: 698427, name: 'Shipping Amount', type: 'Currency' },
  };
  
  console.log('Fishbowl Field                      → Copper Field (ID)                    | Match');
  console.log('────────────────────────────────────┼──────────────────────────────────────┼──────');
  
  let matchedCount = 0;
  let unmatchedCount = 0;
  
  schema.fields.forEach(f => {
    const fbName = f.name.padEnd(35).substring(0, 35);
    
    if (copperFields[f.name]) {
      const copper = copperFields[f.name];
      const mapping = `${copper.name} (${copper.id})`.padEnd(36);
      console.log(`${fbName} → ${mapping} | ✅ AUTO`);
      matchedCount++;
    } else {
      // Try partial match
      const partialMatch = Object.keys(copperFields).find(key => 
        key.toLowerCase().includes(f.name.toLowerCase()) || 
        f.name.toLowerCase().includes(key.toLowerCase())
      );
      
      if (partialMatch) {
        const copper = copperFields[partialMatch];
        const mapping = `${copper.name} (${copper.id})`.padEnd(36);
        console.log(`${fbName} → ${mapping} | ⚠️  MAYBE`);
        matchedCount++;
      } else {
        console.log(`${fbName} → ${'CREATE NEW CUSTOM FIELD'.padEnd(36)} | ❌ NEW`);
        unmatchedCount++;
      }
    }
  });
  
  console.log('\n📊 MAPPING SUMMARY:');
  console.log(`   ✅ Auto-matched: ${matchedCount}`);
  console.log(`   ❌ Need new fields: ${unmatchedCount}`);
  console.log(`   📝 Total fields: ${schema.fields.length}`);
}

/**
 * Save schema to JSON file
 */
function saveSchemaToFile(schema, outputPath) {
  fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
  console.log(`\n💾 Schema saved to: ${outputPath}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 FISHBOWL SCHEMA ANALYZER (Local Version)\n');
  
  try {
    // Analyze Customers
    const customersSchema = analyzeExcelSchema(
      path.join(__dirname, '../docs/FishBowl_Customers.xlsx'),
      'Fishbowl Customers'
    );
    
    if (customersSchema) {
      suggestCopperMappings(customersSchema);
      saveSchemaToFile(
        customersSchema,
        path.join(__dirname, '../docs/fishbowl_customers_schema.json')
      );
    }
    
    // Analyze Sales Orders
    const salesOrdersSchema = analyzeExcelSchema(
      path.join(__dirname, '../docs/Fishbowl_SalesOrders.xlsx'),
      'Fishbowl Sales Orders'
    );
    
    if (salesOrdersSchema) {
      suggestCopperMappings(salesOrdersSchema);
      saveSchemaToFile(
        salesOrdersSchema,
        path.join(__dirname, '../docs/fishbowl_sales_orders_schema.json')
      );
    }
    
    console.log(`\n${'='.repeat(70)}`);
    console.log('✅ ANALYSIS COMPLETE!');
    console.log(`${'='.repeat(70)}\n`);
    console.log('📁 Output files created:');
    console.log('   - docs/fishbowl_customers_schema.json');
    console.log('   - docs/fishbowl_sales_orders_schema.json');
    console.log('\n💡 Next steps:');
    console.log('   1. Review the field mappings above');
    console.log('   2. Create missing Copper custom fields');
    console.log('   3. Update lib/copper/field-mappings.ts with IDs');
    console.log('   4. Implement sync logic in app/api/fishbowl/sync\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Run
main();
