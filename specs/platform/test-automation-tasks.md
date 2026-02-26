# Tasks: Test Automation & Quality Monitoring

**Input**: `specs/platform/test-automation.md`  
**Prerequisites**: Microservices architecture, CI/CD pipeline  
**Continues from**: T1008 (Microservices tasks)

**Organisation**: Tasks grouped by phase for test orchestration, dashboard, and automated bug filing.

**Technology Stack**:
- **CI/CD**: GitHub Actions
- **Reporting**: Allure Report, Grafana
- **Bug Filing**: GitHub Issues API
- **Storage**: PostgreSQL (test result history)

## Format: `[ID] [P?] [Story] Description`

---

## Phase 28: Test Orchestration & Tiered Execution (Priority: P1)

**Purpose**: Automated test execution with tiered strategy (PR, nightly, weekly)  
**Estimated Effort**: 1.5 weeks (14 tasks)  
**Dependencies**: Existing test suites per service

### CI/CD Pipeline (Week 1)

- [ ] T1009 [P] [US1] Create GitHub Actions workflow for PR checks: unit + critical integration per service - 4h
- [ ] T1010 [P] [US1] Create GitHub Actions workflow for nightly: full test suite all services - 4h
- [ ] T1011 [P] [US1] Create GitHub Actions workflow for weekly: performance + security + full E2E - 3h
- [ ] T1012 [US1] Implement service-affected detection (only run tests for changed services) - 4h
- [ ] T1013 [US1] Configure Playwright for multi-browser nightly runs (Chromium, Firefox, WebKit) - 2h
- [ ] T1014 [US1] Implement test result publishing to centralised storage (PostgreSQL) - 3h
- [ ] T1015 [US1] Configure Allure Report generation and publishing for each test run - 3h

### Test Infrastructure (Week 1, Days 4-5)

- [ ] T1016 [P] [US1] Create test result schema in dedicated PostgreSQL database - 2h
- [ ] T1017 [US1] Implement test result ingestion API (parse JUnit/xUnit XML, store results) - 4h
- [ ] T1018 [US1] Implement test run metadata storage (commit SHA, branch, trigger type, duration) - 2h
- [ ] T1019 [US1] Create matrix strategy for running service tests in parallel in CI - 3h
- [ ] T1020 [US1] Write GitHub Action integration tests (verify workflow triggers correctly) - 2h

### Documentation

- [ ] T1021 [US1] Update `docs/testing/NIGHTLY-TESTS.md` with tiered test strategy - 2h
- [ ] T1022 [US1] Update `docs/testing/TEST-INVENTORY.md` with per-service test counts - 1h

**Checkpoint**: Tests run automatically on PR, nightly, and weekly schedules across all services

---

## Phase 29: Quality Dashboard (Priority: P1)

**Purpose**: Interactive dashboard for test health visibility  
**Estimated Effort**: 1.5 weeks (12 tasks)  
**Dependencies**: Phase 28 (test results in database)

### Backend: Dashboard API (Week 1, Days 1-3)

- [ ] T1023 [US2] Implement DashboardService (aggregate pass rates, coverage, trends per service) - 4h
- [ ] T1024 [US2] Implement DashboardController (overview, service detail, trend data, test detail) - 3h
- [ ] T1025 [US2] Implement test trend calculations (7-day, 30-day, 90-day rolling averages) - 3h
- [ ] T1026 [US2] Write unit tests for dashboard aggregation logic (10+ tests) - 2h
- [ ] T1027 [US2] Write integration tests for dashboard API (8+ tests) - 2h

### Frontend: Dashboard UI (Week 1, Days 4-5 → Week 2, Day 1)

- [ ] T1028 [P] [US2] Create test dashboard TypeScript interfaces - 1h
- [ ] T1029 [US2] Create QualityOverview component (service cards with pass rate, coverage, last run) - 4h
- [ ] T1030 [US2] Create TestTrendChart component (pass rate over time with anomaly highlighting) - 4h
- [ ] T1031 [US2] Create TestDetail component (error message, stack trace, screenshots, history) - 3h
- [ ] T1032 [US2] Create coverage report viewer (per-service, per-file percentages with trends) - 3h
- [ ] T1033 [US2] Write Jest tests for dashboard components (8+ tests) - 2h
- [ ] T1034 [US2] Add quality dashboard route and navigation - 1h

**Checkpoint**: Interactive quality dashboard showing test health across all services

---

## Phase 30: Flaky Test Detection & Bug Filing (Priority: P2)

**Purpose**: Automatically detect flaky tests, quarantine them, and file bugs for persistent failures  
**Estimated Effort**: 1.5 weeks (12 tasks)  
**Dependencies**: Phase 28 (test result history)

### Backend: Flaky Detection & Bug Filing (Week 1)

- [ ] T1035 [US3] Implement flaky test detection algorithm (sliding window analysis of pass/fail patterns) - 4h
- [ ] T1036 [US3] Implement quarantine system (flag tests, exclude from blocking pipeline) - 3h
- [ ] T1037 [US3] Implement automatic un-quarantine (7 consecutive passes → restore to blocking) - 2h
- [ ] T1038 [US4] Implement GitHub Issues integration for automatic bug filing - 4h
- [ ] T1039 [US4] Implement de-duplication (hash test identifier, check existing issues before filing) - 3h
- [ ] T1040 [US4] Implement auto-close (3 consecutive passes → close filed bug) - 2h
- [ ] T1041 [US4] Create bug issue template (test name, service, error, screenshots, commit SHA) - 2h
- [ ] T1042 [US3/US4] Write unit tests for flaky detection and bug filing (10+ tests) - 3h
- [ ] T1043 [US3/US4] Write integration tests with mocked GitHub API (6+ tests) - 3h

### Frontend: Flaky/Bug UI (Week 1, Days 4-5)

- [ ] T1044 [US3] Create FlakyTestList component (quarantined tests, failure rate, status) - 3h
- [ ] T1045 [US4] Create AutoFiledBugs component (filed issues list with status, linked tests) - 3h
- [ ] T1046 [US3/US4] Write Jest tests for flaky and bug filing components (6+ tests) - 2h

**Checkpoint**: Flaky tests detected and quarantined, persistent failures auto-filed as bugs

---

## Phase 31: Performance Monitoring (Priority: P3)

**Purpose**: Track test and API performance, detect regressions  
**Estimated Effort**: 1 week (8 tasks)  
**Dependencies**: Phase 28 (test infrastructure)

- [ ] T1047 [P] [US5] Implement k6 performance test scripts for key API endpoints per service - 4h
- [ ] T1048 [US5] Integrate k6 results into test result storage - 2h
- [ ] T1049 [US5] Implement performance baseline tracking (p50, p95, p99 per endpoint) - 3h
- [ ] T1050 [US5] Implement regression detection (alert when response times exceed baseline by 20%) - 3h
- [ ] T1051 [US5] Create PerformanceTrends component (latency charts per endpoint, regression markers) - 4h
- [ ] T1052 [US5] Implement slow test detection and reporting (flag tests exceeding threshold) - 2h
- [ ] T1053 [US5] Write unit tests for performance analysis logic (6+ tests) - 2h
- [ ] T1054 [US5] Add performance tab to quality dashboard - 1h

**Checkpoint**: Performance tracked per endpoint, regressions detected and alerted

---

## Summary

| Phase | Name | Priority | Tasks | Estimated Effort |
|-------|------|----------|-------|-----------------|
| 28 | Test Orchestration | P1 | T1009-T1022 (14) | 1.5 weeks |
| 29 | Quality Dashboard | P1 | T1023-T1034 (12) | 1.5 weeks |
| 30 | Flaky & Bug Filing | P2 | T1035-T1046 (12) | 1.5 weeks |
| 31 | Performance Monitor | P3 | T1047-T1054 (8) | 1 week |
| **Total** | | | **46 tasks** | **~5.5 weeks** |
