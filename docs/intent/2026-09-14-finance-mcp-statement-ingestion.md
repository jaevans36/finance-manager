# Intent: finance-mcp, slice 2 — actually let Jay hand over statements

## The pain point

Slice 1 (`docs/intent/2026-09-13-finance-mcp-and-ingestion.md`, delivered as
`finance-mcp` core tools) gave Claude read access and single manual-transaction entry,
but the actual point of the original intent — "hand Claude a messy real-world mix of
things (a CSV export, an old PDF statement, a spoken credit card balance) and have it
land correctly" — still isn't possible. There's no way to import a batch of
transactions at all, and no way to enter or complete debt-account details (interest
rate, credit limit, promotional terms) through conversation, so any debt projection
run today is working off whatever was typed into the web UI, if anything.

## Why now

Next on the list agreed after finishing the finance-api hardening work (transaction
sharing-visibility, audit-log expansion). This is the harder, more valuable half of
the original finance-mcp intent — the half that was explicitly deferred out of slice 1.

## What "done" looks like

- **CSV exports and PDF statements both go through one path.** finance-api's existing
  CSV importer already accepts a `generic` bank format (`Date,Description,Amount`,
  a handful of common date formats) alongside its named-bank parsers. Claude reading a
  PDF statement natively (no new tooling needed for that) and building a small
  `generic`-format CSV from what it read is the same shape of work as forwarding an
  actual CSV export — one new finance-mcp tool wrapping the existing
  `POST /transactions/import` endpoint covers both cases.
- **Duplicate detection is inherited, not reinvented.** The existing importer already
  dedupes against the real database (`AccountId + TransactionDate + Amount +
  OriginalDescription`), not conversation memory, so cross-session "have I already
  given you this" already holds for anything that goes through this one path.
- **Debt-account fields can be entered and completed conversationally.** A new
  finance-mcp tool to update an account (the fields `AccountService.UpdateAccountAsync`
  already accepts — interest rate, credit limit, minimum payment, promotional
  rate/expiry, mortgage term, current monthly payment), plus a completeness-check tool
  that looks at what a debt projection actually depends on and reports what's missing,
  so entering "my Barclaycard, £2,400 owed" gets a follow-up question about the
  interest rate rather than silently producing a wrong projection later.
- **A repeated balance figure updates the account, not a phantom transaction.** The
  same account-update tool covers "my mortgage balance is now £X" — that's an
  `UpdateAccountRequest.Balance` write, not a transaction, and isn't something the CSV
  dedup logic needs to reason about at all.

## Explicitly out of scope

- **Not building a second, PDF-specific parser.** Claude's own PDF reading extracts the
  table; the only new code is the CSV-shaped submission path, which already exists.
  If a genuinely image-only (scanned) PDF shows up with no text layer, that's still
  out of scope — same as slice 1's original intent said.
- **Not the remaining Phase 49 tools** (financial health score, AI insights, cashflow
  forecast, monthly report, tax year summary, compare months, export) — unrelated to
  ingestion, still deferred.
- **Not a live bank feed / Open Banking integration** — ruled out in the original
  intent, still true.
- **Not redesigning the web UI's structured CSV importer** — this is an additional,
  conversational path alongside it.

## Constraints / relevant history

- `CsvImportService.ImportAsync` (`apps/finance-api/Features/Transactions/Services/`)
  is the reference implementation for both the dedup logic and the `generic` format —
  read it before building the finance-mcp side, don't restate its matching rules.
- The REST endpoint (`POST /transactions/import`) takes `multipart/form-data` with an
  `IFormFile`; the finance-mcp tool needs to build that request from a text CSV string
  (axios `FormData` with a `Blob`/`Buffer` part), not the raw file upload UX a human
  gets from the web app.
- `AccountService.UpdateAccountAsync`'s full field list (`apps/finance-api/Features/
  Accounts/Services/AccountService.cs`) is the exact set of fields the new account-
  update tool should expose — don't invent new ones, don't drop any.
- Completeness checking is a finance-mcp-side concern, not a finance-api one — no new
  backend endpoint, just a tool that fetches the account (already possible via
  `finance_get_accounts`) and evaluates it against a fixed required-field list per debt
  `AccountType` (Credit, Mortgage, Loan).
- `finance_get_transactions`'s known gap (can't see transactions on a shared-but-not-
  owned account — see PR #156's own note, since PR #156 only fixed this at the
  finance-api layer for shared accounts the *caller* has visibility into, which is the
  normal case for Jay importing into his own accounts) doesn't block this slice — Jay
  is importing into accounts he owns.

---
*Sibling/parent intents: `2026-09-13-finance-mcp-and-ingestion.md`,
`2026-09-13-finance-vps-migration-and-sharing.md`.*
