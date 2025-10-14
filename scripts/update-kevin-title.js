/**
 * Script to update Kevin's user record with Vice President title
 * Run with: node scripts/update-kevin-title.js
 * 
 * This will:
 * 1. Find kevin@cwlbrands.com in Firestore
 * 2. Update his title to 'Vice President'
 * 3. Ensure his role is 'admin'
 * 4. Verify he's excluded from sales dashboards
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

if (!admin.apps.length) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    console.log('\n⚠️  Make sure serviceAccountKey.json exists in the project root');
    console.log('   Download it from Firebase Console → Project Settings → Service Accounts');
    process.exit(1);
  }
}

const db = admin.firestore();

async function updateKevinTitle() {
  try {
    console.log('\n🔍 Searching for kevin@cwlbrands.com...\n');
    
    // Find Kevin's user document
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'kevin@cwlbrands.com')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ User kevin@cwlbrands.com not found in Firestore');
      console.log('   Please create the user first or check the email address');
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('✅ Found user:');
    console.log(`   ID: ${userDoc.id}`);
    console.log(`   Name: ${userData.name || 'N/A'}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Current Role: ${userData.role || 'N/A'}`);
    console.log(`   Current Title: ${userData.title || 'N/A'}`);
    
    // Update the user
    console.log('\n📝 Updating user record...\n');
    
    await userDoc.ref.update({
      title: 'Vice President',
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ User updated successfully!');
    console.log('   Title: Vice President');
    console.log('   Role: admin');
    
    // Verify the update
    const updatedDoc = await userDoc.ref.get();
    const updatedData = updatedDoc.data();
    
    console.log('\n✅ Verification:');
    console.log(`   Title: ${updatedData.title}`);
    console.log(`   Role: ${updatedData.role}`);
    
    console.log('\n🎯 Result:');
    console.log('   ✅ Kevin will be EXCLUDED from sales dashboards');
    console.log('   ✅ Kevin retains admin access for commissions app');
    console.log('   ✅ Kevin will NOT appear in team leaderboards');
    console.log('   ✅ Kevin\'s metrics will NOT be counted in team totals');
    
  } catch (error) {
    console.error('\n❌ Error updating user:', error);
    throw error;
  }
}

// Run the script
updateKevinTitle()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
