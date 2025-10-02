/**
 * JustCall Authentication Test Script
 * 
 * Usage: Set your API credentials below and run:
 * node scripts/test-justcall-auth.js
 */

// ⚠️ REPLACE THESE WITH YOUR ACTUAL JUSTCALL CREDENTIALS
const apiKey = 'YOUR_API_KEY_HERE';
const apiSecret = 'YOUR_API_SECRET_HERE';

if (apiKey === 'YOUR_API_KEY_HERE' || apiSecret === 'YOUR_API_SECRET_HERE') {
  console.error('❌ Please edit this file and replace YOUR_API_KEY_HERE and YOUR_API_SECRET_HERE with your actual JustCall credentials');
  console.error('   Find them at: https://app.justcall.io/app/developers');
  process.exit(1);
}

console.log('🔑 Testing JustCall API Authentication\n');
console.log(`API Key: ${apiKey.substring(0, 10)}...`);
console.log(`API Secret: ${apiSecret.substring(0, 10)}...\n`);

async function testAuth() {
  try {
    // Create Basic Auth header
    const authString = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    const url = 'https://api.justcall.io/v2.1/users?available=false&page=0&per_page=50&order=desc';
    
    console.log(`📡 Making request to: ${url}\n`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:');
      console.error(errorText);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Authentication successful!\n');
    console.log(`Found ${data.users?.length || 0} users:\n`);
    
    if (data.users && data.users.length > 0) {
      data.users.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.name} (${user.email})`);
      });
    } else {
      console.log('No users found in response.');
    }
    
    console.log('\n📋 Full Response:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAuth();
