# Intent: move finance-api to the VPS, give Jade her own access

## The pain point

Finance data only exists on Jay's dev PC. Jade has no way to see it, and there's no path for her
to ever see it without either sharing Jay's login (no separate identity, no real access control)
or moving the data somewhere both of them can reach. The original decision to keep finance data
off the VPS (`Service Topology & Data Sensitivity.md`) was specifically about it being unencrypted
at rest — that blocker is gone (column encryption shipped 2026-09-11, ADR-022).

## Why now

Two things converged: the encryption work removed the reason finance data couldn't safely live
on shared infrastructure, and Jay wants to start using an MCP-driven workflow for financial data
going forward, which only makes sense against wherever the data will *actually* live long-term —
better to point that at its permanent home from day one than move it later.

## What "done" looks like

- finance-api runs on the VPS as the canonical copy, alongside life-api — same box, same
  self-hosted runner, same deploy pipeline shape.
- It starts from a **fresh, empty database** — no migration of the current dev-PC data. The
  dev-PC copy stops being canonical and becomes just a local dev/test instance, the same
  relationship life-api's local copy already has to its VPS original.
- Jade has her own life-api login and **full read/write** access to the finance data. Note: this
  is a deliberate departure from `specs/applications/finance/tasks.md` Phase 50 ("Household
  Account Sharing"), which already exists in detail but scopes sharing as **view-only**, with
  edit access explicitly called out there as "a materially bigger feature" and deferred. Jay
  confirmed (2026-09-13) he wants full access from the start, not the phased view-only-first
  approach — so Phase 50's `AccountShare` entity/`Permission` enum and the "no update/delete on
  shared accounts" enforcement in `AccountService`/`TransactionService` need extending to allow a
  write-capable share, not just adopting as-specced.
- **Audit logging is a requirement of full read/write sharing, not a nice-to-have** — with two
  people able to change the same data, "who changed what" needs to be answerable. finance-api
  currently has **no** activity/audit log of any kind (confirmed — nothing like it exists there
  today). life-api already has a proven, working pattern to port over directly: `ActivityLog`/
  `IActivityLogService`/`ActivityLogsController` (`apps/life-api/Features/Common/ActivityLogs/`)
  — action, description, IP, user-agent, timestamp, per-user. Rather than also building Phase
  49's narrower `finance.mcp_audit_log` (MCP-tool-calls only) as a separate mechanism, one general
  activity log covering *all* finance-api writes — web UI and MCP alike — is simpler and answers
  the actual question ("what did Jade do this week") more usefully than an MCP-only log would.
- The finance backup pipeline gets **rebuilt in the opposite direction** from what exists today.
  `push-finance-backup.ps1` (shipped 2026-09-12) was built on the premise that the dev PC is the
  only copy and pushes an off-site backup to the VPS — that premise is now wrong. Once the VPS is
  canonical, finance data needs to follow life-api's existing pattern exactly: the VPS dumps
  itself nightly with its own retention, the dev PC pulls a rolling copy, both stages report to
  Uptime Kuma. The 2026-09-12 script's job is done and it should be retired, not left running
  alongside a now-pointless off-site push.

## Explicitly out of scope

- **Not** migrating the current dev-PC data — deliberately starting blank (see the sibling intent
  on `finance-mcp` for why: it's also meant to prove out MCP-driven data entry from a clean slate).
- **Not** designing a general-purpose multi-tenant/family account system — this is specifically
  "Jade gets access to Jay's finance data," not a system for arbitrary households or more users.
- **Not** re-opening the encryption design itself — ADR-022's field scope stands as-is.

## Constraints / relevant history

- **`specs/applications/finance/tasks.md` Phase 50 ("Household Account Sharing", T1750–T1773)
  already exists as a detailed spec for this exact feature** — found after this intent was first
  drafted. Treat it as the authoritative starting design (it already specifies reusing the
  existing, working `EventShare` model — `apps/life-api/Features/Events/Models/EventShare.cs` —
  not the task-group sharing pattern originally suggested here) and adapt it for full read/write
  rather than writing a competing design from scratch.
- `docs/BRANCHING-STRATEGY.md` / `VPS Setup Runbook.md` Phase 11 (2026-09-12) already added a
  production approval gate and an optional `dev` branch — this migration should extend both
  (finance-api gets a service in `docker-compose.vps.yml` *and* in `docker-compose.vps-dev.yml`
  for parity), not bypass them.
- The VPS is explicitly temporary infrastructure (`VPS Future Use & Lifecycle.md` — retire it when
  the refurb PC exists). Whatever gets built for finance-api's deployment should assume it may
  move again, same as life-api already does.
- Open question for the plan stage, not resolved here: does finance-api's VPS database share the
  same Postgres instance as life-api (a `finance` schema alongside `public`, matching the local
  dev-PC convention) or run as its own container? The former means the *existing* VPS backup
  script already covers it for free; the latter needs genuinely new backup infrastructure. Worth
  deciding explicitly rather than defaulting either way.

---
*Sibling intents: `2026-09-13-finance-mcp-and-ingestion.md`,
`2026-09-13-finance-insights-and-alerts.md`.*
