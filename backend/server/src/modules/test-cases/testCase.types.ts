import { randomUUID } from 'node:crypto';
import type { CreateTestCaseInput, UpdateTestCaseInput } from './testCase.validation';

export interface TestCase {
  id: string;
  title: string;
  description: string;
  type: CreateTestCaseInput['type'];
  priority: CreateTestCaseInput['priority'];
  framework: CreateTestCaseInput['framework'];
  status: CreateTestCaseInput['status'];
  lastUpdated: string; // ISO timestamp
  preconditions: string;
  steps: string[];
  expectedResult: string;
  tags: string[];
  createdBy: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export function buildTestCase(input: CreateTestCaseInput, now = new Date()): TestCase {
  const ts = now.toISOString();
  return { id: randomUUID(), ...input, lastUpdated: ts, createdAt: ts, updatedAt: ts };
}

export function applyPatch(existing: TestCase, patch: UpdateTestCaseInput, now = new Date()): TestCase {
  const ts = now.toISOString();
  const defined = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as UpdateTestCaseInput;
  return {
    ...existing,
    ...defined,
    id: existing.id,
    createdAt: existing.createdAt,
    lastUpdated: ts,
    updatedAt: ts,
  };
}

export function duplicateTestCase(source: TestCase, now = new Date()): TestCase {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, lastUpdated, ...rest } = source;
  return buildTestCase({ ...rest, title: `${source.title} (Copy)`, status: 'Draft' }, now);
}
