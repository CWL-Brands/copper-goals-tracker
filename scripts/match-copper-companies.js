/**
 * Match Copper Companies to Firestore Customers
 * 
 * This script reads the Copper companies export and matches them to
 * Firestore fishbowl_customers records, updating the copperCompanyId field.
 * 
 * Usage: node scripts/match-copper-companies.js
 */

const XLSX = require('xlsx');
const path = require('path');
const admin = require('firebase-admin');

// Use the existing admin setup from the app
// This avoids credential issues since the app is already working
const { adminDb } = require('../lib/firebase/admin.ts');
const db = adminDb;

// Stats tracking
const stats = {
  totalCopperCompanies: 0,
  totalFirestoreCustomers: 0,
  matchedByAccountNumber: 0,
  matchedByAccountOrderId: 0,
  matchedByName: 0,
  unmatched: 0,
  errors: [],
  matchedRecords: []
};

/**
 * Normalize string for comparison
 */
function normalizeString(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ');   // Normalize whitespace
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function similarityScore(str1, str2) {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0;
  
  // Simple Levenshtein-based similarity
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Match a Copper company to Firestore customer
 */
async function matchCompany(copperCompany) {
  const accountNumber = copperCompany['Account Number cf_698260'];
  const accountOrderId = copperCompany['Account Order ID cf_698467'];
  const companyName = copperCompany['Company'] || copperCompany['Name'];
  const copperCompanyId = copperCompany['Company Id'] || copperCompany['Copper ID'];
  
  if (!copperCompanyId) {
    stats.errors.push({
      company: companyName,
      error: 'Missing Copper Company ID'
    });
    return null;
  }
  
  let matchedCustomer = null;
  let matchMethod = null;
  
  // Method 1: Match by Account Number (most reliable)
  if (accountNumber) {
    const snapshot = await db.collection('fishbowl_customers')
      .where('accountId', '==', String(accountNumber))
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      matchedCustomer = snapshot.docs[0];
      matchMethod = 'accountNumber';
      stats.matchedByAccountNumber++;
    }
  }
  
  // Method 2: Match by Account Order ID (Fishbowl customer ID)
  if (!matchedCustomer && accountOrderId) {
    const snapshot = await db.collection('fishbowl_customers')
      .where('id', '==', String(accountOrderId))
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      matchedCustomer = snapshot.docs[0];
      matchMethod = 'accountOrderId';
      stats.matchedByAccountOrderId++;
    }
  }
  
  // Method 3: Fuzzy match by company name (less reliable)
  if (!matchedCustomer && companyName) {
    const allCustomers = await db.collection('fishbowl_customers')
      .where('copperCompanyId', '==', null) // Only unmatched
      .limit(100)
      .get();
    
    let bestMatch = null;
    let bestScore = 0;
    
    allCustomers.forEach(doc => {
      const customer = doc.data();
      const score = similarityScore(companyName, customer.name);
      
      if (score > 0.85 && score > bestScore) { // 85% similarity threshold
        bestScore = score;
        bestMatch = doc;
      }
    });
    
    if (bestMatch) {
      matchedCustomer = bestMatch;
      matchMethod = `name (${(bestScore * 100).toFixed(0)}% match)`;
      stats.matchedByName++;
    }
  }
  
  if (matchedCustomer) {
    return {
      firestoreDoc: matchedCustomer,
      copperCompanyId: Number(copperCompanyId),
      matchMethod,
      copperData: {
        name: companyName,
        accountNumber,
        accountOrderId
      }
    };
  }
  
  stats.unmatched++;
  return null;
}

/**
 * Update Firestore with Copper company ID
 */
async function updateFirestoreCustomer(match) {
  try {
    await match.firestoreDoc.ref.update({
      copperCompanyId: match.copperCompanyId,
      syncStatus: 'matched',
      lastSyncedToCopperAt: admin.firestore.Timestamp.now(),
      copperMatchMethod: match.matchMethod,
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    stats.matchedRecords.push({
      firestoreId: match.firestoreDoc.id,
      copperCompanyId: match.copperCompanyId,
      name: match.copperData.name,
      method: match.matchMethod
    });
    
    return true;
  } catch (error) {
    stats.errors.push({
      firestoreId: match.firestoreDoc.id,
      error: error.message
    });
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🔗 COPPER COMPANY MATCHING SCRIPT\n');
  console.log('='.repeat(80));
  
  try {
    // Read Copper companies export
    console.log('\n📥 Reading Copper companies export...');
    const filePath = path.join(__dirname, '..', 'docs', 'companies_10.2.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const copperCompanies = XLSX.utils.sheet_to_json(worksheet);
    
    stats.totalCopperCompanies = copperCompanies.length;
    console.log(`✅ Found ${stats.totalCopperCompanies} Copper companies`);
    
    // Get total Firestore customers
    const firestoreSnapshot = await db.collection('fishbowl_customers').count().get();
    stats.totalFirestoreCustomers = firestoreSnapshot.data().count;
    console.log(`✅ Found ${stats.totalFirestoreCustomers} Firestore customers`);
    
    console.log('\n🔍 Starting matching process...\n');
    
    // Process in batches to avoid memory issues
    const BATCH_SIZE = 100;
    let processed = 0;
    
    for (let i = 0; i < copperCompanies.length; i += BATCH_SIZE) {
      const batch = copperCompanies.slice(i, i + BATCH_SIZE);
      
      for (const copperCompany of batch) {
        processed++;
        
        // Show progress every 100 records
        if (processed % 100 === 0) {
          console.log(`📊 Progress: ${processed}/${stats.totalCopperCompanies} (${((processed/stats.totalCopperCompanies)*100).toFixed(1)}%)`);
        }
        
        const match = await matchCompany(copperCompany);
        
        if (match) {
          await updateFirestoreCustomer(match);
          
          // Log successful matches
          if (stats.matchedRecords.length % 50 === 0) {
            console.log(`✅ Matched ${stats.matchedRecords.length} records so far...`);
          }
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ MATCHING COMPLETE!\n');
    
    // Print statistics
    console.log('📊 STATISTICS:');
    console.log('-'.repeat(80));
    console.log(`Total Copper Companies:     ${stats.totalCopperCompanies}`);
    console.log(`Total Firestore Customers:  ${stats.totalFirestoreCustomers}`);
    console.log(`\nMatched Records:            ${stats.matchedRecords.length}`);
    console.log(`  - By Account Number:      ${stats.matchedByAccountNumber}`);
    console.log(`  - By Account Order ID:    ${stats.matchedByAccountOrderId}`);
    console.log(`  - By Name (fuzzy):        ${stats.matchedByName}`);
    console.log(`\nUnmatched:                  ${stats.unmatched}`);
    console.log(`Errors:                     ${stats.errors.length}`);
    
    const matchRate = ((stats.matchedRecords.length / stats.totalFirestoreCustomers) * 100).toFixed(1);
    console.log(`\n📈 Match Rate:              ${matchRate}%`);
    
    // Show errors if any
    if (stats.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      console.log('-'.repeat(80));
      stats.errors.slice(0, 10).forEach((err, i) => {
        console.log(`${i + 1}. ${err.company || err.firestoreId}: ${err.error}`);
      });
      if (stats.errors.length > 10) {
        console.log(`... and ${stats.errors.length - 10} more errors`);
      }
    }
    
    // Save detailed results
    const fs = require('fs');
    const resultsPath = path.join(__dirname, '..', 'docs', 'copper_matching_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      stats,
      matchedRecords: stats.matchedRecords,
      errors: stats.errors
    }, null, 2));
    
    console.log(`\n💾 Detailed results saved to: ${resultsPath}`);
    console.log('\n✨ Done!\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
main();
