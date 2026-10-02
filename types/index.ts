export type TestStatus = 'passed' | 'failed' | 'skipped';
export type RunStatus = 'Passed' | 'Failed' | 'Running';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type BugStatus = 'Open' | 'Investigating' | 'Resolved';
export type InsightSeverity = 'high' | 'medium' | 'optimization';
export type Role =
  | 'QA Engineer'
  | 'Automation Engineer'
  | 'Software Engineer'
  | 'Engineering Manager'
  | 'Other';

export interface User {
  name: string;
  email: string;
  role: Role;
  company?: string;
}

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
  trend: number[];
}

export interface TestRun {
  id: string;
  name: string;
  framework: string;
  total: number;
  passed: number;
  failed: number;
  duration: string;
  status: RunStatus;
}

export interface Bug {
  id: string;
  title: string;
  severity: Severity;
  priority: Priority;
  status: BugStatus;
}

export interface AiInsight {
  id: string;
  severity: InsightSeverity;
  title: string;
  recommendation: string;
  details: string;
}

export interface CoverageArea {
  label: string;
  value: number;
}

export interface QualityBreakdown {
  label: string;
  value: number;
  status?: string;
}

export interface ChartPoint {
  day: string;
  passed: number;
  failed: number;
  skipped: number;
}

export type TestCaseStatus =
  | 'Draft'
  | 'Ready'
  | 'Passed'
  | 'Failed'
  | 'Blocked';

export type TestCaseType =
  | 'Functional'
  | 'Regression'
  | 'Negative'
  | 'Edge Case'
  | 'Security';

export type TestFramework = 'Playwright' | 'Selenium' | 'API' | 'Manual';

export type TestCasePriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface TestCase {
  id: string;
  title: string;
  description: string;
  type: TestCaseType;
  priority: TestCasePriority;
  framework: TestFramework;
  status: TestCaseStatus;
  lastUpdated: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  tags: string[];
  createdBy: string;
}

export interface AiGeneratedCase {
  id: string;
  title: string;
  type: TestCaseType;
  priority: TestCasePriority;
  framework: TestFramework;
  confidence: number;
}
