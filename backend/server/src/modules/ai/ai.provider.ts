import type { Env } from '../../config/env';
import { AppError } from '../../utils/http';
import type { AnalyzeFailureRequest, AnalyzeFailureRequest, GenerateRequest } from './ai.schemas';

/** Providers return UNVALIDATED output; ai.service.ts validates it. */
export interface AiProvider {
  readonly name: string;
  generateTestCases(req: GenerateRequest): Promise<unknown>;
  analyzeFailure(req: AnalyzeFailureRequest): Promise<unknown>;
}

// ---------------- Mock (local development only) ----------------
const SCENARIOS: { label: string; priority: string; steps: string[]; expected: string }[] = [
  { label: 'successful flow', priority: 'High',
    steps: ['Open the relevant page', 'Provide valid input', 'Submit the request'],
    expected: 'The operation succeeds and the user sees a confirmation' },
  { label: 'invalid input handling', priority: 'High',
    steps: ['Open the relevant page', 'Provide malformed input', 'Submit the request'],
    expected: 'A clear validation error is shown and nothing is saved' },
  { label: 'required fields left empty', priority: 'Medium',
    steps: ['Open the relevant page', 'Leave required fields empty', 'Submit the request'],
    expected: 'Required-field errors are displayed next to each field' },
  { label: 'boundary values', priority: 'Medium',
    steps: ['Open the relevant page', 'Enter minimum and maximum allowed values', 'Submit'],
    expected: 'Boundary values are accepted; values beyond them are rejected' },
  { label: 'unauthorised access', priority: 'High',
    steps: ['Sign out or use a user without permission', 'Attempt the action'],
    expected: 'Access is denied and no data is exposed' },
  { label: 'backend failure handling', priority: 'Medium',
    steps: ['Simulate a failing backend service', 'Perform the action'],
    expected: 'A friendly error is shown and the UI remains usable' },
  { label: 'duplicate submission', priority: 'Medium',
    steps: ['Perform the action', 'Immediately repeat it'],
    expected: 'The action is applied once; the repeat is rejected or ignored' },
  { label: 'user feedback messages', priority: 'Low',
    steps: ['Perform the action', 'Observe the messages shown'],
    expected: 'Messages are clear, accurate and localised' },
  { label: 'response time', priority: 'Low',
    steps: ['Perform the action under normal load', 'Measure response time'],
    expected: 'The response completes within the agreed performance budget' },
  { label: 'accessibility', priority: 'Low',
    steps: ['Navigate the flow using only the keyboard', 'Run an accessibility scan'],
    expected: 'The flow is fully keyboard-operable with no critical a11y violations' },
];

export class MockAiProvider implements AiProvider {
  readonly name = 'mock';
  async generateTestCases(req: GenerateRequest): Promise<unknown> {
    const action =
      req.requirement && /(?:should be able to|want to|can)\s+(.+?)\.?$/i.exec(req.requirement)
        ? /(?:should be able to|want to|can)\s+(.+?)\.?$/i.exec(req.requirement)![1]
        : req.website?.title || req.website?.url || req.requirement?.slice(0, 80) || req.url || 'the application';
    return Array.from({ length: req.count }, (_, i) => {
      const sc = SCENARIOS[i % SCENARIOS.length];
      const desc = req.website
        ? `Website test (${sc.label}) derived from URL analysis: ${req.website.url}`
        : `Requirement test (${sc.label}) derived from: ${req.requirement ?? req.url}`;
      return {
        title: `Verify ${sc.label}: ${action}`,
        priority: sc.priority,
        confidence: Number((0.95 - i * 0.02).toFixed(2)),
        description: desc,
        preconditions: 'The application is running and the tester has the required access',
        steps: sc.steps,
        expectedResult: sc.expected,
      };
    });
  }

  async analyzeFailure(req: AnalyzeFailureRequest): Promise<unknown> {
    const text = `${req.actual} ${req.expected} ${req.testTitle}`.toLowerCase();

    if (/timed out|timeout|after \d+ms|deadline/.test(text)) {
      return {
        category: 'Timeout / flaky timing',
        rootCause: `"${req.testTitle}" waited for an element or response that never reached the expected state within the configured timeout. This usually means the UI stayed in a loading state or the backend responded too slowly under the current environment.`,
        likelihood: 'High (85%)',
        recommendation:
          'Verify the backend dependency is healthy in the test environment, then increase the explicit wait budget for this step and assert on a stable anchor element instead of a transient one.',
        patch: `await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });`,
        confidence: 0.91,
      };
    }
    if (/permission|unauthorised|unauthorized|403|forbidden|not allowed/.test(text)) {
      return {
        category: 'Access control / permissions',
        rootCause: `The executing user does not hold the role required by "${req.testTitle}". The test ran with credentials that lack the permission the requirement assumes.`,
        likelihood: 'High (80%)',
        recommendation:
          'Run this case with a user that has the required role, or update the seeding script so the test account is granted the permission before execution.',
        patch: `await test.use({ storageState: 'auth/member.json' });`,
        confidence: 0.88,
      };
    }
    if (/validation|required|invalid|error message|missing field/.test(text)) {
      return {
        category: 'Validation gap',
        rootCause: `The application accepted input it should have rejected, or the validation message expected by "${req.testTitle}" was not rendered. The assertion and the UI copy have drifted apart.`,
        likelihood: 'Medium (65%)',
        recommendation:
          'Confirm the expected copy with the product spec, then assert on the field-level error element rather than a raw text match so minor wording changes do not break the test.',
        patch: `await expect(page.getByText(/required/i).first()).toBeVisible();`,
        confidence: 0.84,
      };
    }
    if (/not visible|locator|element|button|found/.test(text)) {
      return {
        category: 'Selector / UI regression',
        rootCause: `The locator used by "${req.testTitle}" no longer matches the rendered DOM — likely a label, role or component change since the test was generated.`,
        likelihood: 'Medium (70%)',
        recommendation:
          'Re-anchor the step on a accessible role and visible name (role + name) instead of CSS selectors, and re-record the baseline screenshot for this flow.',
        patch: `await expect(page.getByRole('button', { name: /submit/i })).toBeEnabled();`,
        confidence: 0.86,
      };
    }
    return {
      category: 'Assertion mismatch / functional defect',
      rootCause: `"${req.testTitle}" produced "${req.actual}" while the requirement expects "${req.expected}". Either the feature regressed or the expected value in the test data is out of date.`,
      likelihood: 'Medium (60%)',
      recommendation:
        'Reproduce the flow manually with the generated test data set, compare against the requirement, and decide whether to fix the product or update the expected outcome.',
      patch: `// Re-run with: npx playwright test --trace on\n// Expected: ${req.expected.replace(/\n/g, ' ')}`,
      confidence: 0.8,
    };
  }
}

// ---------------- Gemini (real provider; needs GEMINI_API_KEY) ----------------
function buildPrompt(req: GenerateRequest): string {
  const base = [
    'You are a senior QA engineer. Generate software test cases.',
    `Test type: ${req.type}. Target framework: ${req.framework}.`,
    `Return EXACTLY ${req.count} test cases as a JSON array and nothing else.`,
    'Each item must have: title (string), priority ("Critical"|"High"|"Medium"|"Low"),',
    'confidence (number between 0 and 1), description (string), preconditions (string),',
    'steps (array of short strings), expectedResult (string).',
    'Cover happy path, negative cases and edge cases. Do not invent features not implied by the requirement or analysis.',
  ];

  if (req.website) {
    base.push(
      `Source: Website analysis from ${req.website.url}`,
      `Page title: ${req.website.title}`,
      `Discovered pages: ${req.website.pages.join(', ') || 'none'}`,
      `Forms: ${req.website.forms.join(', ') || 'none'}`,
      `Actions: ${req.website.actions.join(', ') || 'none'}`,
      `Interactive elements: ${req.website.interactiveElements.slice(0, 40).join('; ') || 'none'}`,
    );
  } else if (req.requirement) {
    base.push(`Requirement: ${req.requirement}`);
  } else {
    base.push(`URL: ${req.url}`);
  }

  return base.join('\n');
}

function buildAnalysisPrompt(req: AnalyzeFailureRequest): string {
  return [
    'You are a senior QA engineer analysing a failed automated test.',
    `Test title: ${req.testTitle}`,
    `Framework: ${req.framework}`,
    `Steps: ${req.steps.join(' | ') || 'not recorded'}`,
    `Expected: ${req.expected}`,
    `Actual: ${req.actual}`,
    'Return a single JSON object and nothing else, with keys:',
    'category (short failure category), rootCause (why it failed), likelihood (e.g. "High (85%)"),',
    'recommendation (how to fix or investigate), patch (short code snippet or command, may be empty),',
    'confidence (number between 0 and 1).',
  ].join('\n');
}

export class GeminiAiProvider implements AiProvider {
  readonly name = 'gemini';
  constructor(private readonly apiKey: string, private readonly model: string) {}

  private async call(prompt: string): Promise<unknown> {
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
          }),
        },
      );
    } catch {
      throw new AppError(502, 'AI_PROVIDER_ERROR', 'Could not reach the Gemini API');
    }
    if (!res.ok) throw new AppError(502, 'AI_PROVIDER_ERROR', `Gemini request failed (HTTP ${res.status})`);
    const body = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    // Malformed JSON throws a plain Error -> ai.service retries once.
    return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim());
  }

  async generateTestCases(req: GenerateRequest): Promise<unknown> {
    return this.call(buildPrompt(req));
  }

  async analyzeFailure(req: AnalyzeFailureRequest): Promise<unknown> {
    return this.call(buildAnalysisPrompt(req));
  }
}

export function createAiProvider(env: Env): AiProvider {
  switch (env.AI_PROVIDER) {
    case 'mock':
      return new MockAiProvider();
    case 'gemini':
      if (!env.GEMINI_API_KEY) throw new Error('AI_PROVIDER=gemini requires GEMINI_API_KEY');
      return new GeminiAiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL);
    case 'openai':
      // TODO: implement an OpenAI provider behind this same interface.
      throw new Error('AI_PROVIDER=openai is not implemented yet');
  }
}



