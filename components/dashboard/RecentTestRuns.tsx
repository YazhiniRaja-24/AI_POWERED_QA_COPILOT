'use client';

import { useMemo } from 'react';
import { recentTestRuns } from '@/data/mockData';
import { runCounts, useFlowState } from '@/lib/flow-store';
import { cn } from '@/lib/utils';
import type { TestRun } from '@/types';

export function RecentTestRuns() {
  const { runs } = useFlowState();

  const rows: TestRun[] = useMemo(() => {
    const local: TestRun[] = runs.map((run) => {
      const counts = runCounts(run);
      return {
        id: run.id,
        name: run.name,
        framework: run.framework,
        total: run.total,
        passed: counts.passed,
        failed: counts.failed,
        duration: run.status === 'Running' ? '—' : run.duration,
        status: run.status,
      };
    });
    return [...local, ...recentTestRuns].slice(0, 6);
  }, [runs]);

  return (
    <div className="rounded-xl bg-surface border border-border overflow-hidden">
      <div className="p-5 border-b border-border">
        <h3 className="text-base font-semibold text-foreground">Recent Test Runs</h3>
        <p className="text-sm text-secondary-text mt-0.5">
          Latest executions across your test suites.
        </p>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Test Run', 'Framework', 'Tests', 'Passed', 'Failed', 'Duration', 'Status'].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-text whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((run) => (
              <tr
                key={run.id}
                className="border-b border-border last:border-0 hover:bg-elevated/50 transition-colors"
              >
                <td className="px-5 py-3.5 font-medium text-foreground whitespace-nowrap">
                  {run.name}
                </td>
                <td className="px-5 py-3.5 text-secondary-text whitespace-nowrap">
                  {run.framework}
                </td>
                <td className="px-5 py-3.5 text-secondary-text whitespace-nowrap">
                  {run.total}
                </td>
                <td className="px-5 py-3.5 text-success whitespace-nowrap">{run.passed}</td>
                <td className="px-5 py-3.5 text-danger whitespace-nowrap">{run.failed}</td>
                <td className="px-5 py-3.5 text-secondary-text whitespace-nowrap">
                  {run.duration}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                      run.status === 'Passed'
                        ? 'bg-success/10 text-success border border-success/20'
                        : run.status === 'Running'
                          ? 'bg-primary/10 text-primary-accent border border-primary/20'
                          : 'bg-danger/10 text-danger border border-danger/20'
                    )}
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        run.status === 'Passed'
                          ? 'bg-success'
                          : run.status === 'Running'
                            ? 'bg-primary-accent animate-pulse'
                            : 'bg-danger'
                      )}
                    />
                    {run.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
