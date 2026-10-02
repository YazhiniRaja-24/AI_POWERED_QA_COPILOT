'use client';

import { FileText, Bot, PenLine, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

interface SummaryCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  info: string;
  accent: string;
}

function SummaryCard({
  icon,
  label,
  value,
  info,
  accent,
}: SummaryCardProps) {
  return (
    <div className="group rounded-xl bg-surface border border-border p-5 hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-elevated border border-border flex items-center justify-center group-hover:border-primary/20 transition-colors">
          {icon}
        </div>
        <span className="text-xs text-muted-text">{info}</span>
      </div>
      <p className="text-xs text-secondary-text mb-1 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}

interface SummaryCardsProps {
  total: number;
  automated: number;
  manual: number;
  coverage: string;
}

export function SummaryCards({
  total,
  automated,
  manual,
  coverage,
}: SummaryCardsProps) {
  const automatedPct = total > 0 ? Math.round((automated / total) * 100) : 0;
  const manualPct = total > 0 ? Math.round((manual / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        icon={<FileText className="w-5 h-5 text-primary-accent" />}
        label="Total Test Cases"
        value={String(total)}
        info="Across all suites"
        accent="text-foreground"
      />
      <SummaryCard
        icon={<Bot className="w-5 h-5 text-success" />}
        label="Automated"
        value={String(automated)}
        info={`${automatedPct}% automated`}
        accent="text-success"
      />
      <SummaryCard
        icon={<PenLine className="w-5 h-5 text-warning" />}
        label="Manual"
        value={String(manual)}
        info={`${manualPct}% manual`}
        accent="text-warning"
      />
      <SummaryCard
        icon={<ShieldCheck className="w-5 h-5 text-primary-accent" />}
        label="Coverage"
        value={coverage}
        info="+4.6% this month"
        accent="text-foreground"
      />
    </div>
  );
}
