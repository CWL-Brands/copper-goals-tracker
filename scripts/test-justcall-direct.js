/**
 * JustCall Authentication Test Script (Direct)
 * Tests authentication directly with hardcoded credentials from .env.local
 */

const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
let apiKey = '';
let apiSecret = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('JUSTCALL_API_KEY=')) {
      apiKey = line.split('=')[1].trim();
    }
    if (line.startsWith('JUSTCALL_API_SECRET=')) {
      apiSecret = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('❌ Could not read .env.local file');
  process.exit(1);
}

if (!apiKey || !apiSecret) {
  console.error('❌ Missing JUSTCALL_API_KEY or JUSTCALL_API_SECRET in .env.local');
  process.exit(1);
}

console.log('🔑 Testing JustCall API Authentication\n');
console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
console.log(`API Secret: ${apiSecret.substring(0, 10)}...${apiSecret.substring(apiSecret.length - 4)}\n`);

async function testAuth() {
  try {
    // Create Basic Auth header
    const authString = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    const url = 'https://api.justcall.io/v2.1/users?available=false&page=0&per_page=50&order=desc';
    
    console.log(`📡 Making request to: ${url}\n`);
    console.log(`Authorization: Basic ${authString.substring(0, 20)}...\n`);
    
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
      console.error('❌ API Error Response:');
      console.error(errorText);
      console.error('\n💡 Possible issues:');
      console.error('   1. API credentials are incorrect');
      console.error('   2. API Key does not have proper permissions');
      console.error('   3. JustCall API is down');
      console.error('\n   Check your credentials at: https://app.justcall.io/app/developers');
      return;
    }

    const data = await response.json();
    
    console.log('✅ Authentication successful!\n');
    console.log(`Found ${data.users?.length || 0} users:\n`);
    
    if (data.users && data.users.length > 0) {
      data.users.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.name || 'No name'} (${user.email || 'No email'})`);
      });
    } else {
      console.log('⚠️  No users found in response.');
      console.log('    This could mean:');
      console.log('    - Your JustCall account has no users');
      console.log('    - The API Key does not have access to users');
    }
    
    console.log('\n📋 Full Response:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  }
}

testAuth();
