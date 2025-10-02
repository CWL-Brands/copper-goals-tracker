/**
 * Analyze Copper Export Files
 * Examines all Copper exports to understand data structure
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const files = [
  { name: 'Companies', path: 'docs/companies_10.2.xlsx' },
  { name: 'People', path: 'docs/people_10.2.xlsx' },
  { name: 'Opportunities', path: 'docs/opportunities_10.2.xlsx' },
  { name: 'Leads', path: 'docs/leads_10.2.xlsx' },
  { name: 'Tasks', path: 'docs/tasks_10.2.xlsx' },
];

console.log('\n🔍 COPPER DATA EXPORT ANALYSIS\n');
console.log('='.repeat(80));

const analysis = {};

for (const file of files) {
  try {
    console.log(`\n📊 Analyzing: ${file.name}`);
    console.log('-'.repeat(80));
    
    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    if (data.length === 0) {
      console.log('⚠️  No data found in this export');
      continue;
    }
    
    console.log(`✅ Total Records: ${data.length}`);
    console.log(`📋 Sheet Name: ${sheetName}`);
    
    // Get all field names
    const fields = Object.keys(data[0]);
    console.log(`📝 Total Fields: ${fields.length}`);
    
    // Categorize fields
    const standardFields = [];
    const customFields = [];
    const systemFields = [];
    
    fields.forEach(field => {
      if (field.startsWith('Custom Field:')) {
        customFields.push(field);
      } else if (['ID', 'Created Date', 'Modified Date', 'Owner', 'Assignee'].includes(field)) {
        systemFields.push(field);
      } else {
        standardFields.push(field);
      }
    });
    
    console.log(`\n📌 Standard Fields (${standardFields.length}):`);
    standardFields.slice(0, 20).forEach(f => console.log(`   - ${f}`));
    if (standardFields.length > 20) {
      console.log(`   ... and ${standardFields.length - 20} more`);
    }
    
    console.log(`\n🔧 Custom Fields (${customFields.length}):`);
    customFields.forEach(f => console.log(`   - ${f}`));
    
    console.log(`\n⚙️  System Fields (${systemFields.length}):`);
    systemFields.forEach(f => console.log(`   - ${f}`));
    
    // Sample record
    console.log(`\n📄 Sample Record:`);
    const sample = data[0];
    Object.entries(sample).slice(0, 10).forEach(([key, value]) => {
      const displayValue = String(value).length > 50 
        ? String(value).substring(0, 50) + '...' 
        : value;
      console.log(`   ${key}: ${displayValue}`);
    });
    
    // Store analysis
    analysis[file.name] = {
      totalRecords: data.length,
      sheetName,
      totalFields: fields.length,
      standardFields,
      customFields,
      systemFields,
      sampleRecord: data[0],
      allFields: fields
    };
    
    // Save detailed analysis to JSON
    const outputPath = `docs/copper_${file.name.toLowerCase()}_analysis.json`;
    fs.writeFileSync(outputPath, JSON.stringify({
      fileName: file.name,
      totalRecords: data.length,
      fields: fields.map(fieldName => {
        // Analyze field values
        const values = data.map(row => row[fieldName]).filter(v => v !== '');
        const uniqueValues = [...new Set(values)];
        
        return {
          name: fieldName,
          isCustomField: fieldName.startsWith('Custom Field:'),
          hasData: values.length > 0,
          fillRate: ((values.length / data.length) * 100).toFixed(1) + '%',
          uniqueCount: uniqueValues.length,
          sampleValues: uniqueValues.slice(0, 5)
        };
      })
    }, null, 2));
    
    console.log(`\n💾 Saved detailed analysis to: ${outputPath}`);
    
  } catch (error) {
    console.log(`❌ Error analyzing ${file.name}: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('✅ ANALYSIS COMPLETE!\n');

// Create summary
console.log('📊 SUMMARY:');
console.log('-'.repeat(80));
Object.entries(analysis).forEach(([name, data]) => {
  console.log(`${name}:`);
  console.log(`  Records: ${data.totalRecords}`);
  console.log(`  Standard Fields: ${data.standardFields.length}`);
  console.log(`  Custom Fields: ${data.customFields.length}`);
  console.log('');
});

// Save complete analysis
fs.writeFileSync('docs/COPPER_EXPORT_ANALYSIS.json', JSON.stringify(analysis, null, 2));
console.log('💾 Complete analysis saved to: docs/COPPER_EXPORT_ANALYSIS.json\n');
