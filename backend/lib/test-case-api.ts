import { apiRequest } from './api-client';
import {
  frameworkOptions,
  priorityOptions,
  statusOptions,
  typeOptions,
} from '../../data/testCaseOptions';
import type { TestCase } from '../../types';

/** Shape returned by the backend. Map to the UI type in ONE place. */
export interface ApiTestCase {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  framework: string;
  status: string;
  lastUpdated: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type TestCaseInput = Omit<ApiTestCase, 'id' | 'lastUpdated' | 'createdAt' | 'updatedAt'>;

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

export interface GenerateParams {
  requirement: string;
  type: string;
  framework: string;
  count: number;
}

function ensureOption<T extends string>(
  value: string,
  options: readonly T[],
  field: string,
): T {
  if (!options.includes(value as T)) {
    throw new Error(`Unexpected ${field} value from API: ${value}`);
  }
  return value as T;
}

function formatLastUpdated(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid lastUpdated timestamp from API: ${isoTimestamp}`);
  }
  return date.toISOString().slice(0, 10);
}

export function toUiTestCase(api: ApiTestCase): TestCase {
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    type: ensureOption(api.type, typeOptions, 'type'),
    priority: ensureOption(api.priority, priorityOptions, 'priority'),
    framework: ensureOption(api.framework, frameworkOptions, 'framework'),
    status: ensureOption(api.status, statusOptions, 'status'),
    lastUpdated: formatLastUpdated(api.lastUpdated),
    preconditions: api.preconditions,
    steps: api.steps,
    expectedResult: api.expectedResult,
    tags: api.tags,
    createdBy: api.createdBy,
  };
}

export function toApiInput(ui: TestCase): TestCaseInput {
  const { id: _id, lastUpdated: _lastUpdated, ...input } = ui;
  return input;
}

/** Only used once a generated case has been reviewed and approved by the user. */
export function toTestCaseInput(
  generated: GeneratedTestCase,
  createdBy: string,
): TestCaseInput {
  return {
    title: generated.title,
    description: generated.description,
    type: ensureOption(generated.type, typeOptions, 'type'),
    priority: ensureOption(generated.priority, priorityOptions, 'priority'),
    framework: ensureOption(generated.framework, frameworkOptions, 'framework'),
    status: 'Draft',
    preconditions: generated.preconditions,
    steps: generated.steps,
    expectedResult: generated.expectedResult,
    tags: ['ai-generated'],
    createdBy,
  };
}

export const testCaseApi = {
  list: () => apiRequest<ApiTestCase[]>('/api/test-cases'),
  get: (id: string) => apiRequest<ApiTestCase>(`/api/test-cases/${id}`),
  create: (input: Partial<TestCaseInput> & Pick<TestCaseInput, 'title' | 'type' | 'priority' | 'framework'>) =>
    apiRequest<ApiTestCase>('/api/test-cases', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, patch: Partial<TestCaseInput>) =>
    apiRequest<ApiTestCase>(`/api/test-cases/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  duplicate: (id: string) =>
    apiRequest<ApiTestCase>(`/api/test-cases/${id}/duplicate`, { method: 'POST' }),
  remove: (id: string) =>
    apiRequest<{ id: string; deleted: true }>(`/api/test-cases/${id}`, { method: 'DELETE' }),
  generate: (params: GenerateParams) =>
    apiRequest<{ provider: string; testCases: GeneratedTestCase[] }>('/api/ai/test-cases/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};
