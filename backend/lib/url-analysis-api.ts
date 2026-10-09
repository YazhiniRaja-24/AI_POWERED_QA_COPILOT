import { apiRequest } from './api-client';

export interface AnalyzeUrlParams {
  url: string;
}

export interface AnalyzedField {
  page: string;
  label: string;
  name: string;
  type: string;
  placeholder: string;
  required: boolean;
  accessibleName: string;
}

export interface AnalyzedButton {
  page: string;
  text: string;
  accessibleName: string;
  type: string;
}

export interface AnalyzedLink {
  page: string;
  text: string;
  href: string;
  sameOrigin: boolean;
}

export interface AnalyzedForm {
  page: string;
  action: string;
  method: string;
  fields: AnalyzedField[];
}

export interface WebsiteAnalysisData {
  url: string;
  title: string;
  pages: string[];
  headings: string[];
  text: string;
  forms: string[];
  formsDetail: AnalyzedForm[];
  actions: string[];
  interactiveElements: string[];
  buttons: AnalyzedButton[];
  links: AnalyzedLink[];
  inputs: AnalyzedField[];
  inspectedPages: number;
  truncated: boolean;
  warnings: string[];
}

export interface AnalyzeUrlResponse {
  analysis: WebsiteAnalysisData;
  provider: string;
}

export const urlAnalysisApi = {
  analyze: (params: AnalyzeUrlParams) =>
    apiRequest<AnalyzeUrlResponse>('/api/ai/analyze-url', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};
