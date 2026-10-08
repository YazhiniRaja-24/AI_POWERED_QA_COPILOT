import { planRun, finaliseRun, runLabel } from '../lib/run-engine';
import { generateDataSets } from '../lib/test-data';
import { generateAutomationCode } from '../lib/automation-code';
import type { TestCase } from '../types';

const base: TestCase = {
  id: 'TC-001',
  title: 'Verify login fails with wrong password',
  description: 'An error is shown when the password is incorrect.',
  type: 'Functional',
  priority: 'High',
  framework: 'Playwright',
  status: 'Ready',
  lastUpdated: '2026-10-08',
  preconditions: 'User is on the login page',
  steps: ['Open the login page', 'Enter wrong password', 'Submit'],
  expectedResult: 'An error message is displayed',
  tags: [],
  createdBy: 'QA',
};

const cases: TestCase[] = Array.from({ length: 5 }, (_, i) => ({
  ...base,
  id: `TC-00${i + 1}`,
  title: `${base.title} #${i + 1}`,
}));

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${msg}`);
  }
}

// run engine
const run = planRun(cases, runLabel('Playwright', 1), 'Playwright');
assert(run.status === 'Running' && run.revealed === 0, 'run starts running at 0');
assert(run.results.length === 5, 'run has all results planned');
const failedCount = run.results.filter((r) => r.status === 'failed').length;
assert(failedCount >= 1, `deterministic failure present (${failedCount})`);

const done = finaliseRun({ ...run, revealed: run.total });
assert(done.status === 'Failed', 'run with failures finalises as Failed');
const allPass = planRun([base], runLabel('X', 1), 'Manual');
assert(
  allPass.results.every((r) => r.status === 'passed'),
  'single-test suite passes'
);

// test data
const sets = generateDataSets(base);
assert(sets.length === 3, '3 data sets generated');
assert(
  sets[0].fields.some((f) => f.name === 'password'),
  'password field detected from steps'
);
const sets2 = generateDataSets({ ...base, steps: ['Search for shoes'], expectedResult: 'ok' });
assert(sets2[0].fields.some((f) => f.name === 'searchTerm'), 'searchTerm detected');

// automation code
for (const fw of ['Playwright', 'Selenium', 'API', 'Manual'] as const) {
  const code = generateAutomationCode(cases, fw);
  assert(code.length > 100 && code.includes(base.title.slice(0, 20)), `code generated for ${fw}`);
}

console.log('smoke done');
