# Dev Password Reset — Design Spec

**Date:** 2026-06-10  
**Status:** Approved  
**Author:** Jay (brainstormed with Claude)

---

## Problem

The email-based password reset flow exists in the codebase but email delivery is not yet implemented. During local development, a forgotten password results in being locked out with no self-service recovery path. The existing `reset-user-password.ps1` script works but requires the developer to drop to a terminal.

---

## Goal

A dev-only, configuration-gated password reset bypass accessible via a dedicated frontend route (`/dev/reset-password`). The feature must be impossible to enable in production, easy to toggle within development, and documented clearly.

---

## Approach

**Approach B — Feature flag in config.**  
Gated by two independent guards:

1. `ASPNETCORE_ENVIRONMENT=Development` (server-side, always present)
2. `DevFeatures:AllowDirectPasswordReset=true` in `appsettings.Development.json` (opt-in, defaults to `false`)

The frontend route is gated by `VITE_ENABLE_DEV_RESET=true` in `.env.local` and is absent from production builds entirely. The backend returns `404` (not `403`) when either guard fails — giving no signal that the route exists.

---

## Architecture

```
Browser → /dev/reset-password
  └── Registered only if VITE_ENABLE_DEV_RESET=true (.env.local, build-time)
        └── POST /api/v1/dev/reset-password
              ├── Guard 1: ASPNETCORE_ENVIRONMENT=Development → else 404
              ├── Guard 2: DevFeatures:AllowDirectPasswordReset=true → else 404
              └── On pass:
                    ├── Validate email + password (same rules as registration)
                    ├── BCrypt hash new password (cost 12)
                    ├── UPDATE users: password_hash, failed_login_attempts=0,
                    │               account_locked_until=NULL, updated_at=NOW()
                    └── Serilog warning log (dev reset used for {email})
```

---

## Backend

### Config (`appsettings.Development.json`)

New `DevFeatures` block added. Defaults to `false` — the developer explicitly opts in each time.

```json
"DevFeatures": {
  "AllowDirectPasswordReset": false
}
```

### New files

| File | Purpose |
|------|---------|
| `Features/Dev/Controllers/DevController.cs` | Single endpoint, both guards inline |
| `Features/Dev/Models/DevPasswordResetRequest.cs` | Request DTO with validation attributes |

### Endpoint

```
POST /api/v1/dev/reset-password
Content-Type: application/json

{ "email": "string", "newPassword": "string" }
```

**Validation (`DevPasswordResetRequest`):**
- `Email` — required, valid email format
- `NewPassword` — required, min 8 chars, at least one uppercase letter, at least one digit

**Success response:** `200 { "message": "Password reset successfully." }`  
**Guard failure response:** `404 Not Found` (no body)  
**Validation failure response:** `400` with standard validation error shape

**DB update:** Direct via `FinanceDbContext` — no dependency on `PasswordResetService` (this bypasses the token flow by design). Password hashed with BCrypt cost 12, matching the existing `AuthService` pattern.

**Logging:** One `LogWarning` entry per use: `"[DEV] Direct password reset used for {Email}"` — visible in the development console so it's auditable during a session.

---

## Frontend

### New files

| File | Purpose |
|------|---------|
| `pages/dev/DevPasswordResetPage.tsx` | Standalone reset form, no app shell |
| `services/devService.ts` | `resetPassword(email, newPassword)` via `apiClient` |

### Page design

- No navigation, sidebar, or app shell — visually distinct from the main app
- Warning banner: *"Dev mode only — this page does not exist in production"*
- Fields: Email, New Password, Confirm Password (client-side match check only)
- Submit button with loading / success / error states
- On success: displays a confirmation message; does not auto-redirect (lets the developer see the result)

### Route registration (`App.tsx`)

```tsx
{import.meta.env.VITE_ENABLE_DEV_RESET === 'true' && (
  <Route path="/dev/reset-password" element={<DevPasswordResetPage />} />
)}
```

No `<Link>` anywhere in the app. Access is by direct URL only.

### `.env.example` addition

```
# Dev-only password reset bypass. Never enable in production.
# VITE_ENABLE_DEV_RESET=false
```

---

## Documentation

### New guide: `docs/guides/DEV-PASSWORD-RESET.md`

Covers: what the feature is, how to enable it, how to use it, how to disable it, and a security callout explaining the double-gate. Does not describe implementation internals.

### References added

- `CLAUDE.md` scripts table — row alongside the existing `reset-user-password.ps1` entry
- `docs/CURRENT_STATE.md` — brief mention under dev tooling

---

## Security Summary

| Risk | Mitigation |
|------|-----------|
| Feature active in production | Impossible — `IsDevelopment()` guard is unconditional |
| Feature active in production bundle | Route absent from production build (`VITE_ENABLE_DEV_RESET` not set) |
| Attacker probing for endpoint | Returns `404`, indistinguishable from any missing route |
| Accidental use during dev | Flag defaults to `false`; developer must explicitly opt in |
| Audit trail | Serilog warning logged on every use |

---

## Files Changed

### New
- `apps/life-api/Features/Dev/Controllers/DevController.cs`
- `apps/life-api/Features/Dev/Models/DevPasswordResetRequest.cs`
- `apps/web/src/pages/dev/DevPasswordResetPage.tsx`
- `apps/web/src/services/devService.ts`
- `docs/guides/DEV-PASSWORD-RESET.md`

### Modified
- `apps/life-api/appsettings.Development.json` — add `DevFeatures` block
- `apps/web/.env.example` — add `VITE_ENABLE_DEV_RESET` entry
- `apps/web/src/App.tsx` — conditional route
- `CLAUDE.md` — scripts table reference
- `docs/CURRENT_STATE.md` — dev tooling mention
