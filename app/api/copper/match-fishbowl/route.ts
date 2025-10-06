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
  console.log('📥 Loading Fishbowl customers...');
  const fishbowlSnapshot = await adminDb.collection('fishbowl_customers').get();
  const fishbowlCustomers = fishbowlSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as any[];
  
  console.log(`✅ Found ${fishbowlCustomers.length} Fishbowl customers`);
  
  // Get ALL Copper companies (no limit - we need all 270K)
  console.log('📥 Loading Copper companies (this takes 20-30 seconds for 270K records)...');
  const startLoad = Date.now();
  const copperSnapshot = await adminDb.collection('copper_companies').get();
  const copperCompanies = copperSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      firestoreId: doc.id,  // Firestore document ID
      id: data.id,          // Actual Copper company ID
      ...data
    };
  }) as any[];
  const loadTime = ((Date.now() - startLoad) / 1000).toFixed(1);
  
  console.log(`✅ Loaded ${copperCompanies.length} Copper companies in ${loadTime}s`);
  
  const matches: MatchResult[] = [];
  const matchedFishbowlIds = new Set<string>();
  
  // Build lookup maps for FAST matching (O(1) instead of O(n))
  console.log('🗺️  Building lookup maps for fast matching...');
  const copperByAccountNumber = new Map<string, any>();
  const copperByOrderId = new Map<string, any>();
  const copperByAddress = new Map<string, any>();
  
  for (const copper of copperCompanies) {
    // Map by Account Number
    const accountNum = copper['Account Number cf_698260'];
    if (accountNum && String(accountNum).trim() !== '') {
      copperByAccountNumber.set(String(accountNum).trim(), copper);
    }
    
    // Map by Order ID
    const orderId = copper['Account Order ID cf_698467'] || copper.accountOrderId;
    if (orderId && String(orderId).trim() !== '') {
      copperByOrderId.set(String(orderId).trim(), copper);
    }
    
    // Map by normalized address
    const address = copper.Street || copper.street || copper.Address || copper.address || '';
    if (address) {
      const normalized = normalizeAddress(address);
      if (normalized.length > 5) {
        copperByAddress.set(normalized, copper);
      }
    }
  }
  
  const mapTime = ((Date.now() - startLoad) / 1000).toFixed(1);
  console.log(`✅ Built maps in ${mapTime}s: ${copperByAccountNumber.size} account numbers, ${copperByOrderId.size} order IDs, ${copperByAddress.size} addresses`);
  
  // Strategy 1: Match by Fishbowl Account Number → Copper Account Number
  // Both use the same field: "Account Number cf_698260"
  console.log('🔍 Strategy 1: Matching by Account Number (Fishbowl → Copper)...');
  const startMatch = Date.now();
  for (const fishbowl of fishbowlCustomers) {
    // Get Fishbowl's Account Number (stored in same field as Copper)
    const fishbowlAccountNumber = fishbowl['Account Number cf_698260'] || fishbowl.accountNumber;
    
    if (fishbowlAccountNumber && String(fishbowlAccountNumber).trim() !== '') {
      // FAST lookup using Map
      const copper = copperByAccountNumber.get(String(fishbowlAccountNumber).trim());
      
      if (copper && !matchedFishbowlIds.has(fishbowl.id)) {
        matches.push({
          fishbowlCustomerId: String(fishbowl.id),  // fb_cust_1
          fishbowlCustomerName: fishbowl.name || '',
          copperCompanyId: String(copper.id),  // Copper's simple ID
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
  
  // Strategy 2: Match by Fishbowl Account ID → Copper Order ID field
  // Fishbowl accountId = Copper "Account Order ID cf_698467"
  console.log('🔍 Strategy 2: Matching by Fishbowl Account ID (accountId → Copper Order ID)...');
  for (const fishbowl of fishbowlCustomers) {
    if (matchedFishbowlIds.has(fishbowl.id)) continue; // Already matched
    
    // Use Fishbowl's accountId (NOT fishbowlId!)
    const fishbowlAccountId = fishbowl.accountId;
    
    if (fishbowlAccountId && String(fishbowlAccountId).trim() !== '') {
      // FAST lookup using Map
      const copper = copperByOrderId.get(String(fishbowlAccountId).trim());
      
      if (copper && !matchedFishbowlIds.has(fishbowl.id)) {
        matches.push({
          fishbowlCustomerId: String(fishbowl.id),  // fb_cust_1
          fishbowlCustomerName: fishbowl.name || '',
          copperCompanyId: String(copper.id),  // Copper's simple ID
          copperCompanyName: copper.Name || copper.name || '',
          matchType: 'account_order_id',
          confidence: 'high',
          accountOrderId: String(fishbowlAccountId)
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
      // FAST lookup using Map
      const copper = copperByAddress.get(normalizedFishbowlAddress);
      
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
  
  const matchTime = ((Date.now() - startMatch) / 1000).toFixed(1);
  const totalTime = ((Date.now() - startLoad) / 1000).toFixed(1);
  console.log(`✅ Total matched: ${matches.length} (${matchedFishbowlIds.size} unique)`);
  console.log(`⏱️  Matching completed in ${matchTime}s (total: ${totalTime}s)`);
  
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
    
    // Use set with merge to avoid errors if document doesn't exist
    batch.set(fishbowlRef, {
      copperCompanyId: match.copperCompanyId,
      copperCompanyName: match.copperCompanyName,
      matchType: match.matchType,
      matchConfidence: match.confidence,
      matchedAt: new Date().toISOString()
    }, { merge: true });
    
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
    const { action, matches } = body;
    
    if (action === 'match') {
      // Just find matches, don't apply
      const result = await matchCopperToFishbowl();
      
      return NextResponse.json({
        success: true,
        ...result
      });
    } else if (action === 'apply') {
      // Apply matches passed from the client (already found)
      if (!matches || !Array.isArray(matches)) {
        return NextResponse.json(
          { error: 'Matches array required for apply action' },
          { status: 400 }
        );
      }
      
      console.log(`📝 Applying ${matches.length} matches from client...`);
      const updated = await applyMatches(matches);
      
      return NextResponse.json({
        success: true,
        updated,
        total: matches.length
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
