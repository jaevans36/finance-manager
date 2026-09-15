# Intent: structured JSON transaction import for finance-mcp

## The pain point

`finance_import_transactions` (slice 2) already lets Claude hand over a batch of
transactions by building a generic CSV (`Date,Description,Amount`) and posting it
through the same importer a real bank export goes through. That's the right call for
an actual bank CSV export — but when Claude is the one assembling the batch (reading a
PDF statement, or being told several transactions conversationally), the generic CSV
shape is a lossy middle step: anything richer that's already known — which category a
spend belongs to, a clean payee name distinct from the raw statement text, a note —
gets flattened into three columns and then thrown away, since the generic parser only
ever extracts date/description/amount.

## Why now

Raised directly by Jay while discussing what finance-mcp can and can't do yet: "will
[a JSON endpoint] give more control over the data rather than relying on the CSV
importer to be mapped correctly?" — yes, and it's a small, well-scoped addition on top
of already-shipped, already-tested infrastructure, so it's a natural next step
alongside the reporting-tools slice.

## What "done" looks like

- **A new endpoint, not a new import mechanism.** `POST /api/v1/finance/transactions/
  import-json` takes `{ accountId, entries: JsonTransactionEntry[] }` and reuses
  `CsvImportService`'s exact dedup/insert/balance-update/bill-matching pipeline
  (refactored into a shared private `ImportRowsAsync`, parameterised by `ImportSource`)
  — the CSV path (`ImportAsync`) and the new JSON path (`ImportJsonAsync`) both funnel
  through it. Same duplicate detection (account + date + amount + description), same
  bill auto-matching, same activity-log entry shape.
- **Genuinely richer per-entry data**: `JsonTransactionEntry` carries `categoryId`,
  `payee` (an override, not just the auto-normalised merchant name), and `notes` —
  none of which the generic CSV shape can carry — alongside the same
  date/description/amount/type/reference the CSV path already has.
- **A new `ImportSource.JsonImport` value** (appended, not inserted, to avoid disturbing
  the existing string-serialised enum) so "how did this transaction get here" stays
  answerable in the audit trail, same granularity as `Manual`/`CsvImport`/`BankSync`.
- **A matching finance-mcp tool**, `finance_import_transactions_json`, alongside the
  existing `finance_import_transactions` — not a replacement. Claude picks whichever
  fits: CSV/generic-CSV for an actual bank export, JSON when it already has structured
  detail worth keeping.

## Explicitly out of scope

- **Not deprecating or changing `finance_import_transactions`/the CSV path** — real
  bank exports and the generic-CSV-from-a-PDF case are still exactly as good a fit for
  CSV as before; this is an addition, not a migration.
- **Not validating `categoryId` against the caller's actual category list** — mirrors
  `TransactionService.CreateTransactionAsync`'s existing behaviour (assigns
  `request.CategoryId` directly, no existence/ownership check, relies on the FK
  constraint) exactly, for consistency rather than inventing stricter validation only
  for this one path.

## Constraints / relevant history

- `CsvImportService.ImportAsync`'s per-row loop (dedup check, `Transaction` creation,
  balance update, bill-matching, skip-message capping) was the extraction target — read
  it before touching either import path, don't restate the dedup key
  (`AccountId + TransactionDate + Amount + OriginalDescription`) elsewhere.
- `TransactionService.CreateTransactionAsync`/`UpdateTransactionAsync`
  (`apps/finance-api/Features/Transactions/Services/TransactionService.cs`) is the
  precedent for "how much does this codebase validate `CategoryId`" — the answer is
  "not much," followed here deliberately for consistency.
- `ImportSource` is stored as a string (`HasConversion<string>().HasMaxLength(20)` in
  `FinanceDbContext.cs`) — appending `JsonImport` (10 chars) is safe, no migration
  needed for the enum itself.

---
*Related: `docs/intent/2026-09-13-finance-mcp-and-ingestion.md`,
`docs/intent/2026-09-14-finance-mcp-statement-ingestion.md`.*
