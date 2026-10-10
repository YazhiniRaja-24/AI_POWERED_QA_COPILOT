import { promises as fs } from 'node:fs';
import path from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { AppError } from '../../utils/http';
import {
  assertSafeUrl,
  classifyNavigationError,
  isBlockedNetworkUrl,
} from '../ai/website-inspector';
import type { ExecutionPlan, PlanStep } from './execution-plan';

export type ExecutionErrorType =
  | 'assertion'
  | 'timeout'
  | 'blocked'
  | 'navigation'
  | 'browser'
  | 'unsupported';

export interface StepOutcome {
  op: string;
  detail: string;
  ok: boolean;
}

export interface PlanExecution {
  status: 'passed' | 'failed';
  errorType?: ExecutionErrorType;
  durationMs: number;
  actual: string;
  steps: StepOutcome[];
  screenshot?: string;
  evidenceAvailable: boolean;
}

export interface Executor {
  execute(plans: ExecutionPlan[], opts: { runId: string }): Promise<Map<string, PlanExecution>>;
}

export interface ExecutorConfig {
  timeoutMs: number;
  concurrency: number;
  screenshotDir: string;
  screenshotUrlBase: string;
  userAgent: string;
}

export interface ExecutorDeps {
  /** Overridden in tests so a local fixture server can be driven deterministically. */
  launchBrowser?: () => Promise<Browser>;
  /** SSRF check applied before every navigation. Defaults to the inspector guard. */
  assertSafe?: (url: string) => Promise<unknown>;
  /** Fast per-request block applied to every browser request (incl. subresources). */
  isBlocked?: (url: string) => boolean;
}

export function executorConfig(env: {
  EXEC_TIMEOUT_MS: number;
  EXEC_CONCURRENCY: number;
  SCREENSHOT_DIR: string;
}): ExecutorConfig {
  return {
    timeoutMs: env.EXEC_TIMEOUT_MS,
    concurrency: env.EXEC_CONCURRENCY,
    screenshotDir: env.SCREENSHOT_DIR,
    screenshotUrlBase: '/api/runs/screenshots',
    userAgent:
      'Mozilla/5.0 (compatible; QA-Copilot-TestExecutor/1.0; +bounded-no-auth)',
  };
}

class AssertionFailure extends Error {}
class TimeoutFailure extends Error {}
class NavigationFailure extends Error {}
class BlockedFailure extends Error {}

function sameDestination(candidate: string, expected: string): boolean {
  try {
    const a = new URL(candidate);
    const b = new URL(expected);
    const norm = (p: string) => p.replace(/\/+$/, '') || '/';
    return a.origin === b.origin && norm(a.pathname) === norm(b.pathname);
  } catch {
    return false;
  }
}

function classify(error: unknown): { errorType: ExecutionErrorType; actual: string } {
  if (error instanceof AssertionFailure) return { errorType: 'assertion', actual: error.message };
  if (error instanceof TimeoutFailure) return { errorType: 'timeout', actual: error.message };
  if (error instanceof BlockedFailure) return { errorType: 'blocked', actual: error.message };
  if (error instanceof NavigationFailure) return { errorType: 'navigation', actual: error.message };
  if (error instanceof AppError) {
    const type: ExecutionErrorType =
      error.code === 'BLOCKED_URL'
        ? 'blocked'
        : error.code === 'INSPECTION_TIMEOUT'
          ? 'timeout'
          : 'navigation';
    return { errorType: type, actual: error.message };
  }
  const message = error instanceof Error ? error.message : String(error);
  if (/timeout/i.test(message)) {
    return { errorType: 'timeout', actual: `Execution timed out. ${message}` };
  }
  return { errorType: 'browser', actual: `Execution could not be completed. ${message}` };
}

async function runStep(
  page: Page,
  step: PlanStep,
  deps: Required<Pick<ExecutorDeps, 'assertSafe'>>,
  timeoutMs: number,
): Promise<StepOutcome> {
  switch (step.op) {
    case 'navigate': {
      try {
        await deps.assertSafe(step.url);
      } catch (error) {
        if (error instanceof AppError && (error.code === 'BLOCKED_URL' || error.code === 'INVALID_URL')) {
          throw new BlockedFailure(error.message);
        }
        throw new NavigationFailure(
          error instanceof Error ? error.message : `Could not validate ${step.url}.`,
        );
      }
      try {
        const response = await page.goto(step.url, {
          waitUntil: 'domcontentloaded',
          timeout: timeoutMs,
        });
        if (response && response.status() >= 400) {
          throw new NavigationFailure(`${step.url} responded with HTTP ${response.status()}.`);
        }
      } catch (error) {
        if (error instanceof NavigationFailure) throw error;
        const classified = classifyNavigationError(error, step.url);
        if (classified.code === 'INSPECTION_TIMEOUT') throw new TimeoutFailure(classified.message);
        if (classified.code === 'BLOCKED_URL') throw new BlockedFailure(classified.message);
        throw new NavigationFailure(classified.message);
      }
      return { op: 'navigate', detail: `Loaded ${page.url()}`, ok: true };
    }
    case 'assertPageLoad': {
      const visible = await page
        .locator('body')
        .first()
        .isVisible()
        .catch(() => false);
      if (!visible) {
        throw new AssertionFailure('The page body was not visible after loading.');
      }
      return { op: 'assertPageLoad', detail: `Page loaded: ${page.url()}`, ok: true };
    }
    case 'assertTextVisible': {
      const locator = page.getByText(step.text, { exact: false }).first();
      try {
        await locator.waitFor({ state: 'visible', timeout: timeoutMs });
      } catch {
        const count = await locator.count().catch(() => 0);
        throw new AssertionFailure(
          `Expected the observed text "${step.text}" to be visible, but it did not appear within ${timeoutMs}ms (matches: ${count}).`,
        );
      }
      return { op: 'assertTextVisible', detail: `Text visible: "${step.text}"`, ok: true };
    }
    case 'clickLink': {
      const byRole = page.getByRole('link', { name: step.name, exact: false }).first();
      const target = (await byRole.count()) > 0 ? byRole : page.getByText(step.name, { exact: false }).first();
      try {
        await target.click({ timeout: timeoutMs });
      } catch {
        throw new AssertionFailure(`Could not click the observed link "${step.name}".`);
      }
      try {
        await page.waitForURL((url) => sameDestination(url.href, step.expectedUrl), { timeout: timeoutMs });
      } catch {
        throw new AssertionFailure(
          `Clicking "${step.name}" did not navigate to the observed destination ${step.expectedUrl} (now at ${page.url()}).`,
        );
      }
      return { op: 'clickLink', detail: `Navigated to ${page.url()}`, ok: true };
    }
  }
}

async function captureScreenshot(
  page: Page,
  config: ExecutorConfig,
  runId: string,
  testCaseId: string,
): Promise<string | undefined> {
  try {
    const dir = path.join(config.screenshotDir, runId);
    await fs.mkdir(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, `${testCaseId}.png`), type: 'png' });
    return `${config.screenshotUrlBase}/${runId}/${testCaseId}.png`;
  } catch {
    return undefined;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(Math.max(limit, 1), items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

export function createExecutor(config: ExecutorConfig, deps: ExecutorDeps = {}): Executor {
  const assertSafe = deps.assertSafe ?? (assertSafeUrl as (url: string) => Promise<unknown>);
  const isBlocked = deps.isBlocked ?? isBlockedNetworkUrl;
  const launch = deps.launchBrowser ?? (() => chromium.launch({ headless: true, args: ['--no-sandbox'] }));

  return {
    async execute(plans, { runId }) {
      const results = new Map<string, PlanExecution>();
      if (plans.length === 0) return results;

      let browser: Browser;
      try {
        browser = await launch();
      } catch {
        throw new AppError(
          503,
          'EXECUTOR_UNAVAILABLE',
          'Test execution needs a Playwright Chromium browser. Run "npx playwright install chromium" on the server and try again.',
        );
      }

      try {
        await mapWithConcurrency(plans, config.concurrency, async (plan) => {
          const startedAt = Date.now();
          const context = await browser.newContext({
            userAgent: config.userAgent,
            viewport: { width: 1366, height: 900 },
            ignoreHTTPSErrors: false,
          });
          await context.route('**/*', (route) =>
            isBlocked(route.request().url())
              ? route.abort('blockedbyclient')
              : route.continue(),
          );
          const page = await context.newPage();
          page.setDefaultTimeout(config.timeoutMs);
          page.setDefaultNavigationTimeout(config.timeoutMs);

          const steps: StepOutcome[] = [];
          let status: PlanExecution['status'] = 'passed';
          let errorType: ExecutionErrorType | undefined;
          let actual = '';
          let screenshot: string | undefined;
          let evidenceAvailable = false;

          try {
            for (const step of plan.steps) {
              steps.push(await runStep(page, step, { assertSafe }, config.timeoutMs));
            }
            const loaded = steps.find((s) => s.op === 'navigate')?.detail ?? '';
            actual = `All ${plan.steps.length} step(s) completed successfully. ${loaded}`.trim();
            evidenceAvailable = true;
          } catch (error) {
            status = 'failed';
            const classified = classify(error);
            errorType = classified.errorType;
            actual = classified.actual;
            screenshot = await captureScreenshot(page, config, runId, plan.testCaseId);
            evidenceAvailable = Boolean(screenshot);
            if (!screenshot) {
              actual = `${actual} No screenshot was available for this failure.`;
            }
          } finally {
            await context.close().catch(() => undefined);
          }

          results.set(plan.testCaseId, {
            status,
            errorType,
            durationMs: Date.now() - startedAt,
            actual,
            steps,
            screenshot,
            evidenceAvailable,
          });
        });
      } finally {
        await browser.close().catch(() => undefined);
      }

      return results;
    },
  };
}
