'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Database } from 'lucide-react';

export default function AdminUtilitiesTab() {
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillMetricsLoading, setBackfillMetricsLoading] = useState(false);
  const [wipeLoading, setWipeLoading] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState('');

  const backfillUsers = async () => {
    setBackfillLoading(true);
    try {
      const res = await fetch('/api/admin/backfill-users', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Backfill failed');
      toast.success(`Backfilled ${data.count || 0} users`);
    } catch (e: any) {
      toast.error(e.message || 'Backfill failed');
    } finally {
      setBackfillLoading(false);
    }
  };

  const backfillMetrics = async () => {
    if (!confirm('This will backfill 90 days of sales metrics. Continue?')) return;
    setBackfillMetricsLoading(true);
    try {
      const res = await fetch('/api/admin/backfill-sales-metrics', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Backfill failed');
      toast.success('Sales metrics backfilled');
    } catch (e: any) {
      toast.error(e.message || 'Backfill failed');
    } finally {
      setBackfillMetricsLoading(false);
    }
  };

  const wipeMetrics = async () => {
    if (wipeConfirm !== 'DELETE ALL METRICS') {
      toast.error('Type "DELETE ALL METRICS" to confirm');
      return;
    }
    setWipeLoading(true);
    try {
      const res = await fetch('/api/admin/wipe-metrics', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Wipe failed');
      toast.success(`Deleted ${data.count || 0} metrics`);
      setWipeConfirm('');
    } catch (e: any) {
      toast.error(e.message || 'Wipe failed');
    } finally {
      setWipeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Admin Utilities</h2>
        <p className="text-sm text-gray-600">Backfill Auth → Firestore profiles for all users.</p>
      </div>

      {/* Fishbowl Import */}
      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-md font-medium text-blue-900 mb-2">🐟 Fishbowl Data Import</h3>
            <p className="text-sm text-blue-700 mb-4">
              Import customer and sales order data from Fishbowl Excel files into Firestore. 
              This creates the data warehouse for syncing with Copper CRM.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/tools/fishbowl-import"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Database className="w-4 h-4" />
                Open Import Tool
              </Link>
              <span className="text-xs text-blue-600">
                ✅ 1,606 customers • 20,227 orders imported
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Copper Import - ALL Entities */}
      <div className="border border-green-200 rounded-lg p-4 bg-green-50">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-md font-medium text-green-900 mb-2">📥 Import All Copper Data</h3>
            <p className="text-sm text-green-700 mb-4">
              Import all Copper entities: Companies (270K), People (75K), Opportunities, Leads, and Tasks. 
              One-time bulk import with live progress tracking.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/tools/copper-import-all"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <Database className="w-4 h-4" />
                Import Copper Data
              </Link>
              <span className="text-xs text-green-600">
                ✅ 270K companies imported
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Copper ↔ Fishbowl Matching */}
      <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-purple-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-md font-medium text-purple-900 mb-2">🔗 Copper ↔ Fishbowl Matching</h3>
            <p className="text-sm text-purple-700 mb-4">
              Link Copper companies to Fishbowl customers for unified CRM data. Matches by Account Number and Order ID.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/tools/copper-fishbowl-match"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                <Database className="w-4 h-4" />
                Match Data
              </Link>
              <span className="text-xs text-purple-600">
                Link CRM to ERP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Backfill Users */}
      <div className="border rounded-lg p-4">
        <h3 className="text-md font-medium mb-2">Backfill Users</h3>
        <p className="text-sm text-gray-600 mb-4">
          Create Firestore profiles for all Firebase Auth users who don't have one yet.
        </p>
        <button
          onClick={backfillUsers}
          disabled={backfillLoading}
          className="px-4 py-2 rounded-lg bg-kanva-green text-white hover:bg-green-600 disabled:bg-gray-400"
        >
          {backfillLoading ? 'Backfilling...' : 'Backfill Users'}
        </button>
      </div>

      {/* Backfill Sales Metrics */}
      <div className="border rounded-lg p-4">
        <h3 className="text-md font-medium mb-2">Backfill Sales Metrics (90d)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Backfill 90 days of sales metrics from Copper for all users.
        </p>
        <button
          onClick={backfillMetrics}
          disabled={backfillMetricsLoading}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {backfillMetricsLoading ? 'Backfilling...' : 'Backfill Sales Metrics (90d)'}
        </button>
      </div>

      {/* Wipe Metrics */}
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <h3 className="text-md font-medium text-red-800 mb-2">⚠️ Wipe All Metrics</h3>
        <p className="text-sm text-red-700 mb-4">
          <strong>DANGER:</strong> This will delete ALL metrics from Firestore. This action cannot be undone.
        </p>
        <input
          type="text"
          value={wipeConfirm}
          onChange={(e) => setWipeConfirm(e.target.value)}
          placeholder='Type "DELETE ALL METRICS" to confirm'
          className="w-full border border-red-300 rounded-md px-3 py-2 mb-3"
        />
        <button
          onClick={wipeMetrics}
          disabled={wipeLoading || wipeConfirm !== 'DELETE ALL METRICS'}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400"
        >
          {wipeLoading ? 'Wiping...' : 'Wipe All Metrics'}
        </button>
      </div>

      {/* Coming Soon */}
      <div className="border-t pt-6">
        <h3 className="text-md font-medium mb-2">Coming Soon</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Fishbowl → Copper sync automation</li>
          <li>• Daily auto-sync schedule</li>
          <li>• Per-goal targets and defaults</li>
          <li>• Notification preferences</li>
          <li>• ShipStation integration</li>
        </ul>
      </div>
    </div>
  );
}
