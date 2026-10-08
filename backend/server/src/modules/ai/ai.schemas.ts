import { z } from 'zod';

export const generateRequestSchema = z
  .object({
    requirement: z.string().trim().max(2000).optional(),
    type: z.string().trim().min(1).max(50),
    framework: z.string().trim().min(1).max(50),
    count: z.coerce.number().int().min(1).max(10).default(5),
    url: z.string().trim().url().max(2048).optional(),
    website: z
      .object({
        url: z.string().trim().url().max(2048),
        title: z.string().trim().max(200),
        pages: z.array(z.string().trim()).max(50),
        forms: z.array(z.string().trim()).max(50),
        actions: z.array(z.string().trim()).max(80),
        interactiveElements: z.array(z.string().trim()).max(200),
      })
      .optional(),
  })
  .refine(
    (data) => Boolean(data.requirement?.trim().length && data.requirement.trim().length >= 10) || Boolean(data.website?.url || data.url),
    {
      message: 'Provide either a valid requirement (min 10 chars) or a website analysis.',
      path: ['requirement'],
    },
  );
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

export const analyzeFailureRequestSchema = z.object({
  url: z.string().trim().url('URL must be valid').max(2048),
});
export type AnalyzeUrlRequest = z.infer<typeof analyzeFailureRequestSchema>
export type AnalyzeFailureRequest = z.infer<typeof analyzeFailureRequestSchema>;

export const websiteAnalysisSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  pages: z.array(z.string()).max(50),
  forms: z.array(z.string()).max(50),
  actions: z.array(z.string()).max(80),
  interactiveElements: z.array(z.string()).max(200),
});
export type WebsiteAnalysis = z.infer<typeof websiteAnalysisSchema>;

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



