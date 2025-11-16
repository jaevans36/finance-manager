import { test, expect } from '@playwright/test';

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const APP_BASE_URL = 'http://localhost:5173';

// Test user credentials
const testUser = {
  email: `test-e2e-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'E2E Test User',
};

test.describe('Complete User Flow - Authentication and Task Management', () => {
  test.beforeAll(async () => {
    // Ensure API is accessible
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error('API server is not running. Please start it with: cd apps/api && pnpm dev');
    }
  });

  test('should complete full user journey from registration to task management', async ({ page }) => {
    // Step 1: Navigate to the application
    await page.goto('/');
    await expect(page).toHaveTitle(/Finance Manager/);

    // Step 2: Register a new user
    await test.step('User Registration', async () => {
      await page.click('text=Register');
      await expect(page).toHaveURL(/\/register/);

      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should redirect to tasks page after successful registration
      await expect(page).toHaveURL(/\/tasks/, { timeout: 5000 });
    });

    // Step 3: Verify logged in state
    await test.step('Verify Authentication', async () => {
      // Should show user's name or email in the UI
      await expect(page.locator('text=/Test User|test-e2e/i')).toBeVisible({ timeout: 3000 });
    });

    // Step 4: Create a new task
    await test.step('Create High Priority Task', async () => {
      // Fill in task form
      await page.fill('input[name="title"]', 'Complete E2E Testing');
      await page.fill('textarea[name="description"]', 'Write comprehensive end-to-end tests for the application');
      await page.selectOption('select[name="priority"]', 'HIGH');
      
      // Set due date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await page.fill('input[type="date"]', tomorrowStr);

      // Submit the form
      await page.click('button:has-text("Create Task")');

      // Verify task appears in the list
      await expect(page.locator('text=Complete E2E Testing')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('text=Write comprehensive end-to-end tests')).toBeVisible();
    });

    // Step 5: Create a second task
    await test.step('Create Medium Priority Task', async () => {
      await page.fill('input[name="title"]', 'Review Code');
      await page.fill('textarea[name="description"]', 'Review pull requests');
      await page.selectOption('select[name="priority"]', 'MEDIUM');
      await page.click('button:has-text("Create Task")');

      await expect(page.locator('text=Review Code')).toBeVisible({ timeout: 3000 });
    });

    // Step 6: Mark first task as complete
    await test.step('Complete Task', async () => {
      // Find the checkbox for "Complete E2E Testing" task
      const taskRow = page.locator('text=Complete E2E Testing').locator('..');
      const checkbox = taskRow.locator('input[type="checkbox"]').first();
      await checkbox.check();

      // Verify task shows as completed (usually with strikethrough or different styling)
      await expect(checkbox).toBeChecked();
    });

    // Step 7: Edit the second task
    await test.step('Edit Task', async () => {
      const taskRow = page.locator('text=Review Code').locator('..');
      await taskRow.locator('button:has-text("Edit")').click();

      // Modal should appear
      await expect(page.locator('text=Edit Task')).toBeVisible({ timeout: 3000 });

      // Update the task
      await page.fill('input[name="title"]', 'Review and Approve Code');
      await page.selectOption('select[name="priority"]', 'HIGH');
      await page.click('button:has-text("Save Changes")');

      // Verify updated task appears
      await expect(page.locator('text=Review and Approve Code')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('text=Review Code').first()).not.toBeVisible();
    });

    // Step 8: Create a low priority task
    await test.step('Create Low Priority Task', async () => {
      await page.fill('input[name="title"]', 'Update Documentation');
      await page.selectOption('select[name="priority"]', 'LOW');
      await page.click('button:has-text("Create Task")');

      await expect(page.locator('text=Update Documentation')).toBeVisible({ timeout: 3000 });
    });

    // Step 9: Delete a task
    await test.step('Delete Task', async () => {
      const taskRow = page.locator('text=Update Documentation').locator('..');
      await taskRow.locator('button:has-text("Delete")').click();

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Verify task is removed
      await expect(page.locator('text=Update Documentation')).not.toBeVisible({ timeout: 3000 });
    });

    // Step 10: Verify remaining tasks
    await test.step('Verify Task List', async () => {
      // Should have 2 tasks remaining
      await expect(page.locator('text=Complete E2E Testing')).toBeVisible();
      await expect(page.locator('text=Review and Approve Code')).toBeVisible();
    });

    // Step 11: Logout
    await test.step('User Logout', async () => {
      // Look for logout button
      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")');
      await logoutButton.click();

      // Should redirect to login page
      await expect(page).toHaveURL(/\/login|\//, { timeout: 5000 });
    });

    // Step 12: Login again
    await test.step('User Login', async () => {
      // Navigate to login if not already there
      const loginLink = page.locator('text=Login');
      if (await loginLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loginLink.click();
      }

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should redirect back to tasks
      await expect(page).toHaveURL(/\/tasks/, { timeout: 5000 });
    });

    // Step 13: Verify tasks persist after re-login
    await test.step('Verify Task Persistence', async () => {
      await expect(page.locator('text=Complete E2E Testing')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('text=Review and Approve Code')).toBeVisible();
      
      // Verify the completed task is still marked as complete
      const taskRow = page.locator('text=Complete E2E Testing').locator('..');
      const checkbox = taskRow.locator('input[type="checkbox"]').first();
      await expect(checkbox).toBeChecked();
    });
  });

  test('should handle validation errors appropriately', async ({ page }) => {
    // Login with existing test user
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/tasks/, { timeout: 5000 });

    // Try to create task without title
    await test.step('Validate Required Title', async () => {
      await page.fill('input[name="title"]', '');
      await page.click('button:has-text("Create Task")');

      // Should show validation error
      await expect(page.locator('text=/title.*required/i')).toBeVisible({ timeout: 2000 });
    });

    // Create task with only title (minimum required)
    await test.step('Create Task with Minimum Data', async () => {
      await page.fill('input[name="title"]', 'Minimal Task');
      await page.click('button:has-text("Create Task")');

      await expect(page.locator('text=Minimal Task')).toBeVisible({ timeout: 3000 });
    });
  });

  test('should handle authentication errors', async ({ page }) => {
    // Try to login with incorrect credentials
    await test.step('Invalid Login Credentials', async () => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('text=/invalid.*credentials|incorrect.*password|login.*failed/i')).toBeVisible({ timeout: 3000 });
    });

    // Try to register with existing email
    await test.step('Duplicate Registration', async () => {
      await page.goto('/register');
      await page.fill('input[name="name"]', 'Another User');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', 'AnotherPassword123!');
      await page.click('button[type="submit"]');

      // Should show error about existing email
      await expect(page.locator('text=/email.*exists|already.*registered/i')).toBeVisible({ timeout: 3000 });
    });
  });

  test('should protect routes requiring authentication', async ({ page }) => {
    // Try to access tasks page without authentication
    await test.step('Protected Route Access', async () => {
      // Clear any existing session
      await page.context().clearCookies();
      await page.goto('/tasks');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });
  });
});
