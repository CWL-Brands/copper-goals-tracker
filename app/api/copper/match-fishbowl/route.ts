import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

interface MatchResult {
  fishbowlCustomerId: string;
  fishbowlCustomerName: string;
  copperCompanyId: string;
  copperCompanyName: string;
  matchType: 'account_number' | 'account_order_id' | 'name';
  confidence: 'high' | 'medium' | 'low';
  accountNumber?: string;
  accountOrderId?: string;
}

/**
 * Normalize address for matching
 */
function normalizeAddress(address: string): string {
  if (!address) return '';
  return address
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)\b/g, '') // Remove street types
    .trim();
}

/**
 * Match Fishbowl customers to Copper companies
 */
async function matchCopperToFishbowl(): Promise<{
  matches: MatchResult[];
  stats: {
    totalFishbowlCustomers: number;
    totalCopperCompanies: number;
    matched: number;
    unmatched: number;
  };
}> {
  console.log('🔗 Starting Fishbowl → Copper matching...');
  
  // Get all Fishbowl customers
  const fishbowlSnapshot = await adminDb.collection('fishbowl_customers').get();
  const fishbowlCustomers = fishbowlSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as any[];
  
  console.log(`📊 Found ${fishbowlCustomers.length} Fishbowl customers`);
  
  // Get all Copper companies (with pagination if needed)
  const copperSnapshot = await adminDb.collection('copper_companies').limit(10000).get();
  const copperCompanies = copperSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as any[];
  
  console.log(`📊 Found ${copperCompanies.length} Copper companies (first 10K)`);
  
  const matches: MatchResult[] = [];
  const matchedFishbowlIds = new Set<string>();
  
  // Strategy 1: Match by Fishbowl Account Number → Copper Account Number
  // Fishbowl "Account Number" (custom field) = Copper account number (starts with C, HQ, etc.)
  console.log('🔍 Strategy 1: Matching by Account Number (Fishbowl → Copper)...');
  for (const fishbowl of fishbowlCustomers) {
    const fishbowlAccountNumber = fishbowl.accountNumber || fishbowl['Account Number'];
    
    if (fishbowlAccountNumber && String(fishbowlAccountNumber).trim() !== '') {
      // Find Copper company with matching Account Number field
      const copper = copperCompanies.find(c => {
        const copperAccountNum = c['Account Number cf_698260'] || c.accountNumber;
        return copperAccountNum && String(copperAccountNum).trim() === String(fishbowlAccountNumber).trim();
      });
      
      if (copper && !matchedFishbowlIds.has(fishbowl.id)) {
        matches.push({
          fishbowlCustomerId: fishbowl.id,
          fishbowlCustomerName: fishbowl.name || '',
          copperCompanyId: String(copper.id),
          copperCompanyName: copper.Name || copper.name || '',
          matchType: 'account_number',
          confidence: 'high',
          accountNumber: String(fishbowlAccountNumber)
        });
        matchedFishbowlIds.add(fishbowl.id);
      }
    }
  }
  
  console.log(`✅ Matched ${matches.length} by Account Number`);
  
  // Strategy 2: Match by Fishbowl Customer Number → Copper Order ID field
  // Fishbowl customer ID = Copper "Account Order ID cf_698467"
  console.log('🔍 Strategy 2: Matching by Customer Number (Fishbowl ID → Copper Order ID)...');
  for (const fishbowl of fishbowlCustomers) {
    if (matchedFishbowlIds.has(fishbowl.id)) continue; // Already matched
    
    const fishbowlCustomerNum = fishbowl.id || fishbowl.customerNumber;
    
    if (fishbowlCustomerNum && String(fishbowlCustomerNum).trim() !== '') {
      // Find Copper company with matching Order ID field
      const copper = copperCompanies.find(c => {
        const copperOrderId = c['Account Order ID cf_698467'] || c.accountOrderId;
        return copperOrderId && String(copperOrderId).trim() === String(fishbowlCustomerNum).trim();
      });
      
      if (copper && !matchedFishbowlIds.has(fishbowl.id)) {
        matches.push({
          fishbowlCustomerId: fishbowl.id,
          fishbowlCustomerName: fishbowl.name || '',
          copperCompanyId: String(copper.id),
          copperCompanyName: copper.Name || copper.name || '',
          matchType: 'account_order_id',
          confidence: 'high',
          accountOrderId: String(fishbowlCustomerNum)
        });
        matchedFishbowlIds.add(fishbowl.id);
      }
    }
  }
  
  console.log(`✅ Matched ${matches.length} total after Customer Number matching`);
  
  // Strategy 3: Match by Address (for new Fishbowl customers without Copper link)
  console.log('🔍 Strategy 3: Matching by Address...');
  for (const fishbowl of fishbowlCustomers) {
    if (matchedFishbowlIds.has(fishbowl.id)) continue; // Already matched
    
    const fishbowlAddress = fishbowl.address || fishbowl.street || '';
    const normalizedFishbowlAddress = normalizeAddress(fishbowlAddress);
    
    if (normalizedFishbowlAddress.length > 5) { // Minimum address length
      // Find Copper company with matching address
      const copper = copperCompanies.find(c => {
        const copperAddress = c.Street || c.street || c.Address || c.address || '';
        const normalizedCopperAddress = normalizeAddress(copperAddress);
        return normalizedCopperAddress && normalizedCopperAddress === normalizedFishbowlAddress;
      });
      
      if (copper && !matchedFishbowlIds.has(fishbowl.id)) {
        matches.push({
          fishbowlCustomerId: fishbowl.id,
          fishbowlCustomerName: fishbowl.name || '',
          copperCompanyId: String(copper.id),
          copperCompanyName: copper.Name || copper.name || '',
          matchType: 'name',
          confidence: 'medium',
          accountNumber: `Address: ${fishbowlAddress.substring(0, 30)}...`
        });
        matchedFishbowlIds.add(fishbowl.id);
      }
    }
  }
  
  console.log(`✅ Total matched: ${matches.length} (${matchedFishbowlIds.size} unique)`);
  
  return {
    matches,
    stats: {
      totalFishbowlCustomers: fishbowlCustomers.length,
      totalCopperCompanies: copperCompanies.length,
      matched: matches.length,
      unmatched: fishbowlCustomers.length - matches.length
    }
  };
}

/**
 * Apply matches to Firestore
 */
async function applyMatches(matches: MatchResult[]): Promise<number> {
  console.log(`💾 Applying ${matches.length} matches to Firestore...`);
  
  let batch = adminDb.batch();
  let batchCount = 0;
  let totalUpdated = 0;
  
  for (const match of matches) {
    const fishbowlRef = adminDb.collection('fishbowl_customers').doc(match.fishbowlCustomerId);
    
    batch.update(fishbowlRef, {
      copperCompanyId: match.copperCompanyId,
      copperCompanyName: match.copperCompanyName,
      matchType: match.matchType,
      matchConfidence: match.confidence,
      matchedAt: new Date().toISOString()
    });
    
    batchCount++;
    
    if (batchCount >= 500) {
      await batch.commit();
      totalUpdated += batchCount;
      console.log(`💾 Updated ${totalUpdated} customers...`);
      batch = adminDb.batch();
      batchCount = 0;
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
    totalUpdated += batchCount;
  }
  
  console.log(`✅ Updated ${totalUpdated} Fishbowl customers with Copper links`);
  return totalUpdated;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    
    if (action === 'match') {
      // Just find matches, don't apply
      const result = await matchCopperToFishbowl();
      
      return NextResponse.json({
        success: true,
        ...result
      });
    } else if (action === 'apply') {
      // Find and apply matches
      const result = await matchCopperToFishbowl();
      const updated = await applyMatches(result.matches);
      
      return NextResponse.json({
        success: true,
        ...result,
        updated
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "match" or "apply"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('❌ Matching error:', error);
    return NextResponse.json(
      { error: error.message || 'Matching failed' },
      { status: 500 }
    );
  }
}
