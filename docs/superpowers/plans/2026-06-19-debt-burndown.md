# Debt Burndown & Financial Affordability — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task.

**Goal:** Three interconnected Finance features — Bill-to-Account Linking, Affordability Engine, and Debt Burndown with Avalanche/Snowball/Custom payoff strategies.

**Spec:** `specs/applications/finance/debt-burndown.md`
**Tasks:** T1322–T1357 in `specs/applications/finance/tasks.md`
**Architecture:** .NET 8 Finance API (`apps/finance-api/`) + React/TypeScript frontend (`apps/web/src/`). Feature-based folder structure. All migrations stop `dotnet watch` first.

---

## File Map

### Phase 1 — Bill-to-Account Linking (T1322–T1330)

| Action | Path |
|--------|------|
| Modify | `apps/finance-api/Features/Bills/Models/Bill.cs` — add `AccountId?`, `Account?` nav, `BillResponse` DTO, update request records |
| Modify | `apps/finance-api/Features/Transactions/Models/Transaction.cs` — add `BillId?` nullable FK |
| Modify | `apps/finance-api/Data/FinanceDbContext.cs` — configure Bill→Account FK, Transaction→Bill FK |
| Modify | `apps/finance-api/Features/Bills/Services/IBillService.cs` — add `GetByAccountIdAsync`, change list return to `BillResponse` |
| Modify | `apps/finance-api/Features/Bills/Services/BillService.cs` — project to `BillResponse`, add `GetByAccountIdAsync`, add `MatchBillsToTransactionsAsync` |
| Modify | `apps/finance-api/Features/Bills/Controllers/BillsController.cs` — add `?accountId` query param |
| Modify | `apps/finance-api/Features/Transactions/Services/CsvImportService.cs` — add bill-matching pass post-import |
| Modify | `apps/finance-api/Program.cs` — no change needed (BillService already registered) |
| Migration | `AddBillAccountLink` — adds `bills.account_id`, `transactions.bill_id` |
| Modify | `apps/web/src/types/finance.ts` — add `accountId?`, `accountName?` to `Bill`, update request types |
| Modify | `apps/web/src/services/bill-service.ts` — add `getByAccount(accountId)` |
| Modify | `apps/web/src/components/finance/BillForm.tsx` — add optional account selector |
| Modify | `apps/web/src/components/finance/BillsDashboard.tsx` — show linked account badge |
| Modify | `apps/web/src/components/finance/AccountsDashboard.tsx` — show "Monthly commitments: £X/mo" |
| Create | `apps/web/src/components/finance/__tests__/BillForm.test.tsx` |
| Create | `apps/web/src/components/finance/__tests__/BillsDashboard.test.tsx` |
| Create | `apps/web/src/components/finance/__tests__/AccountsDashboard.test.tsx` |
| Modify | `apps/finance-api-tests/FinanceApi.UnitTests/Features/Bills/Services/BillServiceTests.cs` |
| Modify | `apps/finance-api-tests/FinanceApi.IntegrationTests/Features/Bills/BillsControllerTests.cs` |

### Phase 2 — Affordability Engine (T1331–T1335)

| Action | Path |
|--------|------|
| Create | `apps/finance-api/Features/Settings/Models/UserFinanceSettings.cs` — entity + DTO |
| Modify | `apps/finance-api/Data/FinanceDbContext.cs` — add `UserFinanceSettings` DbSet + config |
| Create | `apps/finance-api/Features/Affordability/Services/IAffordabilityService.cs` |
| Create | `apps/finance-api/Features/Affordability/Services/AffordabilityService.cs` — income detection, committed costs, discretionary, safe surplus |
| Create | `apps/finance-api/Features/Affordability/Controllers/AffordabilityController.cs` — GET /finance/affordability, PUT /finance/affordability/income |
| Modify | `apps/finance-api/Program.cs` — register AffordabilityService |
| Migration | `AddUserFinanceSettings` — adds `user_finance_settings` table |
| Modify | `apps/web/src/types/finance.ts` — add `AffordabilityResult`, `UserFinanceSettings` interfaces |
| Create | `apps/web/src/services/affordability-service.ts` |
| Create | `apps/web/src/components/finance/AffordabilityPanel.tsx` |
| Create | `apps/finance-api-tests/FinanceApi.UnitTests/Features/Affordability/Services/AffordabilityServiceTests.cs` |

### Phase 3 — Debt Burndown (T1336–T1357)

| Action | Path |
|--------|------|
| Modify | `apps/finance-api/Features/Accounts/Models/Account.cs` — add `MinimumMonthlyPayment`, `CurrentMonthlyPayment`, `LoanEndDate`, `IsInterestOnly` |
| Modify | `apps/finance-api/Features/Accounts/Services/IAccountService.cs` — extend `AccountSummary`, `CreateAccountRequest`, `UpdateAccountRequest` records |
| Modify | `apps/finance-api/Features/Accounts/Services/AccountService.cs` — map new fields |
| Modify | `apps/finance-api/Data/FinanceDbContext.cs` — HasPrecision for new decimal fields |
| Migration | `AddDebtPaymentFields` — adds 4 columns to `accounts` |
| Create | `apps/finance-api/Features/Debt/Models/DebtModels.cs` — all debt DTOs/response records |
| Create | `apps/finance-api/Features/Debt/Services/IDebtSeverityService.cs` |
| Create | `apps/finance-api/Features/Debt/Services/DebtSeverityService.cs` — scoring algorithm |
| Create | `apps/finance-api/Features/Debt/Services/IDebtProjectionService.cs` |
| Create | `apps/finance-api/Features/Debt/Services/DebtProjectionService.cs` — monthly loop, Avalanche/Snowball/Custom, cascade freed minimums |
| Create | `apps/finance-api/Features/Debt/Controllers/DebtController.cs` — GET /finance/debt/overview, POST /finance/debt/projection |
| Modify | `apps/finance-api/Program.cs` — register DebtSeverityService, DebtProjectionService |
| Create | `apps/finance-api/Features/Currency/Services/IExchangeRateService.cs` |
| Create | `apps/finance-api/Features/Currency/Services/ExchangeRateService.cs` — ECB XML feed, 24h cache |
| Create | `apps/finance-api/Features/Currency/Controllers/CurrencyController.cs` — GET /finance/currency/rates |
| Create | `apps/finance-api-tests/FinanceApi.UnitTests/Features/Debt/Services/DebtSeverityServiceTests.cs` |
| Create | `apps/finance-api-tests/FinanceApi.UnitTests/Features/Debt/Services/DebtProjectionServiceTests.cs` |
| Create | `apps/finance-api-tests/FinanceApi.IntegrationTests/Features/Debt/DebtControllerTests.cs` |
| Create | `apps/finance-api-tests/FinanceApi.UnitTests/Features/Currency/Services/ExchangeRateServiceTests.cs` |
| Modify | `apps/web/src/types/finance.ts` — add debt + account debt field interfaces |
| Modify | `apps/web/src/types/finance.ts` — extend `AccountSummary`, `CreateAccountRequest`, `UpdateAccountRequest` |
| Create | `apps/web/src/services/debt-service.ts` |
| Modify | `apps/web/src/components/finance/AccountForm.tsx` — conditional debt fields by account type |
| Create | `apps/web/src/components/finance/DebtOverviewCard.tsx` |
| Create | `apps/web/src/components/finance/DebtStrategySelector.tsx` |
| Create | `apps/web/src/components/finance/DebtProjectionPanel.tsx` |
| Create | `apps/web/src/components/finance/DebtWaterfallChart.tsx` — Recharts horizontal bar |
| Create | `apps/web/src/components/finance/DebtBurndownDashboard.tsx` — orchestrator |
| Create | `apps/web/src/components/finance/CurrencySettings.tsx` |
| Modify | `apps/web/src/pages/finance/FinancePage.tsx` — add `debt` tab |
| Create | `apps/web/src/components/finance/__tests__/DebtOverviewCard.test.tsx` |
| Create | `apps/web/src/components/finance/__tests__/DebtStrategySelector.test.tsx` |
| Create | `apps/web/src/components/finance/__tests__/DebtWaterfallChart.test.tsx` |

---

## Key Design Decisions

- **BillResponse DTO**: New record in `Bill.cs` alongside the entity. All list endpoints return `BillResponse` (includes `AccountName?`). Write endpoints still accept existing request records. Existing integration tests updated to deserialise `BillResponse` where affected.
- **Transaction.BillId**: Nullable FK added in the `AddBillAccountLink` migration alongside `Bill.AccountId`. No cascade delete — a deleted bill does not delete transactions.
- **UserFinanceSettings**: Created fresh for Phase 43b (T1307 deferred). Entity has `UserId` (PK), `ManualMonthlyIncome` (decimal?), `EmergencyBuffer` (decimal, default 200).
- **AccountSummary positional record**: New debt fields appended as optional params at the end so existing call sites compile unchanged.
- **Client-side projection**: `DebtBurndownDashboard` holds last `ProjectionResponse` from API. Slider changes re-run a TypeScript port of the projection loop (pure function in `debt-utils.ts`) — API called only on strategy or account inclusion changes.
- **Migration workflow**: Stop `dotnet watch`, run `dotnet ef migrations add <Name> --project apps/finance-api --startup-project apps/finance-api`, restart watch.

---

## Task Checklist (mark [x] in tasks.md as each completes)

### Phase 1
- [ ] T1322 — Bill.AccountId + Transaction.BillId + migration AddBillAccountLink
- [ ] T1323 — BillService BillResponse projection + GetByAccountIdAsync
- [ ] T1324 — BillsController accountId filter
- [ ] T1325 — CsvImportService bill-matching pass
- [ ] T1326 — BillForm account selector
- [ ] T1327 — BillsDashboard account badge
- [ ] T1328 — AccountsDashboard monthly commitments
- [ ] T1329 — Backend unit tests (8+)
- [ ] T1330 — Frontend Jest tests (6+)

### Phase 2
- [ ] T1331 — UserFinanceSettings entity + migration
- [ ] T1332 — AffordabilityService
- [ ] T1333 — AffordabilityController
- [ ] T1334 — AffordabilityService unit tests (10+)
- [ ] T1335 — AffordabilityPanel component

### Phase 3
- [ ] T1336 — Account model + migration AddDebtPaymentFields
- [ ] T1337 — AccountSummary/DTOs/AccountForm updates
- [ ] T1338 — DebtSeverityService
- [ ] T1339 — DebtProjectionService
- [ ] T1340 — DebtController
- [ ] T1341 — DebtSeverityService tests (10+)
- [ ] T1342 — DebtProjectionService tests (12+)
- [ ] T1343 — DebtController integration tests (8+)
- [ ] T1344 — TypeScript debt interfaces
- [ ] T1345 — DebtOverviewCard
- [ ] T1346 — DebtStrategySelector
- [ ] T1347 — DebtProjectionPanel
- [ ] T1348 — DebtWaterfallChart
- [ ] T1349 — DebtBurndownDashboard + Debt tab
- [ ] T1350 — Frontend Jest tests (10+)
- [ ] T1351 — E2E test
- [ ] T1352 — ExchangeRateService
- [ ] T1353 — CurrencyController
- [ ] T1354 — ExchangeRateService tests (6+)
- [ ] T1355 — CurrencySettings component
- [ ] T1356 — CurrencySettings Jest tests (3+)
- [ ] T1357 — Full finance E2E
