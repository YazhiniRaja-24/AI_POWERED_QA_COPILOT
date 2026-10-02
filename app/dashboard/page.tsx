'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { kpiMetrics } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { TestHealthChart } from '@/components/dashboard/TestHealthChart';
import { AiQualityScore } from '@/components/dashboard/AiQualityScore';
import { AiInsights } from '@/components/dashboard/AiInsights';
import { RecentTestRuns } from '@/components/dashboard/RecentTestRuns';
import { RecentBugs } from '@/components/dashboard/RecentBugs';
import { TestCoverage } from '@/components/dashboard/TestCoverage';

const dateRanges = ['7 Days', '30 Days'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [range, setRange] = useState(0);
  const firstName = (user?.name || 'Yazhini').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {greeting}, {firstName}.
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Here&apos;s what&apos;s happening across your QA workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border border-border">
            {dateRanges.map((r, i) => (
              <button
                key={r}
                onClick={() => setRange(i)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  range === i
                    ? 'bg-primary text-white'
                    : 'text-secondary-text hover:text-foreground'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            New Test
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiMetrics.map((m) => (
          <KpiCard key={m.id} metric={m} />
        ))}
      </div>

      {/* Chart + AI Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TestHealthChart />
        </div>
        <div>
          <AiQualityScore />
        </div>
      </div>

      {/* AI Insights */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">AI Insights</h2>
          <p className="text-sm text-secondary-text mt-0.5">
            Intelligent analysis and recommendations from your QA data.
          </p>
        </div>
        <AiInsights />
      </div>

      {/* Test Runs + Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentTestRuns />
        </div>
        <div>
          <TestCoverage />
        </div>
      </div>

      {/* Recent Bugs */}
      <RecentBugs />
    </div>
  );
}
