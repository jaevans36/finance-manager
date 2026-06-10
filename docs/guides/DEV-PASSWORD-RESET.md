# Dev Password Reset Bypass

A local-only tool for resetting a forgotten password when the email reset flow is unavailable.

> **Security:** The bypass endpoint returns `404` in all non-development environments and when the flag is disabled. It cannot be activated in production.

---

## How to enable

1. In `apps/life-api/appsettings.Development.json`, set:
   ```json
   "DevFeatures": {
     "AllowDirectPasswordReset": true
   }
   ```
2. In `apps/web/.env.local`, add:
   ```
   VITE_ENABLE_DEV_RESET=true
   ```
3. Restart the API (`.\restart-dev.ps1`).

---

## How to use

Navigate to: `http://localhost:5173/dev/reset-password`

Enter your email address and a new password (min 8 chars, one uppercase, one digit). On success a confirmation message is shown — no redirect. Log in normally afterwards.

> **Note:** Email lookup is case-sensitive. Enter your email exactly as you registered it.

---

## How to disable

Set both flags back to `false` (or remove `VITE_ENABLE_DEV_RESET` from `.env.local`) and restart the API. The page will no longer exist in the frontend bundle and the endpoint will return `404`.

---

## Security notes

- The endpoint is double-gated: `ASPNETCORE_ENVIRONMENT=Development` **and** `DevFeatures:AllowDirectPasswordReset=true`
- When either guard fails the endpoint returns `404 Not Found` — indistinguishable from any missing route
- Every use is logged as a Serilog `Warning` entry in the API console
- The frontend route is absent from production builds (Vite tree-shakes the dead import)
