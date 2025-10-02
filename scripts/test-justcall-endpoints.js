/**
 * JustCall API Endpoints Explorer
 * Tests different endpoints to find where team members are stored
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

console.log('🔍 JustCall API Endpoints Explorer\n');

const authString = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

async function testEndpoint(name, url) {
  console.log(`\n📡 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json',
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success! Found ${data.data?.length || data.count || 0} items`);
      
      if (data.data && data.data.length > 0) {
        console.log(`   📋 Sample item:`);
        console.log(JSON.stringify(data.data[0], null, 2).split('\n').map(l => '      ' + l).join('\n'));
      }
      
      return data;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed: ${errorText.substring(0, 100)}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function explore() {
  const baseUrl = 'https://api.justcall.io/v2.1';
  
  // Test various endpoints
  const endpoints = [
    { name: 'Users', url: `${baseUrl}/users?available=false&page=0&per_page=50` },
    { name: 'Teams', url: `${baseUrl}/teams?page=0&per_page=50` },
    { name: 'Team Members', url: `${baseUrl}/teams/members?page=0&per_page=50` },
    { name: 'Agents', url: `${baseUrl}/agents?page=0&per_page=50` },
    { name: 'Contacts', url: `${baseUrl}/contacts?page=0&per_page=10` },
    { name: 'Phone Numbers', url: `${baseUrl}/phone-numbers?page=0&per_page=50` },
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.name, endpoint.url);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
  
  console.log('\n\n✅ Exploration complete!');
  console.log('Check the output above to see which endpoints returned team member data.');
}

explore();
