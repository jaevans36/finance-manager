# Production Deployment Specification

**Created**: 2026-02-14
**Status**: Draft
**Priority**: P2
**Phase**: 25
**Dependencies**: LAN deployment operational, all application features stable

---

## Overview

This specification defines the requirements and approach for deploying Finance Manager as a publicly accessible, production-grade application. It covers security hardening, infrastructure, CI/CD, monitoring, and operational readiness.

The application is currently deployed on a local network only (see `docs/guides/LAN_DEPLOYMENT.md`). This phase transitions from LAN → production with full security, automation, and observability.

---

## Goals

1. **Secure**: HTTPS everywhere, hardened authentication, no exposed secrets
2. **Reliable**: Automated backups, health monitoring, disaster recovery plan
3. **Automated**: CI/CD pipeline from commit to deployment with no manual steps
4. **Observable**: Centralised logging, performance monitoring, alerting
5. **Documented**: Runbook, DR plan, security audit trail

---

## Architecture — Production

```
┌─────────────────────────────────────────────────────────────┐
│  Internet                                                    │
└──────────────┬──────────────────────────────────────────────┘
               │ :443 (HTTPS)
┌──────────────▼──────────────────────────────────────────────┐
│  Reverse Proxy / Load Balancer                               │
│  (Caddy / nginx / cloud LB)                                  │
│  ├── TLS termination (Let's Encrypt)                         │
│  ├── HTTP → HTTPS redirect                                   │
│  ├── Rate limiting (L7)                                      │
│  └── Static file serving (React SPA)                         │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│  .NET API Container(s)                                       │
│  ├── JWT authentication (validated issuer/audience)           │
│  ├── CORS (production domain only)                           │
│  ├── Rate limiting (application-level)                       │
│  ├── Account lockout                                         │
│  ├── Health check endpoints (/health, /health/ready)         │
│  └── Structured logging → centralised log service            │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│  PostgreSQL (managed or containerised)                        │
│  ├── Encrypted at rest                                       │
│  ├── Encrypted in transit (SSL)                              │
│  ├── Connection pooling                                      │
│  ├── Daily automated backups                                 │
│  └── Point-in-time recovery (WAL archiving)                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Security Requirements

### Authentication & Authorisation

| Requirement | Description | Priority |
|---|---|---|
| JWT secret management | Stored in environment variable or secret manager, not source code | Critical |
| Issuer/audience validation | `ValidateIssuer = true`, `ValidateAudience = true` | Critical |
| HTTPS metadata | `RequireHttpsMetadata = true` | Critical |
| Account lockout | 5 failed attempts → 15 min lockout | High |
| Password policy | Minimum 10 characters, complexity requirements | High |
| Token refresh | Implement refresh token rotation | Medium |
| MFA | Time-based OTP (optional, user-configurable) | Low (future) |

### Transport Security

| Requirement | Description | Priority |
|---|---|---|
| TLS 1.2+ | All traffic encrypted, no fallback to TLS 1.0/1.1 | Critical |
| HSTS | `Strict-Transport-Security` header with 1-year max-age | Critical |
| Certificate auto-renewal | Let's Encrypt with automated renewal (Caddy handles this) | Critical |
| HTTP redirect | All HTTP requests redirected to HTTPS | Critical |

### Headers & CORS

| Requirement | Description | Priority |
|---|---|---|
| CSP | Strict Content-Security-Policy (no `unsafe-inline` where possible) | High |
| CORS | Production domain(s) only, no wildcards | Critical |
| X-Frame-Options | `DENY` or `SAMEORIGIN` | High |
| X-Content-Type-Options | `nosniff` | High |
| Referrer-Policy | `strict-origin-when-cross-origin` | Medium |

### Data Protection

| Requirement | Description | Priority |
|---|---|---|
| Secrets in env vars | No secrets in source code, config files, or Docker images | Critical |
| Database encryption | Encryption at rest for PostgreSQL | High |
| Log sanitisation | Passwords, tokens, PII masked in all logs | High |
| Dependency scanning | Automated vulnerability checks on every PR | High |

---

## Infrastructure

### Hosting Options

| Option | Pros | Cons | Cost Estimate |
|---|---|---|---|
| **VPS (Hetzner, DigitalOcean)** | Full control, simple, affordable | Manual management | £5-20/month |
| **Docker on VPS** | Reproducible, easy rollback | Docker overhead | £10-25/month |
| **Cloud PaaS (Azure App Service)** | Managed, scaling, CI/CD integration | Higher cost, vendor lock-in | £30-80/month |
| **Self-hosted (home server)** | No recurring cost, full control | Uptime, bandwidth, security burden | £0 (hardware already owned) |

**Recommended**: Docker on VPS (e.g., Hetzner CX22) — best balance of control, cost, and simplicity for a personal/small-team application.

### Container Strategy

```dockerfile
# API — Multi-stage build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 5000
ENTRYPOINT ["dotnet", "FinanceApi.dll"]
```

```dockerfile
# Frontend — Static build served by nginx
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter @finance-manager/web build

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

---

## CI/CD Pipeline

### Workflow Overview

```
Push to branch → Lint + Unit Tests → Integration Tests → E2E Tests
                                                              │
PR merged to develop ────────────────────────────────────────►│
                                                              │
                                          Build Docker Images │
                                          Push to GHCR        │
                                          Deploy to Staging    │
                                                              │
Release (develop → main) ───────────────► Deploy to Production│
                                          Tag version          │
                                          Update CHANGELOG     │
```

### GitHub Actions Workflows

1. **`ci.yml`** — Runs on every PR
   - Lint (ESLint, StyleCop)
   - Unit tests (Jest, xUnit)
   - Integration tests (xUnit + test database)
   - E2E tests (Playwright in Docker)
   - Dependency vulnerability scan

2. **`build.yml`** — Runs on merge to `develop`
   - Build Docker images (API + frontend)
   - Push to GitHub Container Registry
   - Deploy to staging environment

3. **`release.yml`** — Runs on merge to `main`
   - Deploy to production
   - Create git tag
   - Update CHANGELOG
   - Notify via webhook

---

## Monitoring & Observability

### Logging

| Component | Tool | Retention |
|---|---|---|
| Application logs | Serilog → Seq / Loki | 30 days |
| Access logs | Caddy / nginx | 90 days |
| Audit logs | Database | Indefinite |

### Metrics

| Metric | Target | Alert Threshold |
|---|---|---|
| API response time (p95) | <200ms | >500ms for 5 min |
| Error rate | <1% | >5% for 2 min |
| CPU usage | <60% avg | >85% for 10 min |
| Memory usage | <70% avg | >90% for 5 min |
| Database connections | <50% pool | >80% pool |
| Uptime | 99.5% | Any downtime |

### Health Checks

```
GET /health        → 200 OK (basic liveness)
GET /health/ready  → 200 OK (database connected, services ready)
```

---

## Backup & Disaster Recovery

### Backup Strategy

| Type | Frequency | Retention | Storage |
|---|---|---|---|
| Full database dump | Daily at 02:00 UTC | 30 days | Off-site (S3/B2) |
| WAL archiving | Continuous | 7 days | Off-site |
| Application config | On change (git) | Indefinite | GitHub |
| Docker volumes | Weekly | 4 weeks | Off-site |

### Recovery Targets

| Metric | Target |
|---|---|
| Recovery Time Objective (RTO) | <1 hour |
| Recovery Point Objective (RPO) | <1 hour (WAL), <24h (full dump) |

### Recovery Procedure

1. Provision new server / restore from snapshot
2. Pull latest Docker images from GHCR
3. Restore PostgreSQL from latest backup
4. Apply any WAL segments since last backup
5. Start services via `docker-compose.prod.yml`
6. Verify health checks pass
7. Update DNS to point to new server (if applicable)
8. Run smoke tests

---

## Go-Live Checklist

### Pre-Launch

- [ ] Security audit complete — no critical/high findings
- [ ] All tests passing (unit, integration, E2E)
- [ ] Load test completed (100 concurrent users, <500ms p95)
- [ ] Dependency vulnerability scan clean
- [ ] JWT secret rotated from any test/dev values
- [ ] Database credentials are unique and strong
- [ ] HTTPS configured and verified (SSL Labs A+ rating)
- [ ] Backup and restore procedure tested
- [ ] Monitoring and alerting configured and tested
- [ ] Runbook written and reviewed
- [ ] DR plan written and tested
- [ ] Privacy policy published

### Launch Day

- [ ] DNS records pointed to production server
- [ ] SSL certificate valid and auto-renewing
- [ ] HTTP → HTTPS redirect working
- [ ] Smoke tests pass on production URL
- [ ] Monitoring dashboards showing green
- [ ] First backup completed successfully
- [ ] Announce to users

### Post-Launch (Week 1)

- [ ] Monitor error rates and response times daily
- [ ] Verify backup restoration works
- [ ] Address any user-reported issues
- [ ] Review access logs for suspicious activity
- [ ] Confirm auto-renewal of TLS certificate will work

---

## User Stories

### US-25.1: Secure Public Access (P1)

**As a** user, **I want** to access Finance Manager securely over the internet **so that** I can manage my tasks and finances from anywhere.

**Acceptance Criteria**:
1. **Given** a user navigates to the production URL, **When** the page loads, **Then** the connection is encrypted (HTTPS, TLS 1.2+)
2. **Given** a user tries HTTP, **When** the request is made, **Then** they are redirected to HTTPS
3. **Given** an attacker attempts brute-force login, **When** 5 failures occur, **Then** the account is locked for 15 minutes
4. **Given** the JWT secret, **When** it is checked, **Then** it is not present in any source code or config file
5. **Given** any API response, **When** headers are inspected, **Then** security headers (HSTS, CSP, X-Frame-Options) are present

### US-25.2: Automated Deployment (P2)

**As a** developer, **I want** changes merged to `main` to be automatically deployed **so that** releases are consistent and require no manual intervention.

**Acceptance Criteria**:
1. **Given** a PR is opened, **When** CI runs, **Then** all tests pass before merge is allowed
2. **Given** a merge to `develop`, **When** the pipeline completes, **Then** Docker images are built and pushed to registry
3. **Given** a release merge to `main`, **When** the pipeline completes, **Then** production is updated within 10 minutes
4. **Given** a failed deployment, **When** health checks fail, **Then** automatic rollback to the previous version occurs
5. **Given** a new version, **When** deployed, **Then** a git tag and CHANGELOG entry are created automatically

### US-25.3: Operational Resilience (P2)

**As an** operator, **I want** monitoring, backups, and recovery procedures **so that** I can respond to incidents quickly and prevent data loss.

**Acceptance Criteria**:
1. **Given** an API error spike, **When** the error rate exceeds 5%, **Then** an alert is sent within 2 minutes
2. **Given** a database failure, **When** recovery is initiated, **Then** the system is restored within 1 hour (RTO)
3. **Given** any point in time, **When** data loss is assessed, **Then** no more than 1 hour of data is lost (RPO)
4. **Given** a new team member, **When** they read the runbook, **Then** they can perform startup, shutdown, and rollback procedures independently
5. **Given** a complete server failure, **When** the DR plan is executed, **Then** the system is operational on a new server within the RTO

---

## Future Considerations

- **CDN**: CloudFlare or similar for static asset caching and DDoS protection
- **Multi-region**: Database read replicas for geographic distribution
- **Kubernetes**: If scaling beyond a single server becomes necessary
- **OAuth/OIDC**: Replace custom JWT with an identity provider (Auth0, Keycloak)
- **Feature flags**: Gradual rollout of new features without full deployments
