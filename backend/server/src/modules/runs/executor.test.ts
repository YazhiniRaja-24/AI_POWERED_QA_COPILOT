import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createExecutor, type ExecutorConfig } from './executor';
import type { ExecutionPlan } from './execution-plan';

let server: http.Server;
let base = '';
const SCREENSHOT_DIR = path.join(os.tmpdir(), `qa-copilot-exec-${process.pid}`);

before(async () => {
  server = http.createServer((req, res) => {
    const pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;
    if (pathname === '/slow') {
      // Never respond in time; the executor must classify this as a timeout.
      setTimeout(() => {
        try {
          res.writeHead(200, { 'content-type': 'text/html' });
          res.end('<html><body>late</body></html>');
        } catch {
          /* socket already gone */
        }
      }, 5000);
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html' });
    if (pathname === '/ok') {
      res.end('<html><body><h1>Welcome Heading</h1></body></html>');
    } else if (pathname === '/link') {
      res.end('<html><body><a href="/ok">Go To Ok</a></body></html>');
    } else {
      res.end('<html><body><h1>Home</h1></body></html>');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address && typeof address === 'object') base = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  server.closeAllConnections?.();
});

function config(overrides: Partial<ExecutorConfig> = {}): ExecutorConfig {
  return {
    timeoutMs: 5000,
    concurrency: 1,
    screenshotDir: SCREENSHOT_DIR,
    screenshotUrlBase: '/api/runs/screenshots',
    userAgent: 'qa-copilot-test',
    ...overrides,
  };
}

/** Tests drive a loopback fixture server, so the SSRF guard is relaxed here. */
const allowLoopback = {
  assertSafe: async (url: string) => new URL(url),
  isBlocked: () => false,
};

function plan(overrides: Partial<ExecutionPlan> & { steps: ExecutionPlan['steps'] }): ExecutionPlan {
  return { testCaseId: 'tc', title: 'case', kind: 'content', ...overrides };
}

describe('executor — successful execution', () => {
  it('passes when the observed text is visible', async () => {
    const executor = createExecutor(config(), allowLoopback);
    const results = await executor.execute(
      [
        plan({
          testCaseId: 'ok',
          steps: [
            { op: 'navigate', url: `${base}/ok` },
            { op: 'assertPageLoad' },
            { op: 'assertTextVisible', text: 'Welcome Heading' },
          ],
        }),
      ],
      { runId: 'run-ok' },
    );

    const result = results.get('ok');
    assert.ok(result);
    assert.equal(result.status, 'passed');
    assert.equal(result.steps.length, 3);
    assert.equal(result.errorType, undefined);
    assert.ok(result.evidenceAvailable);
  });

  it('passes when a link navigates to the observed destination', async () => {
    const executor = createExecutor(config(), allowLoopback);
    const results = await executor.execute(
      [
        plan({
          testCaseId: 'link',
          kind: 'link',
          steps: [
            { op: 'navigate', url: `${base}/link` },
            { op: 'clickLink', name: 'Go To Ok', expectedUrl: `${base}/ok` },
            { op: 'assertPageLoad' },
          ],
        }),
      ],
      { runId: 'run-link' },
    );

    assert.equal(results.get('link')?.status, 'passed');
  });
});

describe('executor — failure classification', () => {
  it('reports a missing observed text as an assertion failure', async () => {
    const executor = createExecutor(config(), allowLoopback);
    const results = await executor.execute(
      [
        plan({
          testCaseId: 'missing',
          steps: [
            { op: 'navigate', url: `${base}/ok` },
            { op: 'assertTextVisible', text: 'This Heading Does Not Exist' },
          ],
        }),
      ],
      { runId: 'run-missing' },
    );

    const result = results.get('missing');
    assert.equal(result?.status, 'failed');
    assert.equal(result?.errorType, 'assertion');
  });

  it('reports a slow navigation as a timeout, not an assertion', async () => {
    const executor = createExecutor(config({ timeoutMs: 600 }), allowLoopback);
    const results = await executor.execute(
      [plan({ testCaseId: 'slow', steps: [{ op: 'navigate', url: `${base}/slow` }] })],
      { runId: 'run-slow' },
    );

    const result = results.get('slow');
    assert.equal(result?.status, 'failed');
    assert.equal(result?.errorType, 'timeout');
  });

  it('blocks private destinations through the real SSRF guard', async () => {
    const executor = createExecutor(config());
    const results = await executor.execute(
      [plan({ testCaseId: 'blocked', steps: [{ op: 'navigate', url: `${base}/ok` }] })],
      { runId: 'run-blocked' },
    );

    const result = results.get('blocked');
    assert.equal(result?.status, 'failed');
    assert.equal(result?.errorType, 'blocked');
  });
});
