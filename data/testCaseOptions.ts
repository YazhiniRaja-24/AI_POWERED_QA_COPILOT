import type {
  TestCasePriority,
  TestCaseStatus,
  TestCaseType,
  TestFramework,
} from '@/types';

export const statusOptions: TestCaseStatus[] = [
  'Draft',
  'Ready',
  'Passed',
  'Failed',
  'Blocked',
];

export const priorityOptions: TestCasePriority[] = [
  'Critical',
  'High',
  'Medium',
  'Low',
];

export const typeOptions: TestCaseType[] = [
  'Functional',
  'Regression',
  'Negative',
  'Edge Case',
  'Security',
];

export const frameworkOptions: TestFramework[] = [
  'Playwright',
  'Selenium',
  'API',
  'Manual',
];

export const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
];
