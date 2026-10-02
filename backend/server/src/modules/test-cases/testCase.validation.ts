import { z } from 'zod';

const testCaseTypes = z.enum([
  'Functional',
  'Regression',
  'Negative',
  'Edge Case',
  'Security',
]);

const testCasePriorities = z.enum(['Critical', 'High', 'Medium', 'Low']);

const testCaseFrameworks = z.enum(['Playwright', 'Selenium', 'API', 'Manual']);

const testCaseStatuses = z.enum(['Draft', 'Ready', 'Passed', 'Failed', 'Blocked']);

export const createTestCaseSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().trim().max(5000).default(''),
  type: testCaseTypes,
  priority: testCasePriorities,
  framework: testCaseFrameworks,
  status: testCaseStatuses.default('Draft'),
  preconditions: z.string().trim().max(5000).default(''),
  steps: z.array(z.string().trim().min(1).max(1000)).max(50).default([]),
  expectedResult: z.string().trim().max(5000).default(''),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
  createdBy: z.string().trim().min(1).max(100).default('system'),
});

export const updateTestCaseSchema = createTestCaseSchema.partial();

export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;
export type UpdateTestCaseInput = z.infer<typeof updateTestCaseSchema>;
