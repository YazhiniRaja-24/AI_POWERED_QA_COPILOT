'use client';

import { qualityBreakdown } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function AiQualityScore() {
  const score = 92;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-xl bg-surface border border-border p-5 lg:p-6">
      <h3 className="text-base font-semibold text-foreground mb-1">
        AI Quality Score
      </h3>
      <p className="text-sm text-secondary-text mb-6">
        AI-evaluated health of your QA workspace.
      </p>

      <div className="flex flex-col items-center mb-6">
        <div className="relative w-44 h-44">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#232C38"
              strokeWidth="10"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7C5CFF" />
                <stop offset="100%" stopColor="#5B8CFF" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground">{score}</span>
            <span className="text-sm text-muted-text">/ 100</span>
          </div>
        </div>
        <span className="mt-4 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium border border-success/20">
          Excellent
        </span>
        <p className="text-sm text-secondary-text text-center mt-3 max-w-xs">
          Your application currently shows strong test reliability and coverage.
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        {qualityBreakdown.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-secondary-text">{item.label}</span>
              <span
                className={cn(
                  'text-sm font-medium',
                  item.status ? 'text-success' : 'text-foreground'
                )}
              >
                {item.status ?? `${item.value}%`}
              </span>
            </div>
            {!item.status && (
              <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary-accent transition-all duration-500"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
