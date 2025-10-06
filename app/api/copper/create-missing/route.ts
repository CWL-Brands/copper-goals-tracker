import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

interface MissingCompany {
  fishbowlId: string;
  fishbowlCustomerId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  suggestedAccountType: 'C' | 'HQ' | 'DIST';
}

interface CreateResult {
  fishbowlId: string;
  fishbowlCustomerId: string;
  name: string;
  copperCompanyId?: string;
  copperAccountNumber?: string;
  status: 'created' | 'failed';
  error?: string;
}

/**
 * Find Fishbowl customers marked "NOT IN COPPER"
 */
async function findMissingCompanies(): Promise<MissingCompany[]> {
  console.log('🔍 Finding Fishbowl customers not in Copper...');
  
  const snapshot = await adminDb
    .collection('fishbowl_customers')
    .where('accountNumber', '==', 'NOT IN COPPER')
    .get();
  
  const missing: MissingCompany[] = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Determine suggested account type based on name or other criteria
    let suggestedAccountType: 'C' | 'HQ' | 'DIST' = 'C';
    const name = (data.name || '').toLowerCase();
    
    if (name.includes('distrib') || name.includes('wholesale')) {
      suggestedAccountType = 'DIST';
    } else if (name.includes('hq') || name.includes('headquarters')) {
      suggestedAccountType = 'HQ';
    }
    
    missing.push({
      fishbowlId: data.fishbowlId || data.id,
      fishbowlCustomerId: doc.id,
      name: data.name || 'Unknown',
      address: data.billToAddress || data.address,
      city: data.billToCity || data.city,
      state: data.billToStateID || data.state,
      zip: data.billToZip || data.zip,
      phone: data.phone,
      email: data.email,
      suggestedAccountType
    });
  }
  
  console.log(`✅ Found ${missing.length} companies not in Copper`);
  return missing;
}

/**
 * Get next available account number for a type
 */
async function getNextAccountNumber(type: 'C' | 'HQ' | 'DIST'): Promise<string> {
  // Query Copper companies to find highest number for this type
  const snapshot = await adminDb
    .collection('copper_companies')
    .where('Account Number cf_698260', '>=', type)
    .where('Account Number cf_698260', '<', type + '\uf8ff')
    .get();
  
  let maxNumber = 0;
  
  for (const doc of snapshot.docs) {
    const accountNum = doc.data()['Account Number cf_698260'];
    if (accountNum && typeof accountNum === 'string') {
      const match = accountNum.match(new RegExp(`^${type}(\\d+)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }
  
  // Also check Fishbowl customers
  const fbSnapshot = await adminDb
    .collection('fishbowl_customers')
    .where('accountNumber', '>=', type)
    .where('accountNumber', '<', type + '\uf8ff')
    .get();
  
  for (const doc of fbSnapshot.docs) {
    const accountNum = doc.data().accountNumber;
    if (accountNum && typeof accountNum === 'string') {
      const match = accountNum.match(new RegExp(`^${type}(\\d+)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }
  
  const nextNumber = maxNumber + 1;
  return `${type}${nextNumber}`;
}

/**
 * Create company in Copper via API
 */
async function createCopperCompany(company: MissingCompany, accountNumber: string): Promise<{ id: string; accountNumber: string }> {
  const copperApiKey = process.env.COPPER_API_KEY;
  const copperEmail = process.env.COPPER_USER_EMAIL;
  
  if (!copperApiKey || !copperEmail) {
    throw new Error('Copper API credentials not configured');
  }
  
  // Build Copper company payload
  const payload = {
    name: company.name,
    address: {
      street: company.address || '',
      city: company.city || '',
      state: company.state || '',
      postal_code: company.zip || '',
    },
    phone_numbers: company.phone ? [{ number: company.phone, category: 'work' }] : [],
    emails: company.email ? [{ email: company.email, category: 'work' }] : [],
    custom_fields: [
      {
        custom_field_definition_id: 698260, // Account Number cf_698260
        value: accountNumber
      }
    ]
  };
  
  // Call Copper API
  const response = await fetch('https://api.copper.com/developer_api/v1/companies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-PW-AccessToken': copperApiKey,
      'X-PW-Application': 'developer_api',
      'X-PW-UserEmail': copperEmail,
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Copper API error: ${response.status} - ${error}`);
  }
  
  const copperCompany = await response.json();
  
  return {
    id: String(copperCompany.id),
    accountNumber
  };
}

/**
 * Create missing companies in Copper
 */
async function createMissingCompanies(companies: MissingCompany[]): Promise<CreateResult[]> {
  console.log(`🚀 Creating ${companies.length} companies in Copper...`);
  
  const results: CreateResult[] = [];
  
  for (const company of companies) {
    try {
      // Get next account number
      const accountNumber = await getNextAccountNumber(company.suggestedAccountType);
      
      // Create in Copper
      const copperResult = await createCopperCompany(company, accountNumber);
      
      // Update Fishbowl customer in Firestore
      await adminDb
        .collection('fishbowl_customers')
        .doc(company.fishbowlCustomerId)
        .update({
          accountNumber: accountNumber,
          copperCompanyId: copperResult.id,
          copperAccountNumber: accountNumber,
          syncedToCopperAt: new Date(),
        });
      
      results.push({
        fishbowlId: company.fishbowlId,
        fishbowlCustomerId: company.fishbowlCustomerId,
        name: company.name,
        copperCompanyId: copperResult.id,
        copperAccountNumber: accountNumber,
        status: 'created',
      });
      
      console.log(`✅ Created ${company.name} as ${accountNumber} (Copper ID: ${copperResult.id})`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error: any) {
      console.error(`❌ Failed to create ${company.name}:`, error.message);
      
      results.push({
        fishbowlId: company.fishbowlId,
        fishbowlCustomerId: company.fishbowlCustomerId,
        name: company.name,
        status: 'failed',
        error: error.message,
      });
    }
  }
  
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;
    
    if (action === 'find') {
      // Find missing companies
      const missing = await findMissingCompanies();
      
      return NextResponse.json({
        success: true,
        missing,
        count: missing.length,
      });
    }
    
    if (action === 'create') {
      // Create missing companies
      const companies = body.companies as MissingCompany[];
      
      if (!companies || companies.length === 0) {
        return NextResponse.json(
          { error: 'No companies provided' },
          { status: 400 }
        );
      }
      
      const results = await createMissingCompanies(companies);
      
      const created = results.filter(r => r.status === 'created').length;
      const failed = results.filter(r => r.status === 'failed').length;
      
      return NextResponse.json({
        success: true,
        results,
        stats: {
          total: results.length,
          created,
          failed,
        },
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use "find" or "create"' },
      { status: 400 }
    );
    
  } catch (error: any) {
    console.error('Create missing companies error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
