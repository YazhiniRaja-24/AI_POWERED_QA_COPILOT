'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  Loader2,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { testCaseApi, toUiTestCase } from '@/backend/lib/test-case-api';
import { ApiError } from '@/backend/lib/api-client';
import { finaliseRun, planRun, runLabel } from '@/lib/run-engine';
import { addRun, patchRun, runCounts, useFlowState } from '@/lib/flow-store';
import type { RunRecord } from '@/lib/flow-store';

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : error instanceof Error
      ? error.message
      : 'Something went wrong. Please try again.';
}

function StatusPill({ status }: { status: RunRecord['status'] }) {
  const styles = {
    Passed: 'bg-success/10 text-success border-success/20',
    Failed: 'bg-danger/10 text-danger border-danger/20',
    Running: 'bg-primary/10 text-primary-accent border-primary/20',
  }[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        styles
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          status === 'Passed'
            ? 'bg-success'
            : status === 'Failed'
              ? 'bg-danger'
              : 'bg-primary-accent animate-pulse'
        )}
      />
      {status}
    </span>
  );
}

export default function TestRunsPage() {
  const { runs } = useFlowState();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const running = runs.find((r) => r.status === 'Running');

  /* Drive the simulation forward one step at a time. */
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => {
      const nextRevealed = running.revealed + 1;
      if (nextRevealed >= running.total) {
        const patch = finaliseRun(running);
        patchRun(running.id, patch);
        const failed = running.results.filter((r) => r.status === 'failed').length;
        if (failed > 0) {
          toast.error(`${running.name} finished: ${failed} failure(s).`, {
            action: { label: 'Analyze', onClick: () => (window.location.href = '/failures') },
          });
        } else {
          toast.success(`${running.name} finished: all tests passed.`);
        }
      } else {
        patchRun(running.id, { revealed: nextRevealed });
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [running]);

  useEffect(() => {
    if (!expandedId && runs.length > 0) setExpandedId(runs[0].id);
  }, [runs, expandedId]);

  const expanded = useMemo(
    () => runs.find((r) => r.id === expandedId) ?? null,
    [runs, expandedId]
  );

  const runAll = async () => {
    setStarting(true);
    try {
      const response = await testCaseApi.list();
      const cases = response.map(toUiTestCase);
      if (cases.length === 0) {
        toast.error('No test cases available. Create some first.');
        return;
      }
      const run = planRun(cases, runLabel('Full Suite', runs.length + 1), 'Playwright');
      addRun(run);
      setExpandedId(run.id);
      toast.success(`Run started with ${cases.length} test case(s).`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Test Runs
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Watch executions live and drill into every result.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/automation"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-surface transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Automation
          </Link>
          <button
            onClick={() => void runAll()}
            disabled={starting}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {starting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run all test cases
          </button>
        </div>
      </div>

      {running && (
        <div className="rounded-xl bg-surface border border-primary/30 p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <Loader2 className="w-5 h-5 text-primary-accent animate-spin shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {running.name}
                </p>
                <p className="text-xs text-secondary-text">
                  Executing {running.revealed} of {running.total} test
                  case(s)…
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-primary-accent shrink-0">
              {Math.round((running.revealed / running.total) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-elevated overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary-accent transition-all duration-300"
              style={{
                width: `${Math.round((running.revealed / running.total) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {runs.length === 0 ? (
        <div className="rounded-xl bg-surface border border-border p-14 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-elevated border border-border flex items-center justify-center mb-5">
            <Play className="w-6 h-6 text-primary-accent" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No runs yet</h3>
          <p className="text-sm text-secondary-text mt-1.5 max-w-sm mx-auto">
            Start a run from the Automation preview, or execute every test case
            in one click.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <button
              onClick={() => void runAll()}
              disabled={starting}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {starting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run all test cases
            </button>
            <Link
              href="/automation"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-surface transition-colors"
            >
              Automation preview
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-surface border border-border overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Test Run', 'Framework', 'Tests', 'Passed', 'Failed', 'Duration', 'Status', ''].map(
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
                {runs.map((run) => {
                  const counts = runCounts(run);
                  const isOpen = expandedId === run.id;
                  return (
                    <RunRow
                      key={run.id}
                      run={run}
                      counts={counts}
                      isOpen={isOpen}
                      onToggle={() =>
                        setExpandedId(isOpen ? null : run.id)
                      }
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {expanded && expanded.revealed > 0 && (
        <div className="rounded-xl bg-surface border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {expanded.name}
              </h3>
              <p className="text-sm text-secondary-text mt-0.5">
                {expanded.revealed} of {expanded.total} result(s) shown
              </p>
            </div>
            <StatusPill status={expanded.status} />
          </div>
          <ul className="divide-y divide-border">
            {expanded.results.slice(0, expanded.revealed).map((result) => (
              <li
                key={result.testCaseId}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
              >
                {result.status === 'passed' ? (
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-danger shrink-0" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium min-w-0 flex-1 truncate',
                    result.status === 'passed'
                      ? 'text-foreground'
                      : 'text-danger'
                  )}
                  title={result.title}
                >
                  {result.title}
                </span>
                <span className="text-xs text-muted-text whitespace-nowrap">
                  {result.duration}
                </span>
                {result.status === 'failed' && (
                  <Link
                    href="/failures"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary-accent hover:underline whitespace-nowrap"
                  >
                    Analyze with AI
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RunRow({
  run,
  counts,
  isOpen,
  onToggle,
}: {
  run: RunRecord;
  counts: { passed: number; failed: number };
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-border hover:bg-elevated/50 transition-colors cursor-pointer"
      >
        <td className="px-5 py-3.5 font-medium text-foreground whitespace-nowrap">
          <span className="flex items-center gap-2">
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-text transition-transform',
                isOpen && 'rotate-180'
              )}
            />
            {run.name}
          </span>
        </td>
        <td className="px-5 py-3.5 text-secondary-text whitespace-nowrap">
          {run.framework}
        </td>
        <td className="px-5 py-3.5 text-secondary-text whitespace-nowrap">
          {run.revealed}/{run.total}
        </td>
        <td className="px-5 py-3.5 text-success whitespace-nowrap">
          {counts.passed}
        </td>
        <td className="px-5 py-3.5 text-danger whitespace-nowrap">
          {counts.failed}
        </td>
        <td className="px-5 py-3.5 text-secondary-text whitespace-nowrap">
          {run.status === 'Running' ? '—' : run.duration}
        </td>
        <td className="px-5 py-3.5 whitespace-nowrap">
          <StatusPill status={run.status} />
        </td>
        <td className="px-5 py-3.5 whitespace-nowrap text-right">
          {run.status === 'Failed' && (
            <Link
              href="/failures"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-accent hover:underline"
            >
              Analyze failures
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </td>
      </tr>
    </>
  );
}
