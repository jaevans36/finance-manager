# Intent: finance-mcp, slice 3 — the everyday-conversation reporting tools

## The pain point

Slices 1 and 2 gave Claude read access, manual transaction entry, statement
ingestion, and debt-account entry/completeness-checking — but most of the *other*
things someone would naturally ask a finance assistant conversationally still have
no tool at all: "was that Tesco transaction categorised right?", "have I got any
subscriptions I've forgotten about?", "how's my Groceries pot doing this month?",
"what's my total monthly income across all my streams?". Right now none of that is
answerable through `finance-mcp` — Claude would have to guess or say it doesn't know.

## Why now

Picked up straight after the net-worth-history and change-password work, continuing
down the agreed backlog. Phase 49 (`specs/applications/finance/tasks.md`, T1275–T1289)
already specs the full remaining tool surface by name — this slice implements the
subset of it that's a pure wrapper over an *already-built, already-tested* finance-api
endpoint, deliberately leaving out the tools that would need new backend design work.

## What "done" looks like

8 new `finance_*` tools, each wrapping one existing REST endpoint — no new finance-api
code, same "reuse existing endpoints" discipline as slices 1 and 2:

- **`finance_search_transactions`** — `GET /transactions?search=` (the same endpoint
  `finance_get_transactions` uses; this is a distinctly-named, `search`-first variant
  for "find that specific transaction" rather than "browse recent transactions",
  matching Phase 49's separate tool name).
- **`finance_categorise_transaction`** — `PATCH /transactions/{id}` sending only
  `categoryId`.
- **`finance_get_recurring_payments`** — `POST /bills/detect-recurring?days=` (a
  detection query with no side effects, despite the POST verb).
- **`finance_update_pot_budget`** — `PUT /pots/{id}`.
- **`finance_get_monthly_budget_summary`** — `GET /budgets/current`, with total
  budgeted/spent/remaining summed client-side in the tool alongside the per-category
  breakdown the endpoint already returns.
- **`finance_get_income_summary`** — `GET /income-streams`, with the total monthly
  income summed client-side alongside the per-stream breakdown.
- **`finance_update_savings_goal`** — `PUT /goals/{id}`.
- **`finance_get_ai_insights`** — `GET /insights` (already returns exactly the
  aggregated card shape this tool needs — built for this).

## Explicitly out of scope

- **Not the tools with no backend endpoint at all**: `finance_get_transaction_summary`,
  `finance_get_bill_history`, `finance_flag_bill_for_review`,
  `finance_get_pot_transactions`, `finance_get_financial_health_score`,
  `finance_get_cashflow_forecast`, `finance_get_monthly_report`,
  `finance_get_tax_year_summary`, `finance_compare_months`,
  `finance_export_transactions`. Each of these needs a real finance-api design
  decision (what actually constitutes a "health score"? what does a "monthly report"
  contain?) — not something to invent unsupervised overnight. A future slice, once
  those are scoped with Jay.
- **Not the cross-cutting Phase 49 items** (T1280 claim-tier enforcement, T1281 a
  dedicated `finance.mcp_audit_log` table) — every finance-mcp write already lands in
  the general activity log via the finance-api service it calls (`AccountService`,
  `TransactionService`, etc. already call `IActivityLogService`), so there's no gap
  to close here; a separate MCP-specific audit table would just duplicate that.
- **Not the `FinanceChatPanel` frontend work** (T1285/T1286/T1288) — that's a web UI
  feature, unrelated to the MCP server itself.
- **Not `FINANCE_MCP_BIND_ADDRESS`/Tailscale docs** (T1287) — outdated network-service
  assumption superseded by `life-mcp`'s real stdio-per-user pattern, as already noted
  in slice 1's intent doc.

## Constraints / relevant history

- `apps/life-mcp/src/tools/finance/` is the established structure — one file per tool,
  grouped by feature-area subfolder, each exporting a `defineTool(...)` result; API
  clients live one-per-feature-area in `apps/life-mcp/src/api/finance-*-api.ts`; DTOs
  mirroring the C# response shapes live in `apps/life-mcp/src/types/finance-*.ts`.
  Read `apps/life-mcp/src/tools/finance/accounts/update-account.ts` (a PATCH-style
  update) and `apps/life-mcp/src/tools/finance/transactions/get-transactions.ts` (a
  GET-with-params list) before writing anything new — don't reinvent the shape.
- `GET /transactions` requires `accountId` (non-nullable server-side) — there's no
  cross-account search today, so `finance_search_transactions` is scoped to one
  account at a time, same as `finance_get_transactions`.
- `defineTool`'s error wrapping (`apps/life-mcp/src/tools/_register.ts`) means tool
  handlers never need their own try/catch — any thrown error (including an `AxiosError`
  from a failed HTTP call) already becomes a correct `isError` tool result via
  `toToolError`.
- Test pattern: `apps/life-mcp/src/tools/finance/__tests__/finance-tools.test.ts` mocks
  each `api/finance-*-api.ts` module with `jest.mock`, and covers, per tool: Zod schema
  validation via a local `parse()` helper, the handler's happy path (asserting both
  `content[0].text` and `structuredContent`), and one API-error-maps-to-`isError` case.

---
*Sibling/parent intents: `2026-09-13-finance-mcp-and-ingestion.md`,
`2026-09-14-finance-mcp-statement-ingestion.md`.*
