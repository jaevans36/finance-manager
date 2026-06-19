# Tasks: Finance Application

**Input**: `specs/applications/finance/spec.md`  
**Project location**: `apps/finance-api/` (standalone .NET 8 microservice)  
**Continues from**: T1154 (Project Rename tasks)  
**Task ID range**: T1155–T1285

**Organisation**: Tasks grouped by 9 phases covering the full Finance application from accounts/CSV import through to MCP server tools.

**Technology Stack**:
- **Backend**: .NET 8.0 Web API, Entity Framework Core 8, Npgsql, CsvHelper, Serilog
- **Frontend**: React 18 + TypeScript, Recharts, shadcn/ui, TanStack Query
- **External APIs**: Alpha Vantage (investment prices), ECB (exchange rates — free)
- **AI**: Rule-based categorisation (MVP); Claude API for insights (Phase 48)
- **Database**: PostgreSQL `finance` schema (isolated from main `public` schema)

## Decisions Codified Before Phase 41

| Decision | Choice | Rationale |
|---|---|---|
| Open Banking vs CSV | **CSV-first** — Open Banking deferred | No third-party dependency, privacy-preserving, works offline. 7 UK bank formats in scope. |
| DB isolation | **Separate `finance` PostgreSQL schema** from day one | Supports future microservices extraction; tighter access control; clear encryption boundary |
| Encryption at rest | **Deferred for MVP** — use application-level auth + TLS | Full AES-256 column encryption added in Phase 48+ once schema is stable |
| AI categorisation | **Rule-based for MVP** (keyword matching) | Deterministic, no API cost, explainable. Claude API for Phase 48 insights |
| Multi-user | **Single-user for MVP** — no partner finance sharing | Simplifies auth model; multi-user added post-MVP if needed |
| UK account types | **Include in Phase 41 data model** | UK-first; add the extra enum values now to avoid a migration later |
| Phase ordering | **Finance pulled forward** — starts before Stocks | User decision, June 2026 |
| MCP server | **Register into main Life Manager MCP Server** | Avoids a standalone MCP server; finance tools hook into Phase 64–66 |
| PDF reports | **Deferred** — CSV export only for MVP | QuestPDF added post-MVP if demand exists |

## Note on Existing Placeholder Code

`apps/life-api/Features/Finance/` contains placeholder models (`Account`, `Transaction`, `Category`, `Budget`) and a stub `HealthController`. These were early scaffolding and are **not used** — the real Finance application lives in `apps/finance-api/`. The placeholders can be removed in a cleanup pass (not blocking Phase 41).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 41: Finance Foundation — Accounts & Transactions (Priority: P1)

## Phase 41: Finance Foundation — Accounts & Transactions (Priority: P1)

**Purpose**: New `apps/finance-api/` microservice, account management, CSV import for 7 UK bank formats  
**Estimated Effort**: 2.5 weeks (22 tasks)  
**Dependencies**: None (auth via JWT token validation using same secret as life-api)

### Project Setup (Day 1)

- [x] T1155 [P] [US1] Create `apps/finance-api/` project: `dotnet new webapi -n FinanceApi --output apps/finance-api/ --framework net8.0`; add to `Finance Manager.sln` — 3h
- [x] T1156 [P] [US1] Add NuGet packages: `Npgsql.EntityFrameworkCore.PostgreSQL`, `CsvHelper`, `Microsoft.AspNetCore.Authentication.JwtBearer`, `Serilog.AspNetCore`, `Swashbuckle.AspNetCore` — 1h
- [x] T1157 [P] [US1] Configure JWT bearer auth in `Program.cs` — validate tokens using same `Jwt:Secret` + `Jwt:Issuer` as life-api (shared config); extract `userId` claim — 2h
- [x] T1158 [US1] Add `finance-api` service to `docker-compose.yml` (port 5002, `ASPNETCORE_ENVIRONMENT=Development`, PostgreSQL connection) — 2h
- [x] T1159 [US1] Configure CORS in `Program.cs` to allow `http://localhost:5173` (Vite dev) and production web origin — 1h

### Backend: Entities & DB Schema (Days 2–3)

- [x] T1160 [P] [US1] Define `Account` entity — UK account types (Checking/Savings/Credit/CashIsa/StocksIsa/Sipp/PremiumBonds/LifetimeIsa/Investment/Mortgage/Loan/Other), GBP default — 3h
- [x] T1161 [P] [US1] Define `Transaction` entity — include `userId`, `importBatchId`, `isDuplicate`, `importSource`, `type` (Debit/Credit/Transfer), `baseCurrencyAmount`, `isRecurring`, `payee`, `originalDescription` — 3h
- [x] T1162 [US1] Define `Category` entity (system-level + user-custom, parent/child for subcategories, Lucide icon name, hex colour) — 2h
- [x] T1163 [US1] Create `FinanceDbContext` with `modelBuilder.HasDefaultSchema("finance")` and all entity DbSets — 2h
- [x] T1164 [US1] Create initial EF Core migration `20260603170349_InitialCreate` for `accounts`, `transactions`, `categories` tables in `finance` schema — 1h
- [x] T1165 [US1] Seed 26 default system categories (11 top-level + 15 sub-categories) with Lucide icons and hex colours — 2h

### Backend: Services & API (Days 4–7)

- [x] T1166 [US1] Implement `AccountService` — CRUD, balance update on transaction import, net worth calculation (sum all active non-excluded accounts) — 4h
- [x] T1167 [US1] Implement `AccountsController` — `GET /finance/accounts`, `GET /finance/accounts/{id}`, `POST`, `PATCH /{id}`, `DELETE /{id}`, `GET /finance/accounts/net-worth` — 3h
- [x] T1168 [US1] Implement `CsvImportService` using CsvHelper — bank format registry, `ImportAsync` with batch ID, description normalisation, balance update — 5h
- [x] T1169 [US1] Create bank format adapters in `CsvImportService`: Barclays, Monzo, Starling, Lloyds, HSBC, NatWest, Generic — 4h
- [x] T1170 [US1] Implement duplicate detection — exact match on AccountId + TransactionDate + Amount + OriginalDescription; flag `isDuplicate`, include in result count — 3h
- [x] T1171 [US1] Implement `TransactionService` — CRUD, full-text search (description/payee/reference), filtering (accountId, dateRange, categoryId, type), pagination ordered by date desc — 5h
- [x] T1172 [US1] Implement `TransactionsController` — `GET /finance/transactions`, `GET /{id}`, `POST`, `PATCH /{id}`, `DELETE /{id}`, `POST /import`, `GET /import/formats` — 3h

### Tests (Days 7–8)

- [x] T1173 [US1] Write unit tests for `CsvImportService` — all 7 bank formats, duplicate detection, balance updates, description normalisation, batch ID (18 tests) — 3h
- [x] T1174 [US1] Write unit tests for `AccountService` + `TransactionService` (15+ tests) — 3h
- [x] T1175 [US1] Write integration tests for accounts and transactions controllers (12+ tests) — 3h

### Frontend (Week 2)

- [x] T1176 [P] [US1] Create Finance TypeScript interfaces (`Account`, `AccountSummary`, `Transaction`, `Category`, `CsvImportResult`, `PagedResult`, `NetWorthResponse`) in `apps/web/src/types/finance.ts` — 2h
- [x] T1177 [P] [US1] Create `financeApiClient` (axios instance, `VITE_FINANCE_API_URL`, JWT interceptor); create `accountsService` + `transactionsService` — 2h
- [x] T1178 [US1] Create `CsvImport` component — drag-and-drop upload zone, bank format selector, import result summary (imported/duplicates/errors) — 6h
- [x] T1179 [US1] Create `TransactionList` component — paginated list with reviewed indicator, recurring/duplicate badges, category chip, amount colour-coded — 5h
- [x] T1180 [US1] Create `AccountsDashboard` component — net worth card, account list with type icons and balances, "Add account" action — 4h
- [x] T1181 [US1] Write Jest tests for `CsvImport` (6), `TransactionList` (8), `AccountsDashboard` (6) — total 20 tests — 2h

### Phase 41 Additions (not in original spec — added 2026-06-08)

- [x] T1182a [US1] Create `AccountForm` component — name, type selector, institution, initial balance, excludeFromNetWorth toggle — 3h
- [x] T1182b [US1] Write Jest tests for `AccountForm` (6 tests) — 1h
- [x] T1182c [US1] Create `TransactionFilters` component — search, date range, category selector, type selector — 3h
- [x] T1182d [US1] Create `TransactionDetailPanel` component — modal; shows full details; edit category/notes; marks as reviewed — 4h
- [x] T1182e [US1] Write Jest tests for `TransactionFilters` (6) + `TransactionDetailPanel` (5) — total 11 tests — 2h
- [x] T1182f [US1] Add Accounts + Transactions tabs to `FinancePage` — Accounts: AccountsDashboard + AccountForm; Transactions: account selector → TransactionFilters + TransactionList + TransactionDetailPanel + CsvImport — 4h

### Credit Account Enhancements (new — 2026-06-11)

- [x] T1314 [P] [US1] Add 6 credit detail fields to `Account` entity: `CreditLimit`, `InterestRate`, `PromotionalBalance`, `PromotionalRate`, `PromotionalExpiry` (DateOnly?), `PromotionalRevertRate`; configure `HasPrecision` in `FinanceDbContext` — 2h
- [x] T1315 [US1] Create EF Core migration `AddCreditAccountFields` for new nullable columns — 0.5h
- [x] T1316 [US1] Extend `AccountSummary`, `CreateAccountRequest`, `UpdateAccountRequest` DTOs with new optional fields (default null); update `AccountService` mapping — 2h
- [x] T1317 [US1] Add `[JsonConverter(typeof(JsonStringEnumConverter))]` to all Finance API enum types (`AccountType`, `TransactionType`, `ImportSource`, `BillFrequency`, `RecurringFrequency`, `RecurringPatternType`, `AmountTrend`, `PotType`, `SavingsGoalStatus`, `RuleMatchType`) and register globally in `Program.cs` — 1h
- [x] T1318 [P] [US1] Add `CreditDetail` interface to `finance.ts`; extend `Account`, `AccountSummary`, `CreateAccountRequest`, `UpdateAccountRequest` — 1h
- [x] T1319 [US1] Extend `AccountForm` with edit mode support + conditional fields per account type: credit limit (Credit), overdraft limit (Checking), interest rate (Credit/Loan/Mortgage/Checking), promotional deal box (Credit — balance, rate, expiry, revert rate), fixed rate expiry (Mortgage) — 4h
- [x] T1320 [US1] Add `CreditDetail` sub-component to `AccountsDashboard`: promotional balance row with rate/expiry/revert-rate; standard balance at APR; available credit vs limit; 90-day expiry warning indicator; page-level warning banner — 3h
- [x] T1321 [US1] Add edit (pencil) and delete (trash with inline confirmation) actions to `AccountsDashboard` account rows — 2h

### Merchant Normalisation (new — 2026-06-08)

- [x] T1290 [P] [US1] Define `IMerchantNormalisationService`; implement `MerchantNormalisationService` with 50+ UK merchant patterns; case-insensitive matching; populate `Payee` field — 4h
- [x] T1291 [US1] Integrate `MerchantNormalisationService` into `CsvImportService.ImportAsync()` — sets `Payee` when match found — 1h
- [x] T1292 [US1] Register `IMerchantNormalisationService` as singleton in `Program.cs` — 0.5h
- [x] T1293 [US1] Write unit tests for `MerchantNormalisationService` (27 tests) — 2h

### Category Rules Engine (new — 2026-06-08)

- [x] T1294 [P] [US1] Define `CategoryRule` entity (UserId, Pattern, MatchType: Contains/StartsWith/Exact, CategoryId, Priority, IsActive, AppliedCount) — 2h
- [x] T1295 [US1] Create EF Core migration `AddCategoryRules` for `category_rules` table — 1h
- [x] T1296 [US1] Implement `CategoryRulesService` — CRUD, `ApplyRuleAsync`, `ApplyRulesToAllUnreviewedAsync` — 4h
- [x] T1297 [US1] Implement `CategoryRulesController` — `GET /finance/category-rules`, `POST`, `PATCH /{id}`, `DELETE /{id}`, `POST /apply-all` — 3h
- [x] T1298 [US1] Register `ICategoryRulesService` in `Program.cs` — 0.5h
- [x] T1299 [US1] Write unit tests for `CategoryRulesService` (12 tests) — 3h
- [x] T1300 [US1] Write integration tests for `CategoryRulesController` (7 tests) — 2h
- [ ] T1301 [US1] Create `CategoryRulesManager` frontend component — rules list table (pattern, match type, category, applied count), toggle active, delete, "Create rule" form — 4h
- [ ] T1302 [US1] Write Jest tests for `CategoryRulesManager` (4+ tests) — 1h

### Sinking Funds (new — 2026-06-08, deferred to Phase 42 extension)

- [ ] T1303 [P] [US2] Add `SinkingFund` to `PotType` enum; add nullable `AnnualAmount` (decimal?) and `NextPaymentDate` (DateOnly?) to `SpendingPot` entity; create migration — 2h
- [ ] T1304 [US2] Update `SpendingPotService` — when `Type == SinkingFund`, derive `MonthlyAllocation = AnnualAmount / 12`; expose `MonthsRemaining` and `IsReady` in the progress DTO — 3h
- [ ] T1305 [US2] Create `SinkingFundCard` frontend component — annual amount, monthly allocation, progress bar (accumulated/target), countdown, "Ready" badge — 3h
- [ ] T1306 [US2] Write unit tests for sinking fund logic in `SpendingPotService` (4+ tests) and Jest tests for `SinkingFundCard` (3+ tests) — 2h

### Payday-Aware Budgeting Period (new — 2026-06-08, deferred to Phase 45)

- [ ] T1307 [P] [US-UK] Define `UserFinanceSettings` entity (UserId unique, PaydayDay int?, BaseCurrency string) in `Features/Settings/Models/` — 2h
- [ ] T1308 [US-UK] Create EF Core migration for `user_finance_settings` table — 1h
- [ ] T1309 [US-UK] Implement `FinanceSettingsService` + `FinanceSettingsController` — `GET /finance/settings`, `PUT /finance/settings` — 3h
- [ ] T1310 [US-UK] Implement `PayPeriodCalculator` static helper — `GetCurrentPeriod(paydayDay?)` returns `(DateOnly From, DateOnly To)`, handles month boundary crossing — 2h
- [ ] T1311 [US-UK] Integrate `PayPeriodCalculator` into `BudgetService.GetCurrentBudgetsAsync()` — use pay period when PaydayDay is configured — 2h
- [ ] T1312 [US-UK] Create `FinanceSettings` frontend component — payday day selector (1–28 or "use calendar month"), base currency selector — 2h
- [ ] T1313 [US-UK] Write unit tests for `PayPeriodCalculator` — payday in same month, payday crosses month end, no payday setting (6+ tests) — 2h

**Checkpoint**: Users can create accounts, import CSV from 7 UK bank formats, view categorised transaction list with search/filter; merchant names are normalised; category rules auto-assign on import

---

## Phase 42: Budgeting & Spending Pots (Priority: P1)

**Purpose**: Monthly category budgets + envelope-style spending pots with real-time progress  
**Estimated Effort**: 2 weeks (16 tasks)  
**Dependencies**: Phase 41 complete

### Backend: Entities & Services (Week 1)

- [x] T1182 [P] [US2] Define `Budget` entity (userId, categoryId, month, year, amount, rolloverFromPrevious) and `SpendingPot` entity (userId, name, type, budgetAmount, rolloverEnabled) — 3h
- [x] T1183 [US2] Create EF Core migration for `budgets` and `spending_pots` tables — 1h
- [x] T1184 [US2] Implement `BudgetService` — CRUD, spending progress calculation (join transactions by category+month), 80%/100% threshold alert trigger, next-month auto-creation from template — 5h
- [x] T1185 [US2] Implement `SpendingPotService` — CRUD, transaction auto-assignment to pot by merchant category mapping, pot balance calculation, rollover logic — 5h
- [x] T1186 [US2] Implement `BudgetsController` + `PotsController` — CRUD, `GET /finance/budgets/current`, `GET /finance/budgets/trends`, `POST /finance/pots/:id/assign-transaction` — 4h
- [x] T1187 [US2] Write unit tests for `BudgetService` + `SpendingPotService` (14+ tests) — 3h
- [x] T1188 [US2] Write integration tests for budget and pot endpoints (8+ tests) — 2h

### Frontend (Week 2)

- [x] T1189 [P] [US2] Create `Budget` + `SpendingPot` TypeScript interfaces — 1h
- [x] T1190 [P] [US2] Create `budgetService` + `potService` API methods — 1h
- [x] T1191 [US2] Create `BudgetDashboard` component — category progress bars, green/amber/red colour states at 0%/80%/100%, overspend amount shown — 5h
- [x] T1192 [US2] Create `SpendingPots` component — pot cards (name, icon, budget, spent, remaining), envelope-style progress bars, rollover toggle — 5h
- [x] T1193 [US2] Create `BudgetForm` component — create/edit budget: category selector, amount input, rollover option — 3h
- [x] T1194 [US2] Create `BudgetTrends` component — monthly bar chart comparing budgeted vs actual by category (Recharts) — 4h
- [x] T1195 [US2] Write Jest tests for budget and pot components (10+ tests) — 2h
- [x] T1196 [US2] Write E2E test for budget + pot creation, transaction assignment, and threshold alert flow — 3h

**Checkpoint**: Users can set monthly budgets and spending pots; transactions auto-assign to pots; colour-coded progress with overspend alerts

---

## Phase 43: Bills, Recurring Detection & Savings Goals (Priority: P2)

**Purpose**: Recurring bill tracking, auto-detection of recurring payments, savings goal progress  
**Estimated Effort**: 2 weeks (16 tasks)  
**Dependencies**: Phase 41 complete

### Backend (Week 1)

- [x] T1197 [P] [US4] Define `Bill` entity (name, amount, frequency, dueDay, reminderDaysBefore, isPaid, lastPaidDate) and `SavingsGoal` entity (targetAmount, currentAmount, targetDate, monthlyContribution, status) — 3h
- [x] T1198 [US4/US5] Create EF Core migration for `bills` and `savings_goals` tables — 1h
- [x] T1199 [US4] Implement `RecurringPaymentDetector` — analyse 90 days of transactions, group by merchant name, detect frequency (weekly/monthly/quarterly/annual) and amount stability; classify as Fixed Bill / Variable Bill / Subscription / Regular Spend — 6h
- [x] T1200 [US4] Implement `BillService` — CRUD, upcoming bill list, payment marking (match against imported transaction), price-change detection (flag amount increases vs last period) — 4h
- [x] T1201 [US4] Implement `BillsController` — CRUD, `GET /finance/bills/upcoming`, `PATCH /finance/bills/:id/pay`, `POST /finance/bills/detect-recurring` — 3h
- [x] T1202 [US5] Implement `SavingsGoalService` — CRUD, contributions, on-track projection (current rate vs required rate), milestone notifications — 4h
- [x] T1203 [US5] Implement `GoalsController` — CRUD, `POST /finance/goals/:id/contribute` — 2h
- [x] T1204 [US4/US5] Write unit tests for `RecurringPaymentDetector`, `BillService`, `SavingsGoalService` (16+ tests) — 3h
- [x] T1205 [US4/US5] Write integration tests for bills and goals endpoints (10+ tests) — 3h

### Frontend (Week 2)

- [x] T1206 [P] [US4/US5] Create `Bill`, `RecurringPattern`, `SavingsGoal` TypeScript interfaces — 2h
- [x] T1207 [US4] Create `BillsDashboard` component — upcoming bills timeline, monthly recurring total, calendar dot markers — 4h
- [x] T1208 [US4] Create `RecurringDetected` component — auto-detected payments grid (merchant, avg cost, trend badge: stable/increasing/decreasing), confirm as bill or dismiss — 4h
- [x] T1209 [US4] Create `BillForm` component — name, amount, frequency, due day, category, reminder days — 3h
- [x] T1210 [US5] Create `SavingsGoalsDashboard` component — goal cards with progress bars, on-track status, projected completion date — 4h
- [x] T1211 [US5] Create `SavingsGoalForm` component — target amount, deadline, monthly contribution — 2h
- [x] T1212 [US4/US5] Write Jest tests for bills and savings components (8+ tests) — 2h

**Checkpoint**: Bills tracked manually + auto-detected from imported transactions; savings goals with projection

### Phase 43 Additions — Bill-to-Account Linking (new — 2026-06-19)

- [ ] T1322 [P] [US4] Add `AccountId?` (Guid? nullable FK → Accounts) to `Bill` entity; update `FinanceDbContext` navigation; create migration `AddBillAccountLink` — 1.5h
- [ ] T1323 [US4] Update `BillService` — include `AccountName` in query projections; add `GetByAccountIdAsync`; include `AccountId` + `AccountName` in `BillResponse` DTO — 2h
- [ ] T1324 [US4] Add account-filter to `BillsController`: `GET /finance/bills?accountId={id}` — 1h
- [ ] T1325 [US4] Implement bill-to-transaction matching on import — fuzzy payee (contains bill name), amount ±10%, date ±5 days of due day; matched transaction marks bill paid and sets `Transaction.BillId` — 3h
- [ ] T1326 [US4] Update `BillForm` — optional account selector (dropdown of user's active accounts); null = unlinked — 2h
- [ ] T1327 [US4] Update `BillsDashboard` — show linked account name badge on each bill card; "Not linked" badge when `AccountId` is null — 2h
- [ ] T1328 [US1] Update `AccountsDashboard` — "Monthly commitments: £X/mo" line beneath balance for accounts with linked bills; tooltip lists linked bill names — 2h
- [ ] T1329 [US4] Write unit tests for bill-account linking in `BillService` (8+ tests: link, unlink, get-by-account, matching criteria) — 2h
- [ ] T1330 [US4] Write Jest tests for updated `BillForm`, `BillsDashboard`, `AccountsDashboard` (6+ tests) — 1.5h

### Phase 43b — Financial Affordability Engine (new — 2026-06-19)

- [ ] T1331 [P] [US-UK] Add `ManualMonthlyIncome` (decimal?) to `UserFinanceSettings` entity; extend `FinanceSettingsDto`; create migration `AddManualIncomeToSettings` — 1h
- [ ] T1332 [US-UK] Implement `AffordabilityService` — income detection (90-day credit scan: large regular credits, cadence ±3 days, payroll patterns); committed costs (active bills + minimum payments); discretionary (budget totals or transaction average fallback); safe surplus = income - committed - discretionary - buffer; return `IncomeConfidence` (High/Medium/Low) — 5h
- [ ] T1333 [US-UK] Implement `AffordabilityController` — `GET /finance/affordability` (full breakdown), `PUT /finance/affordability/income` (manual income override) — 2h
- [ ] T1334 [US-UK] Write unit tests for `AffordabilityService` (10+ tests — High/Medium/Low confidence paths, manual override, budget vs average fallback, empty transaction history) — 3h
- [ ] T1335 [US-UK] Create `AffordabilityPanel` frontend component — detected income, committed costs, discretionary, buffer, safe surplus summary; "How is this calculated?" expandable section; manual income input when confidence is Low or user requests — 4h

---

## Phase 44: Financial Dashboard & Reports (Priority: P1)

**Purpose**: Comprehensive financial dashboard with charts, financial health score, and CSV export  
**Estimated Effort**: 1.5 weeks (14 tasks)  
**Dependencies**: Phases 41, 42 complete

### Backend (Week 1, Days 1–3)

- [ ] T1213 [US6] Implement `DashboardService` — aggregate: total balance, this-month income, this-month expenses, savings rate, financial health score (composite: savings rate + budget adherence + emergency fund months) — 5h
- [ ] T1214 [US6] Implement `ReportsService` — spending breakdown by category, income vs expense monthly series, CSV export — 4h
- [ ] T1215 [US6] Implement `DashboardController` — `GET /finance/dashboard`, `GET /finance/dashboard/spending`, `GET /finance/dashboard/income-expense`, `GET /finance/reports/export` — 3h
- [ ] T1216 [US6] Write unit tests for `DashboardService` + `ReportsService` (12+ tests) — 3h
- [ ] T1217 [US6] Write integration tests for dashboard and export endpoints (8+ tests) — 2h

### Frontend (Week 1, Days 4–5)

- [ ] T1218 [US6] Create `FinanceDashboard` page — balance card, income/expense summary, savings rate chip, financial health score badge — 5h
- [ ] T1219 [US6] Create `SpendingBreakdown` component — doughnut chart by category, period selector (this month / last month / 3M / 6M / 1Y / this tax year / last tax year) — 4h
- [ ] T1220 [US6] Create `IncomeVsExpense` chart — monthly bar chart with net-positive/negative line overlay (Recharts) — 4h
- [ ] T1221 [US6] Create `ReportExport` component — date range picker, CSV download trigger — 2h
- [ ] T1222 [US6] Create Finance summary widget for Application Hub (net worth, health score, monthly spend) — 3h
- [ ] T1223 [US1–US6] Add `/finance` route, sidebar navigation entry, page layout with tab navigation (Accounts / Transactions / Budgets / Dashboard) — 2h
- [ ] T1224 [US6] Write Jest tests for dashboard and chart components (8+ tests) — 2h
- [ ] T1225 [US6] Write E2E test for finance dashboard end-to-end data flow — 3h

**Checkpoint**: Financial dashboard with interactive charts, health score, and CSV report export

---

## Phase 45: UK Specifics (Priority: P2)

**Purpose**: UK account types (ISA/SIPP), tax year reporting, cash flow forecasting, net worth timeline  
**Estimated Effort**: 1.5 weeks (10 tasks)  
**Dependencies**: Phase 41 complete (account types already in schema; this phase adds business logic + UI)

### Backend

- [ ] T1226 [P] [US-UK] Implement `IsaAllowanceService` — track combined ISA contributions across all ISA-type accounts for the current tax year (6 Apr–5 Apr), return remaining allowance vs £20,000 cap — 4h
- [ ] T1227 [US-UK] Implement `CashFlowForecastService` — project account balance forward 30/60/90 days using known recurring bills (from bills table) and detected income patterns; flag projected overdraft dates — 5h
- [ ] T1228 [US-UK] Implement UK tax year date-range helpers — `GetCurrentTaxYear()`, `GetLastTaxYear()`, `IsTaxYear(date, year)` — add "This Tax Year" and "Last Tax Year" as filter presets on all report/dashboard endpoints — 2h
- [ ] T1229 [US-UK] Implement `SplitTransactionService` — split one `Transaction` into multiple `TransactionSplit` child records across different categories; parent transaction marked `isSplit = true` — 4h
- [ ] T1230 [US-UK] Write unit + integration tests for UK-specific services (12+ tests) — 2h

### Frontend

- [ ] T1231 [US-UK] Create `IsaAllowanceBadge` component — on ISA account cards: remaining allowance, progress bar vs £20,000 — 2h
- [ ] T1232 [US-UK] Create `CashFlowForecast` component — 30/60/90-day balance projection chart, "projected overdraft" warning banner — 4h
- [ ] T1233 [US-UK] Create `NetWorthTimeline` component — line chart of net worth over time (Recharts, all accounts summed by month) — 3h
- [ ] T1234 [US-UK] Create `SplitTransactionModal` component — split a selected transaction into N category lines with amounts that must sum to original — 3h
- [ ] T1235 [US-UK] Write Jest tests for UK-specific components (6+ tests) — 2h

**Checkpoint**: ISA allowance tracking, cash flow forecast, UK tax year date filters, split transactions

---

## Phase 46: Investment Tracking (Priority: P2)

**Purpose**: Portfolio management with CSV import, performance tracking, and benchmark comparison  
**Estimated Effort**: 1.5 weeks (14 tasks)  
**Dependencies**: Phase 41 complete

### Backend (Week 1, Days 1–3)

- [ ] T1236 [P] [US3] Define `Investment` entity (ticker, name, type, quantity, averageCost, currentPrice, sector, exchange, currency) — 2h
- [ ] T1237 [US3] Create EF Core migration for `investments` table — 1h
- [ ] T1238 [US3] Implement `InvestmentService` — CRUD, portfolio aggregation (total value, unrealised P&L per holding), sector/geography/type allocation — 4h
- [ ] T1239 [US3] Implement portfolio CSV import — Trading 212, Hargreaves Lansdown, Interactive Brokers, Freetrade format adapters — 4h
- [ ] T1240 [US3] Implement `PriceFeedService` — Alpha Vantage daily price fetch (1-day cache, free tier 25 req/min), fallback to cached price if API limit hit — 3h
- [ ] T1241 [US3] Implement `InvestmentsController` — CRUD, `GET /finance/investments/portfolio`, `POST /finance/investments/import`, `GET /finance/investments/performance` — 3h
- [ ] T1242 [US3] Write unit tests for `InvestmentService` + `PriceFeedService` (10+ tests) — 2h
- [ ] T1243 [US3] Write integration tests for investment endpoints (8+ tests) — 2h

### Frontend (Week 1, Days 4–5)

- [ ] T1244 [P] [US3] Create `Investment` TypeScript interfaces (`Investment`, `PortfolioSummary`, `AllocationSlice`) — 1h
- [ ] T1245 [US3] Create `PortfolioDashboard` component — holdings table (ticker, quantity, avg cost, current price, unrealised P&L %, total value), portfolio total — 5h
- [ ] T1246 [US3] Create `AssetAllocation` component — doughnut chart switchable between sector / geography / asset type — 3h
- [ ] T1247 [US3] Create `PerformanceChart` component — portfolio value over time vs FTSE 100 and S&P 500 benchmark lines (Recharts, normalised to same start value) — 4h
- [ ] T1248 [US3] Write Jest tests for portfolio components (8+ tests) — 2h

**Checkpoint**: Investment portfolio with P&L tracking, allocation charts, and benchmark comparison

---

## Phase 47: Debt Burndown & Payoff Planning (Priority: P3)

**Purpose**: Severity-scored debt overview, Avalanche/Snowball/Custom payoff strategies, affordability-driven projection, waterfall visualisation  
**Full spec**: `specs/applications/finance/debt-burndown.md`  
**Estimated Effort**: 2.5 weeks (21 tasks)  
**Dependencies**: Phase 41 complete; Phase 43 Phase 43b (AffordabilityService) required for pre-filled extra payment

> **Note**: Original thin Phase 47 skeleton (T1249–T1252, T1254–T1257, T1259–T1260) is superseded by this expanded spec.
> T1253 (ExchangeRateService) and T1258 (CurrencySettings) are retained below as the multi-currency section.

### Backend: Account Model Extensions

- [ ] T1336 [P] [US9] Extend `Account` entity with `MinimumMonthlyPayment` (decimal?), `CurrentMonthlyPayment` (decimal?), `LoanEndDate` (DateOnly?), `IsInterestOnly` (bool default false); update `FinanceDbContext`; create migration `AddDebtPaymentFields` — 2h
- [ ] T1337 [US9] Update `AccountSummary`, `CreateAccountRequest`, `UpdateAccountRequest` DTOs with new fields; update `AccountService` mapping; update `AccountForm` with conditional fields per type (min payment: Credit/Loan; current payment: all debt types; loan end date: Loan only; interest-only toggle: Mortgage only) — 3h

### Backend: Debt Severity & Projection

- [ ] T1338 [P] [US9] Implement `DebtSeverityService` — scoring algorithm: base = `InterestRate`; promo expiry urgency bonus (≤90 days to revert rate); credit utilisation penalty (>80% adds +5); mortgage downweight (×0.4); return scored list with severity badges (Critical/High/Moderate/Low) — 4h
- [ ] T1339 [US9] Implement `DebtProjectionService` — monthly loop: interest accrual on each debt, minimum payments applied, extra payment applied to priority debt by strategy; freed minimums cascade on payoff; always compute both Avalanche and Snowball for comparison; return `MonthlySnapshot[]` per debt — 6h
- [ ] T1340 [US9] Implement `DebtController` — `GET /finance/debt/overview` (severity scores, weighted avg rate, monthly interest cost, payoff-at-minimums date), `POST /finance/debt/projection` (request: strategy, customOrder, extraPayment, includedAccountIds, excludeMortgage) — 3h
- [ ] T1341 [US9] Write unit tests for `DebtSeverityService` (10+ tests — rate-only, promo expiry <90 days, promo expiry >90 days, utilisation >80%, mortgage downweight, combined) — 3h
- [ ] T1342 [US9] Write unit tests for `DebtProjectionService` (12+ tests — Avalanche order, Snowball order, cascading minimums, extra payment = 0, single debt, strategy comparison output) — 4h
- [ ] T1343 [US9] Write integration tests for `DebtController` (8+ tests) — 2h

### Frontend: Debt Burndown Dashboard

- [ ] T1344 [P] [US9] Add debt projection TypeScript interfaces to `finance.ts`: `DebtOverview`, `DebtSeverityItem`, `ProjectionRequest`, `ProjectionResponse`, `MonthlySnapshot` — 1h
- [ ] T1345 [US9] Create `DebtOverviewCard` — severity-ranked list with Critical/High/Moderate/Low badges, total debt, weighted avg rate, total monthly interest, debt-free date at minimums only, mortgage include/exclude toggle — 4h
- [ ] T1346 [US9] Create `DebtStrategySelector` — Avalanche/Snowball/Custom three-way toggle; extra payment slider (pre-filled from `AffordabilityService` safe surplus, user can adjust); per-account include/exclude toggles; strategy comparison line "Snowball costs £X more but closes Y accounts Z months sooner" — 5h
- [ ] T1347 [US9] Create `DebtProjectionPanel` — debt-free headline date, total interest you'll pay, interest saved vs minimums-only, per-account payoff date table — 4h
- [ ] T1348 [US9] Create `DebtWaterfallChart` — horizontal Recharts bar chart; one row per debt; bar from now to payoff month; colour-coded by severity; vertical "today" marker; tooltip shows balance at hovered month — 5h
- [ ] T1349 [US9] Create `DebtBurndownDashboard` — orchestrator: `AffordabilityPanel` + `DebtOverviewCard` + `DebtStrategySelector` + `DebtProjectionPanel` + `DebtWaterfallChart`; add "Debt" tab to `FinancePage`; extra payment slider changes trigger client-side re-projection without new API call (call API only on strategy/account changes) — 4h
- [ ] T1350 [US9] Write Jest tests for debt components (10+ tests — severity badges, strategy toggle, slider updates projection, waterfall data mapping) — 3h
- [ ] T1351 [US9] Write E2E test for debt payoff (Avalanche with 3 accounts: assert highest-rate eliminated first, freed minimum cascades to next, chart updated) — 3h

### Multi-Currency (carried from original Phase 47 spec)

- [ ] T1352 [US8] Implement `ExchangeRateService` — daily rates from ECB free XML feed, 24h in-memory cache, GBP base, `Convert(amount, from, to)` — 3h
- [ ] T1353 [US8] Implement `CurrencyController` — `GET /finance/currency/rates` — 1h
- [ ] T1354 [US8] Write unit tests for `ExchangeRateService` (6+ tests — happy path, cache hit, feed unavailable fallback) — 1.5h
- [ ] T1355 [US8] Create `CurrencySettings` frontend component — base currency selector (GBP default), toggle foreign account values between original and base currency — 3h
- [ ] T1356 [US8] Write Jest tests for `CurrencySettings` (3+ tests) — 1h

### Full Finance E2E

- [ ] T1357 [US1–US9] Write comprehensive E2E test for the full finance flow: CSV import → budget setup → bill linking → debt overview → Avalanche projection → dashboard — 3h

**Checkpoint**: Severity-scored debt overview; Avalanche/Snowball/Custom projection with waterfall chart; affordability-driven extra payment pre-fill; multi-currency support with ECB rates

---

## Phase 48: AI Insights & Agent Features (Priority: P3)

**Purpose**: Subscription Auditor, Negotiation Engine, Spending Velocity, Anomaly Detection  
**Estimated Effort**: 2 weeks (14 tasks)  
**Dependencies**: Phases 41, 42 complete; 3+ months transaction data available

### Backend

- [ ] T1261 [US7] Implement `SpendingVelocityService` — daily average spend for current month, projected month-end total, projected overspend amount and category breakdown — 4h
- [ ] T1262 [US7] Implement `AnomalyDetectionService` — flag: category spend spike (>2σ from 3-month average), new merchant above configurable threshold, potential duplicate charges (same amount/merchant within 2 days) — 5h
- [ ] T1263 [US7] Implement `SubscriptionAuditorService` — scan 90 days of transactions for recurring digital charges; cross-reference against known subscription merchants list; flag as "possibly unused" if no other interactions with that merchant; never auto-cancel — 5h
- [ ] T1264 [US7] Implement `NegotiationEngineService` — given a merchant/provider, query transaction history (tenure, total spent, payment consistency), generate personalised negotiation script referencing tenure and loyalty — 4h
- [ ] T1265 [US7] Implement `InsightsController` — `GET /finance/insights`, `GET /finance/insights/velocity`, `GET /finance/insights/anomalies`, `GET /finance/insights/subscriptions`, `GET /finance/insights/negotiation-script` — 3h
- [ ] T1266 [US7] Write unit tests for all insights services (16+ tests) — 3h
- [ ] T1267 [US7] Write integration tests for insights endpoints (8+ tests) — 2h

### Frontend

- [ ] T1268 [US7] Create `InsightsDashboard` component — insight cards grid (type, summary, severity chip, action button) — 5h
- [ ] T1269 [US7] Create `SpendingVelocity` widget — "£X spent in Y days — projected to overspend by £Z at this rate"; progress bar showing burn pace vs budget — 3h
- [ ] T1270 [US7] Create `SubscriptionAuditor` component — subscription list (merchant, monthly cost, annual total, possibly-unused badge); bulk review flow — 4h
- [ ] T1271 [US7] Create `NegotiationHelper` component — provider selector, "Generate Script" button, read-only script output with copy-to-clipboard; disclaimer "This is a suggestion — always review before sending" — 3h
- [ ] T1272 [US7] Create `AnomalyAlert` component — flagged transaction card with explanation, "Looks fine" / "Flag for review" actions — 3h
- [ ] T1273 [US7] Write Jest tests for insights components (8+ tests) — 2h
- [ ] T1274 [US7] Write E2E test for insights flow with seeded 90-day transaction data — 3h

**Checkpoint**: Subscription Auditor, Spending Velocity, Anomaly Detection, and Negotiation Engine all functional

---

## Phase 49: MCP Server Integration (Priority: P3)

**Purpose**: Register `finance_*` tools with the Life Manager MCP Server; AI chat interface  
**Estimated Effort**: 2 weeks (15 tasks)  
**Dependencies**: Phase 44 complete; Life Manager MCP Server (Phase 64–66) integration point

### MCP Tool Handlers

- [ ] T1275 [MCP] Implement transaction MCP tools: `finance_get_transactions`, `finance_get_transaction_summary`, `finance_search_transactions`, `finance_add_manual_transaction`, `finance_categorise_transaction` — 5h
- [ ] T1276 [MCP] Implement bills MCP tools: `finance_get_recurring_payments`, `finance_get_bills_due`, `finance_get_bill_history`, `finance_flag_bill_for_review` — 3h
- [ ] T1277 [MCP] Implement budget/pots MCP tools: `finance_get_pot_balances`, `finance_get_pot_transactions`, `finance_update_pot_budget`, `finance_get_monthly_budget_summary` — 3h
- [ ] T1278 [MCP] Implement income/savings MCP tools: `finance_get_income_summary`, `finance_get_savings_goals`, `finance_update_savings_goal`, `finance_get_disposable_income` — 3h
- [ ] T1279 [MCP] Implement assessment + reporting MCP tools: `finance_get_financial_health_score`, `finance_get_ai_insights`, `finance_get_cashflow_forecast`, `finance_get_monthly_report`, `finance_get_tax_year_summary`, `finance_compare_months`, `finance_export_transactions` — 5h
- [ ] T1280 [MCP] Implement permission tiers — read-only tools require `finance:read` claim; write tools require `finance:write` claim; all tools require authenticated session — 2h
- [ ] T1281 [MCP] Implement MCP audit log — every finance tool call writes: timestamp, tool name, parameters (redacted), userId, IP to `finance.mcp_audit_log` table — 3h
- [ ] T1282 [MCP] Register all `finance_*` tool handlers into Life Manager MCP Server's tool registry (Phase 64–66 integration point) — 2h
- [ ] T1283 [MCP] Write unit tests for all MCP tool handlers (16+ tests) — 3h
- [ ] T1284 [MCP] Write integration tests for MCP tool endpoints (10+ tests) — 3h

### Frontend: AI Chat Interface

- [ ] T1285 [MCP] Create `FinanceChatPanel` component — natural language query input (e.g. "How much did I spend on food last month?"), MCP tool routing, formatted response display; read-only answers only, no write actions from chat — 5h
- [ ] T1286 [MCP] Write Jest tests for `FinanceChatPanel` (4+ tests) — 1h
- [ ] T1287 [MCP] Update `docker-compose.yml` — add `FINANCE_MCP_BIND_ADDRESS` env var; default to `127.0.0.1` (localhost only); document Tailscale-only remote access in `docs/guides/LAN_DEPLOYMENT.md` — 2h
- [ ] T1288 [MCP] Write E2E test for AI chat: "What are my top 3 spending categories this month?" → asserts structured response — 3h
- [ ] T1289 [MCP] Update `docs/testing/TEST-INVENTORY.md` with Phase 49 test counts and update `CHANGELOG.md` — 1h

**Checkpoint**: All `finance_*` MCP tools registered and testable; AI chat panel operational; audit log active

---

## Summary

| Phase | Name | Priority | Tasks | Est. Effort |
|-------|------|----------|-------|-------------|
| 41 | Accounts & Transactions (+ project setup) | P1 | T1155–T1181 (27) + T1290–T1321 (additions) | 2.5 weeks |
| 42 | Budgeting & Spending Pots | P1 | T1182–T1196 (15) | 2 weeks |
| 43 | Bills, Recurring Detection & Savings Goals | P2 | T1197–T1212 (16) | 2 weeks |
| 43 additions | Bill-to-Account Linking | P2 | T1322–T1330 (9) | 1 week |
| 43b | Financial Affordability Engine | P2 | T1331–T1335 (5) | 1 week |
| 44 | Financial Dashboard & Reports | P1 | T1213–T1225 (13) | 1.5 weeks |
| 45 | UK Specifics (ISA, Tax Year, Cash Flow) | P2 | T1226–T1235 (10) | 1.5 weeks |
| 46 | Investment Tracking | P2 | T1236–T1248 (13) | 1.5 weeks |
| 47 | Debt Burndown & Payoff Planning | P3 | T1336–T1357 (22) | 2.5 weeks |
| 48 | AI Insights & Agent Features | P3 | T1261–T1274 (14) | 2 weeks |
| 49 | MCP Server Integration | P3 | T1275–T1289 (15) | 2 weeks |
| **Total** | | | **~169 tasks** | **~19.5 weeks** |

### MVP Completion (Phases 41–44)

Phases 41–44 deliver the fully usable Finance Manager: CSV import, budgeting with pots, bill tracking, savings goals, and a financial dashboard. Estimated **8 weeks** to a shippable v1.

### P1 Phase Quick Reference

| Task ID | Description |
|---------|-------------|
| T1155 | Create `apps/finance-api/` project |
| T1160 | Define `Account` entity (UK types) |
| T1164 | Initial EF Core migration |
| T1168 | `CsvImportService` with bank registry |
| T1177 | `financeApiClient` + service layer |
| T1178 | `CsvImport` upload component |
| T1179 | `TransactionList` component |
| T1182 | `Budget` + `SpendingPot` entities |
| T1184 | `BudgetService` with threshold alerts |
| T1185 | `SpendingPotService` |
| T1213 | `DashboardService` |
| T1218 | `FinanceDashboard` page |
