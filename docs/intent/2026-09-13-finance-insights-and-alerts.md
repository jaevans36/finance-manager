# Intent: net worth history, alerts, and statement reconciliation

**Status:** deferred until the VPS migration and `finance-mcp` intents are live — captured now so
the reasoning isn't lost, not meant to be planned/built yet.

## The pain point

Three related gaps surfaced while scoping the finance-MCP work, all under "comparable to a paid
budgeting app":

1. **Net worth is a live number, not a trend.** `GetNetWorthAsync` sums active account balances
   on demand — there's no history, so there's no way to see it moving over time, and it doesn't
   include the actual value of the house or other physical assets, only account balances. A
   mortgage shows as a large negative with nothing offsetting it.
2. **There's no notification/alert mechanism at all.** Confirmed while scoping this: zero
   `BackgroundService`/scheduled-job infrastructure exists anywhere in life-api or finance-api —
   the only existing Discord wiring is a one-way error sink. "Discord digests" has been on the
   life-api roadmap unbuilt since the original service-topology pass.
3. **No live bank feed means silent drift is possible.** Without Open Banking, the app's computed
   balance can only be as accurate as the last statement/CSV Jay fed it — nothing currently checks
   that computed and actual balances still agree.

## What "done" looks like (roughly — to be detailed properly when this is picked up)

- An `Asset` concept (property value, possibly a car — manually estimated, updated occasionally)
  that nets against liabilities in a net-worth figure that actually reflects reality.
- A monthly net-worth **snapshot**, so there's a trend line, not just a point-in-time number —
  ideally capturing assets and liabilities together from the point this is built, not retrofitted.
- A real notification engine (the first `BackgroundService`/scheduled-job infrastructure in either
  API), with its own Discord channel, starting with the concrete example Jay gave: a daily digest
  of what's due to come out of the account that day, by bill and amount. Extensible later to low
  balance, budget overspend, and anomaly-detected alerts (the detection logic for the last one
  already exists in `AnomalyDetectionService`, just has no delivery mechanism).
- A recurring nudge to pull a fresh CSV export (weekly-ish, rather than waiting for the monthly
  statement — most UK banks expose ~90 days on demand) so reconciliation happens more often than
  once a month, and an actual reconciliation check (computed balance vs. what the newest
  statement/export says) that flags drift when it happens rather than months later.

## Explicitly out of scope (for now)

- Not deciding yet whether the notification engine lives in life-api (shared infra, finance-api is
  a consumer) or in finance-api directly — genuinely open, revisit when this is picked up.
- Not designing asset valuation sourcing (manual entry only, no automated property-value lookup —
  no reliable free source for that exists anyway).

## Constraints / relevant history

- Depends on both sibling intents (`2026-09-13-finance-vps-migration-and-sharing.md`,
  `2026-09-13-finance-mcp-and-ingestion.md`) being live first — alerts and reconciliation are
  only meaningful once real, current data exists to alert on.
