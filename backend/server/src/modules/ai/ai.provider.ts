import type { Env } from '../../config/env';
import { AppError } from '../../utils/http';
import type {
  AnalyzeFailureRequest,
  GenerateRequest,
  WebsiteAnalysis,
} from './ai.schemas';

/** Providers return UNVALIDATED output; ai.service.ts validates it. */
export interface AiProvider {
  readonly name: string;
  generateTestCases(r: GenerateRequest): Promise<unknown>;
  analyzeFailure(r: AnalyzeFailureRequest): Promise<unknown>;
}

interface RawCase {
  title: string;
  priority: string;
  confidence: number;
  description: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  targetPage: string;
  evidence: string;
  tags: string[];
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

function requirementCases(r: GenerateRequest): RawCase[] {
  const match = r.requirement
    ? /(?:should be able to|want to|can)\s+(.+?)\.?$/i.exec(r.requirement)
    : null;
  const action = match
    ? match[1]
    : r.requirement?.slice(0, 80) || r.url || 'the application';
  return Array.from({ length: r.count }, (_, i) => {
    const sc = SCENARIOS[i % SCENARIOS.length];
    return {
      title: `Verify ${sc.label}: ${action}`,
      priority: sc.priority,
      confidence: Number((0.95 - i * 0.02).toFixed(2)),
      description: `Requirement test (${sc.label}) derived from: ${r.requirement ?? r.url}`,
      preconditions: 'The application is running and the tester has the required access',
      steps: sc.steps,
      expectedResult: sc.expected,
      targetPage: r.website?.url ?? '',
      evidence: '',
      tags: ['requirement'],
    };
  });
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function resolvePage(base: string, maybe: string): string {
  if (!maybe) return base;
  try {
    return new URL(maybe, base).href;
  } catch {
    return base;
  }
}

const FIELD_TYPE_BEHAVIOUR: Record<string, string> = {
  email: 'email-format validation',
  url: 'URL-format validation',
  tel: 'telephone-format validation',
  number: 'numeric range/format validation',
  password: 'password masking and strength rules',
  date: 'date selection validation',
  search: 'search input behaviour',
};

/**
 * Deterministically derives test cases from an ACTUAL website inspection
 * result. Every case references elements that were observed on the page(s),
 * and no application features are invented.
 */
function groundedFromWebsite(r: GenerateRequest, w: WebsiteAnalysis): RawCase[] {
  const root = w.url;
  const host = hostOf(root);
  const displayTitle = w.title && w.title !== root ? w.title : host;
  const out: RawCase[] = [];

  const structure: string[] = [];
  if (w.headings.length) structure.push(`${w.headings.length} heading(s)`);
  if (w.formsDetail.length) structure.push(`${w.formsDetail.length} form(s)`);
  if (w.inputs.length) structure.push(`${w.inputs.length} input field(s)`);
  if (w.buttons.length) structure.push(`${w.buttons.length} button(s)`);
  if (w.links.length) structure.push(`${w.links.length} link(s)`);
  const structureText = structure.join(', ') || 'no structured elements discovered';

  out.push({
    title: `Load "${displayTitle}" and verify the page renders`,
    priority: 'High',
    confidence: 0.9,
    description: `Opens the inspected page ${root} and confirms the page structure that was observed live. Structure found: ${structureText}.`,
    preconditions: `${root} is reachable from the test environment.`,
    steps: [
      `Navigate to ${root}`,
      'Wait for the page to finish loading',
      w.headings.length
        ? `Verify the visible heading "${w.headings[0]}"`
        : 'Verify the page content is displayed',
    ],
    expectedResult: w.headings.length
      ? `The page loads and the observed heading "${w.headings[0]}" is visible.`
      : 'The page loads successfully and displays its content. No specific heading was discovered during inspection.',
    targetPage: root,
    evidence: `title="${w.title}"; ${structureText}`,
    tags: ['website', 'smoke'],
  });

  if (w.headings.length > 1) {
    out.push({
      title: `Verify the main headings of "${displayTitle}"`,
      priority: 'Low',
      confidence: 0.75,
      description: `Checks that the section headings discovered during inspection are rendered on ${root}.`,
      preconditions: `${root} is reachable from the test environment.`,
      steps: [
        `Navigate to ${root}`,
        `Verify the following headings are visible: ${w.headings.slice(0, 4).join(' | ')}`,
      ],
      expectedResult: `All observed headings (${w.headings.slice(0, 4).join(', ')}) are visible on the page.`,
      targetPage: root,
      evidence: `headings: ${w.headings.slice(0, 6).join(' | ')}`,
      tags: ['website', 'content'],
    });
  }

  // Form-based cases (valid submission + required-field validation).
  for (const form of w.formsDetail.slice(0, 3)) {
    const page = form.page || root;
    const fields = form.fields;
    const fieldLabels = fields
      .map((f) => f.label || f.name || f.type)
      .filter(Boolean)
      .slice(0, 10);
    const target = resolvePage(page, form.action);
    out.push({
      title: `Submit the form on ${page} with valid field values`,
      priority: 'High',
      confidence: 0.8,
      description: `Exercises the ${fields.length}-field form discovered on ${page} (${form.method} ${
        form.action || 'current page'
      }).`,
      preconditions: `The form is reachable at ${page} and does not require authentication.`,
      steps: [
        `Navigate to ${page}`,
        fields.length
          ? `Fill the observed fields: ${fieldLabels.join(', ')}`
          : 'Locate the form on the page',
        'Submit the form',
        'Observe the resulting page or message',
      ],
      expectedResult:
        'The form accepts valid input and proceeds (success message or next step). Expected behaviour inferred from the observed form; it has not been executed.',
      targetPage: target,
      evidence: `form method=${form.method} action=${form.action || '(self)'} @ ${page}; fields: ${
        fields
          .map((f) => `${f.label || f.name || '(unnamed)'}[${f.type}]${f.required ? ' required' : ''}`)
          .join(', ') || 'none observed'
      }`,
      tags: ['website', 'form'],
    });

    const required = fields.filter((f) => f.required);
    if (required.length) {
      out.push({
        title: `Submit the form on ${page} with required fields left empty`,
        priority: 'Medium',
        confidence: 0.7,
        description: `Leaves the ${required.length} field(s) marked required on ${page} empty and submits the form.`,
        preconditions: `The form is reachable at ${page}.`,
        steps: [
          `Navigate to ${page}`,
          `Leave the required field(s) empty: ${required
            .map((f) => f.label || f.name || f.type)
            .join(', ')}`,
          'Submit the form',
        ],
        expectedResult: `A required-field message is shown for: ${required
          .map((f) => f.label || f.name || f.type)
          .join(', ')}. Expected behaviour inferred from the observed required attributes; it has not been executed.`,
        targetPage: target,
        evidence: `form @ ${page}; required fields: ${required
          .map((f) => `${f.label || f.name || f.type}[${f.type}]`)
          .join(', ')}`,
        tags: ['website', 'form', 'validation'],
      });
    }
  }

  // Input type validation based on observed input types.
  const typedInputs = w.inputs.filter((f) => FIELD_TYPE_BEHAVIOUR[f.type]);
  for (const input of typedInputs.slice(0, 4)) {
    const name = input.label || input.accessibleName || input.name || `the ${input.type} field`;
    out.push({
      title: `Validate the "${name}" ${input.type} input`,
      priority: input.required ? 'High' : 'Medium',
      confidence: 0.7,
      description: `Targets the ${input.type} input observed on ${input.page || root}${
        input.name ? ` (name="${input.name}")` : ''
      } and checks its ${FIELD_TYPE_BEHAVIOUR[input.type]}.`,
      preconditions: `${input.page || root} is reachable and the field is visible.`,
      steps: [
        `Navigate to ${input.page || root}`,
        `Locate the "${name}" field`,
        `Enter an invalid value and submit or blur the field`,
        'Observe the validation feedback',
      ],
      expectedResult: `The field applies ${FIELD_TYPE_BEHAVIOUR[input.type]} and shows a validation message for invalid input. Expected behaviour inferred from the observed input type; it has not been executed.`,
      targetPage: input.page || root,
      evidence: `input type=${input.type} name="${input.name}"${input.required ? ' required' : ''}${
        input.label ? ` label="${input.label}"` : ''
      } @ ${input.page || root}`,
      tags: ['website', 'input'],
    });
  }

  // Button interaction cases.
  for (const button of w.buttons.slice(0, 4)) {
    const name = button.accessibleName || button.text;
    if (!name) continue;
    const page = button.page || root;
    out.push({
      title: `Click "${name}" on ${page} and verify the response`,
      priority: 'Medium',
      confidence: 0.7,
      description: `Interacts with the "${name}" button discovered on ${page} and checks the resulting behaviour.`,
      preconditions: `${page} is reachable and the button is visible.`,
      steps: [`Navigate to ${page}`, `Click the "${name}" button`, 'Observe the resulting state or navigation'],
      expectedResult: `Clicking "${name}" triggers its intended action (navigation, dialog or state change). Expected behaviour inferred from the observed control; it has not been executed.`,
      targetPage: page,
      evidence: `button type=${button.type} name="${name}" @ ${page}`,
      tags: ['website', 'interaction'],
    });
  }

  // Same-origin link navigation cases.
  for (const link of w.links.filter((l) => l.sameOrigin && l.href && l.href !== root).slice(0, 4)) {
    const page = link.page || root;
    out.push({
      title: `Follow the "${link.text || link.href}" link to ${link.href}`,
      priority: 'Medium',
      confidence: 0.75,
      description: `Navigates the same-origin link discovered on ${page} and verifies the destination.`,
      preconditions: `${page} is reachable and the link is visible.`,
      steps: [`Navigate to ${page}`, `Click the "${link.text || link.href}" link`, `Verify that ${link.href} loads`],
      expectedResult: `The destination ${link.href} loads successfully. Expected behaviour inferred from the observed link; it has not been executed.`,
      targetPage: link.href,
      evidence: `link href="${link.href}" text="${link.text}" @ ${page}`,
      tags: ['website', 'navigation'],
    });
  }

  return out.slice(0, r.count);
}

export class MockAiProvider implements AiProvider {
  readonly name = 'mock';
  async generateTestCases(r: GenerateRequest): Promise<unknown> {
    if (r.website) return groundedFromWebsite(r, r.website);
    return requirementCases(r);
  }

  async analyzeFailure(r: AnalyzeFailureRequest): Promise<unknown> {
    const text = `${(r as any).actual||""} ${(r as any).expected} ${(r as any).testTitle}`.toLowerCase();

    if (/timed out|timeout|after \d+ms|deadline/.test(text)) {
      return {
        category: 'Timeout / flaky timing',
        rootCause: `"${(r as any).testTitle}" waited for an element or response that never reached the expected state within the configured timeout. This usually means the UI stayed in a loading state or the backend responded too slowly under the current environment.`,
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
        rootCause: `The executing user does not hold the role required by "${(r as any).testTitle}". The test ran with credentials that lack the permission the requirement assumes.`,
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
        rootCause: `The application accepted input it should have rejected, or the validation message expected by "${(r as any).testTitle}" was not rendered. The assertion and the UI copy have drifted apart.`,
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
        rootCause: `The locator used by "${(r as any).testTitle}" no longer matches the rendered DOM — likely a label, role or component change since the test was generated.`,
        likelihood: 'Medium (70%)',
        recommendation:
          'Re-anchor the step on an accessible role and visible name (role + name) instead of CSS selectors, and re-record the baseline screenshot for this flow.',
        patch: `await expect(page.getByRole('button', { name: /submit/i })).toBeEnabled();`,
        confidence: 0.86,
      };
    }
    return {
      category: 'Assertion mismatch / functional defect',
      rootCause: `"${(r as any).testTitle}" produced "${(r as any).actual||""}" while the requirement expects "${(r as any).expected}". Either the feature regressed or the expected value in the test data is out of date.`,
      likelihood: 'Medium (60%)',
      recommendation:
        'Reproduce the flow manually with the generated test data set, compare against the requirement, and decide whether to fix the product or update the expected outcome.',
      patch: `// Re-run with: npx playwright test --trace on\n// Expected: ${String((r as any).expected).replace(/\n/g, ' ')}`,
      confidence: 0.8,
    };
  }
}

// ---------------- Gemini (real provider; needs GEMINI_API_KEY) ----------------
function buildPrompt(r: GenerateRequest): string {
  const base = [
    'You are a senior QA engineer. Generate software test cases grounded ONLY in the provided source.',
    `Test type: ${r.type}. Target framework: ${r.framework}.`,
    `Return EXACTLY ${r.count} test cases as a JSON array and nothing else.`,
    'Each item must have: title (string), priority ("Critical"|"High"|"Medium"|"Low"),',
    'confidence (number between 0 and 1), description (string), preconditions (string),',
    'steps (array of short strings), expectedResult (string), targetPage (string, a URL from the source),',
    'evidence (string naming the observed element(s) that justify the scenario), tags (array of short strings).',
    'Rules: reference only pages, forms, fields, buttons and links that appear in the source.',
    'Do NOT invent login, password reset, checkout or authorization functionality unless it is explicitly present in the source.',
    'Do NOT claim a result was verified; describe the expected behaviour instead.',
  ];

  if (r.website) {
    const w = r.website;
    base.push(
      `Source: LIVE website inspection of ${w.url}`,
      `Page title: ${w.title}`,
      `Inspected pages: ${w.pages.join(', ') || 'none'}`,
      `Headings: ${w.headings.slice(0, 20).join(' | ') || 'none'}`,
      `Forms: ${w.forms.join(' || ') || 'none'}`,
      `Inputs: ${
        w.inputs
          .map(
            (f) =>
              `${f.label || f.name || f.type}[${f.type}]${f.required ? ' required' : ''} @ ${f.page}`,
          )
          .join('; ') || 'none'
      }`,
      `Buttons: ${w.buttons.map((b) => `${b.accessibleName || b.text} @ ${b.page}`).join('; ') || 'none'}`,
      `Same-origin links: ${
        w.links
          .filter((l) => l.sameOrigin)
          .slice(0, 30)
          .map((l) => `${l.text || '(no text)'} -> ${l.href}`)
          .join('; ') || 'none'
      }`,
      `Page text (truncated): ${w.text.slice(0, 1500)}`,
      `Inspection limitations: ${w.warnings.join(' | ') || 'none'}`,
    );
  } else if (r.requirement) {
    base.push(`Requirement: ${r.requirement}`);
  } else {
    base.push(`URL: ${r.url}`);
  }

  return base.join('\n');
}

function buildAnalysisPrompt(r: AnalyzeFailureRequest): string {
  return [
    'You are a senior QA engineer analysing a failed automated test.',
    `Test title: ${(r as any).testTitle}`,
    `Framework: ${(r as any).framework}`,
    `Steps: ${(r as any).steps?.join(' | ') || 'not recorded'}`,
    `Expected: ${(r as any).expected}`,
    `Actual: ${(r as any).actual||""}`,
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

  async generateTestCases(r: GenerateRequest): Promise<unknown> {
    return this.call(buildPrompt(r));
  }

  async analyzeFailure(r: AnalyzeFailureRequest): Promise<unknown> {
    return this.call(buildAnalysisPrompt(r));
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
