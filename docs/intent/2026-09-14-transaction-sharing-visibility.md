# Intent: fix transaction access to actually respect account sharing (and a real IDOR gap)

## The pain point

Account sharing (`docs/intent/2026-09-13-finance-vps-migration-and-sharing.md`) shipped with
`AccountsController` sharing-aware, but `TransactionsController` was never updated to match — it
still filters every read/write by `Transaction.UserId == callerId` (who *created* the row), not by
account visibility. Two distinct problems fall out of that:

1. **The sharing feature doesn't actually work for transactions.** A recipient who accepts a share
   can see the account exists (via `AccountsController`) but `GET /transactions?accountId=...`
   returns nothing for it, because every transaction on that account was created by the owner and
   carries the owner's `UserId`, not the recipient's. "Full read/write once accepted" — the
   explicit design intent recorded on `AccountShare`'s doc comment — isn't true in practice for the
   one resource (transactions) that actually makes an account useful to look at.
2. **`CreateTransactionAsync` and the CSV import path have no ownership check at all.** Neither
   checks that the caller owns or has been shared the target `AccountId` before writing to it —
   any authenticated user who knows (or guesses) another user's account GUID can inject a
   transaction into it, silently mutating that account's balance. This isn't a sharing gap, it's a
   pre-existing authorization hole that happens to be getting fixed alongside the sharing one,
   since both need the same visibility check threaded into the same code.

## Why now

Found while working down the "known gaps" list from last night's account-sharing PR review —
flagged there as "transactions aren't sharing-aware yet" without the IDOR angle having been
spotted. Worth fixing before Jade actually starts using a shared account and hits the "I can see
it but it's empty" wall, and before the write-side gap sits any longer with two real user accounts
now live on the system.

## What "done" looks like

- A recipient who's accepted a share can list, view, add, edit, and delete transactions on that
  account exactly as the owner can — matching what `AccountsController` already does.
- Nobody — shared or not — can read, create, update, or delete a transaction (or CSV-import into
  an account) they have no visibility into, regardless of who technically "owns" the row.
- The existing "not-owner and not-found both look like 404" principle from `AccountSharingController`
  carries over here too: a caller with no visibility into an account shouldn't be able to tell "this
  transaction doesn't exist" from "it exists but isn't yours to see."

## Explicitly out of scope

- Not touching Bills, Budgets, or Spending Pots — checked the data model and none of them are
  meaningfully account-scoped the way Transactions are (Bills are user-owned with an *optional*
  account link; Budgets/Pots are category-scoped, not account-scoped) — sharing an account doesn't
  obviously imply sharing those, and doing it anyway would be guessing at a product decision nobody's
  made. Revisit only if a real use case for it shows up.
- Not adding activity-log audit entries for transaction writes here — that's threading
  `ActivityLogService` through the rest of finance-api generally, a separate, already-queued
  follow-up that touches Bills/Budgets/Pots/Goals/IncomeStreams/CategoryRules too. Bundling it into
  this fix would blur two unrelated changes into one diff.
- Not changing what `Transaction.UserId` means or how it's stored — it stays "who created this
  row" (useful provenance), it just stops being used as the *authorization* filter.

## Constraints / relevant history

- `IAccountSharingService.GetVisibleAccountIdsAsync(userId)` already exists and its own doc
  comment says it's "the visibility set every other finance-api read/write path should use instead
  of a raw `UserId == callerId` filter" — this was clearly anticipated, just not finished.
  `AccountService` is the reference implementation for the pattern to copy.
- `CsvImportService.ImportAsync` also has no ownership check and needs the same fix — it's a write
  path into an `AccountId`, same as `CreateTransactionAsync`.

---
*Sibling intent: `2026-09-13-finance-vps-migration-and-sharing.md`.*
