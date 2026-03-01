# LAN Deployment Guide

**Created**: 2026-02-14
**Status**: Active
**Scope**: Local network (LAN) only — not internet-facing

> **⚠️ Important**: This guide is for deploying Finance Manager on your local home/office network only. A full security audit has not been completed. Do **not** expose this deployment to the public internet. See [Phase 25: Production Deployment](#production-deployment-phase) in specs for the future production plan.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Step 1: Choose a Hostname](#step-1-choose-a-hostname)
- [Step 2: Configure DNS / Hosts Files](#step-2-configure-dns--hosts-files)
- [Step 3: Configure the Database](#step-3-configure-the-database)
- [Step 4: Configure the .NET API](#step-4-configure-the-net-api)
- [Step 5: Build the Frontend](#step-5-build-the-frontend)
- [Step 6: Set Up a Reverse Proxy (Caddy)](#step-6-set-up-a-reverse-proxy-caddy)
- [Step 7: Windows Firewall Rules](#step-7-windows-firewall-rules)
- [Step 8: Start Everything](#step-8-start-everything)
- [Verification Checklist](#verification-checklist)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

---

## Prerequisites

| Requirement | Minimum Version | Notes |
|---|---|---|
| Windows 10/11 | — | Host machine |
| Docker Desktop | 4.x | For PostgreSQL |
| .NET SDK | 8.0 | For the API |
| Node.js | 20 LTS | For building the frontend |
| pnpm | 9.x | Package manager |
| Caddy | 2.x | Reverse proxy (recommended) |

Ensure Docker Desktop is installed and running before proceeding.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│  LAN Clients (browser)                                   │
│  http://finance.local                                    │
└──────────────┬───────────────────────────────────────────┘
               │ :80
┌──────────────▼───────────────────────────────────────────┐
│  Caddy (reverse proxy)                                   │
│  ┌─────────────────┐  ┌──────────────────────────────┐   │
│  │  Static files    │  │  /api/* → localhost:5000     │   │
│  │  (Vite build)    │  │  Proxy to .NET API           │   │
│  └─────────────────┘  └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────┐
│  .NET API (Kestrel)          localhost:5000               │
│  ├── Authentication (JWT)                                 │
│  ├── Task Management                                      │
│  └── All /api/* endpoints                                 │
└──────────────┬───────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────┐
│  PostgreSQL 15 (Docker)      localhost:5432               │
└──────────────────────────────────────────────────────────┘
```

In production/LAN mode the Vite dev server is **not** used. Instead:
- The React app is built to static files (`dist/`)
- Caddy serves the static files and proxies `/api/*` requests to the .NET API
- The .NET API handles all backend logic and database access

---

## Step 1: Choose a Hostname

Pick a hostname for your LAN deployment. Use the `.local` TLD which is conventional for local networks:

- `finance.local` (recommended)
- `financemanager.local`
- Any name you prefer

> **Note**: `.local` is resolved via mDNS on macOS/Linux and via hosts files on Windows. Using hosts files (Step 2) is the most reliable cross-platform approach.

For the rest of this guide we'll use **`finance.local`**.

---

## Step 2: Configure DNS / Hosts Files

You need every device on your LAN to resolve `finance.local` to the host machine's **LAN IP address**.

### Find Your LAN IP

On the host machine (PowerShell):

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.PrefixOrigin -eq "Dhcp" } | Select-Object IPAddress, InterfaceAlias
```

Or simply:

```powershell
ipconfig | Select-String "IPv4"
```

Example output: `192.168.1.50`

> **Tip**: For a stable IP, consider assigning a static IP or a DHCP reservation on your router for the host machine.

### Option A: Router DNS (Recommended)

If your router supports custom DNS entries (e.g., Pi-hole, UniFi, pfSense):

1. Add an A record: `finance.local` → `192.168.1.50`
2. All devices on the network will automatically resolve the hostname

### Option B: Hosts File (Per-Device)

On **every device** that needs access, edit the hosts file:

**Windows** (run Notepad as Administrator):
```
C:\Windows\System32\drivers\etc\hosts
```

**macOS/Linux**:
```
/etc/hosts
```

Add this line (replace with your actual LAN IP):
```
192.168.1.50    finance.local
```

### Verify DNS Resolution

```powershell
ping finance.local
```

You should see replies from your LAN IP.

---

## Step 3: Configure the Database

The existing Docker Compose file works as-is for LAN deployment. However, you should change the default credentials.

### 3a. Update Docker Compose credentials

Edit `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: finance-manager-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: financemanager
      POSTGRES_PASSWORD: <generate-a-strong-password>
      POSTGRES_DB: finance_manager
    ports:
      - "127.0.0.1:5432:5432"   # Bind to localhost only — not exposed to LAN
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U financemanager"]
      interval: 10s
      timeout: 5s
      retries: 5
```

> **Key change**: `127.0.0.1:5432:5432` ensures PostgreSQL is only accessible from the host machine, not directly from the LAN. The API connects locally.

### 3b. Update the Connection String

Edit `apps/finance-api/appsettings.json` (or create an `appsettings.Lan.json` override):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=finance_manager;Username=financemanager;Password=<same-strong-password>"
  }
}
```

### 3c. Start the Database & Apply Migrations

```powershell
docker-compose up -d
cd apps/finance-api
dotnet ef database update
```

---

## Step 4: Configure the .NET API

### 4a. Update JWT Secret

**Critical** — the default secret is a placeholder. Generate a strong secret:

```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Update `appsettings.json` (or `appsettings.Lan.json`):

```json
{
  "Jwt": {
    "Secret": "<your-generated-64-byte-base64-secret>",
    "ExpiresIn": "1h"
  }
}
```

### 4b. Update CORS

The API currently only allows `http://localhost:5173`. You need to add the LAN hostname.

Edit `Program.cs` — find the CORS configuration and update:

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins(
                "http://localhost:5173",  // Development
                "http://finance.local"    // LAN deployment
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});
```

> **Better approach**: Move the allowed origins to `appsettings.json` so you don't need to recompile:
>
> ```json
> "Cors": {
>   "AllowedOrigins": ["http://localhost:5173", "http://finance.local"]
> }
> ```
>
> Then in `Program.cs`:
> ```csharp
> var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
> builder.Services.AddCors(options =>
> {
>     options.AddDefaultPolicy(policy =>
>     {
>         policy.WithOrigins(allowedOrigins ?? new[] { "http://localhost:5173" })
>               .AllowAnyMethod()
>               .AllowAnyHeader()
>               .AllowCredentials();
>     });
> });
> ```

### 4c. Bind to All Network Interfaces

By default Kestrel may only listen on `localhost`. For LAN access, the API must listen on `0.0.0.0`.

However, since we're using Caddy as a reverse proxy on the same machine, the API can stay on `localhost:5000` — Caddy handles external traffic.

If you prefer to run **without** Caddy (direct access), update `Properties/launchSettings.json`:

```json
{
  "profiles": {
    "http": {
      "applicationUrl": "http://0.0.0.0:5000"
    }
  }
}
```

### 4d. Enable Rate Limiting

Ensure rate limiting is active in `appsettings.json`:

```json
{
  "RateLimit": {
    "Enabled": true,
    "MaxRequestsPerMinute": 60,
    "MaxRequestsPerHour": 1000
  }
}
```

### 4e. Publish the API

Build a release version:

```powershell
cd apps/finance-api
dotnet publish -c Release -o ../../deploy/api
```

Run the published API:

```powershell
cd ../../deploy/api
dotnet FinanceApi.dll --urls "http://localhost:5000"
```

---

## Step 5: Build the Frontend

### 5a. Set the API Base URL

The Vite dev proxy won't be available in production. The frontend needs to know the real API URL.

Create or update `apps/web/.env.production`:

```env
VITE_API_BASE_URL=http://finance.local/api
```

> **Note**: If your frontend services already use relative URLs (e.g., `/api/tasks`), and Caddy handles the proxy, you may not need this variable at all — the relative paths will work automatically.

### 5b. Build

```powershell
cd apps/web
pnpm build
```

This produces static files in `apps/web/dist/`.

### 5c. Verify the Build

```powershell
Get-ChildItem apps/web/dist -Recurse | Measure-Object -Property Length -Sum
```

You should see an `index.html` and various JS/CSS chunks.

---

## Step 6: Set Up a Reverse Proxy (Caddy)

[Caddy](https://caddyserver.com/) is the recommended reverse proxy — zero-config, automatic HTTPS (not needed for LAN), and simple configuration.

### 6a. Install Caddy

Download from https://caddyserver.com/download or via Chocolatey:

```powershell
choco install caddy
```

### 6b. Create Caddyfile

Create a `Caddyfile` in the project root (or `deploy/` folder):

```caddyfile
http://finance.local {
    # Serve the React SPA
    root * C:/Projects/Finance Manager/apps/web/dist
    file_server

    # Proxy API requests to the .NET backend
    handle /api/* {
        reverse_proxy localhost:5000
    }

    # SPA fallback — serve index.html for client-side routes
    try_files {path} /index.html
}
```

> **Important**: The `try_files` directive ensures React Router works correctly — all non-file routes fall back to `index.html`.

### 6c. Start Caddy

```powershell
caddy run --config Caddyfile
```

Or run as a Windows service:

```powershell
caddy start --config Caddyfile
```

---

## Step 7: Windows Firewall Rules

Allow incoming connections on port 80 from your LAN subnet only.

Run PowerShell **as Administrator**:

```powershell
# Allow HTTP traffic from LAN only
New-NetFirewallRule `
    -DisplayName "Finance Manager - LAN HTTP" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 80 `
    -RemoteAddress 192.168.1.0/24 `
    -Action Allow `
    -Profile Private

# Verify the rule was created
Get-NetFirewallRule -DisplayName "Finance Manager*" | Format-Table DisplayName, Enabled, Direction
```

> **Adjust the subnet**: Replace `192.168.1.0/24` with your actual LAN subnet. Common subnets:
> - `192.168.0.0/24`
> - `192.168.1.0/24`
> - `10.0.0.0/24`
>
> Check yours with: `ipconfig | Select-String "Subnet Mask"`

**Do NOT open ports on your router/gateway** — this keeps the application LAN-only.

---

## Step 8: Start Everything

Here's the full startup sequence:

```powershell
# 1. Start the database
docker-compose up -d

# 2. Wait for database to be healthy
while (-not (docker ps --filter "name=finance-manager-db" --format "{{.Status}}" | Select-String "healthy")) {
    Write-Host "Waiting for database..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}
Write-Host "Database ready" -ForegroundColor Green

# 3. Start the .NET API
Start-Process -NoNewWindow -FilePath "dotnet" -ArgumentList "deploy/api/FinanceApi.dll", "--urls", "http://localhost:5000"

# 4. Start Caddy
Start-Process -NoNewWindow -FilePath "caddy" -ArgumentList "run", "--config", "Caddyfile"

Write-Host ""
Write-Host "Finance Manager is running at: http://finance.local" -ForegroundColor Green
```

> **Tip**: You can wrap this in a `scripts/start-lan.ps1` script for convenience.

---

## Verification Checklist

From the **host machine**:

- [ ] `docker ps` shows `finance-manager-db` as healthy
- [ ] `curl http://localhost:5000/api/version/current` returns version JSON
- [ ] `curl http://finance.local` returns the React app HTML
- [ ] `curl http://finance.local/api/version/current` returns version JSON (via Caddy proxy)
- [ ] Application loads in browser at `http://finance.local`
- [ ] Can register a user and log in
- [ ] Can create, edit, and complete tasks

From **another device on the LAN**:

- [ ] `ping finance.local` resolves to the host machine's IP
- [ ] `http://finance.local` loads in a browser
- [ ] Full application functionality works (auth, tasks, etc.)

---

## Troubleshooting

### "finance.local" doesn't resolve

- Check hosts file entry is correct (or router DNS)
- Flush DNS cache: `ipconfig /flushdns`
- Ensure no VPN is overriding DNS resolution

### "Connection refused" from another device

- Check Windows Firewall rule is active: `Get-NetFirewallRule -DisplayName "Finance Manager*"`
- Verify Caddy is running: `caddy status`
- Ensure the firewall rule uses the correct subnet

### API returns CORS errors

- Verify `http://finance.local` is in the CORS allowed origins
- Check that the origin includes the scheme (`http://`) and has no trailing slash
- Restart the API after changing CORS settings

### React app shows blank page / 404 on routes

- Ensure the Caddyfile has the `try_files {path} /index.html` directive
- Verify `apps/web/dist/index.html` exists

### Database connection failures

- Check Docker is running: `docker info`
- Verify container is healthy: `docker ps`
- Ensure connection string matches Docker Compose credentials

---

## Security Considerations

This LAN deployment provides **basic security** suitable for a trusted home/office network:

| Area | Current State | Production Requirement |
|---|---|---|
| **Transport** | HTTP (unencrypted) | HTTPS with TLS certificates |
| **JWT Secret** | Manual configuration | Vault/secret manager |
| **Database** | Docker with custom password | Managed database service with encryption at rest |
| **CORS** | Explicit hostname allowlist | Same, with stricter validation |
| **Rate Limiting** | Enabled (60/min) | DDoS protection + WAF |
| **Authentication** | BCrypt + JWT | + MFA, account lockout |
| **Network** | Firewall rules (LAN only) | VPC, security groups, load balancer |
| **Monitoring** | Serilog to file | Centralised logging (ELK/Datadog) |
| **Backups** | Docker volume (local) | Automated off-site backups |

### What This Deployment Does NOT Protect Against

- Eavesdropping on the LAN (no TLS)
- Compromised devices on the same network
- Data loss if the host machine fails (no off-site backups)
- Brute-force attacks (rate limiting helps, but no account lockout)

> **See**: [Phase 25: Production Deployment](../specs/001-todo-app/tasks.md) for the full production hardening plan.

---

## Optional: Docker Compose for All Services

For a more self-contained deployment, you can add the API and Caddy to Docker Compose:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: finance-manager-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: financemanager
      POSTGRES_PASSWORD: <strong-password>
      POSTGRES_DB: finance_manager
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U financemanager"]
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
      - ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=finance_manager;Username=financemanager;Password=<strong-password>
      - Jwt__Secret=<your-jwt-secret>
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
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./apps/web/dist:/srv
      - caddy_data:/data

volumes:
  postgres_data:
  caddy_data:
```

> **Note**: This requires a `Dockerfile` in `apps/finance-api/` and adjustments to the Caddyfile paths. This is a future enhancement — see Phase 25.
