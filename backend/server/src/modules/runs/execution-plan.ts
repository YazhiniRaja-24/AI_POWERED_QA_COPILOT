import { z } from 'zod';
import type { TestCase } from '../test-cases/testCase.types';

/**
 * Structured, allow-listed execution plan. The executor only understands these
 * operations — it never evaluates AI-generated JavaScript/TypeScript. Plans are
 * derived from evidence captured during live website inspection, so no selector
 * or expected outcome is invented at run time.
 */

export const planStepSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('navigate'), url: z.string().url().max(2048) }).strict(),
  z.object({ op: z.literal('assertPageLoad') }).strict(),
  z
    .object({ op: z.literal('assertTextVisible'), text: z.string().trim().min(1).max(300) })
    .strict(),
  z
    .object({
      op: z.literal('clickLink'),
      name: z.string().trim().min(1).max(300),
      expectedUrl: z.string().url().max(2048),
    })
    .strict(),
]);
export type PlanStep = z.infer<typeof planStepSchema>;

export const executionPlanSchema = z
  .object({
    testCaseId: z.string().min(1).max(64),
    title: z.string().min(1).max(300),
    kind: z.enum(['page', 'content', 'link']),
    steps: z.array(planStepSchema).min(1).max(10),
  })
  .strict();
export type ExecutionPlan = z.infer<typeof executionPlanSchema>;

export type PlanDerivation =
  | { supported: true; plan: ExecutionPlan }
  | { supported: false; reason: string };

const TARGET_RE = /^Target page:\s*(\S+)/m;
const EVIDENCE_RE = /^Evidence \(observed\):\s*(.+)$/m;
const HTTP_RE = /https?:\/\/[^\s'")]+/i;

const unsupported = (reason: string): PlanDerivation => ({ supported: false, reason });

function hasTag(tc: TestCase, tag: string): boolean {
  return tc.tags.some((t) => t.toLowerCase() === tag);
}

function toHttpUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}

function extractTargetPage(tc: TestCase): string | null {
  const fromDescription = TARGET_RE.exec(tc.description)?.[1];
  const direct = toHttpUrl(fromDescription);
  if (direct) return direct;
  for (const step of tc.steps) {
    const found = HTTP_RE.exec(step)?.[0];
    const url = toHttpUrl(found);
    if (url) return url;
  }
  return null;
}

function extractEvidence(tc: TestCase): string {
  return EVIDENCE_RE.exec(tc.description)?.[1]?.trim() ?? '';
}

function firstHeadingFromEvidence(evidence: string): string | null {
  const list = /headings:\s*(.+)$/i.exec(evidence)?.[1];
  if (!list) return null;
  const first = list
    .split('|')
    .map((h) => h.trim())
    .filter(Boolean)[0];
  return first ? first.slice(0, 300) : null;
}

function headingFromSteps(tc: TestCase): string | null {
  const m = /Verify the visible heading "([^"]+)"/.exec(tc.steps.join('\n'));
  return m ? m[1].trim().slice(0, 300) : null;
}

/**
 * Derives a supported plan from the inspection evidence that was persisted with
 * the test case. Cases whose evidence cannot justify a safe, verifiable plan are
 * reported as unsupported instead of being guessed at.
 */
export function deriveExecutionPlan(tc: TestCase): PlanDerivation {
  if (hasTag(tc, 'requirement')) {
    return unsupported(
      'Requirement-based cases are not grounded in a website inspection, so there is no page to execute against.',
    );
  }
  if (hasTag(tc, 'form')) {
    return unsupported(
      'Form submission needs test data that was not captured during inspection; submitting invented values would be unsafe.',
    );
  }
  if (hasTag(tc, 'input')) {
    return unsupported(
      'Input validation needs concrete values that were not captured during inspection.',
    );
  }
  if (hasTag(tc, 'interaction')) {
    return unsupported(
      'The inspected button had no evidence-backed outcome to verify, so it cannot be executed deterministically.',
    );
  }

  if (hasTag(tc, 'content')) {
    const target = extractTargetPage(tc);
    if (!target) {
      return unsupported('No target page URL was recorded for this content case.');
    }
    const heading = firstHeadingFromEvidence(extractEvidence(tc));
    const steps: PlanStep[] = [{ op: 'navigate', url: target }, { op: 'assertPageLoad' }];
    if (heading) steps.push({ op: 'assertTextVisible', text: heading });
    return { supported: true, plan: { testCaseId: tc.id, title: tc.title, kind: 'content', steps } };
  }

  if (hasTag(tc, 'smoke') || hasTag(tc, 'limited-evidence')) {
    const target = extractTargetPage(tc);
    if (!target) {
      return unsupported('No target page URL was recorded for this page-load case.');
    }
    const heading = headingFromSteps(tc);
    const steps: PlanStep[] = [{ op: 'navigate', url: target }, { op: 'assertPageLoad' }];
    if (heading) steps.push({ op: 'assertTextVisible', text: heading });
    return { supported: true, plan: { testCaseId: tc.id, title: tc.title, kind: 'page', steps } };
  }

  if (hasTag(tc, 'navigation')) {
    const evidence = extractEvidence(tc);
    const destination = toHttpUrl(/href="([^"]+)"/.exec(evidence)?.[1]);
    const source = toHttpUrl(/@\s*(https?:\/\/\S+)/.exec(evidence)?.[1]);
    const name = /text="([^"]*)"/.exec(evidence)?.[1]?.trim();
    if (!destination || !source || !name) {
      return unsupported(
        'The inspected link is missing its destination or accessible name, so it cannot be executed.',
      );
    }
    return {
      supported: true,
      plan: {
        testCaseId: tc.id,
        title: tc.title,
        kind: 'link',
        steps: [
          { op: 'navigate', url: source },
          { op: 'clickLink', name: name.slice(0, 300), expectedUrl: destination },
          { op: 'assertPageLoad' },
        ],
      },
    };
  }

  return unsupported(
    'This case was not generated from website inspection evidence, so there is nothing safe to execute.',
  );
}
