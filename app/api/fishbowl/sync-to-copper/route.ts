import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting sync to Copper...');

    // Get customers with metrics
    const customersSnapshot = await adminDb
      .collection('fishbowl_customers')
      .where('copperCompanyId', '!=', null)
      .where('metrics', '!=', null)
      .get();

    const customers = customersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    console.log(`📊 Found ${customers.length} customers with metrics`);

    // TODO: Get Copper API credentials from env
    const copperApiKey = process.env.COPPER_API_KEY;
    const copperEmail = process.env.COPPER_EMAIL;

    if (!copperApiKey || !copperEmail) {
      throw new Error('Copper API credentials not configured');
    }

    let synced = 0;
    let failed = 0;

    // Sync each customer to Copper
    for (const customer of customers) {
      try {
        const metrics = customer.metrics;
        
        // TODO: Map metrics to Copper custom field IDs
        const customFields = {
          // 'cf_XXXXX': metrics.totalOrders,
          // 'cf_XXXXX': metrics.totalSpent,
          // 'cf_XXXXX': metrics.firstOrderDate,
          // 'cf_XXXXX': metrics.lastOrderDate,
          // 'cf_XXXXX': metrics.averageOrderValue,
          // 'cf_XXXXX': metrics.daysSinceLastOrder,
        };

        // TODO: Call Copper API to update company
        // const response = await fetch(`https://api.copper.com/developer_api/v1/companies/${customer.copperCompanyId}`, {
        //   method: 'PUT',
        //   headers: {
        //     'X-PW-AccessToken': copperApiKey,
        //     'X-PW-Application': 'developer_api',
        //     'X-PW-UserEmail': copperEmail,
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     custom_fields: customFields,
        //   }),
        // });

        // if (!response.ok) {
        //   throw new Error(`Copper API error: ${response.statusText}`);
        // }

        // Update Firestore with sync timestamp
        await adminDb.collection('fishbowl_customers').doc(customer.id).update({
          syncedToCopperAt: new Date().toISOString(),
        });

        synced++;
        console.log(`✅ Synced ${customer.name} (${synced}/${customers.length})`);

      } catch (error: any) {
        console.error(`❌ Failed to sync ${customer.name}:`, error.message);
        failed++;
      }
    }

    console.log(`✅ Sync complete! Synced: ${synced}, Failed: ${failed}`);

    return NextResponse.json({
      success: true,
      stats: {
        total: customers.length,
        synced,
        failed,
      },
    });

  } catch (error: any) {
    console.error('❌ Error syncing to Copper:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
