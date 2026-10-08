'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bot,
  Check,
  ClipboardCopy,
  Loader2,
  Play,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { testCaseApi, toUiTestCase } from '@/backend/lib/test-case-api';
import { ApiError } from '@/backend/lib/api-client';
import { generateAutomationCode } from '@/lib/automation-code';
import { planRun, runLabel } from '@/lib/run-engine';
import { addRun, useFlowState } from '@/lib/flow-store';
import { StatusBadge, FrameworkBadge } from '@/components/test-cases/badges';
import { frameworkOptions } from '@/data/testCaseOptions';
import type { TestCase, TestFramework } from '@/types';

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : error instanceof Error
      ? error.message
      : 'Something went wrong. Please try again.';
}

export default function AutomationPage() {
  const router = useRouter();
  const { dataRecords, runs } = useFlowState();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [framework, setFramework] = useState<TestFramework>('Playwright');
  const [previewed, setPreviewed] = useState<{ code: string; count: number } | null>(null);
  const [starting, setStarting] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await testCaseApi.list();
      const ui = response.map(toUiTestCase);
      setTestCases(ui);
      setSelectedIds(new Set(ui.map((tc) => tc.id)));
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCases = useMemo(
    () => testCases.filter((tc) => selectedIds.has(tc.id)),
    [testCases, selectedIds]
  );
  const approvedData = useMemo(
    () => dataRecords.filter((r) => r.status === 'approved').length,
    [dataRecords]
  );

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const preview = () => {
    if (selectedCases.length === 0) {
      toast.error('Select at least one test case to preview.');
      return;
    }
    setPreviewed({
      code: generateAutomationCode(selectedCases, framework),
      count: selectedCases.length,
    });
  };

  const copy = async () => {
    if (!previewed) return;
    try {
      await navigator.clipboard.writeText(previewed.code);
      toast.success('Automation code copied to clipboard.');
    } catch {
      toast.error('Could not access the clipboard.');
    }
  };

  const startRun = () => {
    if (selectedCases.length === 0) {
      toast.error('Select at least one test case to run.');
      return;
    }
    setStarting(true);
    try {
      const run = planRun(
        selectedCases,
        runLabel(framework, runs.length + 1),
        framework
      );
      addRun(run);
      toast.success(`Run started with ${selectedCases.length} test case(s).`);
      router.push('/test-runs');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Automation Preview
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Turn reviewed test cases into executable automation code, then start
            a run.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/test-data"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-surface transition-colors"
          >
            Test Data
            {approvedData > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-success/15 text-success text-[11px] font-semibold">
                {approvedData} approved
              </span>
            )}
          </Link>
          <button
            onClick={startRun}
            disabled={starting || selectedCases.length === 0}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {starting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Start test run
          </button>
        </div>
      </div>

      {loading && (
        <div className="h-96 rounded-xl bg-surface border border-border animate-pulse" />
      )}

      {!loading && loadError && (
        <div className="rounded-xl bg-surface border border-danger/30 p-14 text-center">
          <h3 className="text-lg font-semibold text-foreground">
            Unable to load test cases
          </h3>
          <p className="text-sm text-secondary-text mt-1.5">{loadError}</p>
          <button
            onClick={() => void load()}
            className="mt-6 inline-flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !loadError && testCases.length === 0 && (
        <div className="rounded-xl bg-surface border border-border p-14 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-elevated border border-border flex items-center justify-center mb-5">
            <Bot className="w-6 h-6 text-primary-accent" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No test cases to automate
          </h3>
          <p className="text-sm text-secondary-text mt-1.5 max-w-sm mx-auto">
            Create or generate test cases first, then come back to preview the
            automation code.
          </p>
          <Link
            href="/test-cases"
            className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Open Test Cases
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {!loading && !loadError && testCases.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Selection */}
          <div className="rounded-xl bg-surface border border-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">
                Test cases
              </h3>
              <p className="text-sm text-secondary-text mt-0.5">
                {selectedCases.length} of {testCases.length} selected
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() =>
                    setSelectedIds(new Set(testCases.map((tc) => tc.id)))
                  }
                  className="text-xs font-medium text-primary-accent hover:underline"
                >
                  Select all
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs font-medium text-muted-text hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto scrollbar-thin divide-y divide-border">
              {testCases.map((tc) => (
                <label
                  key={tc.id}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-elevated/50 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(tc.id)}
                    onChange={() => toggle(tc.id)}
                    className="mt-1 accent-primary"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground truncate">
                      {tc.title}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <StatusBadge status={tc.status} />
                      <FrameworkBadge framework={tc.framework} />
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2 rounded-xl bg-surface border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Generated code
                </h3>
                <p className="text-sm text-secondary-text mt-0.5">
                  {previewed
                    ? `${previewed.count} test case(s) · ${framework}`
                    : 'Preview the automation script before executing it.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={framework}
                  onChange={(e) => {
                    setFramework(e.target.value as TestFramework);
                    setPreviewed(null);
                  }}
                  className="h-9 px-3 rounded-lg bg-elevated border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  {frameworkOptions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <button
                  onClick={preview}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-elevated border border-border text-sm font-medium text-foreground hover:bg-surface transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-primary-accent" />
                  {previewed ? 'Regenerate' : 'Generate preview'}
                </button>
                {previewed && (
                  <button
                    onClick={() => void copy()}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-elevated border border-border text-sm font-medium text-foreground hover:bg-surface transition-colors"
                  >
                    <ClipboardCopy className="w-4 h-4" />
                    Copy
                  </button>
                )}
              </div>
            </div>

            {previewed ? (
              <div className="relative">
                <pre className="max-h-[420px] overflow-auto scrollbar-thin p-5 text-xs leading-relaxed font-mono text-secondary-text bg-background/60">
                  {previewed.code}
                </pre>
              </div>
            ) : (
              <div className="p-14 text-center">
                <Bot className="w-8 h-8 mx-auto text-muted-text mb-4" />
                <p className="text-sm text-secondary-text max-w-sm mx-auto">
                  Select test cases on the left, pick a framework, then generate
                  the preview. Nothing executes until you start a run.
                </p>
              </div>
            )}

            <div className="p-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-muted-text">
                Executing will simulate the run locally so the demo stays
                reliable without external infrastructure.
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                    approvedData > 0
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-elevated text-muted-text border-border'
                  )}
                >
                  <Check className="w-3 h-3" />
                  {approvedData} approved data set(s)
                </span>
                <button
                  onClick={startRun}
                  disabled={starting || selectedCases.length === 0}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {starting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Start test run
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
