'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  addAnalysis,
  failedResults,
  newId,
  useFlowState,
} from '@/lib/flow-store';
import type { FailureAnalysis } from '@/lib/flow-store';
import {
  failureApi,
  type FailureAnalysisData,
} from '@/backend/lib/failure-api';

/** Offline fallback so the demo never fails, even if the API is down. */
function localAnalysis(
  expected: string,
  actual: string,
  title: string
): { data: FailureAnalysisData; provider: string } {
  const text = `${actual} ${expected} ${title}`.toLowerCase();
  let data: FailureAnalysisData;
  if (/timed out|timeout|after \d+ms|deadline/.test(text)) {
    data = {
      category: 'Timeout / flaky timing',
      rootCause: `"${title}" waited for an element or response that never reached the expected state within the configured timeout.`,
      likelihood: 'High (85%)',
      recommendation:
        'Verify the backend dependency is healthy, then increase the explicit wait budget and assert on a stable anchor element.',
      patch: `await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });`,
      confidence: 0.91,
    };
  } else if (/permission|unauthorised|unauthorized|403|forbidden/.test(text)) {
    data = {
      category: 'Access control / permissions',
      rootCause: `The executing user does not hold the role required by "${title}".`,
      likelihood: 'High (80%)',
      recommendation:
        'Run this case with a user that has the required role, or seed the permission before execution.',
      patch: `await test.use({ storageState: 'auth/member.json' });`,
      confidence: 0.88,
    };
  } else if (/validation|required|invalid|error message/.test(text)) {
    data = {
      category: 'Validation gap',
      rootCause: `The validation message expected by "${title}" was not rendered, or the input was accepted when it should be rejected.`,
      likelihood: 'Medium (65%)',
      recommendation:
        'Assert on the field-level error element rather than a raw text match so wording changes do not break the test.',
      patch: `await expect(page.getByText(/required/i).first()).toBeVisible();`,
      confidence: 0.84,
    };
  } else {
    data = {
      category: 'Assertion mismatch / functional defect',
      rootCause: `"${title}" produced a result that differs from the requirement: expected "${expected}".`,
      likelihood: 'Medium (60%)',
      recommendation:
        'Reproduce the flow manually with the generated test data set, then decide whether to fix the product or update the expected outcome.',
      patch: `// Re-run with: npx playwright test --trace on`,
      confidence: 0.8,
    };
  }
  return { data, provider: 'local-fallback' };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FailuresPage() {
  const { runs, analyses } = useFlowState();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const failures = useMemo(() => failedResults(runs), [runs]);

  const analysisFor = useMemo(() => {
    const map = new Map<string, FailureAnalysis>();
    for (const a of analyses) map.set(`${a.runId}:${a.testCaseId}`, a);
    return map;
  }, [analyses]);

  const pendingFailures = useMemo(
    () =>
      failures.filter(
        (f) => !analysisFor.has(`${f.run.id}:${f.result.testCaseId}`)
      ),
    [failures, analysisFor]
  );
  const pending = pendingFailures.length;

  const analyze = async (key: string, input: {
    runId: string;
    testCaseId: string;
    testTitle: string;
    expected: string;
    actual: string;
    framework: string;
  }) => {
    setBusyKey(key);
    let data: FailureAnalysisData;
    let provider: string;
    try {
      const response = await failureApi.analyze({
        testTitle: input.testTitle,
        steps: [],
        expected: input.expected,
        actual: input.actual,
        framework: input.framework,
      });
      data = response.analysis;
      provider = response.provider;
      toast.success('AI analysis ready.');
    } catch (error) {
      const fallback = localAnalysis(input.expected, input.actual, input.testTitle);
      data = fallback.data;
      provider = fallback.provider;
      const detail = error instanceof Error ? error.message : 'unknown error';
      toast.info(`AI service unavailable — using local analysis. (${detail})`);
    } finally {
      setBusyKey(null);
    }
    addAnalysis({
      id: newId('fa'),
      runId: input.runId,
      testCaseId: input.testCaseId,
      testTitle: input.testTitle,
      ...data,
      provider,
      createdAt: new Date().toISOString(),
    });
  };

  const analyzeAll = async () => {
    for (const f of pendingFailures) {
      const key = `${f.run.id}:${f.result.testCaseId}`;
      await analyze(key, {
        runId: f.run.id,
        testCaseId: f.result.testCaseId,
        testTitle: f.result.title,
        expected: f.result.expected,
        actual: f.result.actual,
        framework: f.result.framework,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            AI Failure Analysis
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Root-cause every failed test with AI and get an actionable fix.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/test-runs"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:bg-surface transition-colors"
          >
            Test Runs
          </Link>
          {pending > 0 && (
            <button
              onClick={() => void analyzeAll()}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <BrainCircuit className="w-4 h-4" />
              Analyze all ({pending})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-surface border border-border p-5">
          <div className="w-10 h-10 rounded-lg bg-elevated border border-border flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-danger" />
          </div>
          <p className="text-xs text-secondary-text mb-1 uppercase tracking-wider">
            Total Failures
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {failures.length}
          </p>
        </div>
        <div className="rounded-xl bg-surface border border-border p-5">
          <div className="w-10 h-10 rounded-lg bg-elevated border border-border flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <p className="text-xs text-secondary-text mb-1 uppercase tracking-wider">
            Analyzed
          </p>
          <p className="text-2xl font-bold tracking-tight text-success">
            {failures.length - pending}
          </p>
        </div>
        <div className="rounded-xl bg-surface border border-border p-5">
          <div className="w-10 h-10 rounded-lg bg-elevated border border-border flex items-center justify-center mb-3">
            <BrainCircuit className="w-5 h-5 text-primary-accent" />
          </div>
          <p className="text-xs text-secondary-text mb-1 uppercase tracking-wider">
            Pending
          </p>
          <p className="text-2xl font-bold tracking-tight text-primary-accent">
            {pending}
          </p>
        </div>
      </div>

      {failures.length === 0 ? (
        <div className="rounded-xl bg-surface border border-border p-14 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-success/10 border border-success/20 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No failures to analyze
          </h3>
          <p className="text-sm text-secondary-text mt-1.5 max-w-sm mx-auto">
            Every executed test passed. Run a suite with multiple test cases to
            see AI-powered failure analysis in action.
          </p>
          <Link
            href="/test-runs"
            className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Test Runs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {failures.map(({ run, result }) => {
            const key = `${run.id}:${result.testCaseId}`;
            const analysis = analysisFor.get(key);
            const busy = busyKey === key;
            return (
              <div
                key={key}
                className="rounded-xl bg-surface border border-danger/25 overflow-hidden"
              >
                <div className="p-5 border-b border-border">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger border border-danger/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                          Failed
                        </span>
                        <span className="text-xs text-muted-text">
                          {run.name} · {formatDate(run.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-foreground">
                        {result.title}
                      </h3>
                    </div>
                    {!analysis && (
                      <button
                        onClick={() =>
                          void analyze(key, {
                            runId: run.id,
                            testCaseId: result.testCaseId,
                            testTitle: result.title,
                            expected: result.expected,
                            actual: result.actual,
                            framework: result.framework,
                          })
                        }
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-br from-primary to-secondary-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 shrink-0"
                      >
                        {busy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <BrainCircuit className="w-4 h-4" />
                        )}
                        {busy ? 'Analyzing…' : 'Analyze with AI'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className="rounded-lg bg-elevated border border-border p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-text mb-1">
                        Expected
                      </p>
                      <p className="text-xs text-secondary-text">{result.expected}</p>
                    </div>
                    <div className="rounded-lg bg-elevated border border-danger/20 p-3">
                      <p className="text-[11px] uppercase tracking-wider text-danger mb-1">
                        Actual
                      </p>
                      <p className="text-xs font-mono text-secondary-text break-words">
                        {result.actual}
                      </p>
                    </div>
                  </div>
                </div>

                {analysis && (
                  <div className="p-5 bg-elevated/40 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary-accent border border-primary/20">
                        {analysis.category}
                      </span>
                      <span className="text-xs text-muted-text">
                        Likelihood: {analysis.likelihood}
                      </span>
                      <span className="ml-auto flex items-center gap-3">
                        <span className="text-xs text-muted-text">
                          Confidence{' '}
                          <span className="text-success font-semibold">
                            {Math.round(analysis.confidence * 100)}%
                          </span>
                        </span>
                        <span className="text-xs text-muted-text">
                          via <span className="font-mono">{analysis.provider}</span>
                        </span>
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-text mb-1">
                        Root cause
                      </p>
                      <p className="text-sm text-secondary-text">
                        {analysis.rootCause}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-text mb-1">
                        Recommendation
                      </p>
                      <p className="text-sm text-secondary-text">
                        {analysis.recommendation}
                      </p>
                    </div>

                    {analysis.patch && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-text mb-1">
                          Suggested fix
                        </p>
                        <pre
                          className={cn(
                            'rounded-lg bg-background/80 border border-border p-3 text-xs font-mono text-secondary-text overflow-x-auto scrollbar-thin'
                          )}
                        >
                          {analysis.patch}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
