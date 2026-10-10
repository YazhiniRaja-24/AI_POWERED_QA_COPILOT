import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deriveExecutionPlan, executionPlanSchema } from './execution-plan';
import type { TestCase } from '../test-cases/testCase.types';

const ROOT = 'https://shop.example.com/';
const ABOUT = 'https://shop.example.com/about';

function makeCase(overrides: Partial<TestCase> = {}): TestCase {
  return {
    id: 'tc-1',
    title: 'Case',
    description: '',
    type: 'Functional',
    priority: 'Medium',
    framework: 'Playwright',
    status: 'Draft',
    lastUpdated: '2024-01-01T00:00:00.000Z',
    preconditions: '',
    steps: [],
    expectedResult: '',
    tags: [],
    createdBy: 'test',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function websiteDescription(root: string, evidence: string): string {
  return [
    'Generated from live inspection.',
    '',
    `Target page: ${root}`,
    '',
    `Evidence (observed): ${evidence}`,
  ].join('\n');
}

describe('deriveExecutionPlan — supported website cases', () => {
  it('derives a page-load plan with the observed heading', () => {
    const tc = makeCase({
      tags: ['ai-generated', 'website', 'smoke', 'navigation'],
      description: websiteDescription(ROOT, 'title="Example Shop"; 2 heading(s)'),
      steps: [`Navigate to ${ROOT}`, 'Wait for the page to finish loading', 'Verify the visible heading "Welcome"'],
    });

    const result = deriveExecutionPlan(tc);
    assert.ok(result.supported);
    assert.equal(result.plan.kind, 'page');
    assert.deepEqual(
      result.plan.steps.map((s) => s.op),
      ['navigate', 'assertPageLoad', 'assertTextVisible'],
    );
    assert.equal(result.plan.steps[0].op === 'navigate' && result.plan.steps[0].url, ROOT);
    assert.ok(executionPlanSchema.safeParse(result.plan).success);
  });

  it('derives a content plan from the observed headings', () => {
    const tc = makeCase({
      tags: ['ai-generated', 'website', 'content'],
      description: websiteDescription(ROOT, 'headings: Alpha | Beta | Gamma'),
    });

    const result = deriveExecutionPlan(tc);
    assert.ok(result.supported);
    assert.equal(result.plan.kind, 'content');
    const textStep = result.plan.steps.find((s) => s.op === 'assertTextVisible');
    assert.ok(textStep && textStep.op === 'assertTextVisible');
    assert.equal(textStep.text, 'Alpha');
  });

  it('derives a link plan that verifies the observed destination', () => {
    const tc = makeCase({
      tags: ['ai-generated', 'website', 'navigation'],
      description: websiteDescription(ABOUT, `link href="${ABOUT}" text="About" @ ${ROOT}`),
    });

    const result = deriveExecutionPlan(tc);
    assert.ok(result.supported);
    assert.equal(result.plan.kind, 'link');
    assert.deepEqual(
      result.plan.steps.map((s) => s.op),
      ['navigate', 'clickLink', 'assertPageLoad'],
    );
    const first = result.plan.steps[0];
    assert.equal(first.op === 'navigate' && first.url, ROOT);
    const click = result.plan.steps.find((s) => s.op === 'clickLink');
    assert.ok(click && click.op === 'clickLink');
    assert.equal(click.expectedUrl, ABOUT);
    assert.equal(click.name, 'About');
  });
});

describe('deriveExecutionPlan — unsupported cases are reported, never guessed', () => {
  it('rejects requirement-based cases', () => {
    const tc = makeCase({ tags: ['ai-generated', 'requirement'] });
    const result = deriveExecutionPlan(tc);
    assert.equal(result.supported, false);
    assert.match(result.supported ? '' : result.reason, /requirement/i);
  });
});

describe('deriveExecutionPlan — unsupported categories', () => {
  for (const [tag, expected] of [
    ['form', /test data/i],
    ['input', /values/i],
    ['interaction', /button/i],
  ] as const) {
    it(`marks ${tag} cases as unsupported`, () => {
      const tc = makeCase({
        tags: ['ai-generated', 'website', tag],
        description: websiteDescription(ROOT, 'whatever the detector observed'),
      });
      const result = deriveExecutionPlan(tc);
      assert.equal(result.supported, false);
      assert.match(result.supported ? '' : result.reason, expected);
    });
  }

  it('rejects website cases with no recorded target page', () => {
    const tc = makeCase({ tags: ['ai-generated', 'website', 'smoke'] });
    const result = deriveExecutionPlan(tc);
    assert.equal(result.supported, false);
    assert.match(result.supported ? '' : result.reason, /target page/i);
  });

  it('rejects cases that were not generated from inspection evidence', () => {
    const tc = makeCase({ tags: ['auth', 'smoke'], steps: ['Open the login page'] });
    const result = deriveExecutionPlan(tc);
    assert.equal(result.supported, false);
  });
});
