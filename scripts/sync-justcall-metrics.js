/**
 * JustCall Metrics Sync Script
 * 
 * Usage: Paste this into the browser console on the app to sync JustCall metrics
 * for multiple users at once.
 * 
 * This is useful for bulk operations or testing.
 */

(async function syncJustCallMetrics() {
  console.log('🔄 JustCall Metrics Sync Script');
  console.log('================================\n');

  // Configure users to sync
  const users = [
    { email: 'user1@kanvabotanicals.com' },
    { email: 'user2@kanvabotanicals.com' },
    { email: 'user3@cwlbrands.com' },
    // Add more users as needed
  ];

  // Configure date range (default: last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  console.log(`📅 Date Range: ${startDateStr} to ${endDateStr}`);
  console.log(`👥 Users to sync: ${users.length}\n`);

  const results = {
    success: [],
    failed: [],
  };

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    console.log(`[${i + 1}/${users.length}] Syncing ${user.email}...`);

    try {
      const params = new URLSearchParams({
        email: user.email,
        start_date: startDateStr,
        end_date: endDateStr,
      });

      const response = await fetch(`/api/justcall/metrics?${params.toString()}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch metrics');
      }

      const data = await response.json();
      
      console.log(`  ✅ Success - ${data.metrics.totalCalls} calls found`);
      results.success.push({
        email: user.email,
        metrics: data.metrics,
      });

      // Small delay to avoid rate limiting
      if (i < users.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`  ❌ Failed - ${error.message}`);
      results.failed.push({
        email: user.email,
        error: error.message,
      });
    }
  }

  console.log('\n================================');
  console.log('📊 Sync Complete\n');
  console.log(`✅ Successful: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}\n`);

  if (results.failed.length > 0) {
    console.log('Failed users:');
    results.failed.forEach(f => {
      console.log(`  - ${f.email}: ${f.error}`);
    });
  }

  console.log('\n💾 Results stored in window.justCallSyncResults');
  window.justCallSyncResults = results;

  return results;
})();
