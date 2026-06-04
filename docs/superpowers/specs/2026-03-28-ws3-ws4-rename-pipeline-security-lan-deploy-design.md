# Design: WS3 Rename + Pipeline Hardening + Security Audit + LAN Deployment

**Date:** 2026-03-28
**Branch:** `develop`
**Approach:** Option A — Rename → Security → Deploy (sequential)

---

## Overview

This document covers four sequential work streams that take Life Manager from its current state (MVP-complete on `develop`) to a hardened, correctly-named application running on the LAN at `https://life-manager`.

**Sequence:**
1. WS3 — Rename remaining `finance-*` references to `life-*`
2. Pipeline hardening — Fix integration tests, create production Docker Compose, validate CI
3. Security audit — Concrete pass/fail checklist across auth and infrastructure
4. WS4 LAN deployment — Self-hosted runner, nginx, mkcert, hosts entries

**Out of scope (future):**
- OAuth / Google Sign-In (separate spec, required before public web hosting)
- Public web hosting
- GitHub repo rename (`jaevans36/finance-manager` → retains redirects until public rebrand)

---

## Section 1: WS3 Rename

### What changes

| Current | Renamed to |
|---|---|
| `apps/finance-api/` | `apps/life-api/` |
| `apps/finance-api-tests/` | `apps/life-api-tests/` |
| `FinanceApi.csproj` | `LifeApi.csproj` |
| `FinanceApi.UnitTests.csproj` | `LifeApi.UnitTests.csproj` |
| `FinanceApi.IntegrationTests.csproj` | `LifeApi.IntegrationTests.csproj` |
| C# root namespace `FinanceApi` | `LifeApi` |
| DB name `finance_manager_dev` | `life_manager_dev` |
| DB name `finance_manager_uat` | `life_manager_uat` |
| `appsettings*.json` connection strings | Updated to match new DB names |
| `docker-compose.yml` DB name | Updated to `life_manager_dev` |
| CI workflow `.csproj` paths | Updated to match new folder/file names |

### What does not change

- `@life-manager/ui`, `@life-manager/schema` — already correctly named
- Root `package.json` name (`life-manager`) — already correct
- `apps/web/` — no rename needed
- GitHub repo name (`jaevans36/finance-manager`) — deferred until public rebrand

### Approach

1. Rename folders using `git mv` to preserve history
2. Update all `.csproj` references, namespace declarations, and `using` statements
3. Update `appsettings*.json` and `docker-compose.yml` connection strings
4. Update `.github/workflows/ci.yml` and `nightly.yml` paths
5. Run `dotnet build` and `pnpm test` locally to verify nothing is broken
6. Commit as a single atomic commit: `refactor: rename finance-api to life-api (WS3)`

---

## Section 2: Pipeline Hardening

### Fix integration test failures

The 25 pre-existing integration test failures are caused by an auth token setup issue in the test factory — not broken application code. The `continue-on-error: true` flag in CI masks these failures.

**Fix:** Investigate and repair the test factory auth setup so all integration tests pass, then remove `continue-on-error: true` from the CI workflow. Integration tests must gate the build before LAN deployment.

### Create `docker-compose.production.yml`

The UAT deploy workflow (`deploy-uat.yml`) references `docker-compose.production.yml` but the file does not exist. It must define:

```
nginx       — reverse proxy, HTTPS termination on 443, HTTP→HTTPS redirect on 80
life-api    — .NET API, internal only (not exposed outside Docker network)
postgres    — DB with named volume for persistence, internal only
```

Container configuration:
- `life-api` and `postgres` bind to the Docker internal network only — no host port mapping
- `nginx` binds to `0.0.0.0:443` and `0.0.0.0:80` to accept LAN connections
- Postgres uses a named volume (`life-manager-pgdata`) for data persistence across restarts
- All containers have restart policies (`unless-stopped`)
- Health checks defined for `life-api` (hits `GET /api/health`) and `postgres`

### nginx configuration

```
server {
    listen 80;
    server_name life-manager;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name life-manager;
    ssl_certificate     /etc/nginx/certs/life-manager.pem;
    ssl_certificate_key /etc/nginx/certs/life-manager-key.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://life-api:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Add compose validation to CI build job

The CI `build` job will run `docker compose -f docker-compose.production.yml config --quiet` to catch syntax errors in the compose file before any deploy attempt.

### nginx Dockerfile

A minimal `nginx` image that COPYs the built frontend (`apps/web/dist/`) into `/usr/share/nginx/html` and COPYs the nginx config. Built as part of the production compose build step.

---

## Section 3: Security Audit

A concrete pass/fail checklist. Any failure is a blocking fix before LAN deployment proceeds.

### Auth implementation

| Check | Pass criteria |
|---|---|
| JWT signing key source | Loaded from environment variable, never hardcoded |
| JWT signing key strength | ≥ 256 bits (32+ character random string) |
| Access token expiry | ≤ 15 minutes |
| Refresh token rotation | New refresh token issued on each use; old token invalidated |
| Refresh token storage | Tokens stored as BCrypt hash in DB, not plaintext |
| BCrypt cost factor | ≥ 12 rounds |
| Account lockout | 5 failed attempts locks account; verify cannot be bypassed via timing or endpoint variation |
| Password reset tokens | Single-use, expire after ≤ 1 hour, deleted on use |
| Email verification tokens | Single-use, expire after ≤ 24 hours |
| Rate limiting | Auth endpoints rate-limited; verify config is appropriate for production |

### Infrastructure

| Check | Pass criteria |
|---|---|
| No secrets in git history | Scan git log for JWT secrets, DB passwords, API keys |
| `.env.production` in `.gitignore` | Confirmed — never committed |
| API container not exposed | Port 5000 bound to Docker internal network only |
| DB container not exposed | Port 5432 bound to Docker internal network only |
| Containers not running as root | `USER` directive set in Dockerfiles or `user:` in compose |
| HTTPS enforced | nginx redirects all HTTP → HTTPS; no plaintext API access |
| TLS version | nginx configured for TLSv1.2 minimum (TLSv1.3 preferred) |
| OWASP security headers | Verify `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy` present on responses |
| CORS configuration | API CORS allows only the known frontend origin, not wildcard |

### Remediation

Each failed check produces a fix task. No deployment proceeds until all checks pass.

---

## Section 4: LAN Deployment

### Self-hosted GitHub Actions runner

Register a runner on the dev machine against `jaevans36/finance-manager` with labels `self-hosted, windows, uat`. Steps:

1. Generate runner token via GitHub → Settings → Actions → Runners → New self-hosted runner
2. Follow [docs/guides/SELF-HOSTED-RUNNER.md](../../guides/SELF-HOSTED-RUNNER.md) for install steps
3. Configure runner as a Windows service so it starts automatically on boot
4. Verify runner shows as "Idle" in GitHub Actions settings

Once registered, every push to `develop` that passes CI will automatically trigger `deploy-uat.yml`.

### TLS certificates with mkcert

```powershell
# Install mkcert (once per machine)
choco install mkcert   # or winget install mkcert

# Install local CA (once per machine — makes browser trust the cert)
mkcert -install

# Generate certificate including LAN IP
mkcert -cert-file certs/life-manager.pem -key-file certs/life-manager-key.pem life-manager 192.168.x.x localhost

# Place in project root certs/ directory (already gitignored)
```

The LAN IP (`192.168.x.x`) must be included as a SAN so other LAN devices trust the certificate without errors.

### hosts file entries

**Dev machine** (`C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1   life-manager
```

**Other LAN devices** (each device's hosts file, or router DNS if supported):
```
192.168.x.x   life-manager
```

Other LAN devices also need to trust the mkcert CA. Options:
- Export the mkcert root CA (`mkcert -CAROOT`) and install it on each device
- Or accept the browser security warning (acceptable for personal LAN use)

### `.env.production` setup

The file lives at the project root and is never committed. Required variables:

```
POSTGRES_PASSWORD=<strong random password, min 32 chars>
JWT_SECRET=<strong random secret, min 32 chars>
JWT_ISSUER=https://life-manager
JWT_AUDIENCE=https://life-manager
ASPNETCORE_ENVIRONMENT=Production
VITE_API_URL=https://life-manager
```

A `.env.production.example` file (already exists) documents all required variables with placeholder values and generation instructions.

### Network access

The running stack accepts connections from any device on the LAN:

```
LAN device → nginx (192.168.x.x:443) → life-api:5000 (internal Docker network)
                                      → postgres:5432 (internal Docker network)
```

The app is **not accessible from the public internet** — it is LAN-only. No router port-forwarding is required or recommended until the public hosting phase.

### Deployment flow (end state)

1. Developer pushes to `develop`
2. GitHub Actions CI runs (backend tests → frontend tests → lint → build)
3. On CI success, `deploy-uat.yml` triggers on the self-hosted runner
4. Runner checks out code, verifies `.env.production` and `certs/` exist
5. `docker compose -f docker-compose.production.yml up -d --build` runs
6. Health check hits `https://life-manager/api/health` — must return 200
7. Deployment summary printed; runner marks job complete

---

## Merge strategy

Each section ships as its own PR to `develop`:

| PR | Content |
|---|---|
| PR1 | WS3 rename (single atomic commit) |
| PR2 | Integration test fixes + `docker-compose.production.yml` + CI compose validation |
| PR3 | Security audit findings fixed |
| PR4 | Self-hosted runner docs update + `.env.production.example` + `certs/` gitignore entry |

After all four PRs merge to `develop` and UAT deploy is verified, `develop` → `main` PR cuts the v1.0.0 release.

---

## What comes after this

- OAuth / Google Sign-In spec (separate brainstorm session)
- Public web hosting setup
- GitHub repo rename to `life-manager`
