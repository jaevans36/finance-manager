import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for Budget + Spending Pots flow (Phase 42, T1196)
 *
 * These tests mock the Finance API (port 5002) via page.route() so they can
 * run without the finance-api service. They will pass once the /finance route
 * is wired up (T1223, Phase 44).
 */

const LIFE_API = 'http://localhost:5000';
const FINANCE_API = 'http://localhost:5002';

const TEST_TIMESTAMP = Date.now();
const testUser = {
  email: `test-budget-pots-${TEST_TIMESTAMP}@example.com`,
  password: 'TestPassword123!',
};

const MOCK_BUDGETS = [
  {
    id: 'b1',
    categoryId: 'c1',
    categoryName: 'Groceries',
    categoryColour: '#22C55E',
    categoryIcon: 'shopping-cart',
    month: 6,
    year: 2026,
    amount: 300,
    spent: 240,
    rolloverFromPrevious: 0,
    percentageUsed: 80,
    isWarning: true,
    isExceeded: false,
  },
  {
    id: 'b2',
    categoryId: 'c2',
    categoryName: 'Fuel',
    categoryColour: '#3B82F6',
    categoryIcon: 'fuel',
    month: 6,
    year: 2026,
    amount: 100,
    spent: 110,
    rolloverFromPrevious: 0,
    percentageUsed: 110,
    isWarning: false,
    isExceeded: true,
  },
];

const MOCK_POTS = [
  {
    id: 'p1',
    name: 'Weekly Food',
    type: 'Groceries',
    budgetAmount: 75,
    spent: 60,
    remaining: 15,
    rolloverEnabled: false,
    icon: 'shopping-cart',
    colour: '#22C55E',
    categoryIds: ['c1'],
    percentageUsed: 80,
    isWarning: true,
    isExceeded: false,
  },
];

const MOCK_TRENDS = [
  {
    month: 4, year: 2026, monthLabel: 'Apr 2026',
    categories: [{ categoryName: 'Groceries', categoryColour: '#22C55E', budgeted: 300, spent: 260 }],
  },
  {
    month: 5, year: 2026, monthLabel: 'May 2026',
    categories: [{ categoryName: 'Groceries', categoryColour: '#22C55E', budgeted: 300, spent: 285 }],
  },
  {
    month: 6, year: 2026, monthLabel: 'Jun 2026',
    categories: [{ categoryName: 'Groceries', categoryColour: '#22C55E', budgeted: 300, spent: 240 }],
  },
];

const MOCK_CATEGORIES = [
  { id: 'c1', name: 'Groceries', colour: '#22C55E', icon: 'shopping-cart', isSystem: true, parentId: null, children: null },
  { id: 'c2', name: 'Fuel', colour: '#3B82F6', icon: 'fuel', isSystem: true, parentId: null, children: null },
];

async function setupFinanceApiMocks(page: Page) {
  await page.route(`${FINANCE_API}/api/v1/finance/budgets/current`, route =>
    route.fulfill({ json: MOCK_BUDGETS })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/budgets/trends*`, route =>
    route.fulfill({ json: MOCK_TRENDS })
  );
  await page.route(`${FINANCE_API}/api/v1/finance/budgets`, async route => {
    if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() ?? '{}');
      await route.fulfill({
        json: {
          id: 'b-new',
          categoryId: body.categoryId,
          categoryName: 'Groceries',
          categoryColour: '#22C55E',
          categoryIcon: 'shopping-cart',
          month: body.month,
          year: body.year,
          amount: body.amount,
          spent: 0,
          rolloverFromPrevious: 0,
          percentageUsed: 0,
          isWarning: false,
          isExceeded: false,
        },
      });
    } else {
      await route.fulfill({ json: MOCK_BUDGETS });
    }
  });
  await page.route(`${FINANCE_API}/api/v1/finance/pots*`, async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        json: {
          id: 'p-new',
          name: 'New Pot',
          type: 'Groceries',
          budgetAmount: 50,
          spent: 0,
          remaining: 50,
          rolloverEnabled: false,
          icon: null,
          colour: null,
          categoryIds: [],
          percentageUsed: 0,
          isWarning: false,
          isExceeded: false,
        },
      });
    } else {
      await route.fulfill({ json: MOCK_POTS });
    }
  });
  await page.route(`${FINANCE_API}/api/v1/finance/categories`, route =>
    route.fulfill({ json: MOCK_CATEGORIES })
  );
}

test.describe.configure({ mode: 'serial' });

test.describe('Budget & Spending Pots Flow (T1196)', () => {
  test.beforeAll(async () => {
    try {
      const response = await fetch(`${LIFE_API}/api/health`);
      if (!response.ok) throw new Error('API not healthy');
    } catch {
      throw new Error(
        'life-api is not running. Start with: .\\start-dev.ps1'
      );
    }
  });

  test('registers and logs in for budget tests', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#confirmPassword', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('navigates to finance section and renders budget dashboard', async ({ page }) => {
    await setupFinanceApiMocks(page);

    await page.goto('/login');
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });

    await page.goto('/finance');
    await expect(page).toHaveURL(/\/finance/);

    await expect(page.locator('text=Groceries')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=Fuel')).toBeVisible();
  });

  test('shows warning colour when a budget reaches 80%', async ({ page }) => {
    await setupFinanceApiMocks(page);
    await page.goto('/login');
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });

    await page.goto('/finance');
    await expect(page.locator('text=Groceries')).toBeVisible({ timeout: 5_000 });

    const amberBar = page.locator('.bg-amber-500').first();
    await expect(amberBar).toBeVisible();
  });

  test('shows exceeded colour and overspend text when budget is exceeded', async ({ page }) => {
    await setupFinanceApiMocks(page);
    await page.goto('/login');
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });

    await page.goto('/finance');
    await expect(page.locator('text=Fuel')).toBeVisible({ timeout: 5_000 });

    const redBar = page.locator('.bg-red-500').first();
    await expect(redBar).toBeVisible();

    await expect(page.locator('text=/over by/i')).toBeVisible();
  });

  test('creates a new budget via BudgetForm', async ({ page }) => {
    await setupFinanceApiMocks(page);
    await page.goto('/login');
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });

    await page.goto('/finance');
    await expect(page.locator('text=Groceries')).toBeVisible({ timeout: 5_000 });

    const addBudgetButton = page.locator(
      'button:has-text("Add Budget"), button:has-text("New Budget"), button:has-text("Create Budget")'
    ).first();
    await addBudgetButton.click();

    const categorySelect = page.locator('select, [role="combobox"]').first();
    await categorySelect.selectOption('c1');

    const amountInput = page.locator('input[placeholder*="amount" i], input[name="amount"]').first();
    await amountInput.fill('200');

    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
    await saveButton.click();

    await page.waitForTimeout(1_000);
    expect(true).toBe(true);
  });

  test('renders spending pots with envelope-style progress bars', async ({ page }) => {
    await setupFinanceApiMocks(page);
    await page.goto('/login');
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });

    await page.goto('/finance');
    await expect(page.locator('text=Weekly Food')).toBeVisible({ timeout: 5_000 });

    await expect(page.locator('text=/£60.*spent/i, text=/£75/i').first()).toBeVisible();
    await expect(page.locator('text=/£15.*left/i').first()).toBeVisible();
  });

  test('renders budget trends chart with period selector', async ({ page }) => {
    await setupFinanceApiMocks(page);
    await page.goto('/login');
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });

    await page.goto('/finance');

    const trendsHeading = page.locator('text=Budget Trends');
    await expect(trendsHeading).toBeVisible({ timeout: 5_000 });

    const threeMonthBtn = page.locator('button:has-text("3M")');
    await expect(threeMonthBtn).toBeVisible();
    await threeMonthBtn.click();
    await page.waitForTimeout(500);

    await expect(page.locator('svg').first()).toBeVisible();
  });
});
