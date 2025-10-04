'use client';

import { useState } from 'react';
import { UserPlus, Database, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

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

export default function CopperCreateMissingPage() {
  const [loading, setLoading] = useState(false);
  const [missing, setMissing] = useState<MissingCompany[]>([]);
  const [results, setResults] = useState<CreateResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const findMissing = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setCreated(false);

    try {
      const response = await fetch('/api/copper/create-missing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'find' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find missing companies');
      }

      setMissing(data.missing);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCompanies = async () => {
    if (!confirm(`Create ${missing.length} companies in Copper? This will assign account numbers and cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/copper/create-missing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          companies: missing,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create companies');
      }

      setResults(data.results);
      setCreated(true);
      setMissing([]); // Clear missing list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeBadge = (type: string) => {
    const colors = {
      C: 'bg-blue-100 text-blue-800',
      HQ: 'bg-purple-100 text-purple-800',
      DIST: 'bg-green-100 text-green-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <a href="/admin" className="text-sm text-kanva-green hover:underline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className="w-8 h-8 text-kanva-green" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Missing Copper Companies</h1>
              <p className="text-sm text-gray-600">
                Create Copper companies for Fishbowl customers marked "NOT IN COPPER"
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">How This Works:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Step 1:</strong> Find Fishbowl customers with accountNumber = "NOT IN COPPER"</li>
              <li>• <strong>Step 2:</strong> Review suggested account types (C, HQ, DIST)</li>
              <li>• <strong>Step 3:</strong> Create companies in Copper via API</li>
              <li>• <strong>Step 4:</strong> Assign sequential account numbers</li>
              <li>• <strong>Step 5:</strong> Update Fishbowl records with Copper account number</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={findMissing}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-kanva-green text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Database className="w-5 h-5" />
              {loading && !created ? 'Finding...' : 'Find Missing Companies'}
            </button>

            {missing.length > 0 && !created && (
              <button
                onClick={createCompanies}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-5 h-5" />
                {loading ? 'Creating...' : `Create ${missing.length} Companies`}
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Missing Companies List */}
          {missing.length > 0 && !created && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900">
                  Missing Companies ({missing.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fishbowl ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {missing.slice(0, 100).map((company) => (
                      <tr key={company.fishbowlCustomerId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{company.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {company.address && (
                            <div>
                              <div>{company.address}</div>
                              <div>{company.city}, {company.state} {company.zip}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{company.fishbowlId}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccountTypeBadge(company.suggestedAccountType)}`}>
                            {company.suggestedAccountType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {missing.length > 100 && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Showing first 100 of {missing.length} companies
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {created && results.length > 0 && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {results.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Processed</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {results.filter(r => r.status === 'created').length}
                  </div>
                  <div className="text-sm text-gray-600">Created</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {results.filter(r => r.status === 'failed').length}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>

              {/* Results Table */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Creation Results</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Copper ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.map((result) => (
                        <tr key={result.fishbowlCustomerId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {result.status === 'created' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{result.name}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">
                            {result.copperAccountNumber || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">
                            {result.copperCompanyId || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-red-600">
                            {result.error || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
