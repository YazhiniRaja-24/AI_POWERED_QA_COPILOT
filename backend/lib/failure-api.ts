import { apiRequest } from './api-client';

export interface AnalyzeParams {
  testTitle: string;
  steps: string[];
  expected: string;
  actual: string;
  framework: string;
}

export interface FailureAnalysisData {
  category: string;
  rootCause: string;
  likelihood: string;
  recommendation: string;
  patch: string;
  confidence: number;
}

export const failureApi = {
  analyze: (params: AnalyzeParams) =>
    apiRequest<{ provider: string; analysis: FailureAnalysisData }>(
      '/api/ai/failures/analyze',
      { method: 'POST', body: JSON.stringify(params) },
    ),
};
