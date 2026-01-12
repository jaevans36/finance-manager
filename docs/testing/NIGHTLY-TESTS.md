# Nightly Test Suite Strategy

This document outlines the nightly/scheduled test suite for the Finance Manager project. These tests are too slow or resource-intensive to run on every PR but are critical for maintaining application quality.

**Last Updated**: 2026-01-10

---

## Why Nightly Tests?

### Problems with Running All Tests on Every PR:
- ⏱️ **Slow feedback**: E2E and performance tests can take 15-30 minutes
- 💰 **CI costs**: GitHub Actions minutes add up quickly
- 🔄 **Developer friction**: Slow CI discourages frequent commits
- 🧪 **Test pollution**: Too many tests = harder to identify failures

### Benefits of Scheduled Testing:
- ✅ Fast PR feedback (critical tests only: <7 minutes)
- ✅ Comprehensive coverage (full suite runs daily)
- ✅ Early detection of issues (before they compound)
- ✅ Cost effective (runs once daily, not 20+ times)
- ✅ Better test organization (fast vs. slow tests)

---

## Test Categorization

### Tier 1: PR Tests (Fast & Critical)
**Run on**: Every push to PR  
**Timeout**: 10 minutes  
**Purpose**: Fast feedback on breaking changes

- ✅ Backend unit tests (~30s)
- ✅ Frontend unit tests (~45s)
- ✅ Frontend integration tests (~2min)
- ✅ Critical path E2E tests (~3min)
- ✅ Linting & type checking (~30s)
- ✅ Build verification (~1min)

**Total**: ~7 minutes

### Tier 2: Nightly Tests (Comprehensive)
**Run on**: Schedule (1:00 AM UTC daily)  
**Timeout**: 30 minutes  
**Purpose**: Catch regressions, performance issues, edge cases

- 🌙 Extended E2E tests (all workflows: ~10min)
- 🌙 Performance tests (1000-50k tasks: ~5min)
- 🌙 Accessibility audits (axe-core: ~2min)
- 🌙 Visual regression tests (Percy/Chromatic: ~3min)
- 🌙 Lighthouse performance scores (~2min)
- 🌙 Bundle size checks (~1min)
- 🌙 Security scans (npm audit, Snyk: ~2min)
- 🌙 Database migration tests (~2min)
- 🌙 API contract tests (~2min)

**Total**: ~30 minutes

### Tier 3: Weekly Tests (Exhaustive)
**Run on**: Sunday 2:00 AM UTC  
**Timeout**: 60 minutes  
**Purpose**: Deep testing, security, compliance

- 📅 Load testing (concurrent users: ~15min)
- 📅 Stress testing (database limits: ~10min)
- 📅 Security penetration tests (~15min)
- 📅 Dependency vulnerability deep scan (~10min)
- 📅 Code quality analysis (SonarCloud: ~5min)
- 📅 Test coverage report generation (~5min)

**Total**: ~60 minutes

---

## GitHub Actions Configuration

### 1. PR Tests (Existing - Keep As Is)

File: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  backend-tests:
    # ... existing configuration ...
  
  frontend-tests:
    # ... existing configuration ...
  
  e2e-tests:
    # ... existing configuration ...
    # Only run critical path tests
```

### 2. Nightly Tests (New Workflow)

File: `.github/workflows/nightly.yml`

```yaml
name: Nightly Tests

on:
  schedule:
    # Run at 1:00 AM UTC daily (adjust for your timezone)
    - cron: '0 1 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  extended-e2e:
    name: Extended E2E Tests
    runs-on: ubuntu-latest
    # ... run all E2E tests including slow ones ...
  
  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    # ... run performance benchmarks ...
  
  accessibility:
    name: Accessibility Audits
    runs-on: ubuntu-latest
    # ... run axe-core tests ...
  
  lighthouse:
    name: Lighthouse Performance
    runs-on: ubuntu-latest
    # ... run Lighthouse CI ...
  
  security-scan:
    name: Security & Dependency Scan
    runs-on: ubuntu-latest
    # ... run npm audit, Snyk, etc. ...
  
  notify-results:
    name: Notify Results
    needs: [extended-e2e, performance-tests, accessibility, lighthouse, security-scan]
    runs-on: ubuntu-latest
    # ... create GitHub issue if tests fail ...
```

### 3. Weekly Tests (New Workflow)

File: `.github/workflows/weekly.yml`

```yaml
name: Weekly Tests

on:
  schedule:
    # Run Sundays at 2:00 AM UTC
    - cron: '0 2 * * 0'
  workflow_dispatch:

jobs:
  load-testing:
    name: Load Testing
    runs-on: ubuntu-latest
    # ... run load tests with k6 or Artillery ...
  
  security-audit:
    name: Security Audit
    runs-on: ubuntu-latest
    # ... run OWASP ZAP, etc. ...
  
  code-quality:
    name: Code Quality Analysis
    runs-on: ubuntu-latest
    # ... run SonarCloud ...
```

---

## Test Failure Notification Strategy

### Option 1: GitHub Issues (Recommended for Solo Dev)
When nightly tests fail, automatically create a GitHub issue:

**Pros**:
- ✅ Built-in tracking and history
- ✅ Can assign priority labels
- ✅ Searchable and linkable
- ✅ Free on GitHub

**Cons**:
- ⚠️ Can create noise if many failures
- ⚠️ Requires GitHub API token

**Example Issue Template**:
```markdown
Title: [Nightly] Test Failure: {test-name}

## Failure Details
- **Date**: 2026-01-10 01:23:45 UTC
- **Branch**: main
- **Commit**: abc123def
- **Test Suite**: Extended E2E Tests
- **Failed Test**: Login flow with expired token

## Error Message
```
Expected: 401 Unauthorized
Received: 500 Internal Server Error
```

## Logs
[Link to GitHub Actions run]

## Action Required
- [ ] Investigate root cause
- [ ] Fix bug or update test
- [ ] Add regression test if needed
- [ ] Close issue when resolved

---
Auto-generated by Nightly Test Suite
```

### Option 2: Email Notifications
Send email on test failures:

**Pros**:
- ✅ Immediate notification
- ✅ Simple to set up

**Cons**:
- ⚠️ Easy to ignore/miss
- ⚠️ No tracking or history
- ⚠️ Requires email service

### Option 3: Slack/Discord Webhook (If you use these)
Post to a dedicated channel:

**Pros**:
- ✅ Real-time notification
- ✅ Can integrate with other workflows
- ✅ Threaded discussions

**Cons**:
- ⚠️ Requires Slack/Discord setup
- ⚠️ Messages get buried quickly

---

## Recommended Approach for Solo Developer

### Phase 1: Immediate (This Week)
1. ✅ **Create test inventory** (done above)
2. ⏭️ **Split existing CI workflow**:
   - Keep PR tests fast (<7min)
   - Move slow E2E tests to nightly
3. ⏭️ **Create nightly workflow**:
   - Run extended E2E tests
   - Run performance tests
   - Create GitHub issue on failure

**Effort**: 2-3 hours  
**Value**: High (immediate feedback improvement)

### Phase 2: Next Month
4. Add accessibility tests (axe-core)
5. Add Lighthouse performance monitoring
6. Add bundle size tracking
7. Add security scanning (npm audit)

**Effort**: 4-6 hours  
**Value**: Medium (proactive quality monitoring)

### Phase 3: Future (As Needed)
8. Add visual regression tests (Percy/Chromatic)
9. Add load testing (k6 or Artillery)
10. Add code quality analysis (SonarCloud)

**Effort**: 8-10 hours  
**Value**: Medium (nice to have for larger projects)

---

## Test Organization Structure

```
apps/web/e2e/
├── critical/              # PR tests (fast, critical paths)
│   ├── user-flow.spec.ts
│   └── task-crud.spec.ts
├── extended/              # Nightly tests (comprehensive)
│   ├── weekly-progress-flow.spec.ts
│   ├── calendar-flow.spec.ts
│   └── search-flow.spec.ts
└── performance/           # Nightly tests (slow)
    └── large-dataset.spec.ts

apps/web/tests/
├── unit/                  # PR tests (fast)
├── integration/           # PR tests (fast)
└── performance/           # Nightly tests (slow)
    └── WeeklyProgressPerformance.test.tsx
```

### Playwright Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'critical',      // PR tests
      testDir: './e2e/critical',
      timeout: 30000,
    },
    {
      name: 'extended',      // Nightly tests
      testDir: './e2e/extended',
      timeout: 60000,
    },
    {
      name: 'performance',   // Nightly tests
      testDir: './e2e/performance',
      timeout: 120000,
    },
  ],
});
```

---

## Metrics to Track

### Daily (from Nightly Tests)
- Test pass rate (target: >95%)
- Average test duration (watch for slowdowns)
- Number of flaky tests (target: 0)
- Failed tests by category

### Weekly (from Weekly Tests)
- Test coverage percentage
- Bundle size trends
- Lighthouse performance score
- Security vulnerabilities found

### Monthly (from Manual Review)
- Time to fix test failures (target: <1 day)
- Number of skipped tests (minimize)
- Test maintenance effort (hours/month)
- Coverage gap closure progress

---

## Integration with Development Workflow

### Daily Routine
1. **Morning**: Check GitHub for nightly test failure issues
2. **If failures exist**: Prioritize fixing before new features
3. **Before leaving**: Ensure PR tests are green

### Weekly Routine
1. **Monday morning**: Review weekend test results
2. **Mid-week**: Address any new test failures
3. **Friday afternoon**: Review test inventory, update metrics

### Monthly Routine
1. **First Monday**: Review test coverage gaps
2. **Mid-month**: Update test documentation
3. **End of month**: Audit slow/flaky tests, plan improvements

---

## Cost Considerations (GitHub Actions)

### Free Tier Limits
- **Public repos**: Unlimited minutes ✅
- **Private repos**: 2,000 minutes/month

### Estimated Usage
- **PR tests**: 7 min × 30 PRs/month = 210 min
- **Nightly tests**: 30 min × 30 days = 900 min
- **Weekly tests**: 60 min × 4 weeks = 240 min
- **Total**: ~1,350 min/month

**Verdict**: Well within free tier for solo developer ✅

### Cost Optimization Tips
1. Use `cancel-in-progress: true` to stop old runs
2. Cache dependencies aggressively
3. Parallelize jobs when possible
4. Skip tests on documentation-only changes
5. Use `concurrency` groups to prevent duplicate runs

---

## Next Steps

1. **Review this document** and decide which tests to move to nightly
2. **Create nightly workflow** (see implementation below)
3. **Test the workflow** with manual trigger
4. **Monitor for one week** and adjust timing/tests as needed
5. **Update test inventory** with new categorization

---

## Related Documentation

- [Test Inventory](./TEST-INVENTORY.md)
- [CI/CD Pipeline](../CI-CD.md)
- [Testing Strategy](../../specs/testing-strategy.md)

---

## 📝 Maintenance Reminder

**IMPORTANT**: Update this document when:
- Adding tests to nightly workflow
- Changing test categorization (Tier 1/2/3)
- Modifying scheduled test configuration
- Adding new test types (accessibility, performance, etc.)

See [GitHub Copilot Instructions](../../.github/copilot-instructions.md#test-documentation-maintenance) for details.
