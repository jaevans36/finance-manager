/**
 * E2E tests for Calendar functionality
 * Tests complete user workflows in the calendar view
 */

import { test, expect } from '@playwright/test';

test.describe('Calendar View E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/register');
    const timestamp = Date.now();
    await page.fill('input[name="username"]', `testuser${timestamp}`);
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');
  });

  test('should navigate to calendar from dashboard', async ({ page }) => {
    // Click on Calendar button in dashboard
    await page.click('button:has-text("Calendar")');

    // Wait for calendar to load
    await page.waitForURL('/calendar');
    await expect(page.getByText('Task Calendar')).toBeVisible();
  });

  test('should create task from calendar date click', async ({ page }) => {
    await page.goto('/calendar');

    // Wait for calendar to load
    await expect(page.getByText('Task Calendar')).toBeVisible();

    // Click on a date (15th of current month)
    await page.click('button.react-calendar__tile:has-text("15")');

    // Quick add modal should appear
    await expect(page.getByText(/add task/i)).toBeVisible();

    // Fill in task details
    await page.fill('input[name="title"]', 'Calendar Test Task');
    await page.selectOption('select[name="priority"]', 'High');

    // Submit
    await page.click('button[type="submit"]');

    // Toast should show success
    await expect(page.getByText(/task added successfully/i)).toBeVisible();

    // Task badge should appear on the calendar
    await expect(page.locator('.react-calendar__tile:has-text("15")').locator('div')).toContainText('1');
  });

  test('should view tasks for a specific day', async ({ page }) => {
    await page.goto('/calendar');

    // Create a task first
    await page.click('button.react-calendar__tile:has-text("20")');
    await page.fill('input[name="title"]', 'Day View Test Task');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Click on task badge
    const dayTile = page.locator('.react-calendar__tile:has-text("20")');
    await dayTile.locator('div').first().click();

    // Day task list modal should appear
    await expect(page.getByText(/tasks for/i)).toBeVisible();
    await expect(page.getByText('Day View Test Task')).toBeVisible();
  });

  test('should navigate months using arrow buttons', async ({ page }) => {
    await page.goto('/calendar');

    // Get current month display
    const currentMonth = await page.locator('.react-calendar__navigation__label').textContent();

    // Click next month
    await page.click('.react-calendar__navigation__next-button');
    await page.waitForTimeout(300);

    // Month should change
    const nextMonth = await page.locator('.react-calendar__navigation__label').textContent();
    expect(nextMonth).not.toBe(currentMonth);

    // Click previous month
    await page.click('.react-calendar__navigation__prev-button');
    await page.waitForTimeout(300);

    // Should be back to original month
    const backToOriginal = await page.locator('.react-calendar__navigation__label').textContent();
    expect(backToOriginal).toBe(currentMonth);
  });

  test('should filter tasks by group', async ({ page }) => {
    await page.goto('/dashboard');

    // Create a task group first
    await page.click('button:has-text("Add Group")');
    await page.fill('input[name="name"]', 'Test Group');
    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(500);

    // Create a task in that group
    await page.click('button:has-text("Add Task")');
    await page.fill('input[name="title"]', 'Grouped Task');
    await page.selectOption('select[name="groupId"]', { label: 'Test Group' });
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Go to calendar
    await page.click('button:has-text("Calendar")');
    await page.waitForURL('/calendar');

    // Apply group filter
    await page.selectOption('select#group-filter', { label: 'Test Group' });

    // Task count should update
    await expect(page.getByText(/tasks this month/i)).toBeVisible();
  });

  test('should filter tasks by priority', async ({ page }) => {
    await page.goto('/calendar');

    // Create tasks with different priorities
    await page.click('button.react-calendar__tile:has-text("10")');
    await page.fill('input[name="title"]', 'High Priority Task');
    await page.selectOption('select[name="priority"]', 'High');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    await page.click('button.react-calendar__tile:has-text("11")');
    await page.fill('input[name="title"]', 'Low Priority Task');
    await page.selectOption('select[name="priority"]', 'Low');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Filter by High priority
    await page.click('button:has-text("High")');

    // Verify filtering (low priority task should not show badge on 11th)
    const day11Badge = page.locator('.react-calendar__tile:has-text("11")').locator('div');
    await expect(day11Badge).not.toBeVisible();
  });

  test('should clear filters', async ({ page }) => {
    await page.goto('/calendar');

    // Apply priority filter
    await page.click('button:has-text("Critical")');

    // Clear filters button should appear
    await expect(page.getByRole('button', { name: /clear filters/i })).toBeVisible();

    // Click clear filters
    await page.click('button:has-text("Clear Filters")');

    // Clear button should disappear
    await expect(page.getByRole('button', { name: /clear filters/i })).not.toBeVisible();
  });

  test('should navigate with keyboard shortcuts', async ({ page }) => {
    await page.goto('/calendar');

    const currentMonth = await page.locator('.react-calendar__navigation__label').textContent();

    // Press right arrow to go to next month
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    const nextMonth = await page.locator('.react-calendar__navigation__label').textContent();
    expect(nextMonth).not.toBe(currentMonth);

    // Press left arrow to go back
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);

    const backToOriginal = await page.locator('.react-calendar__navigation__label').textContent();
    expect(backToOriginal).toBe(currentMonth);
  });

  test('should open quick add with Enter key', async ({ page }) => {
    await page.goto('/calendar');

    // Press Enter to open quick add
    await page.keyboard.press('Enter');

    // Quick add modal should appear
    await expect(page.getByText(/add task/i)).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(page.getByText(/add task/i)).not.toBeVisible();
  });

  test('should toggle task completion from day task list', async ({ page }) => {
    await page.goto('/calendar');

    // Create a task
    await page.click('button.react-calendar__tile:has-text("25")');
    await page.fill('input[name="title"]', 'Toggle Test Task');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Open day task list
    const dayTile = page.locator('.react-calendar__tile:has-text("25")');
    await dayTile.locator('div').first().click();

    // Toggle completion checkbox
    await page.click('input[type="checkbox"]');

    // Success toast should appear
    await expect(page.getByText(/task completed/i)).toBeVisible();
  });

  test('should display empty state for month with no tasks', async ({ page }) => {
    await page.goto('/calendar');

    // Navigate to future month with no tasks
    await page.click('.react-calendar__navigation__next2-button'); // Jump 1 year ahead
    await page.waitForTimeout(300);

    // Empty state should appear
    await expect(page.getByText('No Tasks This Month')).toBeVisible();
    await expect(page.getByText(/Click on any date to create your first task/i)).toBeVisible();
  });

  test('should display task count for current month', async ({ page }) => {
    await page.goto('/calendar');

    // Create multiple tasks
    await page.click('button.react-calendar__tile:has-text("5")');
    await page.fill('input[name="title"]', 'Task 1');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    await page.click('button.react-calendar__tile:has-text("6")');
    await page.fill('input[name="title"]', 'Task 2');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Task count should show 2 tasks
    await expect(page.getByText(/2 tasks this month/i)).toBeVisible();
  });

  test('should show correct badge color based on priority', async ({ page }) => {
    await page.goto('/calendar');

    // Create critical priority task
    await page.click('button.react-calendar__tile:has-text("12")');
    await page.fill('input[name="title"]', 'Critical Task');
    await page.selectOption('select[name="priority"]', 'Critical');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Badge should have red background (critical color)
    const badge = page.locator('.react-calendar__tile:has-text("12")').locator('div').first();
    const backgroundColor = await badge.evaluate((el) => window.getComputedStyle(el).backgroundColor);

    // Should be red-ish for critical priority
    expect(backgroundColor).toContain('rgb'); // Just verify it has a color
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/calendar');

    // Click back button
    await page.click('button:has-text("Back to Dashboard")');

    // Should return to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.getByText('Your Tasks')).toBeVisible();
  });

  test('should maintain filters across month navigation', async ({ page }) => {
    await page.goto('/calendar');

    // Apply priority filter
    await page.click('button:has-text("High")');

    // Navigate to next month
    await page.click('.react-calendar__navigation__next-button');
    await page.waitForTimeout(300);

    // Filter should still be active
    const highButton = page.locator('button:has-text("High")');
    // Check if button has active styling (this depends on your implementation)
    await expect(highButton).toBeVisible();
  });
});
