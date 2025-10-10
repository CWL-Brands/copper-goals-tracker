'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function FishbowlTab() {
  const [loading, setLoading] = useState(false);
  const [fishbowlUsers, setFishbowlUsers] = useState<string[]>([]);
  const [firebaseUsers, setFirebaseUsers] = useState<any[]>([]);
  const [userMapping, setUserMapping] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Load Fishbowl salesmen and Firebase users
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { auth } = await import('@/lib/firebase/client');
      const user = auth.currentUser;
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const token = await user.getIdToken();

      // Load Firebase users
      const usersRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const usersData = await usersRes.json();
      if (!usersRes.ok) throw new Error(usersData?.error || 'Failed to load users');
      
      // Filter to sales users
      const salesUsers = (usersData.users || [])
        .filter((u: any) => (u.role === 'sales' || u.role === 'admin') && u.isActive !== false)
        .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
      setFirebaseUsers(salesUsers);

      // Load existing mapping
      const mappingRes = await fetch('/api/admin/fishbowl-mapping', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (mappingRes.ok) {
        const mappingData = await mappingRes.json();
        setUserMapping(mappingData.mapping || {});
      }

      // Load unique Fishbowl salesmen from orders
      const salesmenRes = await fetch('/api/admin/fishbowl-salesmen', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (salesmenRes.ok) {
        const salesmenData = await salesmenRes.json();
        console.log('[Fishbowl Tab] Salesmen data:', salesmenData);
        setFishbowlUsers(salesmenData.salesmen || []);
        
        if (salesmenData.totalOrders === 0) {
          toast.error('No Fishbowl orders found. Please import Fishbowl data first.');
        } else if (salesmenData.count === 0) {
          toast.error(`Found ${salesmenData.totalOrders} orders but no salesman field. Check server logs.`);
        } else {
          toast.success(`Loaded ${salesmenData.count} salesmen from ${salesmenData.totalOrders} orders`);
        }
      } else {
        const errorData = await salesmenRes.json();
        throw new Error(errorData?.error || 'Failed to load salesmen');
      }
    } catch (e: any) {
      console.error('[Fishbowl Tab] Error:', e);
      toast.error(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const saveMapping = async () => {
    setLoading(true);
    try {
      const { auth } = await import('@/lib/firebase/client');
      const user = auth.currentUser;
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch('/api/admin/fishbowl-mapping', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mapping: userMapping }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save mapping');

      toast.success('Mapping saved successfully!');
    } catch (e: any) {
      console.error('[Fishbowl Tab] Error:', e);
      toast.error(e.message || 'Failed to save mapping');
    } finally {
      setLoading(false);
    }
  };

  const syncSales = async () => {
    setSyncing(true);
    setSyncResults(null);
    try {
      const { auth } = await import('@/lib/firebase/client');
      const user = auth.currentUser;
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch('/api/sync-fishbowl-sales', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to sync sales');

      setSyncResults(data);
      toast.success(`Synced ${data.metricsCreated} metrics from ${data.ordersProcessed} orders!`);
    } catch (e: any) {
      console.error('[Fishbowl Tab] Error:', e);
      toast.error(e.message || 'Failed to sync sales');
    } finally {
      setSyncing(false);
    }
  };

  const setLast90Days = () => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 90);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Fishbowl Sales Integration</h2>
        <p className="text-sm text-gray-600 mt-1">
          Map Fishbowl salesmen to Firebase users and sync sales data
        </p>
      </div>

      {/* User Mapping Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">User Mapping</h3>
            <p className="text-sm text-gray-600">Map Fishbowl salesman names to Firebase users</p>
          </div>
          <button
            onClick={saveMapping}
            disabled={loading}
            className="px-4 py-2 bg-kanva-green text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Mapping'}
          </button>
        </div>

        {fishbowlUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No Fishbowl salesmen found. Make sure Fishbowl data is imported.</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Reload Data
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {fishbowlUsers.map((salesman) => (
              <div key={salesman} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{salesman}</p>
                  <p className="text-xs text-gray-500">Fishbowl Salesman</p>
                </div>
                <div className="flex-1">
                  <select
                    value={userMapping[salesman] || ''}
                    onChange={(e) => setUserMapping({ ...userMapping, [salesman]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kanva-green"
                  >
                    <option value="">-- Select Firebase User --</option>
                    {firebaseUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Sync Fishbowl Sales</h3>
        
        <div className="space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kanva-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kanva-green"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={setLast90Days}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
            >
              Last 90 Days
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={syncSales}
            disabled={syncing || Object.keys(userMapping).length === 0}
            className="w-full px-6 py-3 bg-kanva-green text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium"
          >
            {syncing ? 'Syncing...' : 'Sync Fishbowl Sales'}
          </button>

          {Object.keys(userMapping).length === 0 && (
            <p className="text-sm text-orange-600 text-center">
              ⚠️ Please map Fishbowl users first before syncing
            </p>
          )}
        </div>

        {/* Results */}
        {syncResults && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">✅ Sync Complete!</h4>
            <div className="space-y-1 text-sm text-green-800">
              <p>• Processed {syncResults.ordersProcessed} orders</p>
              <p>• Created {syncResults.metricsCreated} metrics</p>
              <p>• Date range: {new Date(syncResults.dateRange.start).toLocaleDateString()} - {new Date(syncResults.dateRange.end).toLocaleDateString()}</p>
            </div>
            
            {syncResults.results && syncResults.results.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-green-900">
                  View Details ({syncResults.results.length} entries)
                </summary>
                <div className="mt-2 max-h-64 overflow-y-auto space-y-1 text-xs">
                  {syncResults.results.map((r: any, i: number) => (
                    <div key={i} className="p-2 bg-white rounded border">
                      {r.date} | {r.type} | ${r.value.toLocaleString()}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ How It Works</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Fishbowl orders are automatically categorized by customer accountType</li>
          <li>• Wholesale customers → <code className="bg-blue-100 px-1 rounded">new_sales_wholesale</code></li>
          <li>• Distribution customers → <code className="bg-blue-100 px-1 rounded">new_sales_distribution</code></li>
          <li>• Retail customers are skipped (not tracked in goals)</li>
          <li>• Sales are grouped by day and summed</li>
          <li>• Running sync multiple times won't create duplicates</li>
        </ul>
      </div>
    </div>
  );
}
