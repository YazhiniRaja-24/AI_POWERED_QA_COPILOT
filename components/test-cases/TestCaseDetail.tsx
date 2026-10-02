'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TypeBadge, PriorityBadge, FrameworkBadge, StatusBadge } from './badges';
import { Copy, Pencil, Trash2, Play, User, Clock } from 'lucide-react';
import type { TestCase } from '@/types';

interface TestCaseDetailProps {
  testCase: TestCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (testCase: TestCase) => void;
  onDuplicate: (testCase: TestCase) => void;
  onDelete: (testCase: TestCase) => void;
  onRun: (testCase: TestCase) => void;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-text mb-2">
        {label}
      </h4>
      <div>{children}</div>
    </div>
  );
}

export function TestCaseDetail({
  testCase,
  open,
  onOpenChange,
  onEdit,
  onDuplicate,
  onDelete,
  onRun,
}: TestCaseDetailProps) {
  if (!testCase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin bg-background">
        <DialogHeader className="text-left pr-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-text">
              {testCase.id}
            </span>
            <StatusBadge status={testCase.status} />
          </div>
          <DialogTitle className="text-xl">{testCase.title}</DialogTitle>
          <DialogDescription className="mt-2 text-secondary-text">
            {testCase.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <TypeBadge type={testCase.type} />
          <PriorityBadge priority={testCase.priority} />
          <FrameworkBadge framework={testCase.framework} />
          {testCase.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs text-primary-accent bg-primary/5"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="space-y-5 pt-2">
          <DetailRow label="Preconditions">
            <p className="text-sm text-foreground leading-relaxed">
              {testCase.preconditions}
            </p>
          </DetailRow>

          <DetailRow label="Test Steps">
            <ol className="space-y-1.5">
              {testCase.steps.map((step, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm text-foreground"
                >
                  <span className="w-5 h-5 shrink-0 rounded-full bg-elevated border border-border text-xs text-secondary-text flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </DetailRow>

          <DetailRow label="Expected Result">
            <p className="text-sm text-foreground leading-relaxed">
              {testCase.expectedResult}
            </p>
          </DetailRow>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-secondary-text">
              <User className="w-4 h-4 text-muted-text" />
              {testCase.createdBy}
            </div>
            <div className="flex items-center gap-2 text-sm text-secondary-text sm:justify-end">
              <Clock className="w-4 h-4 text-muted-text" />
              Updated {testCase.lastUpdated}
            </div>
          </div>
        </div>

        <DialogHeader className="mt-2 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              onClick={() => onRun(testCase)}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-success/15 border border-success/30 text-success text-sm font-medium hover:bg-success/20 transition-colors"
            >
              <Play className="w-4 h-4" />
              Run Test
            </button>
            <button
              onClick={() => onDuplicate(testCase)}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-surface transition-colors"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <button
              onClick={() => onEdit(testCase)}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-surface transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => onDelete(testCase)}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-danger/15 border border-danger/30 text-danger text-sm font-medium hover:bg-danger/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
