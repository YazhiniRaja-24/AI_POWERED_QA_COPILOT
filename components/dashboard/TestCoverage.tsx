'use client';

import { coverageAreas } from '@/data/mockData';
import { AlertCircle } from 'lucide-react';

export function TestCoverage() {
  return (
    <div className="rounded-xl bg-surface border border-border p-5 lg:p-6">
      <h3 className="text-base font-semibold text-foreground mb-1">Test Coverage</h3>
      <p className="text-sm text-secondary-text mb-5">
        Coverage breakdown across your application areas.
      </p>

      <div className="mb-6">
        <div className="flex items-end justify-between mb-2">
          <span className="text-sm text-secondary-text">Overall</span>
          <span className="text-2xl font-bold text-foreground">87.4%</span>
        </div>
        <div className="h-2 rounded-full bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary-accent transition-all duration-500"
            style={{ width: '87.4%' }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {coverageAreas.map((area) => (
          <div key={area.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-secondary-text">{area.label}</span>
              <span className="text-sm font-medium text-foreground">{area.value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary-accent transition-all duration-500"
                style={{ width: `${area.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-border flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-sm text-secondary-text">
          <span className="text-foreground font-medium">12 critical scenarios</span> are
          currently uncovered.
        </p>
      </div>
    </div>
  );
}
