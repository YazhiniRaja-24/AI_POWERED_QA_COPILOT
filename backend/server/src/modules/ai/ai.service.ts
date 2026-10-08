import { randomUUID } from 'node:crypto';
import { AppError } from '../../utils/http';
import type { AiProvider } from './ai.provider';
import {
  rawAnalysisSchema,
  rawGeneratedCaseSchema,
  type AnalyzeRequest,
  type FailureAnalysisResult,
  type GenerateRequest,
  type GeneratedTestCase,
} from './ai.schemas';

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const normalisePriority = (p: string) =>
  PRIORITIES.find((x) => x.toLowerCase() === p.toLowerCase()) ?? 'Medium';

export class AiService {
  constructor(private readonly provider: AiProvider) {}

  get providerName() {
    return this.provider.name;
  }

  async generate(req: GenerateRequest): Promise<{ provider: string; testCases: GeneratedTestCase[] }> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const cases = this.validate(await this.provider.generateTestCases(req), req);
        if (cases.length > 0) return { provider: this.provider.name, testCases: cases.slice(0, req.count) };
      } catch (err) {
        if (err instanceof AppError) throw err; // provider/network errors: do not retry
      }
    }
    throw new AppError(502, 'AI_INVALID_OUTPUT', 'The AI provider did not return valid test cases. Please try again.');
  }

  async analyze(req: AnalyzeRequest): Promise<{ provider: string; analysis: FailureAnalysisResult }> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await this.provider.analyzeFailure(req);
        const candidate =
          raw && typeof raw === 'object' && 'analysis' in raw
            ? (raw as { analysis: unknown }).analysis
            : raw;
        const parsed = rawAnalysisSchema.safeParse(candidate);
        if (parsed.success) return { provider: this.provider.name, analysis: parsed.data };
      } catch (err) {
        if (err instanceof AppError) throw err; // provider/network errors: do not retry
      }
    }
    throw new AppError(502, 'AI_INVALID_OUTPUT', 'The AI provider did not return a valid failure analysis. Please try again.');
  }

  private validate(raw: unknown, req: GenerateRequest): GeneratedTestCase[] {
    const list = Array.isArray(raw)
      ? raw
      : raw && typeof raw === 'object' && Array.isArray((raw as { testCases?: unknown }).testCases)
        ? (raw as { testCases: unknown[] }).testCases
        : [];
    const out: GeneratedTestCase[] = [];
    for (const item of list) {
      const parsed = rawGeneratedCaseSchema.safeParse(item);
      if (!parsed.success) continue; // drop invalid items instead of trusting them
      out.push({
        id: randomUUID(),
        ...parsed.data,
        priority: normalisePriority(parsed.data.priority),
        type: req.type, // the request is the source of truth
        framework: req.framework,
      });
    }
    return out;
  }
}
