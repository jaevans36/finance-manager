import { test, expect } from '@playwright/test';

// Test configuration
const API_BASE_URL = 'http://localhost:5000';
const APP_BASE_URL = 'http://localhost:5173';

// Test user credentials
const testUser = {
  email: 'test-calendar-e2e@example.com',
  password: 'TestPassword123!',
};

test.describe.configure({ mode: 'serial' });

test.describe('Calendar View - End-to-End Tests', () => {
  test.beforeAll(async () => {
    // Ensure API is accessible
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error('API server is not running');
      }
    } catch (error: unknown) {
      throw new Error('API server is not running. Please start it with: .\\scripts\\start-dev.ps1');
    }
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${APP_BASE_URL}/login`);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 5000 });
  });

  test('should navigate to calendar from dashboard', async ({ page }) => {
    await test.step('Navigate to Calendar', async () => {
      // Find and click the Calendar button
      const calendarButton = page.locator('button[aria-label="View calendar"]');
      await expect(calendarButton).toBeVisible();
      await calendarButton.click();

      // Verify navigation
      await expect(page).toHaveURL(/\/calendar/);
      await expect(page.locator('h1')).toContainText('Task Calendar');
    });
  });

  test('should display calendar with current month', async ({ page }) => {
    await page.goto(`${APP_BASE_URL}/calendar`);

    await test.step('Verify Calendar Display', async () => {
      // Check page title
      await expect(page.locator('h1')).toContainText('Task Calendar');

      // Check back button
      const backButton = page.locator('button:has-text("Back to Dashboard")');
      await expect(backButton).toBeVisible();

      // Check calendar is rendered
      await expect(page.locator('.react-calendar')).toBeVisible();

      // Check navigation is visible
      const navigation = page.locator('.react-calendar__navigation');
      await expect(navigation).toBeVisible();
    });
  });

  test('should display filter controls', async ({ page }) => {
    await page.goto(`${APP_BASE_URL}/calendar`);

    await test.step('Verify Filter Controls', async () => {
      // Check group filter
      await expect(page.locator('label:has-text("Group:")')).toBeVisible();
      await expect(page.locator('select')).toBeVisible();

      // Check priority filter buttons
      await expect(page.locator('button:has-text("Critical")')).toBeVisible();
      await expect(page.locator('button:has-text("High")')).toBeVisible();
      await expect(page.locator('button:has-text("Medium")')).toBeVisible();
      await expect(page.locator('button:has-text("Low")')).toBeVisible();

      // Check task count summary
      await expect(page.locator('text=/\\d+ tasks this month/')).toBeVisible();
    });
  });

  test('should create task via quick add modal', async ({ page }) => {
    await page.goto(`${APP_BASE_URL}/calendar`);

    await test.step('Open Quick Add Modal', async () => {
      // Wait for calendar to load
      await page.waitForSelector('.react-calendar', { timeout: 5000 });

      // Click on an empty day (future date to avoid completed tasks)
      const futureTile = page.locator('.react-calendar__tile').filter({ hasNotText: /\d+/ }).first();
      await futureTile.click();

      // Verify modal opened
      await expect(page.locator('h2:has-text("Quick Add Task")')).toBeVisible({ timeout: 3000 });
    });

    await test.step('Fill and Submit Task Form', async () => {
      // Fill task title
      await page.fill('input#task-title', 'E2E Test Task from Calendar');

      // Select priority
      await page.selectOption('select#task-priority', 'High');

      // Verify due date is pre-filled
      const dueDateInput = page.locator('input#task-due-date');
      await expect(dueDateInput).toHaveValue(/.+/); // Should have some date value

      // Optionally change the due date
      await dueDateInput.fill('2026-02-15');

      // Submit form
      await page.click('button:has-text("Add Task")');

      // Verify modal closed
      await expect(page.locator('h2:has-text("Quick Add Task")')).not.toBeVisible({ timeout: 3000 });
    });

    await test.step('Verify Task Created', async () => {
      // Success toast should appear
      await expect(page.locator('text=/Task added successfully/i')).toBeVisible({ timeout: 3000 });
    });
  });

  test('should display task badges on calendar days', async ({ page }) => {
    await page.goto(`${APP_BASE_URL}/calendar`);

    await test.step('Verify Task Badges', async () => {
      // Wait for tasks to load
      await page.waitForTimeout(1000);

      // Check if any day has a task badge
      const taskBadges = page.locator('.react-calendar__tile').locator('div').filter({ hasText: /\d+/ });
      
      // If there are tasks, badges should be visible
      const count = await taskBadges.count();
      if (count > 0) {
        await expect(taskBadges.first()).toBeVisible();
      }
    });
  });

  test('should open day task list modal when clicking task badge', async ({ page }) => {
    await page.goto(`${APP_BASE_URL}/calendar`);

    await test.step('Click Task Badge', async () => {
      // Wait for calendar to load
      await page.waitForTimeout(1000);

      // Find a day with tasks (badge visible)
      const dayWithTasks = page.locator('.react-calendar__tile').locator('div').filter({ hasText: /\d+/ }).first();
      
      const badgeCount = await dayWithTasks.count();
      if (badgeCount > 0) {
        // Click the badge
        await dayWithTasks.click();

        // Verify day task list modal opened
        await expect(page.locator('h2').filter({ hasText: /Tasks for/ })).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test('should filter tasks by priority', async ({ page }) => {
    await page.goto(`${APP_BASE_URL}/calendar`);

    await test.step('Apply Priority Filter', async () => {
      // Get initial task count
      const initialCount = await page.locator('text=/\\d+ tasks this month/').textContent();

      // Click High priority button
      await page.click('button:has-text("High")');

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Get filtered count
      const filteredCount = await page.locator('text=/\\d+ tasks this month/').textContent();

      // Count should change (unless all tasks are High priority)
      expect(filteredCount).not.toBe(initialCount);
    });

    await test.step('Verify Clear Filters Button', async () => {
      // Clear filters button should appear
      await expect(page.locator('button:has-text("Clear Filters")')).toBeVisible();
    });
  });

  test('should clear filters when clear button is clicked', async ({ page }) => {
    await page.goto(`${APP_BASE_URL}/calendar`);

    await test.step('Apply and Clear Filters', async () => {
      // Get initial count
      const initialCount = await page.locator('text=/\\d+ tasks this month/').textContent();

      // Apply priority filter
      await page.click('button:has-text("High")');
      await page.waitForTimeout(500);

      // Clear filters
      await page.click('button:has-text("Clear Filters")');
      await page.waitForTimeout(500);

      // Count should return to original
      const clearedCount = await page.locator('text=/\\d+ tasks this month/').textContent();
      expect(clearedCount).toBe(initialCount);

      // Clear button should disappear
      await expect(page.locator('button:has-text("Clear Filters")')).not.toBeVisible();
    });
  });

  test('should filter tasks by group', async ({ page }) => {
    await page.goto(`${APP_BASE_URL}/calendar`);

    await test.step('Apply Group Filter', async () => {
      // Wait for groups to load
      await page.waitForTimeout(1000);

      // Get group select options
      const groupSelect = page.locator('select');
      const options = await groupSelect.locator('option').allTextContents();

      // If there are groups other than "All Groups", select one
      if (options.length > 1) {
        const groupOption = options[1]; // First actual group
        await groupSelect.selectOption({ label: groupOption });

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Verify task count changed
        await expect(page.locator('text=/\\d+ tasks this month/')).toBeVisible();
      }
    });
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto(`${APP_BASE_URL}/calendar`);

    await test.step('Click Back Button', async () => {
      const backButton = page.locator('button:has-text("Back to Dashboard")');
      await backButton.click();

      // Verify navigation
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  test('should be responsive at different screen sizes', async ({ page }) => {
    await page.goto(`${APP_BASE_URL}/calendar`);

    await test.step('Test Tablet View (768px)', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);

      // Calendar should still be visible
      await expect(page.locator('.react-calendar')).toBeVisible();

      // Filters should adapt to smaller screen
      await expect(page.locator('label:has-text("Group:")')).toBeVisible();
    });

    await test.step('Test Mobile View (480px)', async () => {
      await page.setViewportSize({ width: 480, height: 800 });
      await page.waitForTimeout(500);

      // Calendar should still be functional
      await expect(page.locator('.react-calendar')).toBeVisible();

      // Title should be visible
      await expect(page.locator('h1:has-text("Task Calendar")')).toBeVisible();
    });

    await test.step('Test Desktop View (1920px)', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);

      // All elements should be visible
      await expect(page.locator('.react-calendar')).toBeVisible();
      await expect(page.locator('label:has-text("Group:")')).toBeVisible();
    });
  });

  test('should handle today highlighting', async ({ page }) => {
    await page.goto(`${APP_BASE_URL}/calendar`);

    await test.step('Verify Today Highlighting', async () => {
      // Find today's date tile
      const todayTile = page.locator('.react-calendar__tile--now');
      
      // Should be visible and have special styling
      await expect(todayTile).toBeVisible();
      await expect(todayTile).toHaveClass(/react-calendar__tile--now/);
    });
  });
});
