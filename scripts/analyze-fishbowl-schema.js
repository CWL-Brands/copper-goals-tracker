/**
 * Fishbowl Schema Analyzer
 * 
 * This script will:
 * 1. Read Fishbowl Excel files
 * 2. Extract column headers (field names)
 * 3. Detect data types
 * 4. Store schema in Firebase
 * 5. Create mapping to Copper custom fields
 * 
 * Usage: node scripts/analyze-fishbowl-schema.js
 */

const XLSX = require('xlsx');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin (use environment variables like the main app)
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.error('❌ Missing Firebase credentials in .env.local');
    console.error('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle both escaped and unescaped newlines
      privateKey: privateKey.includes('\\n') ? privateKey.replace(/\\n/g, '\n') : privateKey,
    }),
  });
}

const db = admin.firestore();

/**
 * Analyze Excel file and extract schema
 */
function analyzeExcelSchema(filePath, sourceName) {
  console.log(`\n📊 Analyzing ${sourceName}...`);
  
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
  
  console.log(`✅ Found ${fields.length} fields`);
  console.log(`✅ ${data.length} rows of data`);
  
  // Analyze each field
  const schema = {
    sourceName,
    fileName: path.basename(filePath),
    analyzedAt: new Date().toISOString(),
    totalRows: data.length,
    fields: fields.map(fieldName => {
      // Sample first 100 rows to detect type
      const samples = data.slice(0, 100).map(row => row[fieldName]);
      const dataType = detectDataType(samples);
      const hasNulls = samples.some(v => v === null || v === undefined || v === '');
      const uniqueCount = new Set(samples.filter(v => v !== null && v !== undefined && v !== '')).size;
      
      return {
        name: fieldName,
        dataType,
        hasNulls,
        uniqueValues: uniqueCount,
        sampleValues: samples.filter(v => v !== null && v !== undefined && v !== '').slice(0, 5),
      };
    }),
  };
  
  return schema;
}

/**
 * Detect data type from sample values
 */
function detectDataType(samples) {
  const nonNull = samples.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNull.length === 0) return 'unknown';
  
  // Check if all are numbers
  if (nonNull.every(v => typeof v === 'number' || !isNaN(Number(v)))) {
    // Check if integers or floats
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
 * Store schema in Firebase
 */
async function storeSchemaInFirebase(schema) {
  console.log(`\n💾 Storing ${schema.sourceName} schema in Firebase...`);
  
  const docRef = db.collection('integration_schemas').doc(schema.sourceName.toLowerCase().replace(/\s+/g, '_'));
  
  await docRef.set(schema);
  
  console.log(`✅ Schema stored successfully`);
}

/**
 * Create Copper field mapping suggestions
 */
function suggestCopperMappings(schema, copperCustomFields) {
  console.log(`\n🔗 Suggesting Copper field mappings...`);
  
  const mappings = [];
  
  for (const field of schema.fields) {
    // Try to find matching Copper field by name similarity
    const copperField = findBestMatch(field.name, copperCustomFields);
    
    if (copperField) {
      mappings.push({
        fishbowlField: field.name,
        fishbowlType: field.dataType,
        copperFieldId: copperField.id,
        copperFieldName: copperField.name,
        copperFieldType: copperField.data_type,
        confidence: calculateConfidence(field, copperField),
      });
    } else {
      mappings.push({
        fishbowlField: field.name,
        fishbowlType: field.dataType,
        copperFieldId: null,
        copperFieldName: null,
        copperFieldType: null,
        confidence: 0,
        suggestion: 'CREATE_NEW_CUSTOM_FIELD',
      });
    }
  }
  
  return mappings;
}

/**
 * Find best matching Copper field
 */
function findBestMatch(fishbowlFieldName, copperFields) {
  const normalized = fishbowlFieldName.toLowerCase().replace(/[_\s]+/g, '');
  
  for (const copperField of copperFields) {
    const copperNormalized = copperField.name.toLowerCase().replace(/[_\s]+/g, '');
    
    if (normalized === copperNormalized) {
      return copperField;
    }
  }
  
  // Partial match
  for (const copperField of copperFields) {
    const copperNormalized = copperField.name.toLowerCase().replace(/[_\s]+/g, '');
    
    if (normalized.includes(copperNormalized) || copperNormalized.includes(normalized)) {
      return copperField;
    }
  }
  
  return null;
}

/**
 * Calculate mapping confidence score
 */
function calculateConfidence(fishbowlField, copperField) {
  let score = 0;
  
  // Name match
  const fbNorm = fishbowlField.name.toLowerCase().replace(/[_\s]+/g, '');
  const cuNorm = copperField.name.toLowerCase().replace(/[_\s]+/g, '');
  
  if (fbNorm === cuNorm) score += 50;
  else if (fbNorm.includes(cuNorm) || cuNorm.includes(fbNorm)) score += 30;
  
  // Type compatibility
  const typeMap = {
    'integer': ['Float', 'Currency'],
    'float': ['Float', 'Currency'],
    'currency': ['Currency'],
    'string': ['String', 'Text'],
    'date': ['Date'],
    'boolean': ['Checkbox'],
  };
  
  if (typeMap[fishbowlField.dataType]?.includes(copperField.data_type)) {
    score += 50;
  }
  
  return score;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Fishbowl Schema Analyzer\n');
  
  try {
    // Analyze Customers
    const customersSchema = analyzeExcelSchema(
      path.join(__dirname, '../docs/FishBowl_Customers.xlsx'),
      'Fishbowl Customers'
    );
    
    if (customersSchema) {
      await storeSchemaInFirebase(customersSchema);
      
      // Print field summary
      console.log('\n📋 Customer Fields:');
      customersSchema.fields.forEach(f => {
        console.log(`  - ${f.name} (${f.dataType}) ${f.hasNulls ? '[nullable]' : ''}`);
      });
    }
    
    // Analyze Sales Orders
    const salesOrdersSchema = analyzeExcelSchema(
      path.join(__dirname, '../docs/Fishbowl_SalesOrders.xlsx'),
      'Fishbowl Sales Orders'
    );
    
    if (salesOrdersSchema) {
      await storeSchemaInFirebase(salesOrdersSchema);
      
      // Print field summary
      console.log('\n📋 Sales Order Fields:');
      salesOrdersSchema.fields.forEach(f => {
        console.log(`  - ${f.name} (${f.dataType}) ${f.hasNulls ? '[nullable]' : ''}`);
      });
    }
    
    // Load Copper custom fields from Firebase
    const copperMetaDoc = await db.collection('settings').doc('copper_metadata').get();
    const copperMeta = copperMetaDoc.data();
    const copperCustomFields = copperMeta?.data?.customFieldDefinitions || [];
    
    // Generate mapping suggestions
    if (customersSchema) {
      const customerMappings = suggestCopperMappings(customersSchema, copperCustomFields);
      
      console.log('\n🔗 Customer → Copper Mappings:');
      customerMappings.forEach(m => {
        if (m.copperFieldId) {
          console.log(`  ✅ ${m.fishbowlField} → ${m.copperFieldName} (${m.confidence}% confidence)`);
        } else {
          console.log(`  ⚠️  ${m.fishbowlField} → ${m.suggestion}`);
        }
      });
      
      // Store mappings
      await db.collection('integration_mappings').doc('fishbowl_customers_to_copper').set({
        sourceName: 'Fishbowl Customers',
        targetName: 'Copper CRM',
        mappings: customerMappings,
        createdAt: new Date().toISOString(),
      });
    }
    
    if (salesOrdersSchema) {
      const salesOrderMappings = suggestCopperMappings(salesOrdersSchema, copperCustomFields);
      
      console.log('\n🔗 Sales Orders → Copper Mappings:');
      salesOrderMappings.forEach(m => {
        if (m.copperFieldId) {
          console.log(`  ✅ ${m.fishbowlField} → ${m.copperFieldName} (${m.confidence}% confidence)`);
        } else {
          console.log(`  ⚠️  ${m.fishbowlField} → ${m.suggestion}`);
        }
      });
      
      // Store mappings
      await db.collection('integration_mappings').doc('fishbowl_sales_orders_to_copper').set({
        sourceName: 'Fishbowl Sales Orders',
        targetName: 'Copper CRM',
        mappings: salesOrderMappings,
        createdAt: new Date().toISOString(),
      });
    }
    
    console.log('\n✅ Analysis complete!');
    console.log('\n📊 Schemas stored in Firebase:');
    console.log('  - integration_schemas/fishbowl_customers');
    console.log('  - integration_schemas/fishbowl_sales_orders');
    console.log('\n🔗 Mappings stored in Firebase:');
    console.log('  - integration_mappings/fishbowl_customers_to_copper');
    console.log('  - integration_mappings/fishbowl_sales_orders_to_copper');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { analyzeExcelSchema, detectDataType, suggestCopperMappings };
