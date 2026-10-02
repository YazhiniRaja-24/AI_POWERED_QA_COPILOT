import type { Env } from '../../config/env';
import { AppError } from '../../utils/http';
import type { GenerateRequest } from './ai.schemas';

/** Providers return UNVALIDATED output; ai.service.ts validates it. */
export interface AiProvider {
  readonly name: string;
  generateTestCases(req: GenerateRequest): Promise<unknown>;
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
      /(?:should be able to|want to|can)\s+(.+?)\.?$/i.exec(req.requirement)?.[1] ??
      req.requirement.slice(0, 80);
    return Array.from({ length: req.count }, (_, i) => {
      const sc = SCENARIOS[i % SCENARIOS.length];
      return {
        title: `Verify ${sc.label}: ${action}`,
        priority: sc.priority,
        confidence: Number((0.95 - i * 0.02).toFixed(2)),
        description: `${req.type} test (${sc.label}) derived from: ${req.requirement}`,
        preconditions: 'The application is running and the tester has the required access',
        steps: sc.steps,
        expectedResult: sc.expected,
      };
    });
  }
}

// ---------------- Gemini (real provider; needs GEMINI_API_KEY) ----------------
function buildPrompt(req: GenerateRequest): string {
  return [
    'You are a senior QA engineer. Generate software test cases from the requirement below.',
    `Requirement: ${req.requirement}`,
    `Test type: ${req.type}. Target framework: ${req.framework}.`,
    `Return EXACTLY ${req.count} test cases as a JSON array and nothing else.`,
    'Each item must have: title (string), priority ("Critical"|"High"|"Medium"|"Low"),',
    'confidence (number between 0 and 1), description (string), preconditions (string),',
    'steps (array of short strings), expectedResult (string).',
    'Cover happy path, negative cases and edge cases. Do not invent features not implied by the requirement.',
  ].join('\n');
}

export class GeminiAiProvider implements AiProvider {
  readonly name = 'gemini';
  constructor(private readonly apiKey: string, private readonly model: string) {}

  async generateTestCases(req: GenerateRequest): Promise<unknown> {
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: buildPrompt(req) }] }],
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
