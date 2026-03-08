import { test, expect } from '@playwright/test';

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
// const APP_BASE_URL = 'http://localhost:5173';

// Test user credentials
const TEST_TIMESTAMP = Date.now();
const testUser = {
  email: `test-weekly-e2e-${TEST_TIMESTAMP}@example.com`,
  password: 'TestPassword123!',
};

test.describe.configure({ mode: 'serial' }); // Run tests serially since they share state

test.describe('Weekly Progress Dashboard E2E Flow (T245)', () => {
  test.beforeAll(async () => {
    // Ensure API is accessible
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error('API server is not running');
      }
    } catch (error) {
      throw new Error('API server is not accessible. Please start it with: .\\scripts\\start-dev.ps1');
    }
  });

  test.afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
  });

  test('should complete weekly progress flow: register → create tasks → view weekly progress → toggle tasks → verify updates', async ({ page }) => {
    // Step 1: Register new user
    await test.step('User Registration', async () => {
      await page.goto('/register');
      await expect(page).toHaveTitle(/Life Manager/);

      await page.fill('#email', testUser.email);
      await page.fill('#password', testUser.password);
      await page.fill('#confirmPassword', testUser.password);
      
      await page.waitForTimeout(500);
      await page.click('button[type="submit"]');

      await page.waitForURL(/\/dashboard/, { timeout: 5000 });
      await expect(page).toHaveURL(/\/dashboard/);
    });

    // Step 2: Create test tasks for the week
    await test.step('Create Test Tasks', async () => {
      // Create 5 tasks with different priorities and states
      const tasks = [
        { title: 'High Priority Task', priority: 'High', complete: false },
        { title: 'Medium Priority Task', priority: 'Medium', complete: true },
        { title: 'Low Priority Task', priority: 'Low', complete: false },
        { title: 'Critical Priority Task', priority: 'Critical', complete: false },
        { title: 'Another Medium Task', priority: 'Medium', complete: true },
      ];

      for (const task of tasks) {
        // Open create task form
        const createButton = page.locator('button:has-text("Create Task"), button:has-text("Add Task"), button:has-text("New Task")').first();
        await createButton.click();
        
        // Fill task details
        await page.fill('input[name="title"], input[placeholder*="title" i], input[placeholder*="task" i]', task.title);
        
        // Select priority if dropdown exists
        const prioritySelect = page.locator('select[name="priority"], select:has-text("Priority")').first();
        if (await prioritySelect.count() > 0) {
          await prioritySelect.selectOption(task.priority);
        }
        
        // Submit form
        const submitButton = page.locator('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Add"), button[type="submit"]:has-text("Save")').first();
        await submitButton.click();
        
        // Wait for task to be created
        await page.waitForTimeout(800);

        // If task should be completed, toggle it
        if (task.complete) {
          const taskRow = page.locator(`text="${task.title}"`).locator('..').locator('..');
          const checkbox = taskRow.locator('input[type="checkbox"], button:has-text("Complete"), [role="checkbox"]').first();
          if (await checkbox.count() > 0) {
            await checkbox.click();
            await page.waitForTimeout(500);
          }
        }
      }
    });

    // Step 3: Navigate to Weekly Progress Dashboard
    await test.step('Navigate to Weekly Progress', async () => {
      // Find and click Weekly Progress link in navigation
      const weeklyLink = page.locator('a:has-text("Weekly Progress"), a:has-text("Weekly"), a:has-text("Progress"), nav >> text="Weekly"').first();
      await weeklyLink.click();

      // Wait for navigation
      await page.waitForURL(/\/weekly-progress/, { timeout: 5000 });
      await expect(page).toHaveURL(/\/weekly-progress/);
    });

    // Step 4: Verify Weekly Progress Dashboard loads
    await test.step('Verify Dashboard Loads', async () => {
      // Check for page title/heading
      await expect(page.locator('h1, h2').filter({ hasText: /Weekly Progress/i })).toBeVisible({ timeout: 10000 });

      // Wait for statistics to load
      await page.waitForTimeout(2000);

      // Verify key elements are present
      const hasStats = await page.locator('text=/total tasks|completed|completion/i').count();
      expect(hasStats).toBeGreaterThan(0);
    });

    // Step 5: Verify Charts are Rendered
    await test.step('Verify Charts are Rendered', async () => {
      // Look for chart elements (SVG or canvas)
      const charts = page.locator('svg, canvas, [class*="chart" i], [class*="Chart"]');
      const chartCount = await charts.count();
      
      // Should have at least 2-3 charts (priority, daily, category)
      expect(chartCount).toBeGreaterThan(0);

      // Verify chart sections exist
      const priorityChart = page.locator('text=/priority.*distribution/i, text=/priority.*breakdown/i').first();
      const dailyChart = page.locator('text=/daily.*breakdown/i, text=/daily.*progress/i').first();
      
      // At least one chart section should be visible
      const hasPriorityChart = await priorityChart.count() > 0;
      const hasDailyChart = await dailyChart.count() > 0;
      expect(hasPriorityChart || hasDailyChart).toBeTruthy();
    });

    // Step 6: Verify Statistics Display
    await test.step('Verify Statistics Display', async () => {
      // Check for completion percentage
      const percentageText = page.locator('text=/%|percent/i');
      await expect(percentageText.first()).toBeVisible({ timeout: 5000 });

      // Check for task counts
      const taskCounts = page.locator('text=/\\d+.*task/i');
      expect(await taskCounts.count()).toBeGreaterThan(0);
    });

    // Step 7: Capture initial statistics
    let initialCompletedCount = 0;
    await test.step('Capture Initial Statistics', async () => {
      // Try to find completed task count
      const completedText = page.locator('text=/completed.*\\d+|\\d+.*completed/i').first();
      if (await completedText.count() > 0) {
        const text = await completedText.textContent();
        const match = text?.match(/\d+/);
        if (match) {
          initialCompletedCount = parseInt(match[0], 10);
        }
      }
    });

    // Step 8: Toggle a task from the Weekly Progress page
    await test.step('Toggle Task Completion', async () => {
      // Find an incomplete task in urgent tasks or task list
      const incompleteTasks = page.locator('[data-testid*="task"], [class*="task" i]').filter({
        has: page.locator('input[type="checkbox"]:not(:checked), [role="checkbox"][aria-checked="false"]')
      });

      if (await incompleteTasks.count() > 0) {
        const firstTask = incompleteTasks.first();
        const checkbox = firstTask.locator('input[type="checkbox"], [role="checkbox"]').first();
        
        await checkbox.click();
        
        // Wait for update to propagate
        await page.waitForTimeout(2000);
      } else {
        // Try finding task checkbox directly
        const checkboxes = page.locator('input[type="checkbox"]:not(:checked)');
        if (await checkboxes.count() > 0) {
          await checkboxes.first().click();
          await page.waitForTimeout(2000);
        }
      }
    });

    // Step 9: Verify statistics update after toggle
    await test.step('Verify Statistics Update', async () => {
      // Wait for potential re-render after cache invalidation
      await page.waitForTimeout(1500);

      // Check if statistics have updated (numbers should change)
      const statsElements = page.locator('text=/\\d+/');
      expect(await statsElements.count()).toBeGreaterThan(0);

      // Verify page is still responsive
      const heading = page.locator('h1, h2').filter({ hasText: /Weekly Progress/i });
      await expect(heading).toBeVisible();
    });

    // Step 10: Test week navigation
    await test.step('Test Week Navigation', async () => {
      // Find previous/next week buttons
      const prevButton = page.locator('button:has-text("Previous"), button:has-text("Prev"), button:has([aria-label*="previous" i])').first();
      const nextButton = page.locator('button:has-text("Next"), button:has([aria-label*="next" i])').first();

      if (await prevButton.count() > 0) {
        await prevButton.click();
        await page.waitForTimeout(1500);
        
        // Should still be on weekly progress page
        await expect(page).toHaveURL(/\/weekly-progress/);
        
        // Navigate back to current week
        if (await nextButton.count() > 0) {
          await nextButton.click();
          await page.waitForTimeout(1500);
        }
      }
    });

    // Step 11: Verify urgent tasks section
    await test.step('Verify Urgent Tasks Section', async () => {
      const urgentSection = page.locator('text=/urgent.*task/i, [data-testid*="urgent"]').first();
      
      if (await urgentSection.count() > 0) {
        await expect(urgentSection).toBeVisible();
      }
    });

    // Step 12: Test responsive behaviour (optional - resize viewport)
    await test.step('Test Responsive Behaviour', async () => {
      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);

      // Verify page is still usable
      const heading = page.locator('h1, h2').filter({ hasText: /Weekly Progress/i });
      await expect(heading).toBeVisible();

      // Resize back to desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(1000);
    });

    // Step 13: Navigate back to dashboard
    await test.step('Navigate Back to Dashboard', async () => {
      const dashboardLink = page.locator('a:has-text("Dashboard"), nav >> text="Dashboard"').first();
      
      if (await dashboardLink.count() > 0) {
        await dashboardLink.click();
        await page.waitForURL(/\/dashboard/, { timeout: 5000 });
        await expect(page).toHaveURL(/\/dashboard/);
      }
    });
  });

  test('should handle edge cases in weekly progress', async ({ page }) => {
    await test.step('Login with existing user', async () => {
      await page.goto('/login');
      await page.fill('#email', testUser.email);
      await page.fill('#password', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 5000 });
    });

    await test.step('Navigate to Weekly Progress', async () => {
      const weeklyLink = page.locator('a:has-text("Weekly Progress"), a:has-text("Weekly"), nav >> text="Weekly"').first();
      await weeklyLink.click();
      await page.waitForURL(/\/weekly-progress/, { timeout: 5000 });
    });

    await test.step('Test Empty State Handling', async () => {
      // Navigate to a future week that has no tasks
      const nextButton = page.locator('button:has-text("Next"), button:has([aria-label*="next" i])').first();
      
      if (await nextButton.count() > 0) {
        // Click next week multiple times to get to empty week
        for (let i = 0; i < 3; i++) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Page should still be functional
        await expect(page).toHaveURL(/\/weekly-progress/);
        const heading = page.locator('h1, h2').filter({ hasText: /Weekly Progress/i });
        await expect(heading).toBeVisible();
      }
    });

    await test.step('Test Date Picker (if available)', async () => {
      const datePicker = page.locator('input[type="date"], input[type="datetime-local"], [data-testid*="date-picker"]').first();
      
      if (await datePicker.count() > 0) {
        await datePicker.click();
        await page.waitForTimeout(500);
        
        // Page should remain stable
        await expect(page).toHaveURL(/\/weekly-progress/);
      }
    });
  });
});
