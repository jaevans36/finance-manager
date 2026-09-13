# Intent: `finance-mcp` and a real transaction/statement ingestion workflow

## The pain point

Finance data currently only gets into the app through manual UI entry or the structured CSV
importer (bank-specific parsers, exact export format required). There's no way to hand Claude a
messy real-world mix of things — a CSV export, an old PDF statement, a spoken credit card balance
— and have it land correctly, deduplicated against what's already there. Without that, "give
Claude your statements and let it assess your finances" isn't actually possible yet — Jay would
be doing all the structured data entry himself first, which defeats the point.

## Why now

Prompted directly by wanting a genuine monthly financial assessment (spare money, savings
capacity) conversationally, rather than only through the app's UI — and by recognising that a lot
of the analytical engine to support that already exists (Debt projection/severity, Affordability,
Insights: velocity/anomalies/subscriptions/negotiation scripts) but has no conversational front
door. `finance-mcp` is that front door, mirroring `life-mcp`, which already proved the pattern.

## What "done" looks like

- `finance-mcp` exists, authenticating as the user's own login (same design choice `life-mcp`
  made, not a service account), exposing accounts/transactions/bills/budgets/goals/debt/
  affordability/insights as tools.
- Jay can hand over a genuine mixture of formats and have it turn into correct data:
  - **CSV exports** (recent months, most banks including HSBC support this on demand) — parsed
    structurally, reusing the existing per-bank parsers and duplicate-detection logic
    (account + date + amount + original description) where the format matches.
  - **PDF statements** (older months, where CSV isn't available) — read directly (native PDF
    reading, no separate tool needed) and the transaction table extracted from that.
  - **Conversational figures** (credit card balance, mortgage balance, loan details) — typed or
    spoken directly rather than sourced from a document. These aren't "transactions" to dedupe;
    a repeated balance figure on a later date is a legitimate update, not a duplicate.
- **Duplicate detection carries across sessions**, not just within a single upload — "have I
  already given you this transaction list" needs to hold even if the earlier list was sent weeks
  ago in a different conversation. Whatever mechanism is built needs to check against what's
  actually in the database, not rely on conversation memory.
- **Completeness checking is part of the entry workflow, not an afterthought.** When entering an
  account, especially debt (credit card, loan, mortgage), the fields that the Debt/Affordability/
  Negotiation features actually depend on (interest rate, credit limit, minimum payment,
  promotional rate/expiry, mortgage term) get actively checked for — if Jay gives partial
  information, the gap gets flagged and asked about rather than silently left null. A debt
  projection run against an account with no interest rate isn't a real projection.
- The database this all gets entered into starts **empty** (see the sibling VPS-migration intent)
  — a clean slate specifically so the whole dataset has one consistent provenance (MCP-entered),
  rather than a mix of old manually-entered data and new AI-entered data of uncertain
  consistency.

## Explicitly out of scope

- **Not** building OCR for scanned/image-based statements — only relevant if a genuinely
  image-only PDF shows up; most bank-generated PDFs have a text layer and don't need it.
- **Not** a live bank feed / Open Banking integration — deliberately ruled out (HSBC coverage
  exists via third-party aggregators, but all carry a cost or free-tier limits not worth it for
  personal use).
- **Not** redesigning the existing structured CSV importer in the web UI — this is an additional,
  conversational path alongside it, not a replacement.

## Constraints / relevant history

- **`specs/applications/finance/tasks.md` Phase 49 ("MCP Server Integration", T1275–T1289)
  already exists as a detailed spec** — found after this intent was first drafted. It already
  names the full tool surface (`finance_get_transactions`, `finance_add_manual_transaction`,
  `finance_get_bills_due`, `finance_get_pot_balances`, `finance_get_savings_goals`,
  `finance_get_disposable_income`, `finance_get_financial_health_score`,
  `finance_get_ai_insights`, `finance_get_cashflow_forecast`, `finance_get_monthly_report`,
  `finance_get_tax_year_summary`, `finance_compare_months`, `finance_export_transactions`, and
  more) — use these names/shapes rather than inventing new ones.
- **One assumption in Phase 49 is outdated and shouldn't be carried forward**: it specs
  `finance-mcp` as a network-bound service (`FINANCE_MCP_BIND_ADDRESS`, defaulting to
  localhost-only). `life-mcp` — built after this spec was written — actually runs as a stdio
  process launched per-user by Claude Code, authenticating with that user's own login, not a
  network service. Follow `life-mcp`'s real, proven pattern instead — it also fits the sharing
  model better: Jay's and Jade's Claude sessions each run their own `finance-mcp`, each with their
  own login, each seeing whatever `AccountSharingService` (see the VPS-migration intent) says
  they can see.
- Phase 49's spec lists "Phase 44 [Financial Dashboard & Reports] complete" as a dependency —
  not done yet. Building `finance-mcp` ahead of that is a deliberate reprioritisation, not an
  oversight, but means tools like `finance_get_monthly_report`/`finance_get_financial_health_score`
  need either a minimal version of the not-yet-built `DashboardService`/`ReportsService` logic, or
  a simpler direct implementation that doesn't wait for Phase 44.
- `life-mcp` (`apps/life-mcp/`) is the direct template beyond the tool names themselves — same
  auth model, same resource structure, same test approach.
- The existing CSV importer's dedup logic (`CsvImportService.cs`) already solves "don't
  double-import the same transaction" for the structured path — reuse its matching logic rather
  than inventing a second dedup mechanism.
- Every finance-mcp write should land in the general activity log described in the sibling
  VPS-migration intent, not a separate MCP-only audit table — one place to answer "who did what."
- Depends on the sibling VPS-migration intent being done first (or at least decided) — this
  should be built and tested against finance-api's *real* eventual location, not the dev-PC copy
  that's about to stop being canonical.

---
*Sibling intents: `2026-09-13-finance-vps-migration-and-sharing.md`,
`2026-09-13-finance-insights-and-alerts.md`.*
