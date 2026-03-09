# Self-Hosted GitHub Actions Runner — UAT Deployment

> **Purpose**: Enables automated deployment to the LAN UAT environment (`https://life-manager`)
> when CI passes on the `develop` branch.
>
> **One-time setup on the Windows machine that hosts UAT.**

---

## How It Works

```
Push to develop
    → CI workflow runs on GitHub hosted runners (ubuntu-latest)
    → If all CI jobs pass → deploy-uat.yml triggers
    → deploy-uat job runs on self-hosted runner (this Windows machine)
    → docker compose up --build on the local machine
    → Health check confirms deploy succeeded
```

---

## Prerequisites

- Docker Desktop running on the Windows machine
- `.env.production` present in the repo root
- TLS certificates in `certs/` (see [HTTPS-SETUP.md](HTTPS-SETUP.md))
- GitHub account with write access to `jaevans36/finance-manager`

---

## Registration Steps

### 1. Create the runner on GitHub

1. Go to: `https://github.com/jaevans36/finance-manager/settings/actions/runners`
2. Click **New self-hosted runner**
3. Select **Windows** + **x64**
4. Follow the download instructions (downloads `actions-runner-win-x64-*.zip`)

### 2. Configure the runner

Open **PowerShell as Administrator** in the directory where you extracted the runner:

```powershell
# Replace TOKEN with the token shown on the GitHub page (valid for 1 hour)
.\config.cmd --url https://github.com/jaevans36/finance-manager --token TOKEN --name "uat-windows" --labels "self-hosted,windows,uat" --work "_work"
```

### 3. Install as a Windows service (auto-start)

```powershell
.\svc.ps1 install
.\svc.ps1 start
```

The runner now starts automatically with Windows and survives reboots.

### 4. Verify

```powershell
.\svc.ps1 status
```

On GitHub: `Settings → Actions → Runners` — the runner should show as **Idle**.

---

## Runner Labels

The `deploy-uat.yml` workflow uses these labels:

```yaml
runs-on: [self-hosted, windows, uat]
```

All three labels must be present on the registered runner.

---

## Security Considerations

- The runner executes arbitrary code from the repository — only trusted branches (`develop`) trigger the deploy workflow
- The runner runs as a Windows service under a local account; it does **not** need admin privileges
- Secrets (`.env.production`, TLS certs) live on the machine and are never pushed to GitHub
- If the machine is compromised, rotate credentials in `.env.production` immediately

---

## Removing the Runner

```powershell
.\svc.ps1 stop
.\svc.ps1 uninstall
.\config.cmd remove --token TOKEN
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Runner shows **Offline** on GitHub | Check service: `.\svc.ps1 status`; restart with `.\svc.ps1 start` |
| Deploy fails at health check | Check `docker compose logs api` on the Windows machine |
| `config.cmd` token expired | Generate a new token on GitHub (1-hour validity) |
| Permission denied on deploy script | Ensure the service account has write access to the repo directory |
