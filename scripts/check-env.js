/**
 * Check Environment Variables
 * Quick script to verify what env vars are loaded
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

console.log('\n🔍 ENVIRONMENT VARIABLES CHECK\n');
console.log('='.repeat(80));

const requiredVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

console.log('\n📋 Required Firebase Variables:\n');

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName === 'FIREBASE_PRIVATE_KEY') {
      console.log(`✅ ${varName}: ${value.substring(0, 50)}... (${value.length} chars)`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('\n💡 To fix:');
console.log('1. Uncomment the lines in .env.local (remove // at start)');
console.log('2. Add your real Firebase private key');
console.log('3. Make sure there are no extra spaces or quotes\n');
