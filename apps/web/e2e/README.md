# End-to-End Testing with Playwright

This directory contains comprehensive E2E tests for the Finance Manager application using Playwright.

## Prerequisites

Before running E2E tests, ensure both the API and Web servers are running:

1. **Start the API server:**
   ```bash
   cd apps/api
   pnpm dev
   ```
   API should be running on `http://localhost:3000`

2. **Start the Web server:**
   ```bash
   cd apps/web
   pnpm dev
   ```
   Web app should be running on `http://localhost:5173`

## Running Tests

### Run all E2E tests (headless mode)
```bash
cd apps/web
pnpm test:e2e
```

### Run tests with UI mode (interactive)
```bash
pnpm test:e2e:ui
```

### Run tests in debug mode
```bash
pnpm test:e2e:debug
```

### Run specific test file
```bash
pnpm test:e2e user-flow.spec.ts
```

### Run tests in headed mode (see browser)
```bash
pnpm test:e2e --headed
```

## Test Coverage

### `user-flow.spec.ts`
Complete user journey testing including:

1. **Authentication Flow**
   - User registration
   - User login
   - Session persistence
   - Logout
   - Protected route access

2. **Task Management**
   - Create tasks with different priorities (HIGH, MEDIUM, LOW)
   - Edit existing tasks
   - Mark tasks as complete
   - Delete tasks
   - Task persistence after re-login

3. **Validation**
   - Required field validation
   - Form error messages
   - Invalid login credentials
   - Duplicate registration prevention

4. **User Interface**
   - Task list rendering
   - Task filtering/sorting
   - Modal interactions
   - Form submissions

## Test Configuration

Configuration is defined in `playwright.config.ts`:

- **Base URL:** `http://localhost:5173`
- **Browser:** Chromium (Desktop Chrome)
- **Retries:** 2 in CI, 0 locally
- **Screenshots:** Captured on failure
- **Traces:** Captured on first retry
- **Parallel execution:** Enabled

## Test Reports

After running tests, view the HTML report:
```bash
pnpm exec playwright show-report
```

## Debugging

### View test traces
```bash
pnpm exec playwright show-trace trace.zip
```

### Use Playwright Inspector
```bash
pnpm test:e2e:debug
```

## CI/CD Integration

Tests are configured to run in CI environments with:
- Automatic retries (2 attempts)
- Single worker to avoid race conditions
- No server reuse (starts fresh server)

## Writing New Tests

Follow the existing pattern in `user-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // Your test code
  });
});
```

### Best Practices

1. **Use test steps** for better reporting:
   ```typescript
   await test.step('Step name', async () => {
     // Step code
   });
   ```

2. **Wait for elements** properly:
   ```typescript
   await expect(element).toBeVisible({ timeout: 3000 });
   ```

3. **Use data-testid** for stable selectors:
   ```typescript
   await page.click('[data-testid="submit-button"]');
   ```

4. **Clean up test data** in `afterEach` hooks

5. **Use unique test data** (timestamps, UUIDs) to avoid conflicts

## Troubleshooting

### API not responding
Ensure the API server is running and accessible at `http://localhost:3000/api/health`

### Tests timing out
Increase timeout in test or config:
```typescript
test('name', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
});
```

### Browser not found
Reinstall browsers:
```bash
pnpm exec playwright install chromium
```

### Port conflicts
Check if ports 3000 (API) and 5173 (Web) are available
