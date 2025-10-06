/**
 * Clean Firestore Database Script
 * 
 * This script:
 * 1. Removes bad match data from fishbowl_customers
 * 2. Restructures copper_companies to use Copper ID as document ID
 * 
 * Usage: Run this from the Firebase console or as a Cloud Function
 */

import { adminDb } from '../lib/firebase/admin';

async function cleanFishbowlCustomers() {
  console.log('🧹 Cleaning fishbowl_customers...');
  
  const snapshot = await adminDb.collection('fishbowl_customers').get();
  const batch = adminDb.batch();
  let count = 0;
  
  snapshot.docs.forEach(doc => {
    // Remove bad match fields
    batch.update(doc.ref, {
      copperCompanyId: null,
      copperCompanyName: null,
      matchType: null,
      matchConfidence: null,
      matchedAt: null
    });
    count++;
  });
  
  await batch.commit();
  console.log(`✅ Cleaned ${count} fishbowl_customers`);
}

async function restructureCopperCompanies() {
  console.log('🔄 Restructuring copper_companies...');
  
  // Get all companies
  const snapshot = await adminDb.collection('copper_companies').get();
  console.log(`📊 Found ${snapshot.size} companies to migrate`);
  
  let migrated = 0;
  let skipped = 0;
  let batchCount = 0;
  let batch = adminDb.batch();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const copperId = data.id;
    
    if (!copperId) {
      console.log(`⚠️  Skipping document ${doc.id} - no Copper ID`);
      skipped++;
      continue;
    }
    
    // Create new document with Copper ID as document ID
    const newRef = adminDb.collection('copper_companies').doc(String(copperId));
    batch.set(newRef, data);
    
    // Delete old document (if different)
    if (doc.id !== String(copperId)) {
      batch.delete(doc.ref);
    }
    
    migrated++;
    batchCount++;
    
    // Commit in batches of 500
    if (batchCount >= 500) {
      await batch.commit();
      console.log(`💾 Migrated ${migrated} companies...`);
      batch = adminDb.batch();
      batchCount = 0;
    }
  }
  
  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
  }
  
  console.log(`✅ Migrated ${migrated} companies, skipped ${skipped}`);
}

async function main() {
  try {
    console.log('🚀 Starting Firestore cleanup...');
    
    // Step 1: Clean fishbowl_customers
    await cleanFishbowlCustomers();
    
    // Step 2: Restructure copper_companies
    await restructureCopperCompanies();
    
    console.log('✅ Cleanup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Go to /admin/tools/copper-fishbowl-match');
    console.log('2. Click "Find Matches"');
    console.log('3. Click "Apply Matches"');
    console.log('4. Go to /admin/tools/sync-fishbowl-copper');
    console.log('5. Click "Calculate Metrics"');
    console.log('6. Click "Sync to Copper"');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { cleanFishbowlCustomers, restructureCopperCompanies };
