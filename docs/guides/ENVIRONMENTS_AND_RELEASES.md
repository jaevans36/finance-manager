# Environments, Release & Deployment

**Created**: 2026-03-01
**Last Updated**: 2026-03-01
**Status**: Active
**Owner**: Finance Manager Engineering

> Single source of truth for environment management, database strategy, release process, and deployment procedures. All team members must follow these processes.

---

## Table of Contents

- [1. Environment Strategy](#1-environment-strategy)
- [2. Database Management](#2-database-management)
- [3. Configuration Per Environment](#3-configuration-per-environment)
- [4. Release Process](#4-release-process)
- [5. Deployment Procedures](#5-deployment-procedures)
- [6. Quality Gates](#6-quality-gates)
- [7. Rollback & Incident Response](#7-rollback--incident-response)
- [8. Security & Compliance](#8-security--compliance)
- [9. Monitoring & Observability](#9-monitoring--observability)
- [10. Backup & Disaster Recovery](#10-backup--disaster-recovery)
- [11. Go-Live Checklist — Production](#11-go-live-checklist--production)
- [Appendix A: Docker Compose Files](#appendix-a-docker-compose-files)
- [Appendix B: Script Reference](#appendix-b-script-reference)
- [Appendix C: Environment Variable Reference](#appendix-c-environment-variable-reference)

---

## 1. Environment Strategy

### Overview

Finance Manager follows a three-environment model that mirrors professional software delivery:

| Environment | Purpose | Audience | Data | URL |
|---|---|---|---|---|
| **Development (Dev)** | Active development, debugging, feature work | Developers | Synthetic + refreshed from UAT | `http://localhost:5173` |
| **UAT** | User acceptance testing, stakeholder demos, pre-release validation | Testers, product owner | Live test data (treated as semi-production) | `http://finance.local` (LAN) |
| **Production** | Live application for end users | All users | Real user data | `https://finance.yourdomain.com` (future) |

### Environment Lifecycle

```
                    ┌─────────────────────────────────────────┐
                    │              Developer Workflow           │
                    │                                          │
   feature branch ──┤  Dev Environment (localhost)             │
                    │  ├── Hot reload (Vite dev server)        │
                    │  ├── Swagger UI enabled                  │
                    │  ├── Debug logging                       │
                    │  ├── Dev database (refreshed from UAT)   │
                    │  └── Rate limiting disabled              │
                    └──────────────┬───────────────────────────┘
                                   │ PR → develop
                    ┌──────────────▼───────────────────────────┐
                    │              UAT Environment              │
                    │                                          │
   develop branch ──┤  LAN Deployment (finance.local)          │
                    │  ├── Production build (static files)     │
                    │  ├── Swagger UI disabled                 │
                    │  ├── Info-level logging                  │
                    │  ├── UAT database (persistent test data) │
                    │  ├── Rate limiting enabled               │
                    │  └── Caddy reverse proxy                 │
                    └──────────────┬───────────────────────────┘
                                   │ Release: develop → main
                    ┌──────────────▼───────────────────────────┐
                    │              Production Environment       │
                    │                                          │ 
   main branch ─────┤  Public Deployment (future)              │
                    │  ├── HTTPS enforced                      │
                    │  ├── Swagger UI disabled                 │
                    │  ├── Warning-level logging               │
                    │  ├── Production database (encrypted)     │
                    │  ├── Rate limiting + WAF                 │
                    │  └── Full monitoring & alerting          │
                    └──────────────────────────────────────────┘
```

### Branch-to-Environment Mapping

| Branch | Deploys To | Trigger | Method |
|---|---|---|---|
| `phase-XX/*` | Dev (automatic via `dotnet watch` / `pnpm dev`) | On save | Hot reload |
| `develop` | UAT (manual deploy via script) | After PR merge | `scripts/deploy-uat.ps1` |
| `main` | Production | After release merge + tag | CI/CD pipeline (future) |

### Environment Parity

All environments use the **same** application binaries, database schema, and migration history. The only differences are:

- **Configuration** (connection strings, secrets, feature flags)
- **Data** (synthetic vs semi-production vs production)
- **Infrastructure** (localhost vs LAN vs cloud)

This ensures that what passes UAT will behave identically in production.

---

## 2. Database Management

### Database Instances

| Database | Container Name | Port | Database Name | Purpose |
|---|---|---|---|---|
| **Dev** | `finance-manager-db` | 5432 | `finance_manager_dev` | Development work — safe to destroy and rebuild |
| **Test** | `finance-manager-db` | 5432 | `finance_manager_test` | Automated test suites (CI, integration tests) |
| **UAT** | `finance-manager-db` | 5432 | `finance_manager_uat` | User acceptance testing — persistent data |

> **Note**: All three databases run on the same PostgreSQL container in the current single-host setup. In production, each environment will have its own isolated database instance.

### Data Flow

```
┌───────────────────┐     Nightly refresh      ┌───────────────────┐
│   UAT Database    │ ──────────────────────── │   Dev Database     │
│   (source of      │     OR on-demand via     │   (developer's     │
│    truth for      │     scripts/sync-db.ps1  │    working copy)   │
│    test data)     │                          │                    │
└───────────────────┘                          └───────────────────┘
         │                                              │
         │  Schema always matches                       │  Schema always matches
         │  via EF Core migrations                      │  via EF Core migrations
         │                                              │
         ▼                                              ▼
┌───────────────────┐                          ┌───────────────────┐
│   Production DB   │                          │   Test Database    │
│   (future — own   │                          │   (ephemeral —     │
│    instance)      │                          │    reset per run)  │
└───────────────────┘                          └───────────────────┘
```

### Database Refresh Strategy

**Dev ← UAT refresh** ensures developers work against realistic data that reflects the current state of acceptance testing. This catches data-dependent bugs early.

#### Nightly Automatic Refresh (Scheduled Task)

A Windows Scheduled Task runs at **02:00 daily** (configurable):

1. Dump the UAT database (`finance_manager_uat`)
2. Drop and recreate the Dev database (`finance_manager_dev`)
3. Restore the UAT dump into Dev
4. Log the result to `logs/db-sync.log`

Script: `scripts/sync-db.ps1`

#### On-Demand Refresh

Developers can trigger a manual refresh at any time:

```powershell
.\scripts\sync-db.ps1
```

With the `-SkipConfirmation` flag for scripted use:

```powershell
.\scripts\sync-db.ps1 -SkipConfirmation
```

#### Data Sanitisation

When refreshing Dev from UAT, the sync script applies sanitisation:

- **Passwords**: Not sanitised (UAT passwords are already test passwords, not real user credentials)
- **PII**: In the current single-user context, no sanitisation is needed
- **Future**: When production exists, a separate `sync-from-prod.ps1` will mask PII, randomise email addresses, and strip sensitive financial data before copying to lower environments

### Migration Management

All environments share the same EF Core migration history:

```powershell
# Apply pending migrations to any environment
$env:ConnectionStrings__DefaultConnection = "<target-connection-string>"
cd apps/finance-api
dotnet ef database update
```

**Rules**:
1. Migrations are **always forward-only** in UAT and Production
2. Never use `dotnet ef database drop` on UAT or Production
3. If a migration needs reverting, create a new migration that undoes the changes
4. Test all migrations against the Dev database before applying to UAT
5. Every migration must have a corresponding rollback migration documented

### Database Credentials

| Environment | Username | Password | Management |
|---|---|---|---|
| Dev | `postgres` | `password` | Hardcoded in `appsettings.Development.json` (dev convenience) |
| Test | `postgres` | `password` | Environment variable in test scripts |
| UAT | `financemanager_uat` | Generated strong password | `appsettings.Uat.json` (git-ignored) or environment variable |
| Production | `financemanager_prod` | Vault/secret manager | Environment variable only — never in source control |

---

## 3. Configuration Per Environment

### ASP.NET Core Configuration Hierarchy

The .NET API uses the standard configuration cascade:

```
appsettings.json                  ← Base (shared) settings
  └── appsettings.Development.json  ← Dev overrides (committed)
  └── appsettings.Uat.json          ← UAT overrides (git-ignored)
  └── appsettings.Production.json   ← Production overrides (git-ignored)
  └── Environment Variables          ← Highest priority (runtime)
```

### Configuration Matrix

| Setting | Dev | UAT | Production |
|---|---|---|---|
| **Database** | `finance_manager_dev` | `finance_manager_uat` | `finance_manager_prod` |
| **JWT Secret** | Placeholder (dev convenience) | Strong generated secret | Vault-managed secret |
| **Rate Limiting** | Disabled | Enabled (60/min) | Enabled (60/min) + WAF |
| **Swagger** | Enabled | Disabled | Disabled |
| **CORS Origins** | `http://localhost:5173` | `http://finance.local` | `https://finance.yourdomain.com` |
| **Log Level** | Information + EF queries | Information | Warning |
| **HTTPS Required** | No | No (LAN) | Yes |
| **ASPNETCORE_ENVIRONMENT** | `Development` | `Uat` | `Production` |

### UAT Configuration

Create `apps/finance-api/appsettings.Uat.json` (add to `.gitignore`):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=finance_manager_uat;Username=financemanager_uat;Password=<strong-password>"
  },
  "Jwt": {
    "Secret": "<generated-64-byte-base64-secret>"
  },
  "RateLimit": {
    "Enabled": true,
    "MaxRequestsPerMinute": 60,
    "MaxRequestsPerHour": 1000
  },
  "Cors": {
    "AllowedOrigins": ["http://finance.local"]
  }
}
```

### Frontend Environment Files

| File | Environment | Committed |
|---|---|---|
| `.env.development` | Dev (Vite dev server) | Yes |
| `.env.uat` | UAT build | Yes |
| `.env.production` | Production build | Git-ignored (secrets may differ) |

---

## 4. Release Process

### Release Types

| Type | Trigger | Flow | Version Bump |
|---|---|---|---|
| **Feature Release** | Phase(s) completed, UAT passed | `develop` → `main` | MINOR (0.X.0) |
| **Bug Fix Release** | Critical bug in UAT/Production | `hotfix/*` → `main` + `develop` | PATCH (0.0.X) |
| **Breaking Release** | API contract changes, schema overhaul | `develop` → `main` | MAJOR (X.0.0) |

### Release Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE: Development                                                 │
│                                                                     │
│  1. Developer creates phase branch from develop                     │
│  2. Work committed with conventional commit messages                │
│  3. All tests pass locally (unit + integration + E2E)               │
│  4. PR opened → develop (max 500 LOC per PR)                       │
│  5. Code review (if team >1, otherwise self-review checklist)       │
│  6. PR squash-merged into develop                                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│  GATE: UAT Deployment                                               │
│                                                                     │
│  1. Deploy develop to UAT environment (scripts/deploy-uat.ps1)     │
│  2. Run smoke tests on UAT (manual or scripted)                    │
│  3. Stakeholder / product owner performs acceptance testing         │
│  4. Regression testing — verify existing features still work        │
│  5. Sign-off recorded (commit message or issue comment)            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ UAT sign-off ✓
┌──────────────────────────▼──────────────────────────────────────────┐
│  GATE: Release Preparation                                          │
│                                                                     │
│  1. Merge develop → main                                           │
│  2. release-please automatically creates a Release PR with:        │
│     - Version bump (based on conventional commits)                 │
│     - CHANGELOG.md update                                           │
│     - Synced version in package.json, VERSION.json, .csproj        │
│  3. Review Release PR — edit changelog/version if needed           │
│  4. Merge Release PR → creates GitHub Release + git tag            │
│  See: release-please-config.json, .release-please-manifest.json    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│  GATE: Production Deployment                                        │
│                                                                     │
│  1. Merge develop → main                                           │
│  2. release-please creates GitHub Release + git tag automatically  │
│  3. Deploy to production (manual now, CI/CD future)                │
│  4. Run production smoke tests                                      │
│  5. Monitor for 30 minutes post-deploy                              │
│  6. Mark release as stable / rollback if issues found              │
└─────────────────────────────────────────────────────────────────────┘
```

### Release Checklist

Before every release, the following must be verified:

#### Pre-Release (Developer)

- [ ] All phase tasks marked complete in `specs/001-todo-app/tasks.md`
- [ ] All unit tests pass (`dotnet test` + `pnpm test`)
- [ ] All integration tests pass
- [ ] All E2E tests pass (`pnpm test:e2e`)
- [ ] No TypeScript compilation errors
- [ ] No ESLint errors or warnings
- [ ] No `any` types introduced
- [ ] Dependency audit clean (`pnpm audit`, `dotnet list package --vulnerable`)
- [ ] CHANGELOG.md updated with user-facing changes (or rely on release-please auto-generation)
- [ ] Phase completion documentation written (`docs/phases/`)

#### Pre-Release (UAT)

- [ ] Deploy build succeeds on UAT
- [ ] Smoke test checklist passed (see below)
- [ ] Regression test — all critical paths verified
- [ ] No new console errors in browser DevTools
- [ ] Performance acceptable (no visible degradation)
- [ ] Stakeholder sign-off recorded

#### Smoke Test Checklist

| # | Test | Expected Result |
|---|---|---|
| 1 | Navigate to home page | Dashboard loads, no errors |
| 2 | Register a new user | Registration succeeds, redirected to app |
| 3 | Log in with existing user | Login succeeds, tasks displayed |
| 4 | Create a new task | Task appears in list immediately |
| 5 | Edit a task (title, priority, due date) | Changes saved and reflected |
| 6 | Complete a task | Status updates, statistics reflect change |
| 7 | Create a subtask | Subtask appears under parent |
| 8 | Navigate to calendar view | Calendar renders with tasks |
| 9 | Navigate to weekly progress | Charts render with data |
| 10 | Log out and log back in | Session cleared, re-authentication works |

### Conventional Commits

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add task search functionality (T150)
fix: correct date picker timezone offset
perf: optimise task list rendering for 500+ items
docs: update API documentation for events endpoints
test: add E2E tests for calendar view
chore: bump version to v0.17.0
refactor: extract task validation into shared module
```

### Version Numbering

Follow [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH

1.0.0  — First production release
0.17.0 — 17th feature release (pre-production)
0.17.1 — Patch fix to 0.17.0
```

**When to bump**:

| Change | Bump | Example |
|---|---|---|
| New feature, backward compatible | MINOR | New page, new API endpoint |
| Bug fix only | PATCH | Fix login error, correct calculation |
| Breaking API change | MAJOR | Removed endpoint, changed response schema |
| Database migration (additive) | MINOR | New column, new table |
| Database migration (destructive) | MAJOR | Removed column, renamed table |

---

## 5. Deployment Procedures

### Development Environment (Dev)

**Start**:
```powershell
.\scripts\start-dev.ps1
```

This starts Docker (PostgreSQL), the .NET API (`dotnet watch run`), and the Vite dev server.

**Reset database**:
```powershell
.\scripts\reset-db.ps1          # Dev database
.\scripts\reset-test-db.ps1     # Test database
```

**Sync from UAT**:
```powershell
.\scripts\sync-db.ps1           # Refresh Dev from UAT
```

### UAT Environment

**Prerequisites**: See [LAN Deployment Guide](LAN_DEPLOYMENT.md) for one-time setup (hostname, Caddy, firewall).

**Deploy to UAT**:
```powershell
.\scripts\deploy-uat.ps1
```

This script:
1. Pulls latest `develop` branch
2. Runs the full test suite
3. Builds the .NET API in Release mode
4. Builds the React frontend for production
5. Applies any pending EF Core migrations to the UAT database
6. Restarts the API and Caddy services
7. Runs a smoke test (health check endpoint)
8. Logs the deployment to `logs/deployments.log`

**Rollback UAT**:
```powershell
.\scripts\deploy-uat.ps1 -Rollback
```

This restores the previous API build and frontend bundle from `deploy/backups/`.

### Production Environment (Future)

See [Section 11: Go-Live Checklist](#11-go-live-checklist--production) for the full production deployment plan. Production deployment will be automated via CI/CD once the infrastructure is in place.

---

## 6. Quality Gates

Every change must pass through quality gates before reaching the next environment:

### Gate 1: PR to Develop (Code Quality)

| Check | Tool | Required |
|---|---|---|
| TypeScript compilation | `tsc --noEmit` | ✅ Zero errors |
| ESLint | `eslint .` | ✅ Zero errors, zero warnings |
| Unit tests (frontend) | `pnpm test` | ✅ 100% pass |
| Unit tests (backend) | `dotnet test` (UnitTests) | ✅ 100% pass |
| Integration tests | `dotnet test` (IntegrationTests) | ✅ 100% pass |
| E2E tests | `pnpm test:e2e` | ✅ 100% pass |
| Code review | Manual / self-review checklist | ✅ Approved |
| PR size | Convention | ✅ ≤500 LOC |
| Conventional commits | Commit message format | ✅ Valid |
| No `any` types | ESLint + manual review | ✅ None |
| Dependency audit | `pnpm audit` | ✅ No critical/high |

### Gate 2: UAT Deployment (Functional Quality)

| Check | Method | Required |
|---|---|---|
| Build succeeds | `deploy-uat.ps1` | ✅ Zero errors |
| Migrations apply cleanly | EF Core `database update` | ✅ No errors |
| Health check passes | `GET /api/version/current` | ✅ 200 OK |
| Smoke tests pass | Manual checklist (10 items) | ✅ All pass |
| Regression testing | Manual critical path walkthrough | ✅ No regressions |
| Stakeholder sign-off | Written confirmation | ✅ Approved |

### Gate 3: Production Deployment (Operational Quality)

| Check | Method | Required |
|---|---|---|
| UAT sign-off complete | Documented approval | ✅ Yes |
| Full test suite on UAT database | `run-tests.ps1` | ✅ 100% pass |
| Security scan | `pnpm audit` + `dotnet list package --vulnerable` | ✅ No critical/high |
| Version files updated | VERSION.json, CHANGELOG.md, package.json, .csproj | ✅ Consistent |
| Backup verified | UAT/Prod database backup tested | ✅ Restoreable |
| Rollback plan documented | In deployment log | ✅ Yes |

---

## 7. Rollback & Incident Response

### Rollback Procedures

#### UAT Rollback

```powershell
# Automated rollback to previous deployment
.\scripts\deploy-uat.ps1 -Rollback
```

The deploy script maintains one previous version in `deploy/backups/`:
- `deploy/backups/api/` — Previous API published build
- `deploy/backups/web/` — Previous frontend dist bundle
- `deploy/backups/migration-state.txt` — EF Core migration name before deployment

**Database rollback** (if migration caused issues):
```powershell
cd apps/finance-api
$env:ConnectionStrings__DefaultConnection = "<uat-connection-string>"
dotnet ef database update <PreviousMigrationName>
```

#### Production Rollback (Future)

1. Revert to previous Docker image tag
2. Run health checks
3. If database migration was applied, execute documented rollback migration
4. Notify stakeholders

### Incident Severity Levels

| Level | Definition | Response Time | Example |
|---|---|---|---|
| **P1 — Critical** | Application completely down or data loss | <30 minutes | Database corruption, authentication broken |
| **P2 — High** | Major feature broken, no workaround | <2 hours | Cannot create tasks, incorrect calculations |
| **P3 — Medium** | Feature degraded, workaround exists | <1 business day | Slow page load, UI glitch |
| **P4 — Low** | Minor issue, cosmetic | Next release | Typo, alignment issue |

### Incident Response Flow

```
1. Identify severity level
2. If P1/P2: Immediately rollback if safe to do so
3. Create hotfix branch from main (for production) or develop (for UAT)
4. Fix, test, deploy
5. Write post-incident report (what happened, root cause, prevention)
```

---

## 8. Security & Compliance

### Security by Environment

| Area | Dev | UAT | Production |
|---|---|---|---|
| **Transport** | HTTP | HTTP (LAN only) | HTTPS (TLS 1.2+) |
| **JWT Secret** | Placeholder | Strong generated | Vault-managed |
| **Database Credentials** | Hardcoded (convenience) | Strong, git-ignored | Environment variable only |
| **CORS** | `localhost:5173` | `finance.local` | Production domain only |
| **Swagger** | Enabled | Disabled | Disabled |
| **Rate Limiting** | Disabled | Enabled | Enabled + WAF |
| **Logging** | Verbose (incl. EF queries) | Standard | Sanitised (no PII) |
| **Network Access** | Localhost only | LAN only (firewall) | Public (behind proxy) |

### Security Checklist for UAT

- [ ] JWT secret is not the default placeholder
- [ ] Database password is not `password`
- [ ] Swagger UI is not accessible
- [ ] Firewall restricts access to LAN only
- [ ] No secrets committed to source control
- [ ] Rate limiting is active

### Security Checklist for Production

All UAT items, plus:

- [ ] HTTPS enforced (HSTS header present)
- [ ] JWT issuer/audience validation enabled
- [ ] Account lockout implemented
- [ ] CSP headers hardened
- [ ] Dependency vulnerability scan clean
- [ ] Database encrypted at rest
- [ ] Logs sanitised (no PII, no tokens)
- [ ] TLS certificate auto-renewal verified

---

## 9. Monitoring & Observability

### Current State (Dev + UAT)

| Component | Tool | Location |
|---|---|---|
| Application logs | Serilog → file | `apps/finance-api/logs/` |
| Log viewing | `scripts/view-logs.ps1` | Console |
| Error logs | `scripts/view-logs.ps1 -LogType error` | Console |
| Database health | Docker healthcheck | `docker ps` |

### Production Target

| Component | Tool | Retention |
|---|---|---|
| Application logs | Serilog → Seq / Loki | 30 days |
| Access logs | Caddy / nginx | 90 days |
| Audit logs | Database table | Indefinite |
| Metrics | Grafana + Prometheus | 90 days |
| Uptime monitoring | UptimeRobot / Healthchecks.io | — |

### Key Metrics

| Metric | Target | Alert Threshold |
|---|---|---|
| API response time (p95) | <200ms | >500ms for 5 min |
| Error rate | <1% | >5% for 2 min |
| Uptime | 99.5% | Any downtime |
| Database connections | <50% pool | >80% pool |

---

## 10. Backup & Disaster Recovery

### Backup Strategy

| Environment | Type | Frequency | Retention | Location |
|---|---|---|---|---|
| **Dev** | No backup (refreshed from UAT) | — | — | — |
| **Test** | No backup (ephemeral) | — | — | — |
| **UAT** | Full dump | Daily at 02:00 | 7 days | `backups/uat/` (local) |
| **Production** | Full dump + WAL | Daily + continuous | 30 days | Off-site (S3/B2) |

### UAT Backup Script

```powershell
# Run manually or via scheduled task
.\scripts\backup-uat-db.ps1
```

### Recovery Targets

| Environment | RTO | RPO |
|---|---|---|
| Dev | Not applicable (rebuild from UAT) | Not applicable |
| UAT | <1 hour | <24 hours |
| Production | <1 hour | <1 hour (with WAL) |

### Recovery Procedure

1. Ensure Docker is running
2. Restore from latest backup:
   ```powershell
   docker exec -i finance-manager-db psql -U postgres -c "DROP DATABASE IF EXISTS finance_manager_uat;"
   docker exec -i finance-manager-db psql -U postgres -c "CREATE DATABASE finance_manager_uat;"
   docker exec -i finance-manager-db psql -U postgres finance_manager_uat < backups/uat/latest.sql
   ```
3. Verify: `dotnet ef database update` (should report "No migrations to apply")
4. Restart services

---

## 11. Go-Live Checklist — Production

> This section covers the future production deployment. It is not currently active.

### Infrastructure (Phase 25)

- [ ] Hosting provisioned (VPS / cloud)
- [ ] Domain purchased and DNS configured
- [ ] TLS certificates (Let's Encrypt via Caddy)
- [ ] Dockerfiles created (API + frontend)
- [ ] `docker-compose.prod.yml` created
- [ ] Health check endpoints (`/health`, `/health/ready`)
- [ ] CI/CD pipeline (GitHub Actions)

### Security Hardening (Phase 25)

- [ ] JWT secret in vault/environment variable
- [ ] JWT issuer/audience validation enabled
- [ ] `RequireHttpsMetadata = true`
- [ ] Account lockout (5 failures → 15 min lock)
- [ ] CSRF protection
- [ ] CSP headers hardened
- [ ] Swagger disabled in production
- [ ] Log sanitisation (no PII, no tokens)
- [ ] Dependency scan clean

### Operational Readiness

- [ ] Database backups automated + tested restore
- [ ] Centralised logging configured
- [ ] Monitoring and alerting active
- [ ] Runbook written
- [ ] Disaster recovery plan tested
- [ ] Load test passed (100 concurrent users, <500ms p95)

### Launch Day

- [ ] DNS cutover
- [ ] TLS verified (SSL Labs A+)
- [ ] HTTP → HTTPS redirect working
- [ ] Smoke tests pass on production URL
- [ ] Monitoring dashboards green
- [ ] First backup completed
- [ ] Stakeholder sign-off

---

## Appendix A: Docker Compose Files

### Development (`docker-compose.yml`)

Current — single PostgreSQL container serving Dev, Test, and UAT databases:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: finance-manager-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: finance_manager_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
```

> The UAT and Test databases are created automatically by EF Core / scripts — only the default `finance_manager_dev` database is created by Docker Compose.

### Production (`docker-compose.prod.yml`) — Future

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: finance-manager-db-prod
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: finance_manager_prod
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./apps/finance-api
      dockerfile: Dockerfile
    container_name: finance-manager-api
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=finance_manager_prod;Username=${DB_USER};Password=${DB_PASSWORD}
      - Jwt__Secret=${JWT_SECRET}
    ports:
      - "127.0.0.1:5000:5000"

  caddy:
    image: caddy:2-alpine
    container_name: finance-manager-proxy
    restart: unless-stopped
    depends_on:
      - api
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile.prod:/etc/caddy/Caddyfile
      - ./apps/web/dist:/srv
      - caddy_data:/data

volumes:
  postgres_data:
  caddy_data:
```

---

## Appendix B: Script Reference

| Script | Purpose | Target |
|---|---|---|
| `scripts/start-dev.ps1` | Start Docker + API + Vite dev server | Dev |
| `scripts/stop-dev.ps1` | Stop all development services | Dev |
| `scripts/restart-dev.ps1` | Quick restart of dev servers | Dev |
| `scripts/reset-db.ps1` | Drop and recreate Dev database | Dev |
| `scripts/reset-test-db.ps1` | Drop and recreate Test database | Test |
| `scripts/sync-db.ps1` | Refresh Dev database from UAT | Dev ← UAT |
| `scripts/deploy-uat.ps1` | Build and deploy to UAT environment | UAT |
| `scripts/backup-uat-db.ps1` | Backup UAT database | UAT |
| `scripts/run-tests.ps1` | Run all test suites | Dev/CI |
| `scripts/view-logs.ps1` | View application logs | Dev/UAT |

---

## Appendix C: Environment Variable Reference

| Variable | Required In | Description |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | UAT, Prod | Set to `Uat` or `Production` |
| `ConnectionStrings__DefaultConnection` | UAT, Prod | PostgreSQL connection string |
| `Jwt__Secret` | UAT, Prod | JWT signing key (min 64 bytes, base64) |
| `Cors__AllowedOrigins__0` | UAT, Prod | First allowed CORS origin |

---

## Document History

| Date | Change | Author |
|---|---|---|
| 2026-03-01 | Initial version — consolidated from LAN guide and production spec | AI / Developer |
