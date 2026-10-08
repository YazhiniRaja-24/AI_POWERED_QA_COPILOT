import type { TestCase } from '@/types';
import { newId, type RunRecord, type RunStepResult } from './flow-store';

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Deterministic: guarantees at least one failure for suites of 2+ tests. */
function shouldFail(index: number, total: number): boolean {
  if (total >= 4) return index % 4 === 3;
  if (total === 3) return index === 2;
  if (total === 2) return index === 1;
  return false;
}

function failureActual(tc: TestCase, hash: number): string {
  const variants = [
    `AssertionError: expected "${tc.title}" to pass — element was not visible after ${3000 + (hash % 3000)}ms`,
    `TimeoutError: waiting for locator timed out after ${3000 + (hash % 3000)}ms. Last seen state: "loading"`,
    `AssertionError: expected page content to match "${tc.expectedResult}" but found "Something went wrong"`,
  ];
  return variants[hash % variants.length];
}

function durationFor(hash: number): string {
  return `${((hash % 1400) + 350) / 1000}s`;
}

export function planRun(
  testCases: TestCase[],
  name: string,
  framework: string
): RunRecord {
  const results: RunStepResult[] = testCases.map((tc, index) => {
    const hash = hashString(tc.id + tc.title);
    const failed = shouldFail(index, testCases.length);
    return {
      testCaseId: tc.id,
      title: tc.title,
      framework: tc.framework,
      status: failed ? 'failed' : 'passed',
      duration: durationFor(hash),
      expected: tc.expectedResult,
      actual: failed
        ? failureActual(tc, hash)
        : `Completed successfully: ${tc.expectedResult}`,
    };
  });

  const totalDuration = results.reduce(
    (sum, r) => sum + parseFloat(r.duration),
    0
  );

  return {
    id: newId('run'),
    name,
    framework,
    createdAt: new Date().toISOString(),
    total: results.length,
    revealed: 0,
    results,
    status: 'Running',
    duration: `${totalDuration.toFixed(1)}s`,
  };
}

export function finaliseRun(run: RunRecord): Partial<RunRecord> {
  const failed = run.results.filter((r) => r.status === 'failed').length;
  return {
    revealed: run.total,
    status: failed > 0 ? 'Failed' : 'Passed',
  };
}

export function runLabel(framework: string, index: number): string {
  const stamp = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${framework} run #${index} — ${stamp}`;
}
