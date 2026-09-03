import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for the AI Insights feature (Phase 48, T1274).
 *
 * Mocks the Finance API (port 5002) via page.route() — runs without a
 * live finance-api service. Requires life-api on port 5000 for auth.
 */

const LIFE_API = 'http://localhost:5000';
const FINANCE_API = 'http://localhost:5002';

const TEST_TIMESTAMP = Date.now();
const testUser = {
  email: `test-insights-${TEST_TIMESTAMP}@example.com`,
  password: 'TestPassword123!',
};

const MOCK_ACCOUNTS = [
  {
    id: 'acc-1',
    name: 'Current Account',
    type: 'Checking',
    currency: 'GBP',
    balance: 1200,
    institution: 'Barclays',
    colour: null,
    icon: null,
    isActive: true,
    excludeFromNetWorth: false,
  },
];

const MOCK_SUMMARY = {
  cards: [
    {
      id: 'velocity',
      type: 'SpendingVelocity',
      severity: 'Warning',
      title: "You're on track to overspend this month",
      summary: '£800.00 spent in 15 days — projected to overspend by £200.00 at this rate.',
      actionLabel: 'View breakdown',
    },
  ],
};

const MOCK_VELOCITY = {
  daysElapsed: 15,
  daysInMonth: 30,
  totalSpentSoFar: 800,
  dailyAverage: 53.33,
  projectedMonthEndTotal: 1600,
  budgetTotal: 1400,
  projectedOverspend: 200,
  categories: [],
};

const MOCK_ANOMALIES = [
  {
    id: 'new:tx-1',
    type: 'NewMerchant',
    transactionId: 'tx-1',
    merchantName: 'Electronics Store',
    amount: 250,
    transactionDate: '2026-06-20',
    description: 'First transaction with this merchant — £250.00 on 20 Jun 2026.',
    severity: 'Info',
  },
];

const MOCK_SUBSCRIPTIONS = {
  subscriptions: [
    {
      merchantName: 'NETFLIX',
      monthlyCost: 15.99,
      annualCost: 191.88,
      frequency: 'Monthly',
      possiblyUnused: true,
      lastOccurrence: '2026-04-01',
      amountTrend: 'Stable',
    },
  ],
  totalMonthlyCost: 15.99,
  totalAnnualCost: 191.88,
  possiblyUnusedCount: 1,
};

const MOCK_NEGOTIATION_SCRIPT = {
  merchantName: 'NETFLIX',
  tenureMonths: 12,
  totalSpent: 191.88,
  averageMonthlyAmount: 15.99,
  paymentCount: 12,
  paymentConsistencyPct: 100,
  script: "Hi, I've been a customer with NETFLIX for 1 year and have paid £191.88 in total over that time.",
  disclaimer: 'This is a suggestion — always review before sending.',
};

async function setupInsightsApiMocks(page: Page) {
  await page.route(`${FINANCE_API}/api/v1/finance/accounts`, route =>
    route.fulfill({ json: MOCK_ACCOUNTS })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/accounts/net-worth`, route =>
    route.fulfill({ json: { netWorth: 1200 } })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/categories`, route =>
    route.fulfill({ json: [] })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/bills*`, route =>
    route.fulfill({ json: [] })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/insights`, route =>
    route.fulfill({ json: MOCK_SUMMARY })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/insights/velocity`, route =>
    route.fulfill({ json: MOCK_VELOCITY })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/insights/anomalies`, route =>
    route.fulfill({ json: MOCK_ANOMALIES })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/insights/subscriptions`, route =>
    route.fulfill({ json: MOCK_SUBSCRIPTIONS })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/insights/negotiation-script*`, route =>
    route.fulfill({ json: MOCK_NEGOTIATION_SCRIPT })
  );
  // Catch-all for any other finance API requests
  await page.route(`${FINANCE_API}/**`, route => {
    if (!route.request().isInterceptResolutionHandled()) {
      route.fulfill({ json: [] });
    }
  });
}

async function loginUser(page: Page) {
  await page.goto('/login');
  await page.fill('#email', testUser.email);
  await page.fill('#password', testUser.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
}

test.describe.configure({ mode: 'serial' });

test.describe('Finance AI Insights (T1274)', () => {
  test.beforeAll(async () => {
    try {
      const response = await fetch(`${LIFE_API}/api/health`);
      if (!response.ok) throw new Error('API not healthy');
    } catch {
      throw new Error('life-api is not running. Start with: .\\start-dev.ps1');
    }
  });

  test('registers user for insights flow tests', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#confirmPassword', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('navigates to finance page and sees AI Insights tab', async ({ page }) => {
    await setupInsightsApiMocks(page);
    await loginUser(page);

    await page.goto('/finance');
    await expect(page).toHaveURL(/\/finance/);

    const insightsTab = page.locator('button:has-text("AI Insights")');
    await expect(insightsTab).toBeVisible({ timeout: 5_000 });
  });

  test('clicking AI Insights tab shows the spending velocity card and overspend warning', async ({ page }) => {
    await setupInsightsApiMocks(page);
    await loginUser(page);

    await page.goto('/finance');
    await page.locator('button:has-text("AI Insights")').click();

    await expect(page.locator('text=Spending velocity')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('text=/projected to overspend by £200/i')).toBeVisible();
  });

  test('shows an anomaly alert that can be dismissed', async ({ page }) => {
    await setupInsightsApiMocks(page);
    await loginUser(page);

    await page.goto('/finance');
    await page.locator('button:has-text("AI Insights")').click();

    await expect(page.locator('text=Electronics Store')).toBeVisible({ timeout: 8_000 });

    await page.locator('button:has-text("Looks fine")').click();
    await expect(page.locator('text=All anomalies reviewed.')).toBeVisible();
  });

  test('lists a possibly-unused subscription', async ({ page }) => {
    await setupInsightsApiMocks(page);
    await loginUser(page);

    await page.goto('/finance');
    await page.locator('button:has-text("AI Insights")').click();

    await expect(page.locator('text=NETFLIX')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('text=Possibly unused')).toBeVisible();
  });

  test('generates and copies a negotiation script for a subscription', async ({ page }) => {
    await setupInsightsApiMocks(page);
    await loginUser(page);

    await page.goto('/finance');
    await page.locator('button:has-text("AI Insights")').click();

    await expect(page.locator('text=NETFLIX')).toBeVisible({ timeout: 8_000 });
    await page.locator('button:has-text("Negotiate")').click();

    await expect(page.locator("text=I've been a customer with NETFLIX")).toBeVisible({ timeout: 8_000 });

    await page.locator('button:has-text("Copy")').click();
    await expect(page.locator('text=Copied to clipboard')).toBeVisible({ timeout: 5_000 });
  });
});
