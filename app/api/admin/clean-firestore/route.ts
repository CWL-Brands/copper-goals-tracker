import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting Firestore cleanup...');

    // Step 1: Clean fishbowl_customers
    console.log('🧹 Cleaning fishbowl_customers...');
    const fishbowlSnapshot = await adminDb.collection('fishbowl_customers').get();
    let fishbowlBatch = adminDb.batch();
    let fishbowlCount = 0;
    
    fishbowlSnapshot.docs.forEach(doc => {
      // Remove bad match fields by setting to admin.firestore.FieldValue.delete()
      fishbowlBatch.update(doc.ref, {
        copperCompanyId: null,
        copperCompanyName: null,
        matchType: null,
        matchConfidence: null,
        matchedAt: null
      });
      fishbowlCount++;
    });
    
    await fishbowlBatch.commit();
    console.log(`✅ Cleaned ${fishbowlCount} fishbowl_customers`);

    // Step 2: Restructure copper_companies
    console.log('🔄 Restructuring copper_companies...');
    const copperSnapshot = await adminDb.collection('copper_companies').get();
    console.log(`📊 Found ${copperSnapshot.size} companies to migrate`);
    
    let migrated = 0;
    let skipped = 0;
    let batchCount = 0;
    let copperBatch = adminDb.batch();
    
    for (const doc of copperSnapshot.docs) {
      const data = doc.data();
      const copperId = data.id;
      
      if (!copperId) {
        console.log(`⚠️  Skipping document ${doc.id} - no Copper ID`);
        skipped++;
        continue;
      }
      
      // Create new document with Copper ID as document ID
      const newRef = adminDb.collection('copper_companies').doc(String(copperId));
      copperBatch.set(newRef, data);
      
      // Delete old document (if different)
      if (doc.id !== String(copperId)) {
        copperBatch.delete(doc.ref);
      }
      
      migrated++;
      batchCount++;
      
      // Commit in batches of 500
      if (batchCount >= 500) {
        await copperBatch.commit();
        console.log(`💾 Migrated ${migrated} companies...`);
        copperBatch = adminDb.batch();
        batchCount = 0;
      }
    }
    
    // Commit remaining
    if (batchCount > 0) {
      await copperBatch.commit();
    }
    
    console.log(`✅ Migrated ${migrated} companies, skipped ${skipped}`);
    console.log('✅ Cleanup complete!');

    return NextResponse.json({
      success: true,
      fishbowlCleaned: fishbowlCount,
      copperMigrated: migrated,
      copperSkipped: skipped
    });

  } catch (error: any) {
    console.error('❌ Cleanup error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
