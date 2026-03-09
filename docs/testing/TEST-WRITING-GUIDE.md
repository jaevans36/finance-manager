# Test Writing Guide

This guide provides practical examples and best practices for writing tests in the Life Manager project.

**Last Updated**: 2026-01-10

---

## Table of Contents

1. [Test Types Overview](#test-types-overview)
2. [Backend Unit Tests](#backend-unit-tests)
3. [Frontend Unit Tests](#frontend-unit-tests)
4. [Integration Tests](#integration-tests)
5. [E2E Tests](#e2e-tests)
6. [Performance Tests](#performance-tests)
7. [Common Patterns](#common-patterns)
8. [Testing Anti-Patterns](#testing-anti-patterns)

---

## Test Types Overview

### When to Use Each Type

| Test Type | Speed | Confidence | Use When |
|-----------|-------|------------|----------|
| **Unit** | ⚡⚡⚡ | 🛡️ | Testing pure functions, utilities, single components |
| **Integration** | ⚡⚡ | 🛡️🛡️ | Testing service interactions, API integration |
| **E2E** | ⚡ | 🛡️🛡️🛡️ | Testing complete user workflows |
| **Performance** | ⚡ | 🛡️🛡️ | Testing scalability, load handling |

### Test Pyramid (Target Distribution)
```
        /\
       /  \      E2E Tests (10%)
      / E2E\     ~20 tests
     /______\
    /        \   Integration (30%)
   /   INT   \   ~60 tests
  /__________\
 /            \  Unit Tests (60%)
/     UNIT     \ ~120 tests
/______________\
```

---

## Backend Unit Tests

**Location**: `apps/finance-api-tests/FinanceApi.UnitTests/`

### Example: Service Method Test

```csharp
using Xunit;
using FluentAssertions;

namespace FinanceApi.UnitTests.Features.Tasks
{
    public class TaskServiceTests
    {
        [Fact]
        public async Task CreateTask_WithValidInput_ReturnsCreatedTask()
        {
            // Arrange
            var mockRepository = new Mock<ITaskRepository>();
            var service = new TaskService(mockRepository.Object);
            var input = new CreateTaskInput
            {
                Title = "Test Task",
                Priority = Priority.High
            };
            
            mockRepository
                .Setup(r => r.CreateAsync(It.IsAny<Task>()))
                .ReturnsAsync((Task t) => t);
            
            // Act
            var result = await service.CreateTaskAsync(input);
            
            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be("Test Task");
            result.Priority.Should().Be(Priority.High);
            mockRepository.Verify(r => r.CreateAsync(It.IsAny<Task>()), Times.Once);
        }
        
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public async Task CreateTask_WithInvalidTitle_ThrowsValidationException(string invalidTitle)
        {
            // Arrange
            var service = new TaskService(Mock.Of<ITaskRepository>());
            var input = new CreateTaskInput { Title = invalidTitle };
            
            // Act & Assert
            await Assert.ThrowsAsync<ValidationException>(() => 
                service.CreateTaskAsync(input));
        }
    }
}
```

### Best Practices
- ✅ Use `Fact` for single test cases, `Theory` for parameterised tests
- ✅ Follow Arrange-Act-Assert pattern
- ✅ Use FluentAssertions for readable assertions
- ✅ Mock external dependencies (repositories, HTTP clients)
- ✅ Test both success and failure paths
- ✅ Use descriptive test names: `MethodName_Scenario_ExpectedResult`

---

## Frontend Unit Tests

**Location**: `apps/web/tests/unit/` or `apps/web/tests/components/`

### Example: Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '@/components/TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    priority: 'High',
    completed: false,
    dueDate: '2026-01-15',
  };

  it('should render task title and priority', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('should call onToggle when checkbox is clicked', () => {
    const mockOnToggle = jest.fn();
    render(<TaskCard task={mockTask} onToggle={mockOnToggle} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockOnToggle).toHaveBeenCalledWith('1', true);
  });

  it('should apply completed styles when task is completed', () => {
    const completedTask = { ...mockTask, completed: true };
    render(<TaskCard task={completedTask} />);
    
    const title = screen.getByText('Test Task');
    expect(title).toHaveStyle({ textDecoration: 'line-through' });
  });

  it('should format due date correctly', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText(/Jan 15, 2026/i)).toBeInTheDocument();
  });
});
```

### Best Practices
- ✅ Use React Testing Library (not Enzyme)
- ✅ Query by role, label, or text (not test IDs unless necessary)
- ✅ Test user interactions, not implementation details
- ✅ Mock child components if they're complex
- ✅ Test accessibility (ARIA roles, labels)

---

## Integration Tests

**Location**: `apps/web/tests/integration/`

### Example: Service Integration Test

```typescript
import { statisticsService } from '@/services/statisticsService';
import { taskService } from '@/services/taskService';
import { apiClient } from '@/services/api-client';

jest.mock('@/services/api-client');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Real-time Cache Invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    statisticsService.invalidateCache();
  });

  it('should invalidate statistics cache when task is toggled', async () => {
    // Arrange
    const mockStats = {
      totalTasks: 10,
      completedTasks: 5,
      completionPercentage: 50,
    };
    
    mockedApiClient.get.mockResolvedValue({ data: mockStats });
    
    // Act: Fetch statistics (populates cache)
    await statisticsService.getWeeklyStatistics();
    expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
    
    // Act: Toggle task (should invalidate cache)
    mockedApiClient.put.mockResolvedValue({ data: { id: '1', completed: true } });
    await taskService.toggleTask('1', true);
    
    // Act: Fetch statistics again (should call API, not use cache)
    await statisticsService.getWeeklyStatistics();
    
    // Assert
    expect(mockedApiClient.get).toHaveBeenCalledTimes(2); // Not cached
  });
});
```

### Best Practices
- ✅ Test interactions between services
- ✅ Mock only external dependencies (API client, not services)
- ✅ Test cache invalidation logic
- ✅ Verify API calls are made (or not made)
- ✅ Clean up state between tests

---

## E2E Tests

**Location**: `apps/web/e2e/`

### Example: Complete User Flow

```typescript
import { test, expect } from '@playwright/test';

test.describe('Task Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create, edit, and delete a task', async ({ page }) => {
    // Create task
    await test.step('Create new task', async () => {
      await page.click('button:has-text("Create Task")');
      await page.fill('input[name="title"]', 'Buy groceries');
      await page.selectOption('select[name="priority"]', 'High');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Buy groceries')).toBeVisible();
    });

    // Edit task
    await test.step('Edit task', async () => {
      await page.click('[aria-label="Edit Buy groceries"]');
      await page.fill('input[name="title"]', 'Buy groceries and milk');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Buy groceries and milk')).toBeVisible();
    });

    // Delete task
    await test.step('Delete task', async () => {
      await page.click('[aria-label="Delete Buy groceries and milk"]');
      await page.click('button:has-text("Confirm")');
      
      await expect(page.locator('text=Buy groceries and milk')).not.toBeVisible();
    });
  });
});
```

### Best Practices
- ✅ Use `test.step()` for logical sections
- ✅ Wait for navigation/API responses before assertions
- ✅ Use semantic selectors (text, role, label)
- ✅ Test complete user journeys, not isolated actions
- ✅ Handle authentication state properly
- ✅ Use `test.describe.configure({ mode: 'serial' })` for dependent tests

---

## Performance Tests

**Location**: `apps/web/tests/performance/`

### Example: Performance Benchmark

```typescript
import { generateLargeMockData } from '@/tests/helpers/mockData';
import { statisticsService } from '@/services/statisticsService';

describe('Weekly Progress Performance', () => {
  it('should calculate statistics for 10,000 tasks in <500ms', async () => {
    // Arrange
    const largeTasks = generateLargeMockData(10000);
    
    // Mock API response
    jest.spyOn(apiClient, 'get').mockResolvedValue({
      data: { tasks: largeTasks },
    });
    
    // Act & Measure
    const startTime = performance.now();
    const result = await statisticsService.getWeeklyStatistics();
    const duration = performance.now() - startTime;
    
    // Assert
    expect(result).toBeDefined();
    expect(result.totalTasks).toBe(10000);
    expect(duration).toBeLessThan(500); // 500ms threshold
  });

  it('should handle 50,000 tasks without memory issues', () => {
    const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
    
    const largeTasks = generateLargeMockData(50000);
    
    const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncreaseMB = (memoryAfter - memoryBefore) / 1024 / 1024;
    
    expect(memoryIncreaseMB).toBeLessThan(100); // <100MB increase
  });
});
```

### Best Practices
- ✅ Use `performance.now()` for timing
- ✅ Set realistic performance budgets
- ✅ Test with production-like data volumes
- ✅ Check memory usage for large datasets
- ✅ Run performance tests separately (nightly CI)

---

## Common Patterns

### Pattern: Test Data Factories

```typescript
// tests/helpers/factories.ts
export const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: '1',
  title: 'Mock Task',
  priority: 'Medium',
  completed: false,
  dueDate: new Date().toISOString(),
  ...overrides,
});

export const createMockWeeklyStats = (overrides?: Partial<WeeklyStatistics>) => ({
  totalTasks: 10,
  completedTasks: 5,
  completionPercentage: 50,
  priorityBreakdown: { High: 3, Medium: 5, Low: 2 },
  ...overrides,
});
```

### Pattern: Custom Test Utilities

```typescript
// tests/helpers/render.tsx
import { render } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';

export const renderWithAuth = (ui: React.ReactElement, { user = mockUser } = {}) => {
  return render(
    <AuthProvider value={{ user, isAuthenticated: true }}>
      {ui}
    </AuthProvider>
  );
};
```

### Pattern: API Mocking

```typescript
// tests/helpers/mockApi.ts
import { apiClient } from '@/services/api-client';

export const mockApiSuccess = <T,>(data: T) => {
  jest.spyOn(apiClient, 'get').mockResolvedValue({ data });
};

export const mockApiError = (status: number, message: string) => {
  jest.spyOn(apiClient, 'get').mockRejectedValue({
    response: { status, data: { message } },
  });
};
```

---

## Testing Anti-Patterns

### ❌ Don't: Test Implementation Details

```typescript
// BAD
it('should update state', () => {
  const { result } = renderHook(() => useState(0));
  expect(result.current[0]).toBe(0); // Testing React internals
});

// GOOD
it('should display updated count when button is clicked', () => {
  render(<Counter />);
  fireEvent.click(screen.getByText('Increment'));
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### ❌ Don't: Use Too Many Mocks

```typescript
// BAD - Mocking everything means you're not testing much
jest.mock('@/services/taskService');
jest.mock('@/services/statisticsService');
jest.mock('@/components/TaskCard');

// GOOD - Only mock external dependencies
jest.mock('@/services/api-client');
// Use real services and components
```

### ❌ Don't: Write Tests That Depend on Each Other

```typescript
// BAD
let userId: string;

test('creates user', async () => {
  userId = await createUser(); // Sets global state
});

test('updates user', async () => {
  await updateUser(userId); // Depends on previous test
});

// GOOD - Each test is independent
test('creates user', async () => {
  const userId = await createUser();
  expect(userId).toBeDefined();
});

test('updates user', async () => {
  const userId = await createUser(); // Create fresh user
  await updateUser(userId);
});
```

### ❌ Don't: Use Arbitrary Waits

```typescript
// BAD
await page.click('button');
await page.waitForTimeout(3000); // Arbitrary wait

// GOOD
await page.click('button');
await page.waitForSelector('.success-message'); // Wait for specific condition
```

---

## Debugging Tests

### Debug Frontend Tests

```bash
# Run specific test file
pnpm --filter @life-manager/web test TaskCard.test.tsx

# Run in watch mode
pnpm --filter @life-manager/web test:watch

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest TaskCard.test.tsx
```

### Debug E2E Tests

```bash
# Run with UI mode
pnpm --filter @life-manager/web test:e2e:ui

# Run with debug mode (step through)
pnpm --filter @life-manager/web test:e2e:debug

# Run specific test file
pnpm --filter @life-manager/web test:e2e user-flow.spec.ts
```

### Debug Backend Tests

```bash
# Run specific test
dotnet test --filter "FullyQualifiedName~TaskServiceTests"

# Run with verbose output
dotnet test --logger "console;verbosity=detailed"
```

---

## Quick Reference

### Common Jest Matchers

```typescript
expect(value).toBe(expected);          // ===
expect(value).toEqual(expected);       // Deep equality
expect(value).toBeTruthy();            // Truthy value
expect(value).toBeNull();              // Null
expect(value).toBeUndefined();         // Undefined
expect(value).toBeDefined();           // Not undefined
expect(array).toContain(item);         // Array contains
expect(string).toMatch(/regex/);       // String matches
expect(fn).toHaveBeenCalled();         // Mock called
expect(fn).toHaveBeenCalledWith(args); // Mock called with args
```

### Common Playwright Actions

```typescript
await page.goto('/path');
await page.click('button');
await page.fill('input', 'text');
await page.selectOption('select', 'value');
await page.waitForURL('/path');
await page.waitForSelector('.class');
await expect(page.locator('text')).toBeVisible();
await expect(page).toHaveURL(/regex/);
```

---

## Related Documentation

- [Test Inventory](./TEST-INVENTORY.md)
- [Nightly Tests](./NIGHTLY-TESTS.md)
- [CI/CD Pipeline](../operations/CI-CD.md)

---

## 📝 Maintenance Reminder

**IMPORTANT**: Add new patterns to this guide when:
- Creating a novel testing approach
- Solving a complex testing challenge
- Establishing new test utilities or helpers
- Discovering useful testing anti-patterns to avoid

See [GitHub Copilot Instructions](../../.github/copilot-instructions.md#test-documentation-maintenance) for details.
