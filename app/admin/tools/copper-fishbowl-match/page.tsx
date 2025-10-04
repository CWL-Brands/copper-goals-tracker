'use client';

import { useState } from 'react';
import { Link2, Database, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

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

interface MatchStats {
  totalFishbowlCustomers: number;
  totalCopperCompanies: number;
  matched: number;
  unmatched: number;
}

export default function CopperFishbowlMatchPage() {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [progress, setProgress] = useState<{
    stage: string;
    current: number;
    total: number;
    matchCount: number;
  } | null>(null);

  const findMatches = async () => {
    setLoading(true);
    setError(null);
    setApplied(false);
    
    try {
      // Show realistic progress stages
      setProgress({ stage: '📥 Loading Fishbowl customers...', current: 1, total: 5, matchCount: 0 });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress({ stage: '📥 Loading Copper companies (270K records)...', current: 2, total: 5, matchCount: 0 });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress({ stage: '🔍 Strategy 1: Matching by Account Number...', current: 3, total: 5, matchCount: 0 });
      
      const response = await fetch('/api/copper/match-fishbowl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'match' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find matches');
      }

      setMatches(data.matches);
      setStats(data.stats);
      setProgress({ 
        stage: 'Complete!', 
        current: data.stats.totalFishbowlCustomers, 
        total: data.stats.totalFishbowlCustomers,
        matchCount: data.stats.matched 
      });

      // Trigger confetti celebration! 🎉
      if (data.stats.matched > 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyMatches = async () => {
    if (!window.confirm(`Apply ${matches.length} matches to Firestore? This will update fishbowl_customers with Copper links.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/copper/match-fishbowl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply matches');
      }

      setMatches(data.matches);
      setStats(data.stats);
      setApplied(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'account_number': return 'Account Number';
      case 'account_order_id': return 'Account Order ID';
      case 'name': return 'Company Name';
      default: return type;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800'
    };
    return colors[confidence as keyof typeof colors] || colors.low;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Link2 className="w-8 h-8 text-kanva-green" />
              Copper ↔ Fishbowl Matching
            </h1>
            <p className="text-gray-600 mt-2">
              Link Copper companies to Fishbowl customers for unified CRM data
            </p>
          </div>
          <a href="/admin" className="text-sm text-kanva-green hover:underline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </a>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How Matching Works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Strategy 1 - Account Number:</strong> Fishbowl "Account Number" (custom field) → Copper "Account Number cf_698260" (C, HQ, etc.)</li>
            <li>• <strong>Strategy 2 - Customer Number:</strong> Fishbowl Customer ID → Copper "Account Order ID cf_698467"</li>
            <li>• <strong>Strategy 3 - Address:</strong> Exact address match (for new Fishbowl customers without Copper link)</li>
            <li>• <strong>High Confidence:</strong> Account Number or Customer Number match</li>
            <li>• <strong>Medium Confidence:</strong> Address match only</li>
          </ul>
        </div>

        {/* Confetti Animation */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="text-9xl animate-bounce">🎉</div>
          </div>
        )}

        {/* Progress Bar */}
        {loading && progress && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold text-gray-800">{progress.stage}</span>
                <span className="text-sm font-bold text-kanva-green">
                  {progress.matchCount > 0 && `${progress.matchCount} matches! 🎯`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-kanva-green via-green-500 to-green-600 h-6 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                  style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-600 font-medium">
                  Step {progress.current} of {progress.total}
                </span>
                <span className="text-lg font-bold text-kanva-green">
                  {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
                </span>
              </div>
              {progress.current === 3 && (
                <div className="mt-3 text-xs text-gray-500 italic">
                  ⏳ Processing large dataset... This may take 30-60 seconds
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={findMatches}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-kanva-green text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
            >
              <Database className="w-5 h-5" />
              {loading ? '🔍 Scanning...' : 'Find Matches'}
            </button>

            {matches.length > 0 && !applied && (
              <button
                onClick={applyMatches}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                Apply {matches.length} Matches
              </button>
            )}
          </div>

          {loading && (
            <p className="text-sm text-gray-600 mt-4">
              ⏳ Processing... This may take a few minutes for large datasets.
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {applied && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-green-900">Matches Applied!</h3>
                <p className="text-sm text-green-800">
                  Successfully updated {matches.length} Fishbowl customers with Copper company links.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Fishbowl Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFishbowlCustomers.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Copper Companies</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCopperCompanies.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Matched</p>
              <p className="text-2xl font-bold text-green-600">{stats.matched.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Unmatched</p>
              <p className="text-2xl font-bold text-gray-600">{stats.unmatched.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Matches Table */}
        {matches.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Match Results ({matches.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fishbowl Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Copper Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identifier</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {matches.slice(0, 100).map((match, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{match.fishbowlCustomerName}</div>
                        <div className="text-xs text-gray-500">ID: {match.fishbowlCustomerId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{match.copperCompanyName}</div>
                        <div className="text-xs text-gray-500">ID: {match.copperCompanyId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getMatchTypeLabel(match.matchType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceBadge(match.confidence)}`}>
                          {match.confidence}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {match.accountNumber || match.accountOrderId || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {matches.length > 100 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing first 100 of {matches.length} matches
                </p>
              </div>
            )}
          </div>
        )}

        {/* No Matches */}
        {!loading && matches.length === 0 && stats && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matches Found</h3>
            <p className="text-gray-600">
              No Copper companies could be matched to Fishbowl customers using the available identifiers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
