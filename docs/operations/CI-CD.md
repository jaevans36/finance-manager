# GitHub Actions CI/CD Pipeline

This document explains the GitHub Actions CI/CD pipeline for the Finance Manager project.

## Pipeline Overview

The CI pipeline runs automatically on:
- Every push to `main`, `develop`, `feature/**`, and `**-todo-app` branches
- Every pull request to `main` and `develop` branches

## Jobs

### 1. Backend Tests (`backend-tests`)
**Purpose**: Test API endpoints and business logic

**Services**:
- PostgreSQL 15 (test database)

**Steps**:
1. Checkout code
2. Setup Node.js 18 and pnpm
3. Cache dependencies
4. Install dependencies
5. Run backend tests (44 tests)
6. Upload test results as artifacts

**Environment Variables**:
- `NODE_ENV=test`
- `DATABASE_URL` (PostgreSQL connection)
- `JWT_SECRET` and `JWT_REFRESH_SECRET`

**Duration**: ~1-2 minutes

---

### 2. Frontend Tests (`frontend-tests`)
**Purpose**: Test React components and UI logic

**Steps**:
1. Checkout code
2. Setup Node.js 18 and pnpm
3. Cache dependencies
4. Install dependencies
5. Run frontend tests (71 tests)
6. Upload test results as artifacts

**Duration**: ~1 minute

---

### 3. E2E Tests (`e2e-tests`)
**Purpose**: Test complete user workflows in a real browser

**Services**:
- PostgreSQL 15 (application database)

**Steps**:
1. Checkout code
2. Setup Node.js 18 and pnpm
3. Cache dependencies
4. Install dependencies
5. Install Playwright Chromium browser
6. Run database migrations
7. Start API server in background
8. Run E2E tests (4 tests)
9. Upload test results and screenshots

**Duration**: ~2-3 minutes

**Note**: E2E tests run with the API server running, testing the full stack integration.

---

### 4. Lint & Type Check (`lint`)
**Purpose**: Ensure code quality and type safety

**Steps**:
1. Checkout code
2. Setup Node.js and pnpm
3. Install dependencies
4. Run ESLint on API and Web
5. Run TypeScript type checking

**Duration**: ~30 seconds

---

### 5. Build Check (`build`)
**Purpose**: Verify production builds work correctly

**Steps**:
1. Checkout code
2. Setup Node.js and pnpm
3. Install dependencies
4. Build API (TypeScript compilation)
5. Build Web (Vite production build)
6. Upload build artifacts

**Duration**: ~1-2 minutes

---

## Total Pipeline Duration

**Typical run**: 3-5 minutes (jobs run in parallel)

## Artifacts

The pipeline uploads the following artifacts for debugging:

1. **Backend test results**: Coverage reports
2. **Frontend test results**: Coverage reports
3. **E2E test results**: Test reports and screenshots
4. **E2E screenshots**: Screenshots on test failures
5. **Build output**: Compiled API and Web code

Artifacts are retained for 90 days (GitHub default).

## Viewing Results

### In GitHub UI:
1. Navigate to your repository
2. Click "Actions" tab
3. Select a workflow run
4. View job results and download artifacts

### In Pull Requests:
- CI status appears automatically
- Green checkmark = all tests passed
- Red X = tests failed (click for details)

### Status Badge:
The README includes a CI status badge showing real-time pipeline status.

## Local Development vs CI

### Differences:
- **CI uses PostgreSQL 15** (same as production recommendation)
- **CI runs on Ubuntu** (Linux environment)
- **CI has no rate limiting** (tests run quickly)
- **CI uses fresh database** (migrations run on each test)

### Debugging CI Failures:

1. **Check the logs**: Click on the failed job to see detailed logs
2. **Download artifacts**: Get screenshots and test reports
3. **Reproduce locally**: Use the same commands as CI
4. **Check environment**: Ensure your local environment matches CI

## Environment Variables in CI

The pipeline uses these secrets/variables:

### Current (hardcoded for testing):
- `JWT_SECRET`: test-secret-key-for-ci
- `JWT_REFRESH_SECRET`: test-refresh-secret-key-for-ci
- `DATABASE_URL`: Generated from PostgreSQL service

### For Production Deployment:
You'll need to add these as GitHub Secrets:
1. Go to repository Settings → Secrets and variables → Actions
2. Add:
   - `DATABASE_URL` (production database)
   - `JWT_SECRET` (secure random string)
   - `JWT_REFRESH_SECRET` (secure random string)
   - Any deployment-specific secrets

## Caching

The pipeline caches:
- **pnpm store**: Speeds up dependency installation
- **Node modules**: Reduces download time

Cache is invalidated when `pnpm-lock.yaml` changes.

## Workflow File

Location: `.github/workflows/ci.yml`

To modify the pipeline:
1. Edit `.github/workflows/ci.yml`
2. Commit and push
3. GitHub Actions automatically picks up changes

## Adding New Jobs

To add a new job to the pipeline:

```yaml
new-job-name:
  name: Display Name
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
    - uses: pnpm/action-setup@v2
      with:
        version: 8
    - run: pnpm install --frozen-lockfile
    - run: your-command-here
```

## Best Practices

1. **Keep jobs independent**: Each job should be able to run standalone
2. **Use caching**: Speed up runs with dependency caching
3. **Fail fast**: Configure jobs to stop on first failure if needed
4. **Upload artifacts**: Save important files for debugging
5. **Use services**: Spin up databases/services as needed
6. **Parallelize**: Run independent jobs in parallel
7. **Test locally first**: Use same commands CI uses

## Troubleshooting

### Common Issues:

**1. Tests pass locally but fail in CI**
- Check Node.js version matches
- Verify environment variables
- Check for timezone/locale issues

**2. Database connection errors**
- Ensure PostgreSQL service is healthy
- Verify DATABASE_URL format
- Check migrations ran successfully

**3. Dependency installation fails**
- Clear cache: Delete old workflow runs
- Check pnpm-lock.yaml is committed
- Verify package.json syntax

**4. E2E tests timeout**
- Increase timeout in playwright.config.ts
- Check API server started correctly
- Verify browser installation

**5. Build failures**
- Check for TypeScript errors
- Verify all dependencies installed
- Look for missing environment variables

## GitHub Actions Limits

With **GitHub Pro**:
- ✅ 3,000 minutes/month
- ✅ 20 concurrent jobs
- ✅ Private repos included

This pipeline uses approximately:
- 4-5 minutes per run
- ~600 runs/month available (assumes 1 run per push)

More than sufficient for active development!

## Next Steps

### Current: Testing Only
The pipeline currently runs tests but doesn't deploy.

### Future: Add Deployment
When ready to deploy, add deployment jobs:

```yaml
deploy:
  name: Deploy to Production
  needs: [backend-tests, frontend-tests, e2e-tests, lint, build]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    # Add deployment steps here
```

Common deployment targets:
- Vercel (frontend)
- Railway/Render (backend + database)
- Fly.io (full-stack)
- Azure/AWS/GCP (enterprise)

See deployment documentation when ready to go live!
