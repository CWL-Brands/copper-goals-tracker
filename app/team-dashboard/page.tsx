'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { settingsService, metricService } from '@/lib/firebase/services';
import { GoalPeriod, GoalType } from '@/types';
import Link from 'next/link';

const goalTypes: GoalType[] = [
  'talk_time',
  'email_quantity',
  'lead_progression_a',
  'lead_progression_b',
  'lead_progression_c',
  'new_sales_wholesale',
  'new_sales_distribution',
];

const periodLabels: Record<GoalPeriod, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export default function TeamDashboardPage() {
  const [period, setPeriod] = useState<GoalPeriod>('daily');
  const [teamGoals, setTeamGoals] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Record<GoalType, number>>({
    talk_time: 0,
    email_quantity: 0,
    lead_progression_a: 0,
    lead_progression_b: 0,
    lead_progression_c: 0,
    new_sales_wholesale: 0,
    new_sales_distribution: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const tg = await settingsService.getTeamGoals();
        if (!cancelled) setTeamGoals(tg || {});

        // Aggregate metrics for the selected period across the team
        const entries = await Promise.all(
          goalTypes.map(async (t) => [t, await metricService.getTeamMetrics(t, period)] as const)
        );
        // Sum values per type
        const agg: any = {};
        for (const [type, map] of entries) {
          let total = 0;
          // map is Map<userId, number>
          (map as Map<string, number>).forEach((v) => (total += v));
          agg[type] = total;
        }
        if (!cancelled) setMetrics(agg as Record<GoalType, number>);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [period]);

  // Helpers to compute pace
  const getElapsedFraction = (p: GoalPeriod) => {
    const now = new Date();
    if (p === 'daily') {
      const start = new Date(now); start.setHours(0,0,0,0);
      const total = 24 * 60 * 60 * 1000;
      return Math.min(0.999, Math.max(0.001, (now.getTime() - start.getTime()) / total));
    }
    if (p === 'weekly') {
      const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0,0,0,0);
      const total = 7 * 24 * 60 * 60 * 1000;
      return Math.min(0.999, Math.max(0.001, (now.getTime() - start.getTime()) / total));
    }
    // monthly ~ last 30 days window
    const start = new Date(now); start.setDate(now.getDate() - 29); start.setHours(0,0,0,0);
    const total = 30 * 24 * 60 * 60 * 1000;
    return Math.min(0.999, Math.max(0.001, (now.getTime() - start.getTime()) / total));
  };

  const kpiCards = useMemo(() => {
    const toTitle = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    return goalTypes.map((type) => {
      const value = metrics[type] || 0;
      const target = teamGoals?.[period]?.[type] ?? 0;
      const pct = target > 0 ? Math.min((value / target) * 100, 999) : 0;
      const elapsed = getElapsedFraction(period);
      const projected = value / elapsed; // naive pace projection
      const onPace = target > 0 ? projected >= target : true;
      return (
        <div key={type} className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-gray-500">{toTitle(type)}</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {type.startsWith('new_sales_') ? `$${value.toLocaleString()}` : value}
          </div>
          <div className="mt-3">
            <div className="h-2 bg-gray-100 rounded">
              <div className="h-2 bg-kanva-green rounded" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{pct.toFixed(0)}%</span>
              <span>Target: {type.startsWith('new_sales_') ? `$${Number(target).toLocaleString()}` : target}</span>
            </div>
            <div className="mt-2 text-xs">
              <span className={onPace ? 'text-green-600' : 'text-amber-600'}>
                Pace: proj {type.startsWith('new_sales_') ? `$${Math.round(projected).toLocaleString()}` : Math.round(projected)} by period end
              </span>
            </div>
          </div>
        </div>
      );
    });
  }, [metrics, teamGoals, period]);

  return (
    <div>
      {/* Page Heading */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Team Dashboard</h1>
        <Link href="https://app.copper.com/companies/562111/app#/browse/board/opportunities/default?pipeline=1084986" target="_blank" className="text-sm text-kanva-green hover:underline">
          View Sales Pipeline →
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['daily', 'weekly', 'monthly'] as GoalPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                period === p ? 'bg-white text-kanva-green shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-600">Loading team metrics…</div>
      ) : (
        <>
          {/* Sales Totals Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {(() => {
              const wholesale = metrics['new_sales_wholesale'] || 0;
              const distribution = metrics['new_sales_distribution'] || 0;
              const total = wholesale + distribution;
              const tg = (teamGoals?.[period]?.['new_sales_wholesale'] ?? 0) + (teamGoals?.[period]?.['new_sales_distribution'] ?? 0);
              const pct = tg > 0 ? Math.min((total / tg) * 100, 999) : 0;
              const elapsed = getElapsedFraction(period);
              const projected = total / elapsed;
              const onPace = tg > 0 ? projected >= tg : true;
              return (
                <>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="text-sm text-gray-500">Wholesale Sales</div>
                    <div className="text-2xl font-semibold">${wholesale.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="text-sm text-gray-500">Distribution Sales</div>
                    <div className="text-2xl font-semibold">${distribution.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="text-sm text-gray-500">Team Sales Total</div>
                    <div className="text-2xl font-semibold">${total.toLocaleString()}</div>
                    <div className="mt-3 h-2 bg-gray-100 rounded">
                      <div className="h-2 bg-kanva-green rounded" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{pct.toFixed(0)}%</span>
                      <span>Target: ${tg.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 text-xs">
                      <span className={onPace ? 'text-green-600' : 'text-amber-600'}>Pace: proj ${Math.round(projected).toLocaleString()}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{kpiCards}</div>

          {/* Stage distribution simple chart */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Pipeline Stage Distribution ({periodLabels[period]})</h3>
            <div className="space-y-4">
              {(['lead_progression_a', 'lead_progression_b', 'lead_progression_c'] as GoalType[]).map((t) => {
                const v = metrics[t] || 0;
                const max = Math.max(1, metrics['lead_progression_a'], metrics['lead_progression_b'], metrics['lead_progression_c']);
                const w = Math.round((v / max) * 100);
                const label = t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                return (
                  <div key={t}>
                    <div className="flex justify-between text-sm text-gray-700"><span>{label}</span><span>{v}</span></div>
                    <div className="h-2 bg-gray-100 rounded">
                      <div className="h-2 bg-kanva-green rounded" style={{ width: `${w}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
