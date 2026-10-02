'use client';

import { useState } from 'react';
import { Sparkles, AlertTriangle, AlertCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { aiInsights } from '@/data/mockData';
import type { AiInsight, InsightSeverity } from '@/types';
import { cn } from '@/lib/utils';

const severityConfig: Record<
  InsightSeverity,
  { label: string; icon: React.ComponentType<{ className?: string }>; classes: string }
> = {
  high: {
    label: 'High Risk',
    icon: AlertTriangle,
    classes: 'bg-danger/10 text-danger border-danger/20',
  },
  medium: {
    label: 'Medium Risk',
    icon: AlertCircle,
    classes: 'bg-warning/10 text-warning border-warning/20',
  },
  optimization: {
    label: 'Optimization',
    icon: Lightbulb,
    classes: 'bg-secondary-accent/10 text-secondary-accent border-secondary-accent/20',
  },
};

export function AiInsights() {
  const [selected, setSelected] = useState<AiInsight | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {aiInsights.map((insight) => {
          const config = severityConfig[insight.severity];
          const SevIcon = config.icon;
          return (
            <div
              key={insight.id}
              className="rounded-xl bg-surface border border-border p-5 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg bg-elevated border border-border flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-accent" />
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                    config.classes
                  )}
                >
                  <SevIcon className="w-3 h-3" />
                  {config.label}
                </span>
              </div>

              <p className="text-sm text-foreground leading-relaxed mb-3">
                {insight.title}
              </p>

              <div className="rounded-lg bg-elevated border border-border p-3 mb-4">
                <p className="text-xs text-muted-text mb-1">Recommendation</p>
                <p className="text-sm text-secondary-text">{insight.recommendation}</p>
              </div>

              <button
                onClick={() => setSelected(insight)}
                className="mt-auto flex items-center gap-1.5 text-sm text-primary-accent hover:underline self-start"
              >
                View Details
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-elevated border border-border p-6 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-accent" />
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                    severityConfig[selected.severity].classes
                  )}
                >
                  {severityConfig[selected.severity].label}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-text hover:text-foreground text-sm"
              >
                Close
              </button>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              {selected.title}
            </h3>
            <div className="rounded-lg bg-surface border border-border p-4 mt-4">
              <p className="text-xs text-muted-text mb-2 font-medium uppercase tracking-wide">
                Detailed Analysis
              </p>
              <p className="text-sm text-secondary-text leading-relaxed">
                {selected.details}
              </p>
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-text mb-1 font-medium uppercase tracking-wide">
                Recommendation
              </p>
              <p className="text-sm text-foreground">{selected.recommendation}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="mt-6 w-full h-10 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
