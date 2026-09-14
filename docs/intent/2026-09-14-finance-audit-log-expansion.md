# Intent: finish threading the activity log through the rest of finance-api

## The pain point

`ActivityLogService` shipped in the account-sharing PR (#153), but only `AccountService` was
actually wired up to call it — every other write path (transactions, bills, budgets, spending
pots, savings goals, income streams, category rules) is silent. Now that two real users can write
to the same shared account, "who changed this bill" or "who deleted this transaction" is
unanswerable for anything except account edits themselves. The `FinanceActivityType` enum already
has `Created`/`Updated`/`Deleted` values reserved for all seven of these entities — the
infrastructure was built expecting this, it just hasn't been finished.

## Why now

Explicitly flagged as a follow-up in PR #153's own description at the time
("Other services... get threaded through alongside the sharing feature itself" — turned out not
to happen even in the sharing PR), and next on the list agreed after finishing the transaction
sharing-visibility fix (#156, which deliberately excluded logging to keep that diff focused on one
thing).

## What "done" looks like

- Every write path in `BillService`, `BudgetService`, `SpendingPotService`, `SavingsGoalService`,
  `IncomeStreamService`, `CategoryRuleService`, and `TransactionService` (Create/Update/Delete, and
  the handful of dedicated write actions like a goal contribution or marking a bill paid) writes an
  `ActivityLog` row, exactly matching how `AccountService` already does it: changed-field *names*
  only on update (never values — several of these fields are column-encrypted), real caller IP/
  user-agent threaded from each controller, no log entry when an update actually changes nothing.
- Every controller in scope gets the same `GetIpAddress()`/`GetUserAgent()` helper pair
  `AccountsController` already has, and threads them into its service calls.
- `GET /api/v1/finance/activity-logs` (already built, already sharing-aware) starts actually
  showing something for these entities instead of just account edits.

## Explicitly out of scope

- Not adding new `FinanceActivityType` values for the handful of dedicated actions (goal
  contribution, spending-pot contribution/transaction-assignment, marking a bill paid, CSV
  import de-dupe review) — logging those as the entity's existing `Updated` type with a
  descriptive changed-field name is simpler and doesn't need a migration. `CsvImportCompleted`
  already exists and is a partial exception worth using where it fits (CSV import).
- Not touching `CategoryRulesController`'s `apply-all` bulk action's per-rule logging — it already
  returns an `{ updated: int }` count; logging every rule it touched individually would be noisy
  for something that's really one caller action. One log entry for the bulk action itself is
  enough, if any.
- Not adding a `CategoryCreated`/`Deleted` audit type — `Category` isn't in the reserved enum
  list, and categories are lower-stakes (no money value) than the other seven entities.

## Constraints / relevant history

- `AccountService` (`apps/finance-api/Features/Accounts/Services/AccountService.cs`) is the
  reference implementation for the exact pattern to copy — constructor-injected
  `IActivityLogService`, optional trailing `ipAddress`/`userAgent` params, a `changedFields` list
  built up field-by-field on update, one `LogAsync` call per write, skipped entirely when nothing
  changed.
- Stacked on the still-open `fix/finance-api-transaction-sharing-visibility` (#156), since that PR
  already touches `TransactionService.cs` and `TransactionsController.cs` — building on top of it
  rather than off `main` avoids two open PRs editing the same files at once.
- `ActivityLog.Description` must never embed the plaintext of an encrypted column (several of
  these entities have encrypted `Name`/`Notes`/`Pattern` fields) — same rule `AccountService`
  already follows.

---
*Related: `docs/intent/2026-09-14-transaction-sharing-visibility.md`.*
