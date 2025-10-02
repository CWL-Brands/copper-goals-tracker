/**
 * Create Fishbowl → Copper Field Mappings
 * 
 * This script:
 * 1. Reads Fishbowl schema from JSON files
 * 2. Reads existing Copper custom fields from Firebase
 * 3. Creates intelligent mappings based on:
 *    - Exact name matches
 *    - Partial name matches
 *    - Data type compatibility
 *    - Object type (Company vs Opportunity vs Person)
 * 4. Identifies which Copper fields already exist
 * 5. Suggests which new fields need to be created
 * 6. Outputs mapping document for sync implementation
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.error('❌ Missing Firebase credentials');
    process.exit(1);
  }
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey.includes('\\n') ? privateKey.replace(/\\n/g, '\n') : privateKey,
    }),
  });
}

const db = admin.firestore();

/**
 * Load Copper metadata from Firebase
 */
async function loadCopperMetadata() {
  console.log('📥 Loading Copper metadata from Firebase...\n');
  
  const doc = await db.collection('settings').doc('copper_metadata').get();
  
  if (!doc.exists) {
    console.error('❌ No Copper metadata found in Firebase');
    console.error('   Run: POST /api/copper/metadata to fetch and store metadata');
    process.exit(1);
  }
  
  const data = doc.data();
  const customFields = data?.customFieldDefinitions || data?.data?.customFieldDefinitions || [];
  
  if (!Array.isArray(customFields) || customFields.length === 0) {
    console.error('❌ No custom field definitions found');
    process.exit(1);
  }
  
  console.log(`✅ Loaded ${customFields.length} Copper custom fields\n`);
  
  // Group by object type
  const byType = {
    company: customFields.filter(f => f.available_on?.includes('company')),
    person: customFields.filter(f => f.available_on?.includes('person')),
    opportunity: customFields.filter(f => f.available_on?.includes('opportunity')),
    project: customFields.filter(f => f.available_on?.includes('project')),
  };
  
  console.log('📊 Custom Fields by Object Type:');
  console.log(`   Companies: ${byType.company.length}`);
  console.log(`   People: ${byType.person.length}`);
  console.log(`   Opportunities: ${byType.opportunity.length}`);
  console.log(`   Projects: ${byType.project.length}\n`);
  
  return { all: customFields, byType };
}

/**
 * Load Fishbowl schemas
 */
function loadFishbowlSchemas() {
  console.log('📥 Loading Fishbowl schemas...\n');
  
  const customersPath = path.join(__dirname, '../docs/fishbowl_customers_schema.json');
  const ordersPath = path.join(__dirname, '../docs/fishbowl_sales_orders_schema.json');
  
  if (!fs.existsSync(customersPath) || !fs.existsSync(ordersPath)) {
    console.error('❌ Fishbowl schema files not found');
    console.error('   Run: node scripts/analyze-fishbowl-local.js first');
    process.exit(1);
  }
  
  const customers = JSON.parse(fs.readFileSync(customersPath, 'utf8'));
  const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
  
  console.log(`✅ Loaded Fishbowl Customers: ${customers.fields.length} fields`);
  console.log(`✅ Loaded Fishbowl Sales Orders: ${orders.fields.length} fields\n`);
  
  return { customers, orders };
}

/**
 * Calculate match score between Fishbowl field and Copper field
 */
function calculateMatchScore(fbField, cuField) {
  let score = 0;
  
  const fbName = fbField.name.toLowerCase().replace(/[_\s-]/g, '');
  const cuName = cuField.name.toLowerCase().replace(/[_\s-]/g, '');
  
  // Exact match
  if (fbName === cuName) score += 100;
  // Contains match
  else if (fbName.includes(cuName) || cuName.includes(fbName)) score += 50;
  // Partial word match
  else {
    const fbWords = fbField.name.toLowerCase().split(/[_\s-]+/);
    const cuWords = cuField.name.toLowerCase().split(/[_\s-]+/);
    const commonWords = fbWords.filter(w => cuWords.includes(w));
    score += commonWords.length * 20;
  }
  
  // Data type compatibility
  const typeMap = {
    'integer': ['Float', 'Currency', 'String'],
    'float': ['Float', 'Currency'],
    'currency': ['Currency', 'Float'],
    'string': ['String', 'Text', 'Dropdown'],
    'date': ['Date'],
    'boolean': ['Checkbox'],
  };
  
  if (typeMap[fbField.dataType]?.includes(cuField.data_type)) {
    score += 30;
  }
  
  return score;
}

/**
 * Find best Copper field match for a Fishbowl field
 */
function findBestMatch(fbField, copperFields) {
  let bestMatch = null;
  let bestScore = 0;
  
  for (const cuField of copperFields) {
    const score = calculateMatchScore(fbField, cuField);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = cuField;
    }
  }
  
  return bestScore >= 50 ? { field: bestMatch, score: bestScore } : null;
}

/**
 * Create mappings for Fishbowl Customers → Copper Companies
 */
function mapCustomersToCompanies(fishbowlCustomers, copperCompanyFields) {
  console.log('\n' + '='.repeat(70));
  console.log('🏢 MAPPING: Fishbowl Customers → Copper Companies');
  console.log('='.repeat(70) + '\n');
  
  const mappings = [];
  
  for (const fbField of fishbowlCustomers.fields) {
    const match = findBestMatch(fbField, copperCompanyFields);
    
    if (match) {
      mappings.push({
        fishbowlField: fbField.name,
        fishbowlType: fbField.dataType,
        copperFieldId: match.field.id,
        copperFieldName: match.field.name,
        copperFieldType: match.field.data_type,
        matchScore: match.score,
        action: 'USE_EXISTING',
      });
      console.log(`✅ ${fbField.name.padEnd(30)} → ${match.field.name} (${match.field.id}) [${match.score}%]`);
    } else {
      mappings.push({
        fishbowlField: fbField.name,
        fishbowlType: fbField.dataType,
        copperFieldId: null,
        copperFieldName: null,
        copperFieldType: null,
        matchScore: 0,
        action: 'CREATE_NEW',
      });
      console.log(`❌ ${fbField.name.padEnd(30)} → CREATE NEW FIELD`);
    }
  }
  
  const existing = mappings.filter(m => m.action === 'USE_EXISTING').length;
  const newFields = mappings.filter(m => m.action === 'CREATE_NEW').length;
  
  console.log(`\n📊 Summary: ${existing} existing, ${newFields} new fields needed\n`);
  
  return mappings;
}

/**
 * Create mappings for Fishbowl Sales Orders → Copper Opportunities
 */
function mapOrdersToOpportunities(fishbowlOrders, copperOpportunityFields) {
  console.log('\n' + '='.repeat(70));
  console.log('💰 MAPPING: Fishbowl Sales Orders → Copper Opportunities');
  console.log('='.repeat(70) + '\n');
  
  const mappings = [];
  
  for (const fbField of fishbowlOrders.fields) {
    const match = findBestMatch(fbField, copperOpportunityFields);
    
    if (match) {
      mappings.push({
        fishbowlField: fbField.name,
        fishbowlType: fbField.dataType,
        copperFieldId: match.field.id,
        copperFieldName: match.field.name,
        copperFieldType: match.field.data_type,
        matchScore: match.score,
        action: 'USE_EXISTING',
      });
      console.log(`✅ ${fbField.name.padEnd(30)} → ${match.field.name} (${match.field.id}) [${match.score}%]`);
    } else {
      mappings.push({
        fishbowlField: fbField.name,
        fishbowlType: fbField.dataType,
        copperFieldId: null,
        copperFieldName: null,
        copperFieldType: null,
        matchScore: 0,
        action: 'CREATE_NEW',
      });
      console.log(`❌ ${fbField.name.padEnd(30)} → CREATE NEW FIELD`);
    }
  }
  
  const existing = mappings.filter(m => m.action === 'USE_EXISTING').length;
  const newFields = mappings.filter(m => m.action === 'CREATE_NEW').length;
  
  console.log(`\n📊 Summary: ${existing} existing, ${newFields} new fields needed\n`);
  
  return mappings;
}

/**
 * Save mappings to file
 */
function saveMappings(customerMappings, orderMappings) {
  const output = {
    createdAt: new Date().toISOString(),
    customers: {
      fishbowlObject: 'Customer',
      copperObject: 'Company',
      totalFields: customerMappings.length,
      existingFields: customerMappings.filter(m => m.action === 'USE_EXISTING').length,
      newFieldsNeeded: customerMappings.filter(m => m.action === 'CREATE_NEW').length,
      mappings: customerMappings,
    },
    salesOrders: {
      fishbowlObject: 'Sales Order',
      copperObject: 'Opportunity',
      totalFields: orderMappings.length,
      existingFields: orderMappings.filter(m => m.action === 'USE_EXISTING').length,
      newFieldsNeeded: orderMappings.filter(m => m.action === 'CREATE_NEW').length,
      mappings: orderMappings,
    },
  };
  
  const outputPath = path.join(__dirname, '../docs/fishbowl_copper_mappings.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`\n💾 Mappings saved to: ${outputPath}\n`);
  
  return output;
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 FISHBOWL → COPPER FIELD MAPPER\n');
  
  try {
    // Load data
    const copper = await loadCopperMetadata();
    const fishbowl = loadFishbowlSchemas();
    
    // Create mappings
    const customerMappings = mapCustomersToCompanies(
      fishbowl.customers,
      copper.byType.company
    );
    
    const orderMappings = mapOrdersToOpportunities(
      fishbowl.orders,
      copper.byType.opportunity
    );
    
    // Save results
    const output = saveMappings(customerMappings, orderMappings);
    
    // Print summary
    console.log('='.repeat(70));
    console.log('✅ MAPPING COMPLETE!');
    console.log('='.repeat(70));
    console.log(`\n📊 TOTALS:`);
    console.log(`   Customer Fields: ${output.customers.existingFields} existing, ${output.customers.newFieldsNeeded} new`);
    console.log(`   Order Fields: ${output.salesOrders.existingFields} existing, ${output.salesOrders.newFieldsNeeded} new`);
    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Review: docs/fishbowl_copper_mappings.json`);
    console.log(`   2. Create missing Copper custom fields (${output.customers.newFieldsNeeded + output.salesOrders.newFieldsNeeded} total)`);
    console.log(`   3. Re-run this script to update mappings`);
    console.log(`   4. Implement sync logic using these mappings\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

main();
