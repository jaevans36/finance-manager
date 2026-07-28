import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for the Debt Burndown feature (Phase 43b, T1357).
 *
 * Mocks the Finance API (port 5002) via page.route() — runs without a
 * live finance-api service. Requires life-api on port 5000 for auth.
 */

const LIFE_API = 'http://localhost:5000';
const FINANCE_API = 'http://localhost:5002';

const TEST_TIMESTAMP = Date.now();
const testUser = {
  email: `test-debt-${TEST_TIMESTAMP}@example.com`,
  password: 'TestPassword123!',
};

const MOCK_ACCOUNTS = [
  {
    id: 'acc-1',
    name: 'Barclaycard',
    type: 'Credit',
    currency: 'GBP',
    balance: -1500,
    institution: 'Barclays',
    colour: null,
    icon: null,
    isActive: true,
    excludeFromNetWorth: false,
    creditLimit: 3000,
    interestRate: 24.9,
    minimumMonthlyPayment: 30,
    currentMonthlyPayment: 100,
  },
];

const MOCK_DEBT_OVERVIEW = {
  debts: [
    {
      accountId: 'acc-1',
      name: 'Barclaycard',
      type: 'Credit',
      balance: -1500,
      interestRate: 24.9,
      minimumMonthlyPayment: 30,
      currentMonthlyPayment: 100,
      promotionalRate: null,
      promotionalExpiry: null,
      loanEndDate: null,
      severityScore: 50,
      severityLabel: 'High',
      severityReason: null,
    },
  ],
  totalDebt: 1500,
  totalMinimumPayments: 30,
  totalCurrentPayments: 100,
};

const MOCK_DEBT_PROJECTION = {
  strategy: 'Avalanche',
  monthsToFreedom: 18,
  estimatedFreedomDate: '2028-01',
  totalInterestPaid: 182.40,
  schedule: [
    {
      month: 1,
      label: '2026-08',
      balances: [{ accountId: 'acc-1', name: 'Barclaycard', balance: 1430 }],
      totalRemaining: 1430,
    },
    {
      month: 18,
      label: '2028-01',
      balances: [{ accountId: 'acc-1', name: 'Barclaycard', balance: 0 }],
      totalRemaining: 0,
    },
  ],
  payoffOrder: [
    { accountId: 'acc-1', name: 'Barclaycard', monthPaidOff: 18, paidOffDate: '2028-01' },
  ],
};

const MOCK_AFFORDABILITY = {
  monthlyIncome: 3200,
  incomeConfidence: 'High',
  incomeSource: 'Detected',
  committedCosts: 100,
  discretionarySpend: 800,
  emergencyBuffer: 200,
  safeSurplus: 2100,
  suggestedDebtPayment: 1890,
  calculatedAt: '2026-06-20',
};

const MOCK_BILLS = [];
const MOCK_CATEGORIES = [];

async function setupFinanceApiMocks(page: Page) {
  await page.route(`${FINANCE_API}/api/v1/finance/accounts`, route =>
    route.fulfill({ json: MOCK_ACCOUNTS })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/accounts/net-worth`, route =>
    route.fulfill({ json: { netWorth: -1500 } })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/debt/overview`, route =>
    route.fulfill({ json: MOCK_DEBT_OVERVIEW })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/debt/projection`, route =>
    route.fulfill({ json: MOCK_DEBT_PROJECTION })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/affordability`, route =>
    route.fulfill({ json: MOCK_AFFORDABILITY })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/bills*`, route =>
    route.fulfill({ json: MOCK_BILLS })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/categories`, route =>
    route.fulfill({ json: MOCK_CATEGORIES })
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

test.describe('Finance Debt Burndown (T1357)', () => {
  test.beforeAll(async () => {
    try {
      const response = await fetch(`${LIFE_API}/api/health`);
      if (!response.ok) throw new Error('API not healthy');
    } catch {
      throw new Error('life-api is not running. Start with: .\\start-dev.ps1');
    }
  });

  test('registers user for debt flow tests', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#confirmPassword', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('navigates to finance page and sees Debt tab', async ({ page }) => {
    await setupFinanceApiMocks(page);
    await loginUser(page);

    await page.goto('/finance');
    await expect(page).toHaveURL(/\/finance/);

    const debtTab = page.locator('button:has-text("Debt")');
    await expect(debtTab).toBeVisible({ timeout: 5_000 });
  });

  test('clicking Debt tab shows debt overview', async ({ page }) => {
    await setupFinanceApiMocks(page);
    await loginUser(page);

    await page.goto('/finance');

    const debtTab = page.locator('button:has-text("Debt")');
    await expect(debtTab).toBeVisible({ timeout: 5_000 });
    await debtTab.click();

    // Overview card shows account name and total
    await expect(page.locator('text=Barclaycard')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('text=Debt overview')).toBeVisible();
  });

  test('Debt tab shows total debt figure', async ({ page }) => {
    await setupFinanceApiMocks(page);
    await loginUser(page);

    await page.goto('/finance');

    await page.locator('button:has-text("Debt")').click();
    await expect(page.locator('text=Barclaycard')).toBeVisible({ timeout: 8_000 });

    // £1,500 total debt
    await expect(page.locator('text=£1,500')).toBeVisible();
  });

  test('Debt tab auto-runs Avalanche projection and shows freedom date', async ({ page }) => {
    await setupFinanceApiMocks(page);
    await loginUser(page);

    await page.goto('/finance');
    await page.locator('button:has-text("Debt")').click();
    await expect(page.locator('text=Barclaycard')).toBeVisible({ timeout: 8_000 });

    // Projection panel shows months-to-freedom (18 months = 1 yr 6 mo)
    await expect(page.locator('text=1 yr 6 mo')).toBeVisible({ timeout: 5_000 });
  });

  test('strategy selector is visible with Avalanche/Snowball/Custom options', async ({ page }) => {
    await setupFinanceApiMocks(page);
    await loginUser(page);

    await page.goto('/finance');
    await page.locator('button:has-text("Debt")').click();
    await expect(page.locator('text=Paydown calculator')).toBeVisible({ timeout: 8_000 });

    await expect(page.locator('text=Avalanche')).toBeVisible();
    await expect(page.locator('text=Snowball')).toBeVisible();
    await expect(page.locator('text=Custom')).toBeVisible();
  });

  test('clicking Calculate projection re-runs the projection', async ({ page }) => {
    await setupFinanceApiMocks(page);
    await loginUser(page);

    await page.goto('/finance');
    await page.locator('button:has-text("Debt")').click();
    await expect(page.locator('text=Paydown calculator')).toBeVisible({ timeout: 8_000 });

    // Switch to Snowball and calculate
    await page.locator('button:has-text("Snowball")').click();
    await page.locator('button:has-text("Calculate projection")').click();

    // Projection result should still show (using the same mock response)
    await expect(page.locator('text=1 yr 6 mo')).toBeVisible({ timeout: 5_000 });
  });

  test('payoff order section lists the debt', async ({ page }) => {
    await setupFinanceApiMocks(page);
    await loginUser(page);

    await page.goto('/finance');
    await page.locator('button:has-text("Debt")').click();
    await expect(page.locator('text=Payoff order')).toBeVisible({ timeout: 8_000 });

    // Barclaycard should appear in payoff order (it's the only debt)
    const payoffSection = page.locator('text=Payoff order').locator('..');
    await expect(payoffSection.locator('text=Barclaycard').first()).toBeVisible();
  });
});
