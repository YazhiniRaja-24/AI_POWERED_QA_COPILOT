import { z } from 'zod';

export const inspectedFieldSchema = z.object({
  page: z.string().trim().max(2048).default(''),
  label: z.string().trim().max(200).default(''),
  name: z.string().trim().max(200).default(''),
  type: z.string().trim().max(40).default('text'),
  placeholder: z.string().trim().max(200).default(''),
  required: z.boolean().default(false),
  accessibleName: z.string().trim().max(200).default(''),
});
export type InspectedField = z.infer<typeof inspectedFieldSchema>;

export const inspectedButtonSchema = z.object({
  page: z.string().trim().max(2048).default(''),
  text: z.string().trim().max(200).default(''),
  accessibleName: z.string().trim().max(200).default(''),
  type: z.string().trim().max(40).default('button'),
});
export type InspectedButton = z.infer<typeof inspectedButtonSchema>;

export const inspectedLinkSchema = z.object({
  page: z.string().trim().max(2048).default(''),
  text: z.string().trim().max(300).default(''),
  href: z.string().trim().max(2048),
  sameOrigin: z.boolean().default(true),
});
export type InspectedLink = z.infer<typeof inspectedLinkSchema>;

export const inspectedFormSchema = z.object({
  page: z.string().trim().max(2048).default(''),
  action: z.string().trim().max(2048).default(''),
  method: z.string().trim().max(10).default('GET'),
  fields: z.array(inspectedFieldSchema).max(60).default([]),
});
export type InspectedForm = z.infer<typeof inspectedFormSchema>;

export const websiteAnalysisSchema = z.object({
  url: z.string().url().max(2048),
  title: z.string().trim().max(300),
  pages: z.array(z.string().trim().max(2048)).max(50).default([]),
  headings: z.array(z.string().trim().max(300)).max(80).default([]),
  text: z.string().max(20000).default(''),
  forms: z.array(z.string().trim().max(500)).max(50).default([]),
  formsDetail: z.array(inspectedFormSchema).max(30).default([]),
  actions: z.array(z.string().trim().max(500)).max(120).default([]),
  interactiveElements: z.array(z.string().trim().max(300)).max(200).default([]),
  buttons: z.array(inspectedButtonSchema).max(80).default([]),
  links: z.array(inspectedLinkSchema).max(200).default([]),
  inputs: z.array(inspectedFieldSchema).max(120).default([]),
  inspectedPages: z.number().int().min(0).default(0),
  truncated: z.boolean().default(false),
  warnings: z.array(z.string().trim().max(500)).max(30).default([]),
});
export type WebsiteAnalysis = z.infer<typeof websiteAnalysisSchema>;

export const generateRequestSchema = z
  .object({
    requirement: z.string().trim().max(2000).optional(),
    type: z.string().trim().min(1).max(50),
    framework: z.string().trim().min(1).max(50),
    count: z.coerce.number().int().min(1).max(10).default(5),
    url: z.string().trim().url().max(2048).optional(),
    website: websiteAnalysisSchema.optional(),
  })
  .refine(
    (data) =>
      Boolean(data.requirement?.trim().length && data.requirement.trim().length >= 10) ||
      Boolean(data.website?.url || data.url),
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
  targetPage: z.string().trim().max(2048).default(''),
  evidence: z.string().trim().max(2000).default(''),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
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
  targetPage: string;
  evidence: string;
  tags: string[];
}

export const analyzeUrlRequestSchema = z.object({
  url: z
    .string()
    .trim()
    .url('URL must be valid')
    .max(2048)
    .refine((u) => /^https?:\/\//i.test(u), 'Only http(s) URLs are supported'),
});
export type AnalyzeUrlRequest = z.infer<typeof analyzeUrlRequestSchema>;

export const analyzeFailureRequestSchema = z.object({
  url: z.string().trim().url('URL must be valid').max(2048),
});
export type AnalyzeFailureRequest = z.infer<typeof analyzeFailureRequestSchema>;

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



