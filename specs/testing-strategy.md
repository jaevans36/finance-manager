# Testing Strategy & Coverage

## Overview

The Finance Manager To Do application has comprehensive test coverage across three levels:
1. **Backend Integration Tests** - API endpoint testing
2. **Frontend Component Tests** - React component unit testing  
3. **End-to-End Tests** - Complete user flow testing

## Test Statistics

### Overall Coverage
- **Total Tests:** 119 tests (44 backend + 71 frontend + 4 E2E)
- **Pass Rate:** 100%
- **Test Suites:** 6 backend + 4 frontend + 1 E2E = 11 total

### Backend Tests (44 tests)
Location: `apps/api/tests/`
- **Authentication Tests:** 16 tests
- **Task Management Tests:** 28 tests
- **Test Framework:** Jest + Supertest
- **Execution Time:** ~8-10 seconds

### Frontend Tests (71 tests)
Location: `apps/web/tests/`
- **TaskItem Component:** 17 tests
- **TaskList Component:** 14 tests  
- **CreateTaskForm Component:** 10 tests
- **EditTaskModal Component:** 30 tests
- **Test Framework:** Jest + React Testing Library + ts-jest
- **Execution Time:** ~5-6 seconds

### E2E Tests (4 tests - 100% passing)
Location: `apps/web/e2e/`
- **User Journey Test:** Full authentication and task management flow
- **Validation Test:** Form validation and error handling
- **Auth Error Test:** Invalid credentials and duplicate registration
- **Protected Route Test:** Unauthorized access prevention
- **Test Framework:** Playwright (Chromium)
- **Execution Time:** ~15-20 seconds (serial execution)

---

## Running Tests

### Backend Tests

```bash
cd apps/api
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
```

**Prerequisites:**
- PostgreSQL database running
- `finance_manager_test` database created
- `.env.test` file configured

### Frontend Component Tests

```bash
cd apps/web
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
```

**No prerequisites** - Tests run in jsdom environment

### E2E Tests

```bash
cd apps/web
pnpm test:e2e          # Headless mode
pnpm test:e2e:ui       # Interactive UI mode
pnpm test:e2e:debug    # Debug mode
```

**Prerequisites:**
- API server running on `http://localhost:3000`
- Web server running on `http://localhost:5173`

**Start servers:**
```bash
# Terminal 1 - API
cd apps/api && pnpm dev

# Terminal 2 - Web  
cd apps/web && pnpm dev

# Terminal 3 - E2E Tests
cd apps/web && pnpm test:e2e
```

---

## Test Coverage Details

### Backend Integration Tests

#### Authentication API (`apps/api/tests/api/auth.test.ts`)
✅ User Registration
- Valid registration with all fields
- Email format validation
- Password strength requirements
- Duplicate email prevention
- Missing required fields handling

✅ User Login
- Valid login credentials
- Invalid email/password handling
- JWT token generation
- Refresh token functionality

✅ User Profile
- Get authenticated user profile
- Unauthorized access prevention

✅ Token Management
- Access token validation
- Refresh token rotation
- Token expiration handling

✅ Logout
- Session termination
- Token invalidation

#### Task Management API (`apps/api/tests/api/tasks.test.ts`)
✅ Create Tasks
- Task with all fields (title, description, priority, due date)
- Task with required fields only
- Validation error handling
- Long title/description handling

✅ Read Tasks
- Get all user tasks with pagination
- Filter by completion status
- Sort by creation date
- User isolation verification

✅ Update Tasks
- Update all task fields
- Update individual fields
- Mark as complete/incomplete
- Validation on updates

✅ Delete Tasks
- Delete own tasks
- Prevent deleting other users' tasks
- Handle non-existent tasks

✅ Task Queries
- Pagination (page, limit)
- Filtering (completed status)
- Sorting (createdAt, priority)
- Empty results handling

### Frontend Component Tests

#### TaskItem Component (`apps/web/tests/components/TaskItem.test.tsx`)
✅ Rendering
- Task title display
- Description display (with null handling)
- Priority badge with correct color
- Due date formatting (DD/MM/YYYY)
- Overdue indicator
- Completed date display

✅ User Interactions
- Checkbox checked/unchecked state
- Toggle completion callback
- Edit button callback
- Delete button callback
- Strikethrough styling for completed tasks

✅ Priority Colors
- HIGH = Red
- MEDIUM = Yellow
- LOW = Green

#### TaskList Component (`apps/web/tests/components/TaskList.test.tsx`)
✅ States
- Loading state display
- Empty state message
- Task list rendering

✅ Task Management
- Render all tasks in order
- Handle task order changes
- Display single task
- Handle 100+ tasks

✅ Component Integration
- Pass props to TaskItem
- Maintain task ordering
- Handle minimal task data

#### CreateTaskForm Component (`apps/web/tests/components/CreateTaskForm.test.tsx`)
✅ Form Rendering
- All input fields present
- Default priority (MEDIUM)
- Submit and cancel buttons

✅ Validation
- Required title field
- Whitespace-only title rejection
- Error message display

✅ Submission
- Submit with minimum data (title only)
- Submit with all fields
- Whitespace trimming
- Form reset after success
- Error handling on failure

#### EditTaskModal Component (`apps/web/tests/components/EditTaskModal.test.tsx`)
✅ Modal Behavior
- Render with pre-populated data
- Handle null values (description, due date)
- Close on Escape key
- Close on backdrop click
- Prevent close on content click

✅ Form Editing
- Update title
- Update description
- Change priority
- Change due date
- Character count display

✅ Validation & Submission
- Required title validation
- Trim whitespace
- Send undefined for empty optional fields
- Disable inputs while submitting
- Show loading state ("Saving...")
- Error message display
- Clear errors on resubmission

### E2E Tests

#### Complete User Flow (`apps/web/e2e/user-flow.spec.ts`)

✅ **Test 1: Full User Journey**
1. Navigate to application
2. Register new user
3. Verify authentication
4. Create high-priority task with due date
5. Create medium-priority task
6. Mark first task as complete
7. Edit second task (change title and priority)
8. Create low-priority task
9. Delete task
10. Verify remaining tasks
11. Logout
12. Login again
13. Verify task persistence and completion state

✅ **Test 2: Validation Errors**
1. Login with test user
2. Attempt to create task without title (validation error)
3. Create task with minimum required data

✅ **Test 3: Authentication Errors**
1. Attempt login with invalid credentials
2. Attempt registration with existing email

✅ **Test 4: Protected Routes**
1. Access tasks page without authentication
2. Verify redirect to login page

---

## Test Infrastructure

### Backend Testing Stack
- **Jest** 29.7.0 - Test framework
- **Supertest** 6.3.3 - HTTP assertion library
- **ts-jest** - TypeScript support
- **PostgreSQL** - Test database isolation
- **Environment:** NODE_ENV=test

**Key Files:**
- `apps/api/jest.config.js` - Jest configuration
- `apps/api/tests/setup.ts` - Global test setup
- `apps/api/tests/helpers/auth.helper.ts` - Test utilities
- `apps/api/.env.test` - Test environment variables

### Frontend Testing Stack
- **Jest** 29.7.0 - Test framework
- **React Testing Library** 14.1.2 - React component testing
- **ts-jest** 29.4.5 - TypeScript compilation
- **@testing-library/jest-dom** 6.1.5 - DOM matchers
- **jsdom** - Browser environment simulation

**Key Files:**
- `apps/web/jest.config.cjs` - Jest configuration
- `apps/web/tests/setup.ts` - Test setup with jest-dom

### E2E Testing Stack
- **Playwright** 1.56.1 - Browser automation
- **Chromium** - Test browser
- **TypeScript** - Type-safe test scripts

**Key Files:**
- `apps/web/playwright.config.ts` - Playwright configuration
- `apps/web/e2e/README.md` - E2E testing documentation

---

## Testing Best Practices

### Backend Tests
1. ✅ Use test database isolation
2. ✅ Create unique test users per test
3. ✅ Clean up test data after tests
4. ✅ Test authentication and authorization
5. ✅ Test validation and error cases
6. ✅ Verify user data isolation

### Frontend Tests
1. ✅ Test user interactions, not implementation
2. ✅ Use fireEvent.submit() for forms
3. ✅ Wait for async updates with waitFor()
4. ✅ Mock external dependencies
5. ✅ Test loading and error states
6. ✅ Use accessible queries (getByRole, getByLabelText)

### E2E Tests
1. ✅ Test complete user workflows
2. ✅ Use unique test data (timestamps)
3. ✅ Test both happy path and error cases
4. ✅ Verify data persistence across sessions
5. ✅ Test authentication flows
6. ✅ Use test.step() for clear reporting

---

## CI/CD Integration

### GitHub Actions (Recommended Setup)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: cd apps/api && pnpm test
      
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: cd apps/web && pnpm test
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: cd apps/web && pnpm exec playwright install chromium
      - run: cd apps/api && pnpm dev &
      - run: cd apps/web && pnpm test:e2e
```

---

## Future Testing Enhancements

### Potential Additions
1. ⏳ Visual regression testing (Percy, Chromatic)
2. ⏳ API contract testing (Pact)
3. ⏳ Performance testing (Lighthouse CI)
4. ⏳ Accessibility testing (axe-core)
5. ⏳ Load testing (k6, Artillery)
6. ⏳ Security testing (OWASP ZAP)

### Coverage Improvements
1. ⏳ Increase backend test coverage to 90%+
2. ⏳ Add mutation testing
3. ⏳ Test error boundaries
4. ⏳ Test responsive layouts
5. ⏳ Test keyboard navigation

---

## Troubleshooting

### Backend Tests Failing
- Ensure PostgreSQL is running
- Check `finance_manager_test` database exists
- Verify `.env.test` has correct credentials
- Check port 5432 is not blocked

### Frontend Tests Failing
- Clear Jest cache: `pnpm jest --clearCache`
- Check Node version (v18+)
- Verify all dependencies installed

### E2E Tests Failing
- Ensure both servers are running
- Check ports 3000 and 5173 are available
- Reinstall browsers: `pnpm exec playwright install chromium`
- Check test database has data

### Performance Issues
- Run tests in parallel: `jest --maxWorkers=4`
- Use test.only() to run specific tests
- Clear test database regularly

---

## Test Maintenance

### Regular Tasks
- ✅ Update test dependencies monthly
- ✅ Review and remove flaky tests
- ✅ Keep test data fresh
- ✅ Monitor test execution time
- ✅ Update documentation with new tests

### Code Review Checklist
- [ ] All new features have tests
- [ ] Tests follow existing patterns
- [ ] No commented-out tests
- [ ] Test names are descriptive
- [ ] No hard-coded values
- [ ] Proper cleanup after tests

---

## Summary

The Finance Manager To Do application has **119 passing tests (100% pass rate)** across all layers, providing confidence in:
- ✅ API reliability and data integrity (44 tests)
- ✅ UI component correctness (71 tests)
- ✅ Complete user workflows (4 E2E tests)
- ✅ Error handling and validation
- ✅ Authentication and authorization
- ✅ Cross-browser compatibility (Chromium tested)

**Test execution time:** ~40-50 seconds total for all test suites.

**Test Coverage Breakdown:**
- Backend Integration: 44 tests (16 auth + 28 tasks)
- Frontend Components: 71 tests (17 TaskItem + 14 TaskList + 10 CreateForm + 30 EditModal)
- End-to-End: 4 tests (user journey + validation + auth errors + protected routes)

**Status:** All test infrastructure complete and operational. Ready for CI/CD integration.
