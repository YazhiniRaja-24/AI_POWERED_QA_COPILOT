import { z } from 'zod';

export const generateRequestSchema = z.object({
  requirement: z.string().trim().min(10, 'Requirement must be at least 10 characters').max(2000),
  type: z.string().trim().min(1).max(50),
  framework: z.string().trim().min(1).max(50),
  count: z.coerce.number().int().min(1).max(10).default(5),
});
export type GenerateRequest = z.infer<typeof generateRequestSchema>;

/** What we accept from a provider before normalising. */
export const rawGeneratedCaseSchema = z.object({
  title: z.string().trim().min(3).max(200),
  priority: z.string().trim().default('Medium'),
  confidence: z.number().min(0).max(1).default(0.7),
  description: z.string().trim().default(''),
  preconditions: z.string().trim().default(''),
  steps: z.array(z.string().trim().min(1)).min(1).max(30),
  expectedResult: z.string().trim().min(1),
});

export interface GeneratedTestCase {
  id: string;
  title: string;
  type: string;
  priority: string;
  framework: string;
  confidence: number;
  description: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
}

export const analyzeRequestSchema = z.object({
  testTitle: z.string().trim().min(3).max(300),
  steps: z.array(z.string().trim().min(1)).max(30).default([]),
  expected: z.string().trim().min(1).max(2000),
  actual: z.string().trim().min(1).max(2000),
  framework: z.string().trim().min(1).max(50).default('Playwright'),
});
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

/** What we accept from a provider before normalising. */
export const rawAnalysisSchema = z.object({
  category: z.string().trim().min(1).max(120),
  rootCause: z.string().trim().min(1).max(1500),
  likelihood: z.string().trim().min(1).max(120),
  recommendation: z.string().trim().min(1).max(2000),
  patch: z.string().trim().max(4000).default(''),
  confidence: z.number().min(0).max(1).default(0.7),
});

export interface FailureAnalysisResult {
  category: string;
  rootCause: string;
  likelihood: string;
  recommendation: string;
  patch: string;
  confidence: number;
}
