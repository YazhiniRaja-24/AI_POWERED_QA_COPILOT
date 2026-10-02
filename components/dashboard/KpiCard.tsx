'use client';

import { cn } from '@/lib/utils';
import {
  Beaker,
  CheckCircle2,
  XCircle,
  Bug,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { KpiMetric } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Beaker,
  CheckCircle2,
  XCircle,
  Bug,
  ShieldCheck,
  Sparkles,
};

export function KpiCard({ metric }: { metric: KpiMetric }) {
  const Icon = iconMap[metric.icon] ?? Beaker;
  const TrendIcon = metric.positive ? TrendingUp : TrendingDown;
  const max = Math.max(...metric.trend);
  const points = metric.trend
    .map((v, i) => `${(i / (metric.trend.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(' ');

  return (
    <div className="group rounded-xl bg-surface border border-border p-5 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-elevated border border-border flex items-center justify-center group-hover:border-primary/20 transition-colors">
          <Icon className="w-5 h-5 text-primary-accent" />
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md',
            metric.positive
              ? 'bg-success/10 text-success'
              : 'bg-danger/10 text-danger'
          )}
        >
          <TrendIcon className="w-3 h-3" />
          {metric.change}
        </div>
      </div>

      <p className="text-sm text-secondary-text mb-1">{metric.label}</p>
      <p className="text-2xl font-bold text-foreground tracking-tight">
        {metric.value}
      </p>

      <div className="mt-4 h-8">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id={`grad-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points={points}
            fill="none"
            stroke="#7C5CFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <polygon points={`0,100 ${points} 100,100`} fill={`url(#grad-${metric.id})`} />
        </svg>
      </div>
    </div>
  );
}
