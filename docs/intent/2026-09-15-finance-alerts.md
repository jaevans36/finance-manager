# Intent: finance alerts — daily bill digest + sudden price-change warnings via Discord

## The pain point

Everything finance-api can tell Jay about bills and recurring payments today is
pull-only — he has to open the app, or ask Claude, to find out a bill is due or that a
subscription's price has crept up. Explicitly raised: he wants to know about bill
renewal dates without remembering to check, and to be warned specifically when a
recurring payment's cost changes *suddenly*, not months later when he happens to
notice.

## Why now

`docs/intent/2026-09-13-finance-insights-and-alerts.md` scoped this exact idea and
deliberately deferred it pending the VPS migration/account-sharing work and
finance-mcp being live — both shipped earlier this session (PRs #159–163). Picked up
directly after those, per Jay's own prioritisation.

## What "done" looks like

- A daily job (finance-api's first scheduled/background job — neither API has ever had
  one) that, once a day, checks every user's bills due that day and recurring-payment
  price changes, and posts a Discord message for anything worth surfacing.
- **Bill digest**: reuses the existing `BillService.GetUpcomingBillsAsync` (already
  computes days-until-due) — no new detection logic needed, just a scheduled trigger
  and a delivery path that didn't exist before.
- **Price-change alerts**: a genuinely new piece of logic. `RecurringPaymentDetector`'s
  existing `AmountTrend` is a stateless, recomputed-every-call windowed average — fine
  for an on-demand UI signal, wrong for a daily alert (it would stay "Increasing" for
  months after one jump and either spam or need a dedup bolt-on). Instead, a new
  `RecurringPaymentBaseline` table tracks the last amount actually alerted on per
  user+merchant+account; a day's `LatestAmount` is only alert-worthy when it differs
  from that stored baseline by more than a threshold (default 10%), and firing updates
  the baseline so the same jump can't re-fire tomorrow.
- **Discord delivery**, mirroring the existing `DiscordWebhookSink` HTTP+JSON pattern
  (`apps/life-api/Infrastructure/Logging/DiscordWebhookSink.cs`) but as an injectable
  singleton service, not a Serilog sink — a new dedicated webhook/channel, separate
  from the existing deploy-notification one.
- **A dev-only manual trigger** (`POST /api/v1/dev/alerts/run-now`, double-gated like
  life-api's existing `DevController`) so this can be tested end-to-end without a
  24-hour wait.

## Explicitly out of scope

- **In-app bell/notification-dropdown integration** — life-api's `Notification` system
  is narrow (task/event-only enums, no generic payload) and extending it is real,
  separable scope. Discord-only for v1; the existing system satisfies what was
  actually asked for.
- **Any alert type beyond bills-due-today and price-change** — no monthly digest, no
  low-balance alert, no budget-overspend alert. The parent intent doc names these as
  natural extensions once this infrastructure exists; not part of this slice.
- **Changing `RecurringPaymentDetector`'s existing windowed-trend logic** — left
  untouched; the new baseline table is fully independent of it, not a replacement.
- **A job-scheduling library (Quartz/Hangfire)** — a plain `BackgroundService` +
  `PeriodicTimer` is enough at this scale (effectively 1–2 users, one check a day);
  a library would add job-persistence machinery this doesn't need.

## Constraints / relevant history

- Neither `life-api` nor `finance-api` has ever run a scheduled job before — confirmed
  via a full grep of both for `IHostedService`/`BackgroundService`/`Quartz`/`Hangfire`/
  `Timer`. Genuinely greenfield.
- `life-api` already registers `TimeProvider.System` (`Program.cs:55`) for clock
  abstraction in tests; `finance-api` doesn't yet — added here, same pattern.
- `apps/life-api/Features/Dev/Controllers/DevController.cs`'s double-gate
  (`IHostEnvironment.IsDevelopment()` **and** a `DevFeatures` config flag) is the
  precedent for the manual-trigger endpoint — finance-api has no `Dev` feature yet,
  this is its first.
- Every new mutating path gets logged via `IActivityLogService`, same as every other
  feature this session — new `FinanceActivityType` values appended at the enum's end,
  never inserted, to avoid disturbing the string-serialised DB column.

---
*Parent intent: `docs/intent/2026-09-13-finance-insights-and-alerts.md`.*
