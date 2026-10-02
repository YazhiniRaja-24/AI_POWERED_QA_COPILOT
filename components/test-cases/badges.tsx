'use client';

import type {
  TestCasePriority,
  TestCaseStatus,
  TestCaseType,
  TestFramework,
} from '@/types';
import { cn } from '@/lib/utils';

interface BadgeProps {
  className?: string;
}

const base =
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium';

export function StatusBadge({
  status,
  className,
}: BadgeProps & { status: TestCaseStatus }) {
  const dot = {
    Draft: 'bg-muted-text',
    Ready: 'bg-primary',
    Passed: 'bg-success',
    Failed: 'bg-danger',
    Blocked: 'bg-warning',
  }[status];

  const styles = {
    Draft: 'border-border text-secondary-text bg-elevated',
    Ready: 'border-primary/30 text-primary-accent bg-primary/10',
    Passed: 'border-success/30 text-success bg-success/10',
    Failed: 'border-danger/30 text-danger bg-danger/10',
    Blocked: 'border-warning/30 text-warning bg-warning/10',
  }[status];

  return (
    <span className={cn(base, styles, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
      {status}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: BadgeProps & { priority: TestCasePriority }) {
  const styles = {
    Critical: 'border-danger/40 text-danger bg-danger/10',
    High: 'border-warning/40 text-warning bg-warning/10',
    Medium: 'border-primary/40 text-primary-accent bg-primary/10',
    Low: 'border-border text-secondary-text bg-elevated',
  }[priority];

  return (
    <span className={cn(base, styles, className)}>
      <span className="w-1 h-1 rounded-full bg-current" />
      {priority}
    </span>
  );
}

export function TypeBadge({
  type,
  className,
}: BadgeProps & { type: TestCaseType }) {
  return (
    <span
      className={cn(
        base,
        'border-border text-secondary-text bg-elevated',
        className
      )}
    >
      {type}
    </span>
  );
}

export function FrameworkBadge({
  framework,
  className,
}: BadgeProps & { framework: TestFramework }) {
  return (
    <span
      className={cn(
        base,
        'border-border/60 text-foreground bg-surface',
        className
      )}
    >
      {framework}
    </span>
  );
}
