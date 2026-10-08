import { apiRequest } from './api-client';

export interface AnalyzeUrlParams {
  url: string;
}

export interface WebsiteAnalysisData {
  url: string;
  title: string;
  pages: string[];
  forms: string[];
  actions: string[];
  interactiveElements: string[];
}

export const urlAnalysisApi = {
  analyze: (params: AnalyzeUrlParams) =>
    apiRequest<{ analysis: WebsiteAnalysisData; provider: string }>(
      '/api/ai/analyze-url',
      { method: 'POST', body: JSON.stringify(params) },
    ),
};
