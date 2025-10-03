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
 * Match Copper companies to Fishbowl customers
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
  console.log('🔗 Starting Copper ↔ Fishbowl matching...');
  
  // Get all Fishbowl customers
  const fishbowlSnapshot = await adminDb.collection('fishbowl_customers').get();
  const fishbowlCustomers = fishbowlSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  console.log(`📊 Found ${fishbowlCustomers.length} Fishbowl customers`);
  
  // Get all Copper companies (with pagination if needed)
  const copperSnapshot = await adminDb.collection('copper_companies').limit(10000).get();
  const copperCompanies = copperSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  console.log(`📊 Found ${copperCompanies.length} Copper companies (first 10K)`);
  
  const matches: MatchResult[] = [];
  const matchedFishbowlIds = new Set<string>();
  
  // Strategy 1: Match by Account Number
  console.log('🔍 Matching by Account Number...');
  for (const copper of copperCompanies) {
    const accountNumber = copper['Account Number cf_698260'] || copper.accountNumber;
    
    if (accountNumber && String(accountNumber).trim() !== '') {
      const fishbowl = fishbowlCustomers.find(f => 
        f.accountId === accountNumber || 
        String(f.accountId) === String(accountNumber)
      );
      
      if (fishbowl && !matchedFishbowlIds.has(fishbowl.id)) {
        matches.push({
          fishbowlCustomerId: fishbowl.id,
          fishbowlCustomerName: fishbowl.name || '',
          copperCompanyId: String(copper.id),
          copperCompanyName: copper.Name || copper.name || '',
          matchType: 'account_number',
          confidence: 'high',
          accountNumber: String(accountNumber)
        });
        matchedFishbowlIds.add(fishbowl.id);
      }
    }
  }
  
  console.log(`✅ Matched ${matches.length} by Account Number`);
  
  // Strategy 2: Match by Account Order ID (from sales orders)
  console.log('🔍 Matching by Account Order ID...');
  const ordersSnapshot = await adminDb.collection('fishbowl_sales_orders').limit(5000).get();
  const orders = ordersSnapshot.docs.map(doc => doc.data());
  
  for (const copper of copperCompanies) {
    const accountOrderId = copper['Account Order ID cf_698467'] || copper.accountOrderId;
    
    if (accountOrderId && String(accountOrderId).trim() !== '') {
      // Find order with this ID
      const order = orders.find(o => 
        String(o.id) === String(accountOrderId) ||
        String(o.num) === String(accountOrderId)
      );
      
      if (order && order.customerId) {
        const fishbowl = fishbowlCustomers.find(f => f.id === order.customerId);
        
        if (fishbowl && !matchedFishbowlIds.has(fishbowl.id)) {
          matches.push({
            fishbowlCustomerId: fishbowl.id,
            fishbowlCustomerName: fishbowl.name || '',
            copperCompanyId: String(copper.id),
            copperCompanyName: copper.Name || copper.name || '',
            matchType: 'account_order_id',
            confidence: 'high',
            accountOrderId: String(accountOrderId)
          });
          matchedFishbowlIds.add(fishbowl.id);
        }
      }
    }
  }
  
  console.log(`✅ Total matched: ${matches.length}`);
  
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
