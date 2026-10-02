import type {
  KpiMetric,
  TestRun,
  Bug,
  AiInsight,
  CoverageArea,
  QualityBreakdown,
  ChartPoint,
  User,
  TestCase,
  TestFramework,
  TestCaseType,
  TestCasePriority,
  TestCaseStatus,
} from '@/types';

export const demoUser: User = {
  name: 'Yazhini Raj',
  email: 'saif@qacopilot.io',
  role: 'QA Engineer',
  company: 'QA Copilot',
};

export const kpiMetrics: KpiMetric[] = [
  {
    id: 'total-tests',
    label: 'Total Tests',
    value: '1,284',
    change: '+12.8%',
    positive: true,
    icon: 'Beaker',
    trend: [40, 55, 48, 62, 70, 85, 92],
  },
  {
    id: 'passed',
    label: 'Passed',
    value: '1,087',
    change: '84.7%',
    positive: true,
    icon: 'CheckCircle2',
    trend: [30, 42, 38, 50, 58, 64, 70],
  },
  {
    id: 'failed',
    label: 'Failed',
    value: '97',
    change: '-8.4%',
    positive: true,
    icon: 'XCircle',
    trend: [20, 18, 22, 15, 12, 10, 8],
  },
  {
    id: 'open-bugs',
    label: 'Open Bugs',
    value: '24',
    change: '-15.2%',
    positive: true,
    icon: 'Bug',
    trend: [38, 34, 30, 28, 26, 25, 24],
  },
  {
    id: 'coverage',
    label: 'Coverage',
    value: '87.4%',
    change: '+4.6%',
    positive: true,
    icon: 'ShieldCheck',
    trend: [78, 80, 82, 83, 85, 86, 87],
  },
  {
    id: 'ai-insights',
    label: 'AI Insights',
    value: '156',
    change: '+23.1%',
    positive: true,
    icon: 'Sparkles',
    trend: [60, 72, 80, 95, 110, 130, 156],
  },
];

export const chartData7Days: ChartPoint[] = [
  { day: 'Mon', passed: 142, failed: 18, skipped: 6 },
  { day: 'Tue', passed: 168, failed: 12, skipped: 4 },
  { day: 'Wed', passed: 155, failed: 22, skipped: 8 },
  { day: 'Thu', passed: 178, failed: 9, skipped: 5 },
  { day: 'Fri', passed: 192, failed: 15, skipped: 3 },
  { day: 'Sat', passed: 120, failed: 11, skipped: 7 },
  { day: 'Sun', passed: 132, failed: 10, skipped: 4 },
];

export const chartData30Days: ChartPoint[] = [
  { day: 'W1D1', passed: 680, failed: 82, skipped: 24 },
  { day: 'W1D2', passed: 720, failed: 65, skipped: 18 },
  { day: 'W2D1', passed: 750, failed: 70, skipped: 22 },
  { day: 'W2D2', passed: 790, failed: 55, skipped: 15 },
  { day: 'W3D1', passed: 820, failed: 48, skipped: 12 },
  { day: 'W3D2', passed: 860, failed: 40, skipped: 10 },
  { day: 'W4D1', passed: 910, failed: 35, skipped: 8 },
  { day: 'W4D2', passed: 940, failed: 30, skipped: 6 },
];

export const aiInsights: AiInsight[] = [
  {
    id: 'insight-1',
    severity: 'high',
    title: 'Checkout API has experienced repeated failures in the last 24 hours.',
    recommendation: 'Review timeout handling and API response latency.',
    details:
      'The Checkout API endpoint has recorded 14 failures across 6 test runs in the past 24 hours. Average response time has increased from 240ms to 1.8s. The failure pattern correlates with peak traffic windows between 14:00–17:00 UTC. Recommended actions: (1) Review connection pool configuration, (2) Add circuit breaker pattern, (3) Investigate downstream payment gateway latency.',
  },
  {
    id: 'insight-2',
    severity: 'medium',
    title: 'Authentication has lower test coverage than the project average.',
    recommendation: 'Add edge-case tests for expired sessions and invalid credentials.',
    details:
      'Authentication module coverage is at 64% versus the project average of 87.4%. Critical gaps include: expired token refresh flow, concurrent session limits, and OAuth callback error handling. Adding 12 targeted test cases would bring coverage to 89%.',
  },
  {
    id: 'insight-3',
    severity: 'optimization',
    title: '7 potentially flaky tests were detected.',
    recommendation: 'Review repeated failures and stabilize the affected test cases.',
    details:
      'AI analysis identified 7 tests with inconsistent pass/fail patterns over the last 30 runs. These tests have a flakiness score above 0.3, indicating environmental or timing dependencies. Tests affected: user_profile_load, cart_timeout, search_debounce, payment_webhook_retry, and 3 others. Recommended: add explicit waits, mock time-dependent calls, and isolate test data.',
  },
];

export const recentTestRuns: TestRun[] = [
  {
    id: 'run-1',
    name: 'Regression Suite',
    framework: 'Playwright',
    total: 248,
    passed: 231,
    failed: 17,
    duration: '04:32',
    status: 'Failed',
  },
  {
    id: 'run-2',
    name: 'Checkout API',
    framework: 'Postman',
    total: 84,
    passed: 84,
    failed: 0,
    duration: '01:18',
    status: 'Passed',
  },
  {
    id: 'run-3',
    name: 'Login Automation',
    framework: 'Selenium',
    total: 126,
    passed: 119,
    failed: 7,
    duration: '03:41',
    status: 'Failed',
  },
];

export const recentBugs: Bug[] = [
  {
    id: 'BUG-1042',
    title: 'Checkout fails on expired card',
    severity: 'Critical',
    priority: 'P1',
    status: 'Open',
  },
  {
    id: 'BUG-1041',
    title: 'Login timeout on slow networks',
    severity: 'High',
    priority: 'P1',
    status: 'Investigating',
  },
  {
    id: 'BUG-1039',
    title: 'Incorrect tax calculation',
    severity: 'Medium',
    priority: 'P2',
    status: 'Resolved',
  },
];

export const coverageAreas: CoverageArea[] = [
  { label: 'Frontend', value: 91 },
  { label: 'Backend', value: 84 },
  { label: 'API', value: 89 },
  { label: 'Critical Paths', value: 96 },
];

export const qualityBreakdown: QualityBreakdown[] = [
  { label: 'Test Stability', value: 94 },
  { label: 'Coverage', value: 87 },
  { label: 'Failure Recovery', value: 91 },
  { label: 'Regression Risk', value: 0, status: 'Low' },
];

const baseTestCases: TestCase[] = [
  {
    id: 'TC-1024',
    title: 'Verify successful user login',
    description:
      'Verify that an existing user can successfully authenticate using valid credentials.',
    type: 'Functional',
    priority: 'High',
    framework: 'Playwright',
    status: 'Passed',
    lastUpdated: '2026-08-28',
    preconditions: 'User account exists and is active.',
    steps: [
      'Open login page',
      'Enter valid email',
      'Enter valid password',
      'Click Sign In',
      'Verify dashboard appears',
    ],
    expectedResult:
      'User is successfully authenticated and redirected to the dashboard.',
    tags: ['auth', 'smoke', 'login'],
    createdBy: 'Yazhini Raj',
  },
  {
    id: 'TC-1025',
    title: 'Verify invalid password is rejected',
    description:
      'Verify that an incorrect password does not grant access and shows an error message.',
    type: 'Negative',
    priority: 'High',
    framework: 'Playwright',
    status: 'Ready',
    lastUpdated: '2026-08-27',
    preconditions: 'User account exists and is active.',
    steps: [
      'Open login page',
      'Enter valid email',
      'Enter wrong password',
      'Click Sign In',
      'Verify error message appears',
    ],
    expectedResult:
      'User is not authenticated and an invalid credentials error is displayed.',
    tags: ['auth', 'negative', 'login'],
    createdBy: 'Yazhini Raj',
  },
  {
    id: 'TC-1026',
    title: 'Verify expired session is handled',
    description:
      'Verify that an expired session returns the user to the login flow securely.',
    type: 'Security',
    priority: 'Critical',
    framework: 'Playwright',
    status: 'Blocked',
    lastUpdated: '2026-08-26',
    preconditions: 'User has an authenticated session that has expired.',
    steps: [
      'Authenticate and obtain a session',
      'Wait for the session to expire',
      'Attempt to access a protected route',
      'Verify redirection to login',
    ],
    expectedResult:
      'The user is redirected to the login page with no protected data exposed.',
    tags: ['auth', 'security', 'session'],
    createdBy: 'Maryam Ali',
  },
  {
    id: 'TC-1027',
    title: 'Verify checkout with valid card',
    description:
      'Verify a successful checkout flow when a valid payment card is provided.',
    type: 'Functional',
    priority: 'Critical',
    framework: 'Playwright',
    status: 'Passed',
    lastUpdated: '2026-08-25',
    preconditions: 'A product is in the cart and payment methods are configured.',
    steps: [
      'Add a product to the cart',
      'Proceed to checkout',
      'Enter valid card details',
      'Confirm the order',
      'Verify the order confirmation page',
    ],
    expectedResult:
      'The order is placed successfully and a confirmation is shown to the buyer.',
    tags: ['checkout', 'payment', 'smoke'],
    createdBy: 'Omar Farouk',
  },
  {
    id: 'TC-1028',
    title: 'Verify checkout with expired card',
    description:
      'Verify that an expired payment card is rejected with a clear error message.',
    type: 'Negative',
    priority: 'High',
    framework: 'API',
    status: 'Failed',
    lastUpdated: '2026-08-24',
    preconditions: 'A product is in the cart and an expired card is available.',
    steps: [
      'Add a product to the cart',
      'Proceed to checkout',
      'Enter an expired card',
      'Attempt to confirm the order',
      'Verify the error response',
    ],
    expectedResult:
      'The payment is declined and a descriptive card-expired error is returned.',
    tags: ['checkout', 'payment', 'negative'],
    createdBy: 'Omar Farouk',
  },
  {
    id: 'TC-1029',
    title: 'Verify search filters by status',
    description:
      'Verify that the test case list can be filtered by status correctly.',
    type: 'Functional',
    priority: 'Medium',
    framework: 'Selenium',
    status: 'Passed',
    lastUpdated: '2026-08-23',
    preconditions: 'At least two test cases exist with different statuses.',
    steps: [
      'Navigate to the test case list',
      'Select a status filter',
      'Verify the displayed results',
    ],
    expectedResult:
      'Only test cases matching the selected status are displayed.',
    tags: ['ui', 'filter', 'list'],
    createdBy: 'Yazhini Raj',
  },
  {
    id: 'TC-1030',
    title: 'Verify password change updates session',
    description:
      'Verify that changing the password invalidates old sessions.',
    type: 'Security',
    priority: 'High',
    framework: 'API',
    status: 'Ready',
    lastUpdated: '2026-08-22',
    preconditions: 'User is authenticated and can change the password.',
    steps: [
      'Authenticate with the current password',
      'Change the password',
      'Attempt to use the previous session token',
    ],
    expectedResult:
      'The previous session token is rejected after the password change.',
    tags: ['auth', 'security', 'password'],
    createdBy: 'Maryam Ali',
  },
  {
    id: 'TC-1031',
    title: 'Verify empty cart checkout blocked',
    description:
      'Verify that checkout cannot proceed when the cart is empty.',
    type: 'Edge Case',
    priority: 'Medium',
    framework: 'Selenium',
    status: 'Draft',
    lastUpdated: '2026-08-21',
    preconditions: 'The user has no items in the cart.',
    steps: [
      'Ensure the cart is empty',
      'Attempt to access checkout',
      'Verify the empty cart message',
    ],
    expectedResult:
      'Checkout is blocked and a prompt to add items is displayed.',
    tags: ['checkout', 'edge-case', 'cart'],
    createdBy: 'Omar Farouk',
  },
  {
    id: 'TC-1032',
    title: 'Verify login rate limiting',
    description:
      'Verify that repeated failed login attempts are rate limited.',
    type: 'Security',
    priority: 'Low',
    framework: 'API',
    status: 'Failed',
    lastUpdated: '2026-08-20',
    preconditions: 'A rate limiting policy is configured for the login endpoint.',
    steps: [
      'Send repeated failed login requests',
      'Increment the attempt counter',
      'Verify the lockout response',
    ],
    expectedResult:
      'After the threshold, further attempts return a rate limit error.',
    tags: ['auth', 'security', 'rate-limit'],
    createdBy: 'Maryam Ali',
  },
  {
    id: 'TC-1033',
    title: 'Verify checkout with invalid CVV',
    description:
      'Verify that an invalid CVV is rejected during payment processing.',
    type: 'Negative',
    priority: 'Medium',
    framework: 'API',
    status: 'Blocked',
    lastUpdated: '2026-08-19',
    preconditions: 'A product is in the cart and a card with an invalid CVV is available.',
    steps: [
      'Proceed to checkout',
      'Enter card with invalid CVV',
      'Attempt to confirm the order',
      'Verify the validation error',
    ],
    expectedResult:
      'The payment is rejected and a CVV validation error is returned.',
    tags: ['checkout', 'payment', 'negative'],
    createdBy: 'Omar Farouk',
  },
  {
    id: 'TC-1034',
    title: 'Verify product search with special characters',
    description:
      'Verify that search handles special characters without errors.',
    type: 'Edge Case',
    priority: 'Low',
    framework: 'Selenium',
    status: 'Draft',
    lastUpdated: '2026-08-18',
    preconditions: 'Search functionality is available.',
    steps: [
      'Navigate to search',
      'Enter special characters',
      'Submit the search',
      'Verify no errors occur',
    ],
    expectedResult:
      'Search returns results or a safe empty state without breaking.',
    tags: ['search', 'edge-case', 'ui'],
    createdBy: 'Yazhini Raj',
  },
  {
    id: 'TC-1035',
    title: 'Verify order history pagination',
    description:
      'Verify that order history pages through results correctly.',
    type: 'Functional',
    priority: 'Low',
    framework: 'Manual',
    status: 'Passed',
    lastUpdated: '2026-08-17',
    preconditions: 'The user has more orders than one page displays.',
    steps: [
      'Open order history',
      'Click next page',
      'Verify the following page of orders',
    ],
    expectedResult:
      'Pagination navigates through all order history entries.',
    tags: ['orders', 'ui', 'pagination'],
    createdBy: 'Omar Farouk',
  },
  {
    id: 'TC-1036',
    title: 'Verify checkout total calculation tax',
    description:
      'Verify that taxes are calculated correctly in the checkout total.',
    type: 'Functional',
    priority: 'High',
    framework: 'API',
    status: 'Ready',
    lastUpdated: '2026-08-16',
    preconditions: 'Tax configuration exists for the region.',
    steps: [
      'Add item to cart',
      'Proceed to checkout',
      'Verify the calculated total',
    ],
    expectedResult:
      'The total includes the correct tax amount for the region.',
    tags: ['checkout', 'tax', 'calculation'],
    createdBy: 'Maryam Ali',
  },
  {
    id: 'TC-1037',
    title: 'Verify expired password reset link',
    description:
      'Verify that an expired password reset link is rejected.',
    type: 'Negative',
    priority: 'High',
    framework: 'Playwright',
    status: 'Passed',
    lastUpdated: '2026-08-15',
    preconditions: 'A password reset link has exceeded its validity window.',
    steps: [
      'Request a password reset',
      'Wait for the link to expire',
      'Open the expired link',
      'Verify the expiry message',
    ],
    expectedResult:
      'The expired link is rejected and a new reset is requested.',
    tags: ['auth', 'password', 'negative'],
    createdBy: 'Maryam Ali',
  },
  {
    id: 'TC-1038',
    title: 'Verify concurrent sessions limit',
    description:
      'Verify that concurrent session limits are enforced for a user.',
    type: 'Security',
    priority: 'Medium',
    framework: 'API',
    status: 'Draft',
    lastUpdated: '2026-08-14',
    preconditions: 'A maximum concurrent session policy is configured.',
    steps: [
      'Log in on multiple devices',
      'Exceed the session limit',
      'Verify the oldest session is revoked',
    ],
    expectedResult:
      'Exceeding the limit revokes an existing session safely.',
    tags: ['auth', 'security', 'sessions'],
    createdBy: 'Maryam Ali',
  },
  {
    id: 'TC-1039',
    title: 'Verify checkout with declined card',
    description:
      'Verify that a declined card prevents an order from being placed.',
    type: 'Negative',
    priority: 'Critical',
    framework: 'API',
    status: 'Failed',
    lastUpdated: '2026-08-13',
    preconditions: 'A card that is declined by the processor is available.',
    steps: [
      'Proceed to checkout',
      'Enter a declined card',
      'Attempt to confirm the order',
      'Verify the decline message',
    ],
    expectedResult:
      'The order is not placed and a payment declined message is shown.',
    tags: ['checkout', 'payment', 'negative'],
    createdBy: 'Omar Farouk',
  },
];

const automatedFrameworks: TestFramework[] = [
  'Playwright',
  'Selenium',
  'API',
];

const manualFrameworks: TestFramework[] = ['Manual'];

const generatedTitles = [
  'Verify user profile can be updated',
  'Verify search returns relevant results',
  'Verify cart total updates correctly',
  'Verify order cancellation flow',
  'Verify product details page renders',
  'Verify navigation between pages',
  'Verify responsive layout on mobile',
  'Verify form validation on submit',
  'Verify file upload accepts valid files',
  'Verify bulk import of test data',
  'Verify API returns rate limit headers',
  'Verify email notification is sent',
  'Verify token refresh flow',
  'Verify account deactivation',
  'Verify multi-role permission access',
  'Verify audit log entries are recorded',
];

const types: TestCaseType[] = [
  'Functional',
  'Regression',
  'Negative',
  'Edge Case',
  'Security',
];

const priorities: TestCasePriority[] = [
  'Critical',
  'High',
  'Medium',
  'Low',
];

const statuses: TestCaseStatus[] = [
  'Draft',
  'Ready',
  'Passed',
  'Failed',
  'Blocked',
];

const authors = ['Yazhini Raj', 'Maryam Ali', 'Omar Farouk', 'Lina Hassan'];

function padNumber(n: number) {
  return String(n).padStart(4, '0');
}

function dateBefore(days: number) {
  const d = new Date('2026-08-28T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function buildGeneratedCases(automatedCount: number, manualCount: number): TestCase[] {
  const result: TestCase[] = [];
  let seq = 1040;
  const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];
  const push = (framework: TestFramework) => {
    const i = result.length;
    result.push({
      id: `TC-${padNumber(seq)}`,
      title: pick(generatedTitles, i),
      description: '',
      type: pick(types, i),
      priority: pick(priorities, i),
      framework,
      status: pick(statuses, i),
      lastUpdated: dateBefore(i % 60),
      preconditions: '',
      steps: [
        'Navigate to the module',
        'Set up the required state',
        'Perform the action',
        'Observe the result',
      ],
      expectedResult:
        'The system behaves as specified without errors.',
      tags: [pick(types, i).toLowerCase().replace(/\s+/g, '-'), 'suite-b'],
      createdBy: pick(authors, i),
    });
    seq += 1;
  };

  for (let i = 0; i < automatedCount; i++) {
    push(pick(automatedFrameworks, i));
  }
  for (let i = 0; i < manualCount; i++) {
    push(pick(manualFrameworks, i));
  }
  return result;
}

const generated = buildGeneratedCases(169, 63);

export const mockTestCases: TestCase[] = [
  ...baseTestCases,
  ...generated,
];
