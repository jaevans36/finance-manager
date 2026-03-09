# Test Inventory

This document tracks all automated tests in the Life Manager project. It serves as a reference for what's tested, coverage gaps, and maintenance responsibilities.

**Last Updated**: 2026-01-18  
**Total Tests**: 303 (Phase 13 complete: Events feature with 68 new tests)

---

## Test Suite Overview

| Type | Count | Run On | Duration | Location |
|------|-------|--------|----------|----------|
| Backend Unit | 62 (+18) | Every PR | ~45s | `apps/finance-api-tests/` |
| Frontend Unit | 96 (+25) | Every PR | ~60s | `apps/web/tests/` |
| Frontend Integration | 77 | Every PR | ~2.5min | `apps/web/tests/integration/` |
| E2E (Playwright) | 37 (+9) | Every PR | ~6min | `apps/web/e2e/` |
| Backend Integration | 16 (+16) | Every PR | ~1min | `apps/finance-api-tests/` |
| Performance | 15 | Manual/Nightly | ~1min | `apps/web/tests/performance/` |
| **Total** | **303** | | **~11min** | |

---

## Feature Coverage Matrix

### Phase 1: User Authentication (US1)
| Feature | Unit Tests | Integration Tests | E2E Tests | Coverage |
|---------|------------|-------------------|-----------|----------|
| User Registration | ✅ Backend (4) | ✅ Frontend (3) | ✅ (1) | 100% |
| Login/Logout | ✅ Backend (4) | ✅ Frontend (3) | ✅ (1) | 100% |
| Token Refresh | ✅ Backend (2) | ✅ Frontend (2) | ⚠️ Partial | 85% |
| Password Validation | ✅ Backend (3) | ✅ Frontend (2) | ❌ | 70% |
| Session Management | ✅ Backend (4) | ✅ Frontend (2) | ❌ | 75% |

### Phase 2-7: Task Management (US2-US7)
| Feature | Unit Tests | Integration Tests | E2E Tests | Coverage |
|---------|------------|-------------------|-----------|----------|
| CRUD Operations | ✅ Backend (12) | ✅ Frontend (8) | ✅ (1) | 100% |
| Task Filtering | ✅ Backend (5) | ✅ Frontend (6) | ⚠️ Partial | 85% |
| Priority Management | ✅ Backend (4) | ✅ Frontend (4) | ✅ (1) | 100% |
| Due Dates | ✅ Backend (3) | ✅ Frontend (5) | ✅ (1) | 95% |
| Categories | ✅ Backend (4) | ✅ Frontend (4) | ⚠️ Partial | 80% |
| Calendar Integration | ✅ Backend (2) | ✅ Frontend (12) | ✅ (1) | 90% |
| Task Search | ✅ Backend (3) | ⚠️ Partial (2) | ❌ | 60% |

### Phase 11: Weekly Progress Dashboard (US8)
| Feature | Unit Tests | Integration Tests | E2E Tests | Coverage |
|---------|------------|-------------------|-----------|----------|
| Weekly Statistics | ✅ (18) | ✅ (15) | ✅ (1) | 100% |
| Priority Charts | ✅ (15) | ❌ | ✅ (1) | 95% |
| Daily Breakdown | ✅ (10) | ❌ | ✅ (1) | 95% |
| Category Charts | ✅ (10) | ❌ | ✅ (1) | 95% |
| Week Navigation | ✅ (15) | ❌ | ✅ (1) | 100% |
| Urgent Tasks | ✅ (11) | ❌ | ✅ (1) | 100% |
| Responsive Design | ✅ (23) | ❌ | ✅ (1) | 95% |
| Query Caching | ✅ (18) | ✅ (15) | ⚠️ Implicit | 100% |
| Real-time Updates | ❌ | ✅ (13) | ✅ (1) | 95% |
| Performance (1000+ tasks) | ✅ (15) | ❌ | ❌ | 90% |

### Phase 12: Calendar View (US9)
| Feature | Unit Tests | Integration Tests | E2E Tests | Coverage |
|---------|------------|-------------------|-----------|----------|
| Calendar Display | ❌ | ✅ (3) | ✅ (2) | 95% |
| Month Navigation | ❌ | ✅ (2) | ✅ (3) | 100% |
| Task Creation | ❌ | ✅ (1) | ✅ (3) | 95% |
| Task Viewing | ❌ | ✅ (1) | ✅ (2) | 95% |
| Filtering (Group/Priority) | ❌ | ✅ (3) | ✅ (4) | 100% |
| Keyboard Navigation | ❌ | ✅ (3) | ✅ (3) | 100% |
| Empty States | ❌ | ✅ (1) | ✅ (1) | 100% |
| Task Count Display | ❌ | ❌ | ✅ (1) | 90% |
| Badge Colors | ❌ | ❌ | ✅ (1) | 90% |
| Responsive Design | ❌ | ❌ | ✅ (1) | 85% |
| Filter Persistence | ❌ | ❌ | ✅ (1) | 90% |
| Task Completion Toggle | ❌ | ❌ | ✅ (1) | 95% |
| Accessibility | ❌ | ✅ (2) | ❌ | 75% |
| Tooltips | ❌ | ❌ | ❌ | 80% |

### Phase 13: Events Feature (US10)
| Feature | Unit Tests | Integration Tests | E2E Tests | Coverage |
|---------|------------|-------------------|-----------|----------|
| Event CRUD API | ✅ Backend (18) | ✅ Backend (16) | ✅ (1) | 100% |
| Event Creation | ❌ | ✅ Component (5) | ✅ (2) | 95% |
| Event Viewing/Listing | ❌ | ✅ Component (13) | ✅ (1) | 95% |
| Event Editing | ❌ | ✅ Component (4) | ✅ (1) | 95% |
| Event Deletion | ❌ | ✅ Component (3) | ✅ (1) | 95% |
| All-Day Events | ✅ Backend (2) | ✅ Component (3) | ✅ (1) | 100% |
| Date/Time Validation | ✅ Backend (3) | ✅ Component (2) | ✅ (1) | 100% |
| Event Filtering | ✅ Backend (2) | ❌ | ✅ (1) | 90% |
| Calendar Integration | ❌ | ❌ | ✅ (9) | 90% |
| Event Badges | ❌ | ❌ | ✅ (1) | 85% |
| Event Reminders | ✅ Backend (1) | ✅ Component (2) | ❌ | 75% |
| Location Field | ✅ Backend (1) | ✅ Component (3) | ❌ | 80% |

---

## Coverage Gaps & Priorities

### High Priority (Implement within 1 month)
1. ~~**Task Search E2E Test**~~ - ✅ **ADDRESSED** (Phase 12)
2. **Password Reset Flow** - Missing E2E test for email-based password reset
3. **Error Boundary Tests** - No tests for React error boundaries
4. **API Error Handling** - Limited tests for 500/503 errors

### Medium Priority (Implement within 3 months)
5. **Accessibility Tests** - No automated a11y testing
6. **Category Management E2E** - Only partial coverage
7. **Mobile Gesture Tests** - No touch interaction testing
8. **Offline Handling** - No tests for network failures

### Low Priority (Nice to have)
9. **Performance Regression Tests** - Automate performance benchmarks
10. **Visual Regression Tests** - Screenshot comparison tests
11. **Load Testing** - API stress testing with many concurrent users
12. **Security Penetration Tests** - Automated security scanning

---

## Test Maintenance Guidelines

### When to Update Tests

1. **Feature Changes**: Update tests before or alongside code changes
2. **Bug Fixes**: Add regression test before fixing bug
3. **Refactoring**: Ensure tests still pass; update if necessary
4. **Breaking Changes**: Update all affected tests in the same PR

### Test Quality Standards

- **Unit Tests**: Should run in <100ms each
- **Integration Tests**: Should run in <1s each
- **E2E Tests**: Should run in <30s each
- **Coverage Target**: >80% line coverage for business logic
- **Flakiness**: Fix or remove tests that fail intermittently

### Maintenance Schedule

| Task | Frequency | Responsibility |
|------|-----------|----------------|
| Review test failures | Daily | Developer |
| Update test documentation | Weekly | Developer |
| Review coverage gaps | Monthly | Developer |
| Audit test performance | Quarterly | Developer |
| Refactor slow/brittle tests | As needed | Developer |

---

## Running Tests Locally

### Quick Commands
```powershell
# All frontend tests
pnpm --filter @life-manager/web test

# Watch mode (for TDD)
pnpm --filter @life-manager/web test:watch

# E2E tests (requires dev servers running)
pnpm --filter @life-manager/web test:e2e

# E2E with UI mode (debugging)
pnpm --filter @life-manager/web test:e2e:ui

# Backend tests (requires test database)
.\scripts\reset-test-db.ps1
pnpm --filter @life-manager/api test

# All tests (full suite)
.\scripts\run-tests.ps1
```

### Environment Requirements
- **Backend Tests**: PostgreSQL test database
- **Frontend Tests**: Node.js environment only
- **E2E Tests**: API server + Web server running

---

## CI/CD Integration

### Current Pipeline (Every PR)
- ✅ Backend unit tests
- ✅ Frontend unit tests
- ✅ Frontend integration tests
- ✅ E2E tests (Playwright)
- ✅ Linting & type checking
- ✅ Build verification

**Duration**: ~7 minutes total (parallel execution)

### Planned: Nightly Test Suite (See NIGHTLY-TESTS.md)
- 🔄 Extended E2E tests (slow workflows)
- 🔄 Performance regression tests
- 🔄 Accessibility audits
- 🔄 Lighthouse scores
- 🔄 Bundle size checks
- 🔄 Dependency vulnerability scans

**Duration**: ~20 minutes total

---

## Test Failure Response Process

### 1. Immediate Response (within 1 hour)
- Check GitHub Actions logs
- Identify failing test(s)
- Assess if it's a flaky test or real failure

### 2. Investigation (within 4 hours)
- Reproduce locally: `git checkout <branch> && .\scripts\run-tests.ps1`
- Review recent code changes
- Check for environmental issues (DB state, timing, etc.)

### 3. Resolution (within 1 day)
- **Real Bug**: Create issue, fix bug, add regression test
- **Flaky Test**: Improve test stability or temporarily skip
- **Environmental**: Fix CI configuration or test setup

### 4. Documentation
- Update test inventory if coverage gaps found
- Document known issues in test comments
- Update CI/CD documentation if needed

---

## Future Enhancements

### Phase 12+ Tests (To Be Planned)
- [ ] Finance transaction CSV import tests
- [ ] Financial dashboard tests
- [ ] Report generation tests
- [ ] Data export tests
- [ ] Multi-user collaboration tests
- [ ] Notification system tests

### Testing Infrastructure
- [ ] Test data factories/builders
- [ ] Shared test fixtures
- [ ] Custom Jest matchers
- [ ] Playwright custom fixtures
- [ ] API mocking library
- [ ] Test database seeding utilities

---

## Related Documentation

- [CI/CD Pipeline Details](../operations/CI-CD.md)
- [Testing Strategy](../../specs/testing-strategy.md)
- [Nightly Test Suite](./NIGHTLY-TESTS.md) *(to be created)*
- [Test Writing Guide](./TEST-WRITING-GUIDE.md) *(to be created)*

---

## Metrics Tracking

### Current Metrics (as of 2026-01-10)
- **Total Tests**: 195+
- **Average Test Duration**: 2.1s
- **CI Pipeline Duration**: ~7min
- **Test Coverage**: Backend 85%, Frontend 78%
- **Flaky Tests**: 0
- **Last Test Failure**: None (all green)

### Goals for Q1 2026
- **Total Tests**: 250+ (add 55 tests)
- **Average Test Duration**: <2.0s
- **CI Pipeline Duration**: <6min
- **Test Coverage**: Backend 90%, Frontend 85%
- **Flaky Tests**: <2
- **Coverage Gaps**: Address all high-priority gaps

---

## Notes

- **Test IDs**: Tests referenced by ID (T236-T245) from Phase 11. See [specs/001-todo-app/tasks.md](../../specs/001-todo-app/tasks.md)
- **Coverage Calculation**: Based on lines covered, not branches
- **E2E Test Strategy**: Focus on critical user paths, not comprehensive coverage
- **Performance Baselines**: Based on local development machine (adjust for CI environment)

---

## 📝 Maintenance Reminder

**IMPORTANT**: This document must be updated when tests are added, removed, or modified.

See [GitHub Copilot Instructions](../../.github/copilot-instructions.md#test-documentation-maintenance) for the complete maintenance workflow.

**Quick Checklist**:
- [ ] Update test counts in overview table
- [ ] Update feature coverage matrix
- [ ] Mark coverage gaps as addressed when filled
- [ ] Update "Last Updated" date at top of file
- [ ] Commit documentation with code changes
