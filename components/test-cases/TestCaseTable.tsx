'use client';

import {
  Pencil,
  Copy,
  Trash2,
  Play,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { StatusBadge, PriorityBadge, TypeBadge, FrameworkBadge } from './badges';
import { cn } from '@/lib/utils';
import type { TestCase } from '@/types';

interface TestCaseTableProps {
  testCases: TestCase[];
  onSelect: (testCase: TestCase) => void;
  onRun: (testCase: TestCase) => void;
  onEdit: (testCase: TestCase) => void;
  onDuplicate: (testCase: TestCase) => void;
  onDelete: (testCase: TestCase) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function ActionButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      title={label}
      aria-label={label}
      className={cn(
        'w-8 h-8 rounded-lg border border-border bg-elevated flex items-center justify-center text-secondary-text hover:text-foreground transition-colors',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TestCaseTable({
  testCases,
  onSelect,
  onRun,
  onEdit,
  onDuplicate,
  onDelete,
  page,
  pageSize,
  onPageChange,
}: TestCaseTableProps) {
  const totalPages = Math.max(1, Math.ceil(testCases.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = testCases.slice(start, start + pageSize);

  if (testCases.length === 0) {
    return (
      <div className="rounded-xl bg-surface border border-border p-12 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-elevated border border-border flex items-center justify-center mb-4">
          <Inbox className="w-6 h-6 text-muted-text" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          No test cases yet
        </h3>
        <p className="text-sm text-secondary-text mt-1.5 max-w-sm mx-auto">
          Create your first test case or let AI generate scenarios from a
          requirement.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface border border-border overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {[
                'ID',
                'Test Case',
                'Type',
                'Priority',
                'Framework',
                'Status',
                'Last Updated',
                'Actions',
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-text whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((tc) => (
              <tr
                key={tc.id}
                onClick={() => onSelect(tc)}
                className="border-b border-border last:border-0 hover:bg-elevated/60 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-text whitespace-nowrap">
                  {tc.id}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground max-w-[280px] truncate">
                    {tc.title}
                  </div>
                  <div className="text-xs text-muted-text truncate max-w-[280px]">
                    {tc.tags.map((t) => `#${t}`).join(' ')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <TypeBadge type={tc.type} />
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={tc.priority} />
                </td>
                <td className="px-4 py-3">
                  <FrameworkBadge framework={tc.framework} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={tc.status} />
                </td>
                <td className="px-4 py-3 text-secondary-text whitespace-nowrap">
                  {tc.lastUpdated}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <ActionButton
                      label="Run test"
                      onClick={() => onRun(tc)}
                      className="hover:bg-success/10 hover:text-success hover:border-success/30"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </ActionButton>
                    <ActionButton label="Edit" onClick={() => onEdit(tc)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </ActionButton>
                    <ActionButton
                      label="Duplicate"
                      onClick={() => onDuplicate(tc)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </ActionButton>
                    <ActionButton
                      label="Delete"
                      onClick={() => onDelete(tc)}
                      className="hover:bg-danger/10 hover:text-danger hover:border-danger/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden divide-y divide-border">
        {pageItems.map((tc) => (
          <div
            key={tc.id}
            onClick={() => onSelect(tc)}
            className="p-4 hover:bg-elevated/60 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-text">
                    {tc.id}
                  </span>
                  <StatusBadge status={tc.status} />
                </div>
                <p className="font-medium text-foreground text-sm leading-snug">
                  {tc.title}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ActionButton
                  label="Run test"
                  onClick={() => onRun(tc)}
                  className="hover:bg-success/10 hover:text-success"
                >
                  <Play className="w-3.5 h-3.5" />
                </ActionButton>
                <ActionButton
                  label="Delete"
                  onClick={() => onDelete(tc)}
                  className="hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </ActionButton>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <TypeBadge type={tc.type} />
              <PriorityBadge priority={tc.priority} />
              <FrameworkBadge framework={tc.framework} />
            </div>
            <div className="text-xs text-muted-text mt-2">
              Updated {tc.lastUpdated}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 py-3">
        <p className="text-xs text-muted-text">
          Showing{' '}
          <span className="text-foreground font-medium">{start + 1}</span>–
          <span className="text-foreground font-medium">
            {Math.min(start + pageItems.length, testCases.length)}
          </span>{' '}
          of <span className="text-foreground font-medium">{testCases.length}</span>{' '}
          test cases
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            className="w-8 h-8 rounded-lg border border-border bg-elevated flex items-center justify-center text-secondary-text hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'w-8 h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-colors',
                p === safePage
                  ? 'bg-primary text-white'
                  : 'text-secondary-text hover:text-foreground hover:bg-elevated'
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            className="w-8 h-8 rounded-lg border border-border bg-elevated flex items-center justify-center text-secondary-text hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
