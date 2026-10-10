import { apiRequest } from './api-client';

export type ApiRunResultStatus = 'passed' | 'failed' | 'unsupported';
export type ApiRunSource = 'playwright' | 'simulated';

export interface ApiRunStep {
  op: string;
  detail: string;
  ok: boolean;
}

export interface ApiRunResult {
  testCaseId: string;
  title: string;
  framework: string;
  status: ApiRunResultStatus;
  durationMs: number;
  expected: string;
  actual: string;
  errorType?: string;
  steps: ApiRunStep[];
  screenshot?: string;
  evidenceAvailable: boolean;
  unsupportedReason?: string;
}

export interface ApiRun {
  id: string;
  name: string;
  framework: string;
  source: ApiRunSource;
  status: 'Passed' | 'Failed' | 'Running';
  total: number;
  passed: number;
  failed: number;
  unsupported: number;
  durationMs: number;
  createdAt: string;
  results: ApiRunResult[];
}

export const runApi = {
  execute: (testCaseIds: string[], name?: string) =>
    apiRequest<ApiRun>('/api/runs/execute', {
      method: 'POST',
      body: JSON.stringify({ testCaseIds, name }),
    }),
  list: () => apiRequest<ApiRun[]>('/api/runs'),
  get: (id: string) => apiRequest<ApiRun>(`/api/runs/${id}`),
};
