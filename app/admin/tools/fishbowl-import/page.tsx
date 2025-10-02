'use client';

import { useState, useRef } from 'react';

export default function FishbowlImportPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [customersFile, setCustomersFile] = useState<File | null>(null);
  const [ordersFile, setOrdersFile] = useState<File | null>(null);
  const [copperFile, setCopperFile] = useState<File | null>(null);
  const [copperLoading, setCopperLoading] = useState(false);
  const [copperResult, setCopperResult] = useState<any>(null);
  
  const customersInputRef = useRef<HTMLInputElement>(null);
  const ordersInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!customersFile && !ordersFile) {
      setError('Please select at least one file to import');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      if (customersFile) {
        formData.append('customersFile', customersFile);
      }
      if (ordersFile) {
        formData.append('ordersFile', ordersFile);
      }

      const response = await fetch('/api/fishbowl/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data);
      // Clear file selections after successful import
      setCustomersFile(null);
      setOrdersFile(null);
      if (customersInputRef.current) customersInputRef.current.value = '';
      if (ordersInputRef.current) ordersInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🐟 Fishbowl Data Import
          </h1>
          <a
            href="/admin"
            className="text-sm text-kanva-green hover:underline"
          >
            ← Back to Admin
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Excel Files</h2>
          
          <div className="space-y-6">
            {/* Customers File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👥 Customers File (FishBowl_Customers.xlsx)
              </label>
              <input
                ref={customersInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setCustomersFile(e.target.files?.[0] || null)}
                disabled={loading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              {customersFile && (
                <p className="mt-2 text-sm text-green-600">
                  ✅ Selected: {customersFile.name}
                </p>
              )}
            </div>

            {/* Sales Orders File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📦 Sales Orders File (Fishbowl_SalesOrders.xlsx)
              </label>
              <input
                ref={ordersInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setOrdersFile(e.target.files?.[0] || null)}
                disabled={loading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
              />
              {ordersFile && (
                <p className="mt-2 text-sm text-green-600">
                  ✅ Selected: {ordersFile.name}
                </p>
              )}
            </div>

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={loading || (!customersFile && !ordersFile)}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg"
            >
              {loading ? '⏳ Importing...' : '🚀 Import Files'}
            </button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> You can upload one or both files. The import will process whatever you select.
            </p>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">
              ✅ Import Successful!
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-2xl font-bold text-green-700">{result.duration}</p>
              </div>

              {result.stats.customers && (
                <div className="bg-white rounded p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">👥 Customers</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Processed</p>
                      <p className="text-xl font-bold text-blue-600">{result.stats.customers.processed}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="text-xl font-bold text-green-600">{result.stats.customers.created}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Updated</p>
                      <p className="text-xl font-bold text-yellow-600">{result.stats.customers.updated}</p>
                    </div>
                  </div>
                </div>
              )}

              {result.stats.salesOrders && (
                <div className="bg-white rounded p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">📦 Sales Orders</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Processed</p>
                      <p className="text-xl font-bold text-blue-600">{result.stats.salesOrders.processed}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="text-xl font-bold text-green-600">{result.stats.salesOrders.created}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Updated</p>
                      <p className="text-xl font-bold text-yellow-600">{result.stats.salesOrders.updated}</p>
                    </div>
                  </div>
                </div>
              )}

              {result.stats.errors > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <h4 className="font-semibold text-red-900 mb-2">
                    ⚠️ Errors: {result.stats.errors}
                  </h4>
                  {result.stats.errorSamples && result.stats.errorSamples.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {result.stats.errorSamples.map((err: any, i: number) => (
                        <div key={i} className="text-sm text-red-700">
                          <strong>{err.recordId}:</strong> {err.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4">
              <button
                onClick={() => setResult(null)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear Results
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              ❌ Import Failed
            </h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 text-sm text-red-600 hover:text-red-900"
            >
              Clear Error
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📚 How It Works
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Upload your Fishbowl Excel files (Customers and/or Sales Orders)</li>
            <li>Click "Import Files" to start the process</li>
            <li>The system parses and validates all data (dates, numbers, custom fields)</li>
            <li>Data is stored in Firestore collections:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li><code className="bg-blue-100 px-1 rounded">fishbowl_customers</code></li>
                <li><code className="bg-blue-100 px-1 rounded">fishbowl_sales_orders</code></li>
                <li><code className="bg-blue-100 px-1 rounded">sync_log</code> (audit trail)</li>
              </ul>
            </li>
            <li>Creates new records or updates existing ones (upsert)</li>
            <li>Tracks sync status for future Copper sync</li>
          </ol>
          
          <div className="mt-4 p-3 bg-white rounded border border-blue-300">
            <p className="text-sm text-blue-900 font-medium">
              ✨ <strong>Benefits of File Upload:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-blue-800 mt-1 ml-2">
              <li>No file system permissions needed</li>
              <li>Works from any location</li>
              <li>Can import updated files anytime</li>
              <li>Secure - files processed in memory</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
