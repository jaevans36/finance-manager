# Intent: net worth as a real trend, with actual assets netted in

## The pain point

Net worth today (`AccountService.GetNetWorthAsync`) is a single live number — the sum
of active account balances right now. There's no history, so the app can't answer "is
this going up or down," and there's no way to offset a mortgage against the house it
actually bought, so a mortgage shows as a large negative with nothing balancing it.

## Why now

Scoped out of `docs/intent/2026-09-13-finance-insights-and-alerts.md` — that doc bundles
net worth history/assets together with a notification engine and a CSV-reconciliation
nudge, which are separate, larger pieces of work. This is just the net-worth half,
picked to round out the Finance module's own feature set before moving on to the
non-finance parts of the roadmap.

## What "done" looks like

- Net worth has a real trend line (monthly, at least the last 12 months), backed by
  actual historical data — not a line that only starts accumulating points from
  whenever this ships.
- Manually-tracked assets (property, vehicle, other) net into the current net-worth
  figure, so a mortgage has something to offset against.
- Verified visually in a browser, not just via passing tests — this is a UI-facing
  feature and needs to actually look right (light and dark, and at a narrower
  viewport) before it's considered done.

## Explicitly out of scope

- Not the notification engine (scheduled digests, Discord delivery) or the
  CSV-pull-reminder/reconciliation-check pieces of the sibling intent doc — separate
  work.
- Not automated property-value lookup — manual entry only, same call the sibling
  intent doc already made (no reliable free source for that exists anyway).
- Not reconstructing historical asset values — nothing tracked one exists yet, so
  there's nothing to reconstruct. The history line is accounts-only; today's summary
  figure is the one that includes current asset values. See the plan for the full
  reasoning on why this is accounts-only-history rather than a snapshot job.

## Constraints / relevant history

- `specs/applications/finance/tasks.md` Phase 45 already specs a `NetWorthTimeline`
  component (T1233, Recharts line chart) but has no backend counterpart at all —
  confirmed by reading the full phase (T1226–T1230 cover ISA allowances, cash-flow
  forecasting, tax-year helpers, transaction splitting; nothing about net-worth history
  or assets). This fills that gap rather than inventing a new spec from scratch.
- `AccountService.GetNetWorthAsync` is already sharing-aware
  (`GetVisibleAccountIdsAsync`) — any new net-worth code should stay consistent with
  that rather than reverting to a raw ownership filter.
- Full technical plan (design decision on how history actually gets computed, exact
  files touched) is in the session's plan file, approved before implementation started.

---
*Parent intent: `2026-09-13-finance-insights-and-alerts.md`.*
