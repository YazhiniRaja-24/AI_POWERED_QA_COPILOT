'use client';

import { recentBugs } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { Severity, Priority, BugStatus } from '@/types';

const severityClasses: Record<Severity, string> = {
  Critical: 'bg-danger/10 text-danger border-danger/20',
  High: 'bg-warning/10 text-warning border-warning/20',
  Medium: 'bg-secondary-accent/10 text-secondary-accent border-secondary-accent/20',
  Low: 'bg-muted text-muted-text border-border',
};

const priorityClasses: Record<Priority, string> = {
  P1: 'bg-danger/10 text-danger',
  P2: 'bg-warning/10 text-warning',
  P3: 'bg-secondary-accent/10 text-secondary-accent',
  P4: 'bg-muted text-muted-text',
};

const statusClasses: Record<BugStatus, string> = {
  Open: 'text-danger',
  Investigating: 'text-warning',
  Resolved: 'text-success',
};

export function RecentBugs() {
  return (
    <div className="rounded-xl bg-surface border border-border p-5 lg:p-6">
      <h3 className="text-base font-semibold text-foreground mb-1">Recent Bugs</h3>
      <p className="text-sm text-secondary-text mb-5">
        Latest issues detected across your workspace.
      </p>
      <div className="space-y-3">
        {recentBugs.map((bug) => (
          <div
            key={bug.id}
            className="flex items-center gap-4 p-3 rounded-lg bg-elevated border border-border hover:border-primary/20 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono text-muted-text">{bug.id}</span>
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded font-medium',
                    priorityClasses[bug.priority]
                  )}
                >
                  {bug.priority}
                </span>
              </div>
              <p className="text-sm text-foreground truncate">{bug.title}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  'text-xs px-2 py-1 rounded-full border font-medium whitespace-nowrap',
                  severityClasses[bug.severity]
                )}
              >
                {bug.severity}
              </span>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  statusClasses[bug.status]
                )}
              >
                {bug.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
