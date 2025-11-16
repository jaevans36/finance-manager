import { test, expect } from '@playwright/test';

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const APP_BASE_URL = 'http://localhost:5173';

// Test user credentials - use a static timestamp so tests can share the same user
const TEST_TIMESTAMP = Date.now();
const testUser = {
  email: `test-e2e-${TEST_TIMESTAMP}@example.com`,
  password: 'TestPassword123!',
};

test.describe.configure({ mode: 'serial' }); // Run tests serially since they share state

test.describe('Complete User Flow - Authentication and Task Management', () => {
  test.beforeAll(async () => {
    // Ensure API is accessible
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('API server is not running. Please start it with: cd apps/api && pnpm dev');
    }
  });

  test('should complete full user journey from registration to task management', async ({ page }) => {
    // Step 1: Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveTitle(/Finance Manager/);

    // Step 2: Register a new user
    await test.step('User Registration', async () => {
      await expect(page).toHaveURL(/\/register/);

      await page.fill('#email', testUser.email);
      await page.fill('#password', testUser.password);
      await page.fill('#confirmPassword', testUser.password);
      
      // Wait for form to be ready
      await page.waitForTimeout(500);
      
      await page.click('button[type="submit"]');

      // Should redirect to dashboard after successful registration
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    // Step 3: Verify on Dashboard
    await test.step('Verify Dashboard', async () => {
      // Should be on dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    // Step 4: Create a new task
    await test.step('Create High Priority Task', async () => {
      // Click New Task button to show form
      await page.click('button:has-text("New Task")');
      
      // Fill in task form
      await page.fill('#title', 'Complete E2E Testing');
      await page.fill('#description', 'Write comprehensive end-to-end tests for the application');
      await page.selectOption('#priority', 'HIGH');
      
      // Set due date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await page.fill('#dueDate', tomorrowStr);

      // Submit the form
      await page.click('button:has-text("Create Task")');

      // Verify task appears in the list
      await expect(page.locator('text=Complete E2E Testing')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Write comprehensive end-to-end tests')).toBeVisible();
    });

    // Step 5: Create a second task
    await test.step('Create Medium Priority Task', async () => {
      // Click New Task button again to show form
      await page.click('button:has-text("New Task")');
      
      await page.fill('#title', 'Review Code');
      await page.fill('#description', 'Review pull requests');
      await page.selectOption('#priority', 'MEDIUM');
      await page.click('button:has-text("Create Task")');

      await expect(page.locator('text=Review Code')).toBeVisible({ timeout: 5000 });
    });

    // Step 6: Mark first task as complete
    await test.step('Complete Task', async () => {
      // Get all checkboxes and click the first one (for first task)
      const checkboxes = page.locator('input[type="checkbox"]');
      await checkboxes.first().click();

      // Wait a moment for the state to update
      await page.waitForTimeout(500);

      // Verify task shows as completed
      await expect(checkboxes.first()).toBeChecked();
    });

    // Step 7: Edit the second task
    await test.step('Edit Task', async () => {
      // Click first Edit button
      await page.locator('button:has-text("Edit")').first().click();

      // Modal should appear
      await expect(page.locator('text=Edit Task')).toBeVisible({ timeout: 3000 });

      // Update the task
      await page.fill('#title', 'Review and Approve Code');
      await page.selectOption('#priority', 'HIGH');
      await page.click('button:has-text("Save Changes")');

      // Verify updated task appears
      await expect(page.locator('text=Review and Approve Code')).toBeVisible({ timeout: 5000 });
    });

    // Step 8: Create a low priority task
    await test.step('Create Low Priority Task', async () => {
      // Click New Task button again
      await page.click('button:has-text("New Task")');
      
      await page.fill('#title', 'Update Documentation');
      await page.selectOption('#priority', 'LOW');
      await page.click('button:has-text("Create Task")');

      await expect(page.locator('text=Update Documentation')).toBeVisible({ timeout: 5000 });
    });

    // Step 9: Delete a task
    await test.step('Delete Task', async () => {
      // Count tasks before deletion
      const tasksBefore = await page.locator('h3').count();

      // Set up dialog handler before clicking
      page.once('dialog', async dialog => {
        await dialog.accept();
      });

      // Click last Delete button (for the last task created)
      await page.locator('button:has-text("Delete")').last().click();

      // Wait for task count to decrease
      await expect(async () => {
        const tasksAfter = await page.locator('h3').count();
        expect(tasksAfter).toBe(tasksBefore - 1);
      }).toPass({ timeout: 5000 });
    });

    // Step 10: Verify remaining tasks
    await test.step('Verify Task List', async () => {
      // Should have 2 tasks remaining (count h3 elements which are task titles)
      const taskTitles = page.locator('h3');
      await expect(taskTitles).toHaveCount(2);
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
      // Navigate to login page
      await page.goto('/login');

      await page.fill('#email', testUser.email);
      await page.fill('#password', testUser.password);
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    });

    // Step 13: Verify tasks persist after re-login
    await test.step('Verify Task Persistence', async () => {
      // Should have 2 tasks
      const taskTitles = page.locator('h3');
      await expect(taskTitles).toHaveCount(2);
      
      // Verify the completed task is still marked as complete
      const checkboxes = page.locator('input[type="checkbox"]');
      await expect(checkboxes.first()).toBeChecked();
    });
  });

  test('should handle validation errors appropriately', async ({ page }) => {
    // Login with existing test user
    await page.goto('/login');
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    // Try to create task without title
    await test.step('Validate Required Title', async () => {
      // Click New Task button to show form
      await page.click('button:has-text("New Task")');
      
      await page.fill('#title', '');
      await page.click('button:has-text("Create Task")');

      // Should show validation error
      await expect(page.locator('text=/title.*required/i')).toBeVisible({ timeout: 2000 });
    });

    // Create task with only title (minimum required)
    await test.step('Create Task with Minimum Data', async () => {
      await page.fill('#title', 'Minimal Task');
      await page.click('button:has-text("Create Task")');

      await expect(page.locator('text=Minimal Task')).toBeVisible({ timeout: 5000 });
    });
  });

  test('should handle authentication errors', async ({ page }) => {
    // Try to login with incorrect credentials
    await test.step('Invalid Login Credentials', async () => {
      await page.goto('/login');
      await page.fill('#email', 'nonexistent@example.com');
      await page.fill('#password', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('text=/invalid.*email.*password/i')).toBeVisible({ timeout: 3000 });
    });

    // Try to register with existing email
    await test.step('Duplicate Registration', async () => {
      await page.goto('/register');
      await page.fill('#email', testUser.email);
      await page.fill('#password', 'AnotherPassword123!');
      await page.fill('#confirmPassword', 'AnotherPassword123!');
      await page.click('button[type="submit"]');

      // Should show error about existing email
      await expect(page.locator('text=/email.*exists|already.*registered/i')).toBeVisible({ timeout: 3000 });
    });
  });

  test('should protect routes requiring authentication', async ({ page }) => {
    // Try to access dashboard without authentication
    await test.step('Protected Route Access', async () => {
      // Clear any existing session
      await page.context().clearCookies();
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });
  });
});
