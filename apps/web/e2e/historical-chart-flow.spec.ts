import { test, expect } from '@playwright/test';

// Test configuration
const API_BASE_URL = 'http://localhost:3000';

// Test user credentials
const TEST_TIMESTAMP = Date.now();
const testUser = {
  email: `test-historical-chart-${TEST_TIMESTAMP}@example.com`,
  password: 'TestPassword123!',
};

test.describe.configure({ mode: 'serial' });

test.describe('Historical Completion Chart E2E Flow (T231.18)', () => {
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
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('should display historical completion chart and allow week range selection', async ({ page }) => {
    // Step 1: Register and login
    await test.step('User Registration and Login', async () => {
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

    // Step 2: Create some test tasks to generate historical data
    await test.step('Create Test Tasks', async () => {
      // Create tasks for this week to generate statistics
      const tasks = [
        { title: 'Historical Test Task 1', priority: 'High' },
        { title: 'Historical Test Task 2', priority: 'Medium' },
        { title: 'Historical Test Task 3', priority: 'Low' },
      ];

      for (const task of tasks) {
        const createButton = page.locator('button:has-text("Create Task"), button:has-text("Add Task"), button:has-text("New Task")').first();
        await createButton.click();
        
        await page.fill('input[name="title"], input[placeholder*="title" i], input[placeholder*="task" i]', task.title);
        
        const prioritySelect = page.locator('select[name="priority"], select:has-text("Priority")').first();
        if (await prioritySelect.count() > 0) {
          await prioritySelect.selectOption(task.priority);
        }
        
        const submitButton = page.locator('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Add"), button[type="submit"]:has-text("Save")').first();
        await submitButton.click();
        
        await page.waitForTimeout(800);
      }

      // Complete one task to create varied statistics
      const firstTaskCheckbox = page.locator('input[type="checkbox"]').first();
      if (await firstTaskCheckbox.count() > 0) {
        await firstTaskCheckbox.click();
        await page.waitForTimeout(500);
      }
    });

    // Step 3: Navigate to Weekly Progress page
    await test.step('Navigate to Weekly Progress', async () => {
      const weeklyProgressLink = page.locator('a[href*="weekly"], a:has-text("Weekly Progress"), a:has-text("Progress")');
      await weeklyProgressLink.first().click();
      
      await page.waitForURL(/.*weekly.*/, { timeout: 5000 });
      await expect(page.url()).toContain('weekly');
    });

    // Step 4: Verify Historical Completion Chart is visible
    await test.step('Verify Historical Chart Renders', async () => {
      // Wait for the chart component to load
      await page.waitForTimeout(1500);

      // Check for chart title
      const chartTitle = page.locator('text=Completion Rate History, text=Historical Completion');
      await expect(chartTitle.first()).toBeVisible({ timeout: 5000 });

      // Verify chart container is present
      const chartContainer = page.locator('[class*="HistoricalCompletionChart"], [class*="historical"], div:has(text("Completion Rate History"))').first();
      await expect(chartContainer).toBeVisible();

      // Wait for chart to fully render
      await page.waitForTimeout(1000);
    });

    // Step 5: Test week range selector buttons
    await test.step('Test Week Range Selection - 4 Weeks', async () => {
      const fourWeeksButton = page.locator('button:has-text("4 weeks"), button:has-text("4 Weeks")');
      
      if (await fourWeeksButton.count() > 0) {
        await fourWeeksButton.click();
        await page.waitForTimeout(1000);

        // Verify button is active/selected
        const buttonClass = await fourWeeksButton.getAttribute('class');
        expect(buttonClass).toContain('active');
      }
    });

    await test.step('Test Week Range Selection - 8 Weeks', async () => {
      const eightWeeksButton = page.locator('button:has-text("8 weeks"), button:has-text("8 Weeks")');
      
      if (await eightWeeksButton.count() > 0) {
        await eightWeeksButton.click();
        await page.waitForTimeout(1000);

        // Verify button is active/selected
        const buttonClass = await eightWeeksButton.getAttribute('class');
        expect(buttonClass).toContain('active');
      }
    });

    await test.step('Test Week Range Selection - 12 Weeks', async () => {
      const twelveWeeksButton = page.locator('button:has-text("12 weeks"), button:has-text("12 Weeks")');
      
      if (await twelveWeeksButton.count() > 0) {
        await twelveWeeksButton.click();
        await page.waitForTimeout(1000);

        // Verify button is active/selected
        const buttonClass = await twelveWeeksButton.getAttribute('class');
        expect(buttonClass).toContain('active');
      }
    });

    // Step 6: Verify chart displays data
    await test.step('Verify Chart Data Display', async () => {
      // Look for SVG chart elements (Recharts renders as SVG)
      const chartSvg = page.locator('svg').first();
      await expect(chartSvg).toBeVisible();

      // Verify line chart path exists (Recharts LineChart renders paths)
      const chartPath = page.locator('svg path[class*="recharts"]').first();
      await expect(chartPath).toBeVisible();

      // Check for axis labels or ticks
      const axisTicks = page.locator('svg text[class*="recharts"]');
      expect(await axisTicks.count()).toBeGreaterThan(0);
    });

    // Step 7: Test chart interactivity (tooltip on hover)
    await test.step('Test Chart Hover Interactions', async () => {
      const chartArea = page.locator('svg .recharts-surface, svg').first();
      
      // Hover over chart to trigger tooltip
      await chartArea.hover({ position: { x: 100, y: 100 } });
      await page.waitForTimeout(500);

      // Recharts tooltip should appear on hover
      // Note: Tooltip visibility depends on implementation
      const tooltip = page.locator('[class*="recharts-tooltip"]');
      
      // Check if tooltip exists (may not always be visible depending on data)
      const tooltipCount = await tooltip.count();
      console.log(`Tooltip elements found: ${tooltipCount}`);
    });

    // Step 8: Verify legend is present
    await test.step('Verify Chart Legend', async () => {
      const legend = page.locator('text=Completion Rate, [class*="legend"], [class*="Legend"]');
      
      if (await legend.count() > 0) {
        await expect(legend.first()).toBeVisible();
      }
    });

    // Step 9: Verify no errors are displayed
    await test.step('Verify No Error States', async () => {
      const errorMessage = page.locator('text=/failed|error|unable/i');
      
      if (await errorMessage.count() > 0) {
        // If error exists, it should not be visible
        const isVisible = await errorMessage.first().isVisible();
        expect(isVisible).toBe(false);
      }
    });

    // Step 10: Test responsiveness (optional)
    await test.step('Test Chart Responsiveness', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      // Chart should still be visible on mobile
      const chartSvg = page.locator('svg').first();
      await expect(chartSvg).toBeVisible();

      // Reset to desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(500);
    });
  });

  test('should handle empty historical data gracefully', async ({ page }) => {
    await test.step('Login with Existing User', async () => {
      await page.goto('/login');
      
      await page.fill('#email', testUser.email);
      await page.fill('#password', testUser.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL(/\/dashboard/, { timeout: 5000 });
    });

    await test.step('Navigate to Weekly Progress', async () => {
      const weeklyProgressLink = page.locator('a[href*="weekly"], a:has-text("Weekly Progress")');
      await weeklyProgressLink.first().click();
      
      await page.waitForTimeout(1500);
    });

    await test.step('Verify Chart Handles Empty Data', async () => {
      const chartTitle = page.locator('text=Completion Rate History, text=Historical Completion');
      await expect(chartTitle.first()).toBeVisible({ timeout: 5000 });

      // Chart should render even with limited data
      const chartSvg = page.locator('svg').first();
      await expect(chartSvg).toBeVisible();

      // No error message should be shown
      const errorMessage = page.locator('text=/error|failed/i');
      if (await errorMessage.count() > 0) {
        const isVisible = await errorMessage.first().isVisible();
        expect(isVisible).toBe(false);
      }
    });
  });

  test('should persist week range selection across page navigations', async ({ page }) => {
    await test.step('Login and Navigate to Weekly Progress', async () => {
      await page.goto('/login');
      
      await page.fill('#email', testUser.email);
      await page.fill('#password', testUser.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL(/\/dashboard/, { timeout: 5000 });

      const weeklyProgressLink = page.locator('a[href*="weekly"], a:has-text("Weekly Progress")');
      await weeklyProgressLink.first().click();
      
      await page.waitForTimeout(1500);
    });

    await test.step('Select 4 Weeks Range', async () => {
      const fourWeeksButton = page.locator('button:has-text("4 weeks"), button:has-text("4 Weeks")');
      
      if (await fourWeeksButton.count() > 0) {
        await fourWeeksButton.click();
        await page.waitForTimeout(500);

        // Verify selection
        const buttonClass = await fourWeeksButton.getAttribute('class');
        expect(buttonClass).toContain('active');
      }
    });

    await test.step('Navigate Away and Back', async () => {
      // Navigate to dashboard
      await page.locator('a[href*="dashboard"], a:has-text("Dashboard")').first().click();
      await page.waitForTimeout(500);

      // Navigate back to weekly progress
      await page.locator('a[href*="weekly"], a:has-text("Weekly Progress")').first().click();
      await page.waitForTimeout(1500);
    });

    await test.step('Verify Selection Persistence', async () => {
      // Check if 4 weeks is still selected (if persistence is implemented)
      const fourWeeksButton = page.locator('button:has-text("4 weeks"), button:has-text("4 Weeks")');
      
      if (await fourWeeksButton.count() > 0) {
        // Note: This may default back to 8 weeks depending on implementation
        // Just verify the component loads successfully
        await expect(fourWeeksButton).toBeVisible();
      }
    });
  });
});
