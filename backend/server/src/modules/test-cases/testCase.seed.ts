import { buildTestCase, type TestCase } from './testCase.types';
import type { CreateTestCaseInput } from './testCase.validation';

const s = (
  title: string,
  type: CreateTestCaseInput['type'],
  priority: CreateTestCaseInput['priority'],
  framework: CreateTestCaseInput['framework'],
  status: CreateTestCaseInput['status'],
  description: string,
  steps: string[],
  expectedResult: string,
  tags: string[],
): CreateTestCaseInput => ({
  title, type, priority, framework, status, description, steps, expectedResult, tags,
  preconditions: 'User account exists and the application is reachable',
  createdBy: 'seed',
});

const DEMO: CreateTestCaseInput[] = [
  s('Verify login with valid credentials', 'Functional', 'High', 'Playwright', 'Ready',
    'A registered user can sign in with correct credentials.',
    ['Open the login page', 'Enter a valid email and password', 'Click Sign In'],
    'User lands on the dashboard', ['auth', 'smoke']),
  s('Verify login fails with wrong password', 'Functional', 'High', 'Playwright', 'Ready',
    'An error is shown when the password is incorrect.',
    ['Open the login page', 'Enter a valid email and a wrong password', 'Click Sign In'],
    'An "Invalid credentials" error is displayed and no session is created', ['auth', 'negative']),
  s('Verify password reset email is sent', 'Functional', 'High', 'Playwright', 'Draft',
    'A registered user can request a password reset link.',
    ['Open Forgot Password', 'Enter the registered email', 'Submit the form'],
    'A confirmation message is shown and a reset email is queued', ['auth', 'email']),
  s('GET /api/users returns paginated list', 'Functional', 'Medium', 'API', 'Ready',
    'The users endpoint supports page and limit parameters.',
    ['Send GET /api/users?page=1&limit=10', 'Inspect the response body'],
    'Status 200 with at most 10 users and pagination metadata', ['api', 'users']),
  s('POST /api/orders rejects empty cart', 'Functional', 'High', 'API', 'Ready',
    'Order creation must fail when the cart has no items.',
    ['Send POST /api/orders with an empty items array'],
    'Status 400 with a validation error message', ['api', 'orders', 'negative']),
  s('Checkout flow completes with a valid card', 'Regression', 'Critical', 'Selenium', 'Ready',
    'End-to-end purchase using a valid payment method.',
    ['Add a product to the cart', 'Go to checkout', 'Enter valid card details', 'Confirm the order'],
    'Order confirmation page is shown with an order number', ['checkout', 'e2e']),
  s('Dashboard renders within 3 seconds', 'Functional', 'Medium', 'Playwright', 'Draft',
    'Initial dashboard load should meet the performance budget.',
    ['Log in', 'Measure time until KPI cards are visible'],
    'KPI cards are visible within 3 seconds', ['performance', 'dashboard']),
  s('Session expires after inactivity', 'Security', 'Medium', 'Manual', 'Draft',
    'Idle sessions must be invalidated.',
    ['Log in', 'Stay idle past the timeout', 'Click any navigation link'],
    'User is redirected to the login page', ['security', 'session']),
];

export const buildSeedData = (): TestCase[] => DEMO.map((d) => buildTestCase(d));
