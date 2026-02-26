# Tasks: Finance Application

**Input**: `specs/applications/finance/spec.md`  
**Prerequisites**: Authentication Service, Microservices Architecture  
**Continues from**: T1154 (Project Rename tasks)

**Organisation**: Tasks grouped by phase for transaction management, budgeting, investments, and AI insights.

**Technology Stack**:
- **Backend**: .NET Core 8.0 Web API, Entity Framework Core, PostgreSQL
- **Frontend**: React 18 with TypeScript, Chart.js/Recharts
- **External APIs**: Yahoo Finance, CoinGecko, ECB Exchange Rates
- **AI**: OpenAI GPT-4 for categorisation and insights

## Format: `[ID] [P?] [Story] Description`

---

## Phase 41: Finance Foundation — Accounts & Transactions (Priority: P1)

**Purpose**: Account management and transaction import with CSV parsing  
**Estimated Effort**: 2 weeks (22 tasks)  
**Dependencies**: API gateway routing `/api/v1/finance/*`

### Backend: Entities & Core API (Week 1, Days 1-3)

- [ ] T1155 [P] [US1] Create Finance microservice project (`apps/finance-api-v2/FinanceApp.csproj`) with EF Core - 4h
- [ ] T1156 [P] [US1] Define Account, Transaction, Category entities in `apps/finance-api-v2/Data/Entities/` - 3h
- [ ] T1157 [US1] Create FinanceDbContext with all entity DbSets - 2h
- [ ] T1158 [US1] Create initial EF Core migration for Account, Transaction, Category tables - 1h
- [ ] T1159 [US1] Create default system categories seed data (food, transport, utilities, entertainment, etc.) - 2h
- [ ] T1160 [US1] Implement AccountService with CRUD, balance calculation, net worth - 4h
- [ ] T1161 [US1] Implement AccountsController (POST, GET, GET/:id, PUT, DELETE, net-worth) - 3h

### Backend: CSV Import (Week 1, Days 3-5)

- [ ] T1162 [US1] Implement CsvImportService using CsvHelper with bank format registry - 6h
- [ ] T1163 [US1] Create bank format adapters: Lloyds, Barclays, HSBC, Monzo, Starling, Nationwide - 4h
- [ ] T1164 [US1] Implement generic CSV column mapping interface for unknown formats - 3h
- [ ] T1165 [US1] Implement duplicate transaction detection (hash-based matching) - 3h
- [ ] T1166 [US1] Implement TransactionService with CRUD, search, filtering, pagination - 4h
- [ ] T1167 [US1] Implement TransactionsController (CRUD, import, search, categorise) - 3h
- [ ] T1168 [US1] Implement AI categorisation endpoint using OpenAI for description parsing - 4h
- [ ] T1169 [US1] Write unit tests for CsvImportService with sample bank files (15+ tests) - 3h
- [ ] T1170 [US1] Write unit tests for TransactionService (12+ tests) - 3h
- [ ] T1171 [US1] Write integration tests for accounts and transactions controllers (12+ tests) - 3h

### Frontend: Accounts & Transactions UI (Week 2)

- [ ] T1172 [P] [US1] Create Finance TypeScript interfaces (Account, Transaction, Category) - 2h
- [ ] T1173 [P] [US1] Create accountService and transactionService API methods - 2h
- [ ] T1174 [US1] Create CsvImport component (drag-and-drop upload, format detection, column mapping) - 6h
- [ ] T1175 [US1] Create TransactionList component (filterable, sortable, paginated table with category icons) - 5h
- [ ] T1176 [US1] Create AccountsDashboard component (account cards, balances, net worth) - 4h

**Checkpoint**: Users can create accounts, import CSV transactions, and view categorised transaction lists

---

## Phase 42: Budgeting (Priority: P1)

**Purpose**: Monthly category budgets with real-time spending tracking and alerts  
**Estimated Effort**: 1.5 weeks (14 tasks)  
**Dependencies**: Phase 41 complete

### Backend: Budget API (Week 1, Days 1-3)

- [ ] T1177 [P] [US2] Define Budget entity in `apps/finance-api-v2/Data/Entities/` - 2h
- [ ] T1178 [US2] Create EF Core migration for Budget table - 1h
- [ ] T1179 [US2] Implement BudgetService with CRUD, progress calculation, threshold alerts - 4h
- [ ] T1180 [US2] Implement auto-creation of next month's budgets from templates - 2h
- [ ] T1181 [US2] Implement BudgetsController (CRUD, current, trends) - 3h
- [ ] T1182 [US2] Write unit tests for BudgetService (10+ tests) - 2h
- [ ] T1183 [US2] Write integration tests for BudgetsController (8+ tests) - 2h

### Frontend: Budget UI (Week 1, Days 4-5)

- [ ] T1184 [P] [US2] Create Budget TypeScript interfaces - 1h
- [ ] T1185 [P] [US2] Create budgetService API methods - 1h
- [ ] T1186 [US2] Create BudgetDashboard component (category progress bars, green→yellow→red) - 5h
- [ ] T1187 [US2] Create BudgetForm component (create/edit with category selection, amount) - 3h
- [ ] T1188 [US2] Create BudgetTrends component (monthly comparison charts) - 4h
- [ ] T1189 [US2] Write Jest tests for budget components (8+ tests) - 2h
- [ ] T1190 [US2] Write E2E test for budget creation and tracking flow - 3h

**Checkpoint**: Users can set budgets, track spending, and receive threshold warnings

---

## Phase 43: Bills & Savings Goals (Priority: P2)

**Purpose**: Recurring bill tracking with reminders and savings goal progress  
**Estimated Effort**: 1.5 weeks (16 tasks)  
**Dependencies**: Phase 41 complete

### Backend: Bills & Goals API (Week 1)

- [ ] T1191 [P] [US4] Define Bill entity in `apps/finance-api-v2/Data/Entities/` - 2h
- [ ] T1192 [P] [US5] Define SavingsGoal entity in `apps/finance-api-v2/Data/Entities/` - 2h
- [ ] T1193 [US4/US5] Create EF Core migration for Bill and SavingsGoal tables - 1h
- [ ] T1194 [US4] Implement BillService with CRUD, reminders, payment tracking, cost analysis - 4h
- [ ] T1195 [US4] Implement BillsController (CRUD, upcoming, pay) - 3h
- [ ] T1196 [US5] Implement SavingsGoalService with CRUD, contributions, projections - 4h
- [ ] T1197 [US5] Implement GoalsController (CRUD, contribute) - 3h
- [ ] T1198 [US4/US5] Write unit tests for BillService and SavingsGoalService (12+ tests) - 3h
- [ ] T1199 [US4/US5] Write integration tests for Bills and Goals controllers (10+ tests) - 3h

### Frontend: Bills & Goals UI (Week 1, Days 4-5 → Week 2)

- [ ] T1200 [P] [US4/US5] Create Bill and SavingsGoal TypeScript interfaces - 1h
- [ ] T1201 [US4] Create BillsDashboard component (upcoming bills, calendar view, total costs) - 4h
- [ ] T1202 [US4] Create BillForm component (name, amount, frequency, due date, category) - 3h
- [ ] T1203 [US5] Create SavingsGoalsDashboard component (goal cards, progress bars, projections) - 4h
- [ ] T1204 [US5] Create SavingsGoalForm component (target, deadline, contribution amount) - 3h
- [ ] T1205 [US4/US5] Write Jest tests for bills and goals components (8+ tests) - 2h
- [ ] T1206 [US4/US5] Write E2E test for bill tracking and goal creation flow - 3h

**Checkpoint**: Users can track bills, receive reminders, set savings goals, and monitor progress

---

## Phase 44: Financial Dashboard & Reports (Priority: P1)

**Purpose**: Comprehensive financial dashboard with charts and report export  
**Estimated Effort**: 1.5 weeks (14 tasks)  
**Dependencies**: Phases 41, 42 complete

### Backend: Dashboard & Reports API (Week 1, Days 1-3)

- [ ] T1207 [US6] Implement DashboardService (balance, income, expenses, savings rate aggregation) - 4h
- [ ] T1208 [US6] Implement ReportsService (spending breakdown, income vs expense, export) - 4h
- [ ] T1209 [US6] Implement DashboardController (GET /dashboard, spending, income-expense, export) - 3h
- [ ] T1210 [US6] Implement PDF report generation using QuestPDF or iTextSharp - 4h
- [ ] T1211 [US6] Write unit tests for DashboardService and ReportsService (12+ tests) - 3h
- [ ] T1212 [US6] Write integration tests for dashboard and report endpoints (8+ tests) - 2h

### Frontend: Dashboard UI (Week 1, Days 4-5)

- [ ] T1213 [US6] Create FinanceDashboard component (balance card, income/expense summary, savings rate) - 5h
- [ ] T1214 [US6] Create SpendingBreakdown component (pie/doughnut chart by category, period selector) - 4h
- [ ] T1215 [US6] Create IncomeVsExpense chart component (monthly bar chart with net line) - 4h
- [ ] T1216 [US6] Create ReportExport component (date range, format selection, download trigger) - 3h
- [ ] T1217 [US6] Create finance widget for Application Hub dashboard - 3h
- [ ] T1218 [US1-US6] Add `/finance` route and navigation menu entry - 1h
- [ ] T1219 [US6] Write Jest tests for dashboard and chart components (8+ tests) - 2h
- [ ] T1220 [US6] Write E2E test for finance dashboard end-to-end data flow - 3h

**Checkpoint**: Financial dashboard with interactive charts and PDF/CSV report export

---

## Phase 45: Investment Tracking (Priority: P2)

**Purpose**: Portfolio management with CSV import, performance tracking, allocation charts  
**Estimated Effort**: 1.5 weeks (14 tasks)  
**Dependencies**: Phase 41 complete

### Backend: Investment API (Week 1, Days 1-3)

- [ ] T1221 [P] [US3] Define Investment entity in `apps/finance-api-v2/Data/Entities/` - 2h
- [ ] T1222 [US3] Create EF Core migration for Investment table - 1h
- [ ] T1223 [US3] Implement InvestmentService with CRUD, portfolio aggregation, performance calc - 4h
- [ ] T1224 [US3] Implement portfolio CSV import (Trading 212, HL, Interactive Brokers formats) - 4h
- [ ] T1225 [US3] Implement price feed integration (Yahoo Finance or Alpha Vantage for stocks) - 3h
- [ ] T1226 [US3] Implement CoinGecko integration for cryptocurrency prices - 2h
- [ ] T1227 [US3] Implement InvestmentsController (CRUD, summary, import, performance) - 3h
- [ ] T1228 [US3] Write unit tests for InvestmentService (10+ tests) - 2h
- [ ] T1229 [US3] Write integration tests for investment endpoints (8+ tests) - 2h

### Frontend: Investment UI (Week 1, Days 4-5)

- [ ] T1230 [P] [US3] Create Investment TypeScript interfaces - 1h
- [ ] T1231 [US3] Create PortfolioDashboard component (holdings table, gain/loss, total value) - 5h
- [ ] T1232 [US3] Create AssetAllocation component (pie chart by sector/geography/type) - 3h
- [ ] T1233 [US3] Create PerformanceChart component (portfolio value over time vs benchmark) - 4h
- [ ] T1234 [US3] Write Jest tests for portfolio components (8+ tests) - 2h

**Checkpoint**: Users can track investment portfolios with performance charts and allocation analysis

---

## Phase 46: Debt Management & Multi-Currency (Priority: P3)

**Purpose**: Debt tracking with payoff calculators and multi-currency support  
**Estimated Effort**: 1.5 weeks (14 tasks)  
**Dependencies**: Phase 41 complete

### Backend: Debt & Currency API (Week 1)

- [ ] T1235 [P] [US9] Define Debt entity in `apps/finance-api-v2/Data/Entities/` - 2h
- [ ] T1236 [US9] Create EF Core migration for Debt table - 1h
- [ ] T1237 [US9] Implement DebtService with CRUD, snowball/avalanche calculators, payment tracking - 4h
- [ ] T1238 [US9] Implement DebtsController (CRUD, payment, payoff-plan) - 3h
- [ ] T1239 [US8] Implement ExchangeRateService (daily rates from ECB, caching, conversion) - 3h
- [ ] T1240 [US8] Implement multi-currency conversion in dashboard and transaction views - 3h
- [ ] T1241 [US8/US9] Write unit tests for DebtService and ExchangeRateService (10+ tests) - 2h
- [ ] T1242 [US8/US9] Write integration tests for debt and currency endpoints (8+ tests) - 2h

### Frontend: Debt & Currency UI (Week 1, Days 4-5)

- [ ] T1243 [US9] Create DebtTracker component (debt list, balances, total owed) - 4h
- [ ] T1244 [US9] Create PayoffCalculator component (snowball vs avalanche comparison, schedule) - 5h
- [ ] T1245 [US8] Create CurrencySettings component (base currency selection, conversion display) - 3h
- [ ] T1246 [US8/US9] Write Jest tests for debt and currency components (8+ tests) - 2h
- [ ] T1247 [US8/US9] Write E2E test for debt payoff planning flow - 3h
- [ ] T1248 [US1-US9] Write comprehensive E2E test for full finance app flow - 3h

**Checkpoint**: Complete finance app with debt management, payoff planning, and multi-currency

---

## Phase 47: AI Financial Insights (Priority: P3)

**Purpose**: AI-powered spending analysis, anomaly detection, and savings recommendations  
**Estimated Effort**: 1 week (8 tasks)  
**Dependencies**: Phases 41, 42 complete (3+ months of transaction data ideal)

- [ ] T1249 [US7] Implement InsightsService with trend analysis, anomaly detection, and recommendations - 6h
- [ ] T1250 [US7] Implement InsightsController (GET /insights) - 2h
- [ ] T1251 [US7] Implement spending prediction engine (next month estimate from patterns) - 4h
- [ ] T1252 [US7] Implement subscription detection and consolidation suggestions - 3h
- [ ] T1253 [US7] Create InsightsDashboard component (insight cards, anomaly alerts, predictions) - 5h
- [ ] T1254 [US7] Create SpendingPrediction component (projected vs actual chart) - 3h
- [ ] T1255 [US7] Write unit tests for InsightsService (8+ tests) - 2h
- [ ] T1256 [US7] Write E2E test for insights generation with sample transaction data - 3h

**Checkpoint**: AI-generated financial insights available on finance dashboard

---

## Summary

| Phase | Name | Priority | Tasks | Estimated Effort |
|-------|------|----------|-------|-----------------|
| 41 | Accounts & Transactions | P1 | T1155-T1176 (22) | 2 weeks |
| 42 | Budgeting | P1 | T1177-T1190 (14) | 1.5 weeks |
| 43 | Bills & Savings Goals | P2 | T1191-T1206 (16) | 1.5 weeks |
| 44 | Dashboard & Reports | P1 | T1207-T1220 (14) | 1.5 weeks |
| 45 | Investment Tracking | P2 | T1221-T1234 (14) | 1.5 weeks |
| 46 | Debt & Multi-Currency | P3 | T1235-T1248 (14) | 1.5 weeks |
| 47 | AI Insights | P3 | T1249-T1256 (8) | 1 week |
| **Total** | | | **102 tasks** | **~11 weeks** |
