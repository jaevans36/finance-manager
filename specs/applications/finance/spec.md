# Feature Specification: Finance Application

**Feature ID**: `010-finance-app`  
**Created**: 2026-02-13  
**Status**: Draft  
**Priority**: P2  
**Dependencies**: Authentication Service, Microservices Architecture

## Overview

A comprehensive personal finance management application within the Life Manager platform. The Finance Application enables users to track income and expenses, manage budgets, monitor investments, pay bills, set savings goals, import transactions from banks and investment platforms, and receive AI-powered financial insights. This evolves the original Life Manager concept into a full-featured personal finance suite.

## Rationale

Financial management is a core life management activity. While many finance apps exist, integrating finance into the Life Manager platform provides unique value through cross-domain insights (e.g., fitness subscription costs, weather-triggered spending patterns) and a unified personal dashboard. The Finance Application transforms raw transaction data into actionable financial intelligence.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Transaction Import & Management (Priority: P1)

Users can import financial transactions from CSV files exported by banks and financial institutions. The system parses, normalises, and categorises transactions automatically, supporting multiple bank formats.

**Why this priority**: Transaction data is the foundation of all financial analysis. Without imports, users cannot populate their accounts.

**Independent Test**: Import CSV files from 3 different bank formats, verify transactions are parsed correctly, categorisation is applied, and duplicates are detected.

**Acceptance Scenarios**:

1. **Given** a user with a bank CSV file, **When** they upload it via drag-and-drop or file picker, **Then** the system detects the bank format and parses transactions automatically
2. **Given** a parsed CSV, **When** the system processes the file, **Then** each transaction has: date, description, amount, and auto-categorised type (food, transport, utilities, etc.)
3. **Given** unsupported CSV format, **When** the user uploads it, **Then** the system provides a column mapping interface to manually assign: date, description, amount, and optional fields
4. **Given** previously imported transactions, **When** the user imports a new file with overlapping dates, **Then** duplicate transactions are detected and flagged for user review
5. **Given** imported transactions, **When** the user views the transaction list, **Then** they can search, filter by category/date/amount, and sort by any column
6. **Given** a transaction, **When** the user edits its category, **Then** the system learns the preference and applies it to future similar transactions
7. **Given** transaction data, **When** the user adds a manual transaction (e.g., cash payment), **Then** it appears in the list alongside imported transactions

**Supported Bank Formats** (initial):
- Lloyds Bank
- Barclays
- HSBC
- Nationwide
- Monzo
- Starling Bank
- Generic CSV (user-mapped columns)

---

### User Story 2 - Budgeting (Priority: P1)

Users can create monthly budgets by category, track spending against budgets in real-time, and receive alerts when approaching or exceeding budget limits.

**Why this priority**: Budgeting is the most requested personal finance feature and provides immediate, actionable value from transaction data.

**Independent Test**: Create budgets for multiple categories, import transactions, verify budget progress updates, alerts trigger at correct thresholds.

**Acceptance Scenarios**:

1. **Given** a user, **When** they create a monthly budget, **Then** they can set spending limits for each category (food, transport, entertainment, utilities, etc.)
2. **Given** an active budget, **When** transactions are imported or added, **Then** spending progress updates in real-time with colour-coded progress bars (green → yellow → red)
3. **Given** spending reaching 80% of a budget category, **When** the threshold is crossed, **Then** the user receives a warning notification
4. **Given** a budget that is exceeded, **When** spending surpasses the limit, **Then** the category is highlighted in red with the overspend amount shown
5. **Given** a month ending, **When** the budget period closes, **Then** a summary shows: budgeted vs actual for each category, total savings/overspend, and comparison to previous months
6. **Given** recurring budget categories, **When** a new month starts, **Then** budgets are automatically created based on the previous month's template (adjustable)
7. **Given** budget history, **When** the user views trends, **Then** monthly spending by category is charted over time to identify patterns

---

### User Story 3 - Investment Portfolio Tracking (Priority: P2)

Users can track investment portfolios across multiple platforms (stocks, funds, crypto), view performance, and monitor asset allocation. Data can be imported from investment apps like Trading 212, Hargreaves Lansdown, and Robinhood.

**Why this priority**: Investment tracking complements day-to-day budgeting by providing a complete picture of net worth. However, it depends on core transaction infrastructure.

**Independent Test**: Import portfolio data from Trading 212 CSV, verify holdings display correctly, calculate unrealised gains/losses, and display asset allocation charts.

**Acceptance Scenarios**:

1. **Given** a user with investment accounts, **When** they import a portfolio CSV from Trading 212, **Then** holdings are parsed with: ticker, quantity, average price, current value
2. **Given** imported holdings, **When** the user views the portfolio, **Then** current market values are displayed with unrealised gain/loss (amount and percentage) per holding
3. **Given** a portfolio, **When** the user views asset allocation, **Then** a pie/doughnut chart shows allocation by sector, geography, and asset type (stocks/bonds/crypto/cash)
4. **Given** a portfolio over time, **When** the user views performance, **Then** a chart shows total portfolio value over time with comparison to benchmarks (e.g., S&P 500, FTSE 100)
5. **Given** dividends received, **When** the user logs or imports them, **Then** dividend income is tracked and displayed as annual yield
6. **Given** multiple investment accounts, **When** the user views their investments, **Then** all accounts are consolidated into a single portfolio view with per-account breakdowns
7. **Given** capital gains, **When** the user sells a position, **Then** realised gains/losses are calculated and summarised for tax reporting

**Supported Import Formats**:
- Trading 212 (CSV)
- Hargreaves Lansdown (CSV)
- Robinhood (CSV)
- Interactive Brokers (CSV)
- Freetrade (CSV)
- Generic portfolio CSV (user-mapped)

**Enhancement**: Real-time price feeds via Yahoo Finance API or Alpha Vantage. Crypto tracking via CoinGecko API.

---

### User Story 4 - Bill Tracking & Reminders (Priority: P2)

Users can track recurring bills and subscriptions, receive reminders before due dates, and monitor total recurring costs.

**Why this priority**: Bill tracking helps users understand their fixed costs and avoid missed payments. It builds on the budgeting foundation.

**Independent Test**: Create bills with various frequencies, verify reminders trigger correctly, bill dashboard shows totals, and payment status tracking works.

**Acceptance Scenarios**:

1. **Given** a user, **When** they add a recurring bill (e.g., "Netflix £15.99/month, due 15th"), **Then** the bill is saved with name, amount, frequency, due date, and category
2. **Given** a bill approaching its due date, **When** the reminder threshold is reached (configurable: 3 days, 1 week), **Then** the user receives a notification
3. **Given** all active bills, **When** the user views the bills dashboard, **Then** they see: total monthly recurring costs, upcoming bills, and a calendar view of due dates
4. **Given** a bill paid, **When** the user marks it as paid (or it matches an imported transaction), **Then** the bill status updates to "Paid" for the current period
5. **Given** a subscription the user wants to cancel, **When** they view their subscriptions list, **Then** they see: annual cost, how long they've been subscribed, and total spent to date
6. **Given** bill history, **When** the user reviews changes, **Then** price increases are highlighted (e.g., "Netflix increased from £13.99 to £15.99 in March 2026")

---

### User Story 5 - Savings Goals (Priority: P2)

Users can set savings goals with target amounts and deadlines, track progress, and receive suggestions for reaching their goals faster.

**Why this priority**: Savings goals provide motivation and direction for financial behaviour. They transform budgeting from cost-cutting into goal-oriented saving.

**Independent Test**: Create savings goals, allocate funds manually and automatically, verify progress calculations, milestone notifications, and projection accuracy.

**Acceptance Scenarios**:

1. **Given** a user, **When** they create a savings goal (e.g., "Holiday fund: £2,000 by August"), **Then** the goal is saved with target amount, deadline, and initial progress
2. **Given** an active goal, **When** the user allocates money to it (manual transfer or percentage of income), **Then** progress updates with the total saved and percentage complete
3. **Given** a goal with a deadline, **When** the user views the projection, **Then** the system shows whether they are on track based on current saving rate, with an estimated completion date
4. **Given** a goal falling behind, **When** the projection shows it won't be met, **Then** the system suggests: increased monthly contributions needed, or deadline extension
5. **Given** a goal achieved, **When** the target amount is reached, **Then** a celebration notification is displayed and the goal is marked as complete
6. **Given** multiple goals, **When** the user views the goals dashboard, **Then** all goals are displayed with progress bars, priority ranking, and total savings across all goals

---

### User Story 6 - Financial Dashboard & Reports (Priority: P1)

Users can view a comprehensive financial dashboard showing key metrics: net worth, monthly spending, income vs expenses, savings rate, and category breakdowns with interactive charts.

**Why this priority**: The dashboard is the user's primary interaction point with their finances. It transforms raw data into actionable insights.

**Independent Test**: Populate with 6 months of transactions, verify dashboard calculations are accurate, charts render correctly, and comparisons match manual calculations.

**Acceptance Scenarios**:

1. **Given** a user with transaction data, **When** they view the finance dashboard, **Then** they see: total balance, income this month, expenses this month, and savings rate
2. **Given** multiple accounts, **When** the dashboard calculates net worth, **Then** it sums all account balances, investment values, and savings (minus debts if tracked)
3. **Given** categorised transactions, **When** the user views the spending breakdown, **Then** a pie/doughnut chart shows spending by category for the selected period
4. **Given** historical data, **When** the user views the income vs expenses chart, **Then** a bar chart shows monthly income and expenses with the net difference highlighted
5. **Given** the dashboard, **When** the user selects different time periods (this month, last month, 3 months, 6 months, 1 year), **Then** all metrics and charts update accordingly
6. **Given** a user wanting a detailed report, **When** they generate a financial report, **Then** a PDF/CSV export is produced with: transaction list, category totals, budget performance, and savings progress

---

### User Story 7 - AI-Powered Financial Insights (Priority: P3)

The system analyses transaction data using AI to provide personalised financial insights, anomaly detection, spending predictions, and savings recommendations.

**Why this priority**: AI insights are the differentiating feature, but they require substantial transaction history to be useful. They enhance the platform but aren't core functionality.

**Independent Test**: Import 3+ months of transactions, verify insights are generated, test anomaly detection with unusual spending, and validate prediction accuracy.

**Acceptance Scenarios**:

1. **Given** 3+ months of transaction data, **When** the AI analysis runs, **Then** it identifies spending trends and presents insights (e.g., "Your food spending has increased 15% this month vs your 3-month average")
2. **Given** an unusual transaction, **When** the AI detects an anomaly, **Then** it flags it for user review (e.g., "Unusual £500 charge at Electronics Store — confirm or dispute?")
3. **Given** transaction patterns, **When** the AI predicts next month's spending, **Then** an estimated budget is suggested based on historical patterns and known upcoming bills
4. **Given** spending data, **When** the AI identifies savings opportunities, **Then** it suggests specific actions (e.g., "You have 3 streaming subscriptions totalling £35/month — consider consolidating")
5. **Given** recurring patterns, **When** the AI detects a price increase in a subscription, **Then** it alerts the user and suggests alternatives or negotiation strategies
6. **Given** financial goals, **When** the AI analyses spending, **Then** it suggests budget adjustments to accelerate goal achievement

---

### User Story 8 - Multi-Currency Support (Priority: P3)

Users can manage accounts in multiple currencies with automatic exchange rate conversion and consolidated net worth in their base currency.

**Why this priority**: Multi-currency is essential for users with international accounts but not needed for the majority of users initially.

**Independent Test**: Create accounts in GBP, USD, and EUR. Import transactions in different currencies. Verify conversion calculations and consolidated net worth accuracy.

**Acceptance Scenarios**:

1. **Given** a user with accounts in different currencies, **When** they view the dashboard, **Then** all values are converted to their base currency using current exchange rates
2. **Given** a foreign currency transaction, **When** it is imported, **Then** the original currency and amount are preserved alongside the converted base currency value
3. **Given** exchange rates, **When** the user views currency conversion, **Then** rates are from a reliable source (e.g., ECB, Exchange Rates API) updated daily
4. **Given** a user changing their base currency, **When** they update the setting, **Then** all displays recalculate to show the new base currency
5. **Given** currency fluctuations, **When** the user views foreign account values over time, **Then** charts show both local currency value and base currency value

---

### User Story 9 - Debt Management & Payoff Planning (Priority: P3)

Users can track debts (credit cards, loans, mortgages) and use payoff calculators to plan repayment strategies (snowball, avalanche).

**Why this priority**: Debt management is a valuable feature for financial planning but builds on core budgeting and tracking functionality.

**Independent Test**: Add multiple debts with different interest rates, select a payoff strategy, verify calculation accuracy, payment schedule, and total interest savings.

**Acceptance Scenarios**:

1. **Given** a user with debts, **When** they add a debt (e.g., "Credit Card: £3,000 at 19.9% APR, minimum £50/month"), **Then** the debt appears in the debt tracker with balance, rate, and minimum payment
2. **Given** multiple debts, **When** the user selects the avalanche strategy, **Then** the system calculates the optimal payment order (highest interest first) with estimated payoff dates
3. **Given** multiple debts, **When** the user selects the snowball strategy, **Then** the system calculates the payment order (smallest balance first) with motivational milestones
4. **Given** a payoff strategy, **When** the user enters their monthly budget for debt repayment, **Then** a detailed payment schedule shows per-debt payments month by month
5. **Given** a debt being repaid, **When** the user logs a payment, **Then** the balance updates and the payoff schedule recalculates
6. **Given** payoff comparison, **When** the user views strategy options, **Then** a comparison shows: total interest paid, total time to payoff, and monthly payment amounts for each strategy

---

### User Story 10 - Household / Partner Account Sharing (Priority: P3)

Users can share individual accounts with another Life Manager user (e.g. a spouse or partner), so that shared income and spending can be included in affordability, debt payoff, and AI insight calculations — without merging logins or exposing every account by default.

**Why this priority**: Affordability and debt payoff planning are meaningfully incomplete for couples who manage money jointly but track it across two separate logins — income landing in a shared account is visible today, but a partner's own spending/bills on their own accounts is invisible, which understates committed costs and overstates safe surplus. This closes that gap. It builds on Phases 43b, 47, and 48 rather than blocking them, so it's appropriately deferred behind them. Resolves the "Multi-user scope" open question below.

**Independent Test**: Two test users, each with their own accounts; user A shares one account with user B at View permission; user B accepts; user B enables "Include household accounts" on the Debt tab and confirms user A's shared account balance and transactions are included in the payoff projection; user A revokes the share and confirms it disappears from user B's view immediately.

**Acceptance Scenarios**:

1. **Given** an account the user owns, **When** they choose "Share" and enter a partner's username or email, **Then** a pending share invitation is created and the partner is notified (reusing the existing notification system used for task assignment and event sharing)
2. **Given** a pending share invitation, **When** the recipient accepts it, **Then** the account appears in their Finance app under "Shared with you", read-only, with the owner's name shown
3. **Given** a shared account, **When** the recipient views the Affordability, Debt, or AI Insights tab, **Then** an "Include household accounts" toggle lets them opt the shared account's transactions into income detection, committed costs, debt overview, and spending insights
4. **Given** a shared account, **When** the recipient tries to edit, delete, or re-share it, **Then** the action is blocked — View permission is read-only in the initial release; Edit permission (allowing the recipient to add/categorise transactions on a shared account) is a future enhancement
5. **Given** an active share, **When** the owner revokes it, **Then** the account and its transactions immediately disappear from the recipient's view and any household-scoped calculations recalculate without it
6. **Given** a declined or revoked share, **When** either party looks at their sharing management screen, **Then** they see an accurate, up-to-date list of what's shared, with whom, and its status

**Explicitly deferred (future enhancement, not this phase)**: Edit permission on shared accounts; merging Bills/Budgets (which are user-scoped, not account-scoped) across two logins into a single household budget; more than two linked users.

---

## Data Model

### Core Entities

```typescript
interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'current' | 'savings' | 'credit_card' | 'loan' | 'mortgage' | 'investment' | 'cash';
  currency: string;            // ISO 4217 (GBP, USD, EUR)
  balance: number;
  institution: string | null;  // Bank name
  lastImportAt: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// Household sharing (Phase 50, User Story 10) — mirrors EventShare (Todo/Events)
interface AccountShare {
  id: string;
  accountId: string;
  sharedByUserId: string;
  sharedWithUserId: string;
  permission: 'view';          // 'edit' deferred to a future phase
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  accountId: string;
  userId: string;
  date: string;
  description: string;
  amount: number;              // Negative for expenses, positive for income
  currency: string;
  baseCurrencyAmount: number | null;
  categoryId: string | null;
  subcategory: string | null;
  type: 'income' | 'expense' | 'transfer';
  isRecurring: boolean;
  merchantName: string | null;
  notes: string | null;
  importSource: string | null;  // CSV filename, bank name
  importBatchId: string | null;
  isDuplicate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  userId: string | null;       // null = system default, non-null = user custom
  name: string;
  icon: string;                // Lucide icon name
  colour: string;              // Hex colour
  parentId: string | null;     // For subcategories
  isSystem: boolean;
  createdAt: string;
}

interface Budget {
  id: string;
  userId: string;
  name: string;
  month: number;               // 1-12
  year: number;
  categoryId: string;
  amount: number;
  spent: number;               // Calculated from transactions
  rolloverFromPrevious: number;
  createdAt: string;
  updatedAt: string;
}

interface Bill {
  id: string;
  userId: string;
  name: string;
  amount: number;
  categoryId: string | null;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'annually';
  dueDay: number;              // Day of month
  nextDueDate: string;
  reminderDaysBefore: number;
  isPaid: boolean;
  lastPaidDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: string | null;
  icon: string | null;
  colour: string | null;
  status: 'active' | 'achieved' | 'paused' | 'archived';
  monthlyContribution: number | null;  // Auto-save amount
  createdAt: string;
  updatedAt: string;
}

interface Investment {
  id: string;
  userId: string;
  accountId: string;
  ticker: string;
  name: string;
  type: 'stock' | 'etf' | 'fund' | 'bond' | 'crypto' | 'other';
  quantity: number;
  averageCost: number;
  currentPrice: number | null;
  currency: string;
  sector: string | null;
  exchange: string | null;
  lastPriceUpdate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Debt {
  id: string;
  userId: string;
  name: string;
  type: 'credit_card' | 'personal_loan' | 'mortgage' | 'student_loan' | 'other';
  originalAmount: number;
  currentBalance: number;
  interestRate: number;        // Annual percentage rate
  minimumPayment: number;
  currency: string;
  dueDay: number;
  lender: string | null;
  startDate: string;
  expectedPayoffDate: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## API Endpoints

### Accounts
```
POST   /api/v1/finance/accounts              Create account
GET    /api/v1/finance/accounts              List accounts
GET    /api/v1/finance/accounts/:id          Get account detail
PUT    /api/v1/finance/accounts/:id          Update account
DELETE /api/v1/finance/accounts/:id          Delete/archive account
GET    /api/v1/finance/accounts/net-worth    Calculate net worth
```

### Transactions
```
POST   /api/v1/finance/transactions          Create manual transaction
GET    /api/v1/finance/transactions          List transactions (paginated, filtered)
GET    /api/v1/finance/transactions/:id      Get transaction detail
PUT    /api/v1/finance/transactions/:id      Update transaction (recategorise)
DELETE /api/v1/finance/transactions/:id      Delete transaction
POST   /api/v1/finance/transactions/import   Import CSV file
GET    /api/v1/finance/transactions/search   Full-text search transactions
POST   /api/v1/finance/transactions/categorise  AI categorisation
```

### Categories
```
GET    /api/v1/finance/categories            List categories (system + custom)
POST   /api/v1/finance/categories            Create custom category
PUT    /api/v1/finance/categories/:id        Update category
DELETE /api/v1/finance/categories/:id        Delete custom category
```

### Budgets
```
POST   /api/v1/finance/budgets               Create budget
GET    /api/v1/finance/budgets               List budgets (month/year filtered)
GET    /api/v1/finance/budgets/current       Get current month's budgets with progress
PUT    /api/v1/finance/budgets/:id           Update budget
DELETE /api/v1/finance/budgets/:id           Delete budget
GET    /api/v1/finance/budgets/trends        Budget trends over time
```

### Bills
```
POST   /api/v1/finance/bills                 Create bill
GET    /api/v1/finance/bills                 List bills
GET    /api/v1/finance/bills/upcoming        List upcoming bills
PUT    /api/v1/finance/bills/:id             Update bill
PATCH  /api/v1/finance/bills/:id/pay         Mark bill as paid
DELETE /api/v1/finance/bills/:id             Delete bill
```

### Savings Goals
```
POST   /api/v1/finance/goals                 Create savings goal
GET    /api/v1/finance/goals                 List savings goals
GET    /api/v1/finance/goals/:id             Get goal detail
PUT    /api/v1/finance/goals/:id             Update goal
PATCH  /api/v1/finance/goals/:id/contribute  Add contribution
DELETE /api/v1/finance/goals/:id             Delete/archive goal
```

### Investments
```
POST   /api/v1/finance/investments           Add investment holding
GET    /api/v1/finance/investments           List portfolio
GET    /api/v1/finance/investments/summary   Portfolio summary & allocation
PUT    /api/v1/finance/investments/:id       Update holding
DELETE /api/v1/finance/investments/:id       Remove holding
POST   /api/v1/finance/investments/import    Import portfolio CSV
GET    /api/v1/finance/investments/performance  Portfolio performance over time
```

### Debts
```
POST   /api/v1/finance/debts                 Add debt
GET    /api/v1/finance/debts                 List debts
GET    /api/v1/finance/debts/:id             Get debt detail
PUT    /api/v1/finance/debts/:id             Update debt
POST   /api/v1/finance/debts/:id/payment     Log payment
DELETE /api/v1/finance/debts/:id             Delete debt
GET    /api/v1/finance/debts/payoff-plan     Calculate payoff strategy
```

### Dashboard & Reports
```
GET    /api/v1/finance/dashboard             Dashboard summary (balance, income, expenses, savings rate)
GET    /api/v1/finance/reports/spending       Spending breakdown by category/period
GET    /api/v1/finance/reports/income-expense  Income vs expense over time
GET    /api/v1/finance/reports/export         Export report (PDF/CSV)
GET    /api/v1/finance/insights              AI-generated insights
GET    /api/v1/finance/exchange-rates         Current exchange rates
```

## Technical Considerations

### CSV Parsing
- Use a robust CSV parser (CsvHelper for .NET)
- Maintain a bank format registry mapping known CSV structures to the normalised schema
- Support custom column mapping for unknown formats
- Handle encoding differences (UTF-8, ISO-8859-1)
- Validate data types (dates, amounts) with clear error messages for invalid rows

### AI Categorisation
- Train on user's historical categorisation decisions
- Use OpenAI API for natural language description parsing
- Fallback to rule-based categorisation (keyword matching)
- User corrections improve future accuracy (feedback loop)

### Investment Price Data
- **Yahoo Finance API** (unofficial): Real-time stock prices
- **Alpha Vantage**: Free tier for stock data
- **CoinGecko API**: Cryptocurrency prices
- Cache prices with 15-minute intervals (to respect rate limits)
- Store daily closing prices for historical charts

### Security
- Financial data is highly sensitive — encrypt at rest (AES-256)
- No bank credentials stored — CSV import only (not screen scraping)
- All API endpoints require authentication
- Audit logging for all data access
- GDPR-compliant data export and deletion
- Rate limiting on import endpoints (prevent abuse)

### Performance
- Pagination for transaction lists (default 50, max 200)
- Materialised views for dashboard aggregations
- Background processing for CSV imports (async with status polling)
- Pre-calculated monthly summaries updated via triggers or scheduled jobs
- Database indices on userId, accountId, date, categoryId

### Multi-Currency
- Exchange rates updated daily from European Central Bank or Exchange Rates API
- Historical rates stored for accurate historical conversions
- Base currency configurable per user
- Display both original and converted amounts

---

## UK-Specific Features

### UK Account Types

The standard account type list should be extended to include common UK-specific account types:

| Account Type | Notes |
|---|---|
| `cash_isa` | Cash ISA — tax wrapper, annual allowance tracking |
| `stocks_isa` | Stocks & Shares ISA — distinct from general investment account |
| `sipp` | Self-Invested Personal Pension — balance tracking, annual contribution |
| `premium_bonds` | NS&I Premium Bonds — no interest, prize tracking |
| `lifetime_isa` | LISA — bonus tracking, 25% government bonus |

ISA allowance tracking: display remaining annual ISA allowance (£20,000 for 2025/26) across all ISA accounts combined.

### UK Tax Year Awareness

All reporting **must** be filterable by UK tax year (6 April – 5 April) in addition to calendar year. This is important for:

- Self-assessment preparation (sole traders, landlords, investors)
- ISA allowance usage tracking
- Capital gains tax summary (HMRC annual exemption)
- Pension contribution tracking (annual allowance)

The date range picker throughout the Finance module must include "This Tax Year" and "Last Tax Year" as preset options.

### Additional UK-Relevant Features

| Feature | Detail |
|---|---|
| **Cash flow forecasting** | Project account balance forward 30 / 60 / 90 days based on known recurring bills and expected income. Answers: "Will I go overdrawn before payday?" |
| **Split transactions** | One payment split across multiple categories — e.g. a supermarket shop covering groceries, toiletries, and alcohol separately |
| **Net worth timeline** | Graph net worth over time (not just the current snapshot). Motivating and useful for long-term financial planning |
| **Financial calendar** | Month view showing income vs outgoings by date — not just totals. Useful for cash-flow planning when multiple large bills land in the same week |

---

## Spending Pots (Envelope Budgeting)

The budgeting model should support an **envelope budgeting** approach where each spending category is a named pot with an individual budget allocation. This is in addition to the category-based budget system.

### Pot Types

| Pot | Type |
|---|---|
| Food & Groceries | Variable |
| Fuel | Variable |
| Eating Out / Takeaways | Variable / Discretionary |
| Kids | Variable |
| Clothing | Discretionary |
| Entertainment | Discretionary |
| Bills & Utilities | Fixed — auto-populated from recurring payment detection |
| Subscriptions | Fixed — auto-populated from recurring detection |
| Savings | Fixed allocation |
| Emergency Fund | Fixed allocation |
| Holiday / Travel | Savings goal |

### Pot Behaviour
- Transactions auto-assigned to pots based on merchant category
- Manual reassignment where auto-categorisation is incorrect
- Real-time pot balance: budget remaining vs spent
- Visual indicators — progress bars per pot, colour-coded (green / amber / red)
- Overspend alerts — notify when a pot is near (80%) or over (100%) budget
- Rollover options — unused pot budget can roll to next month or reset

---

## Recurring Payment Detection & Bills Dashboard

In addition to manually entered bills (User Story 4), the system should **automatically detect** recurring payments from imported transaction data.

### Auto-Detection Logic
- Identify repeat payments by merchant name, frequency (weekly / monthly / quarterly / annual), and amount stability
- Classify automatically as:
  - **Fixed Bills** — same merchant, same amount every period
  - **Variable Bills** — same merchant, amount fluctuates (e.g. energy)
  - **Subscriptions** — digital services (Netflix, Spotify, Adobe etc.)
  - **Regular Spend** — same merchant, discretionary (e.g. gym, coffee shop)

### Bills Dashboard View
For each detected recurring payment, display:
- Merchant name and logo (where available)
- Average monthly cost
- Last payment date
- Next expected payment date
- Payment trend: stable / increasing / decreasing
- Category: Utilities / Insurance / Subscriptions / Debt / Other

### Bill Intelligence
- Flag bills that have **increased** since the last period — with the amount and percentage of increase
- Flag subscriptions that have not been used recently (where detectable from other data)
- Allow manual override: rename, recategorise, or mark a recurring payment as a one-off

---

## Merchant Normalisation

Bank CSV exports contain noisy, machine-generated descriptions: `AMZN*1X2Y3Z LUXEMBOURG`, `TFL TRAVEL CH 000001`, `PAYPAL *EBAY`. Merchant normalisation transforms these into clean, human-readable names before any other processing.

### Normalisation Pipeline

Each imported transaction passes through two stages:

1. **Prefix stripping** — remove common UK bank prefixes (`PURCHASE`, `CONTACTLESS`, `FASTER PAYMENT`, `BACS CREDIT`, `DD`)
2. **Merchant lookup** — match the stripped description against a curated pattern dictionary and replace with the canonical merchant name

The normalised name is stored in the `Payee` field. The original bank text is always preserved in `OriginalDescription`.

### Merchant Pattern Dictionary (initial set)

The dictionary maps regex patterns to canonical names, grouped by category:

| Pattern | Canonical Name | Category |
|---|---|---|
| `AMZN\*`, `AMAZON` | Amazon | Shopping |
| `NETFLIX` | Netflix | Subscriptions |
| `SPOTIFY` | Spotify | Subscriptions |
| `APPLE\.COM`, `APPLE STORE`, `ITUNES` | Apple | Subscriptions |
| `GOOGLE \*`, `GOOGLE PAY` | Google | Subscriptions |
| `DISNEY\+`, `DISNEY PLUS` | Disney+ | Subscriptions |
| `TFL TRAVEL`, `TFL\.GOV` | Transport for London | Transport |
| `UBER \*`, `UBEREATS` | Uber | Transport |
| `DELIVEROO` | Deliveroo | Eating Out |
| `JUST EAT` | Just Eat | Eating Out |
| `TESCO` | Tesco | Groceries |
| `SAINSBURY` | Sainsbury's | Groceries |
| `ASDA` | ASDA | Groceries |
| `LIDL` | Lidl | Groceries |
| `ALDI` | Aldi | Groceries |
| `MORRISONS` | Morrisons | Groceries |
| `WAITROSE` | Waitrose | Groceries |
| `MARKS AND SPENCER`, `M&S` | Marks & Spencer | Shopping |
| `COSTA` | Costa Coffee | Eating Out |
| `STARBUCKS` | Starbucks | Eating Out |
| `PRET A MANGER`, `PRET` | Pret A Manger | Eating Out |
| `MCDONALD` | McDonald's | Eating Out |
| `BP`, `BP\*` | BP | Fuel |
| `SHELL` | Shell | Fuel |
| `ESSO` | Esso | Fuel |
| `EDF ENERGY`, `EDF` | EDF Energy | Utilities |
| `BRITISH GAS` | British Gas | Utilities |
| `OCTOPUS ENERGY` | Octopus Energy | Utilities |
| `VIRGIN MEDIA` | Virgin Media | Utilities |
| `SKY` | Sky | Utilities |
| `BT GROUP`, `BT\.COM` | BT | Utilities |
| `PAYPAL \*` | PayPal (+ merchant suffix) | Shopping |
| `ETSY` | Etsy | Shopping |
| `EBAY` | eBay | Shopping |
| `HMRC` | HMRC | Tax |
| `DVLA` | DVLA | Transport |

### User Override

When a user corrects a `Payee` name on a transaction, they are offered the option to:

- Update this transaction only
- Update all transactions from the same original description pattern
- Create a permanent rule (see Category Rules Engine below)

---

## Category Rules Engine

Users should not have to manually categorise every imported transaction. The rules engine learns from the transaction data and the user's corrections to auto-assign categories.

### How Rules Work

A `CategoryRule` specifies: given a transaction whose `Payee` (or `Description`) **contains** / **starts with** / **exactly matches** a pattern, assign it to a specific category.

Rules are applied in priority order after merchant normalisation, before the transaction is saved. The first matching rule wins.

### Rule Sources

Rules are created from three places:

1. **Automatic from merchant normalisation** — when a merchant is in the normalisation dictionary, a rule is auto-suggested for that merchant's canonical category (e.g. Tesco → Groceries). User can accept or dismiss.
2. **Manual correction** — when a user recategorises a transaction, they are offered: "Always categorise [Merchant] as [Category]?" Accepting creates a rule.
3. **User-defined** — user can create rules manually via the Category Rules Manager UI.

### Rule Entity

```
CategoryRule:
  id, userId
  pattern (string — the merchant name or substring to match)
  matchType (Contains | StartsWith | Exact)
  categoryId (FK → categories)
  priority (integer — lower = higher priority)
  isActive (bool)
  appliedCount (int — times applied, for UI display)
  createdAt, updatedAt
```

### Category Rules Manager (UI)

A dedicated settings panel listing all user rules:

- Rule pattern, match type, assigned category, times applied
- Toggle active/inactive
- Delete rule
- Drag to reorder (priority)
- "Apply rules to existing transactions" — retrospectively apply all rules to unreviewed transactions

### Integration Points

- `CsvImportService.ImportAsync()` — applies rules after normalisation, before saving
- `TransactionService.UpdateTransactionAsync()` — when category changes, prompt to create rule
- `GET /finance/category-rules` — list rules
- `POST /finance/category-rules` — create rule
- `PATCH /finance/category-rules/{id}` — update (toggle active, change priority)
- `DELETE /finance/category-rules/{id}` — delete rule
- `POST /finance/category-rules/apply-all` — apply all active rules to unreviewed transactions

---

## Sinking Funds

A sinking fund is the financial planning concept of setting aside a fixed monthly amount for a large irregular expense — spreading the cost so it doesn't feel like a financial shock when it arrives.

**Examples**: Annual car insurance (£600 → £50/month), MOT + service (£400 → £33/month), boiler service (£120 → £10/month), Christmas spending (£500 → £42/month).

### Sinking Fund as a Pot Type

The `SpendingPot` entity supports a `SinkingFund` pot type with additional fields:

- `AnnualAmount` — the full annual cost being spread
- `NextPaymentDate` — when the lump sum will next be needed (e.g. insurance renewal)
- `MonthlyAllocation = AnnualAmount / 12` (derived)
- `AccumulatedAmount` — total set aside so far this cycle
- `MonthsRemaining` — until the next payment date

### Sinking Fund Behaviour

- Contributions are tracked manually (user taps "Set aside this month's allocation")
- OR automatically deducted from disposable income calculation (Phase 44+)
- When `AccumulatedAmount >= AnnualAmount`, the fund shows "Ready" status
- After the payment date passes, the fund resets for the next cycle

### Display

Sinking fund cards show:

- Annual amount and monthly allocation
- Progress bar: accumulated vs target
- Countdown: "Ready in N months" or "Ready"
- Next payment date

---

## Payday-Aware Budgeting Period

Most budget apps reset on the 1st of the month. This is wrong for most people — if you're paid on the 25th, your "month" runs 25th → 24th, and a calendar-month reset means the first 24 days of your budget are already half-spent before you even get paid.

### User Setting

Users can configure a `PaydayDay` (1–28) in Finance Settings. When set:

- All budget calculations switch from "calendar month" to "pay period" (last PaydayDay → next PaydayDay)
- The budget overview header shows the pay period dates: "25 May – 24 Jun"
- The days-remaining counter counts to the next payday, not the end of the calendar month
- Historical budgets remain aligned to the pay period they belonged to

### Calculation Logic

```
if PaydayDay is set:
    periodStart = most recent occurrence of PaydayDay (inclusive)
    periodEnd   = next occurrence of PaydayDay (exclusive)
else:
    periodStart = first day of calendar month
    periodEnd   = last day of calendar month
```

When today IS the payday, the new period starts today.

### Finance Settings Entity

```
UserFinanceSettings:
  id, userId (unique)
  paydayDay (int? — null = use calendar month, 1–28 = use pay period)
  baseCurrency (string — ISO 4217, default "GBP")
  createdAt, updatedAt
```

Finance Settings are accessed via:

- `GET /finance/settings` — get current user's settings
- `PUT /finance/settings` — update settings

---

## AI Agent Features

### Subscription Auditor
Runs monthly. Fetches 90 days of transactions, finds merchants with recurring monthly charges, flags ones not used recently. Outputs a structured list of "potentially unused subscriptions." **Execution (cancellation) always requires manual confirmation — the agent is an advisor, never an accountant.**

### Negotiation Engine
Pulls service history with a provider (ISP, mobile, utilities) and generates a persuasive, personalised email or chat script for retention / discount negotiations — referencing contract length, customer tenure, and competitor pricing.

### Spending Velocity
Not just "70% of budget used" but **"70% used in 10 days — projected to overspend by £45 at this rate."** Actionable, not merely informational.

### Anomaly Detection
Flag unusual transactions: spending spike in a category, potential duplicate charges, merchant the user has never used before above a configurable threshold.

---

## The Finance Oracle — Architecture Direction

*Decision captured 2026-05-23. Treat finance as a data engineering problem, not just a CRUD app.*

### Deterministic Data Access Layer

The AI never calculates net worth or spending trends itself. It queries MCP tools that return raw, sanitised data, and the LLM performs semantic analysis on top. This keeps financial data **accurate and auditable**.

```
Claude (claude.ai / Claude Code / Claude mobile)
        │
        │  MCP over stdio (local) or SSE (remote via Tailscale)
        │
Life Manager MCP Server (local — Node.js, TypeScript)
        │
        │  SQL queries
        │
Finance Manager PostgreSQL schema (separate `finance` schema)
```

### Data Connectivity — Open Banking vs CSV

| Option | Pros | Cons |
|---|---|---|
| **CSV Import** (MVP plan) | No third-party dependency, works offline, privacy-preserving | Manual, user friction, not real-time |
| **TrueLayer / Enable Banking** | Real-time sync, PSD2 compliant, UK-native | Setup complexity, ongoing API cost, privacy considerations |
| **Plaid** | Mature, great DX | Less UK bank coverage than TrueLayer |

**Decision**: Build CSV import first (spec covers 7 UK banks). Layer Open Banking on top as a Phase 2 enhancement. Do not block Phase 41 on the Open Banking decision.

### DB Isolation

Consider a separate `finance` PostgreSQL schema to isolate sensitive financial data from the main application schema. This supports:
- Future microservices extraction (finance service can own its schema)
- Tighter access control and audit logging scoped to financial data
- Clear data boundary for encryption at rest decisions

---

## MCP Tools — `finance_*` Namespace

The Finance Manager exposes the following tools on the Life Manager MCP Server:

### Transaction Tools
| Tool | Description |
|---|---|
| `finance_get_transactions` | Get transactions filtered by date range, category, merchant, or pot |
| `finance_get_transaction_summary` | Summarised spend totals by category for a given period |
| `finance_search_transactions` | Full-text search across merchant names and notes |
| `finance_add_manual_transaction` | Add a cash or manual transaction |
| `finance_categorise_transaction` | Update the category or pot assignment of a transaction |

### Bills & Recurring Payments
| Tool | Description |
|---|---|
| `finance_get_recurring_payments` | List all detected recurring payments with trend data |
| `finance_get_bills_due` | Return upcoming bills due within a specified number of days |
| `finance_get_bill_history` | Get payment history for a specific bill / merchant |
| `finance_flag_bill_for_review` | Mark a bill as needing review |

### Budget & Pots
| Tool | Description |
|---|---|
| `finance_get_pot_balances` | Return current balance, budget, and remaining for all pots |
| `finance_get_pot_transactions` | Get all transactions assigned to a specific pot |
| `finance_update_pot_budget` | Adjust the budget allocation for a pot |
| `finance_get_monthly_budget_summary` | Full month overview — income, spent, remaining, pot breakdown |

### Income & Savings
| Tool | Description |
|---|---|
| `finance_get_income_summary` | Total income detected for a period |
| `finance_get_savings_goals` | List all savings goals with progress |
| `finance_update_savings_goal` | Update target amount or date for a savings goal |
| `finance_get_disposable_income` | Calculate remaining disposable income after committed spend |

### AI Assessments
| Tool | Description |
|---|---|
| `finance_get_financial_health_score` | Return current health score with breakdown |
| `finance_get_ai_insights` | Return queued AI-generated insights and recommendations |
| `finance_run_spend_analysis` | Trigger a fresh AI analysis of recent transactions |
| `finance_get_savings_opportunities` | Return AI-identified savings opportunities |
| `finance_get_cashflow_forecast` | Project account balance 30 / 60 / 90 days forward |

### Reporting
| Tool | Description |
|---|---|
| `finance_get_monthly_report` | Full formatted report for a given month |
| `finance_get_year_to_date_summary` | YTD spend, income, and savings summary |
| `finance_get_tax_year_summary` | Summary filtered to the UK tax year (6 Apr – 5 Apr) |
| `finance_compare_months` | Side-by-side comparison of two months |
| `finance_export_transactions` | Export transactions as CSV for a given period |

---

## Data Privacy & Security

- Financial data is highly sensitive — **AES-256 encryption at rest** for account balances, transaction descriptions, and account numbers
- No third-party sharing of transaction data — CSV-only processing keeps data local
- CSV files should be processed server-side and **optionally deleted** after import (user choice)
- Consider a **PIN / biometric lock** for the Finance Manager module specifically, independent of the main app session
- All MCP tool calls against financial data are logged with timestamp, tool name, and parameters for audit
- MCP server should bind to localhost only by default — never exposed on the network without explicit Tailscale configuration
- Read-only MCP tools and write MCP tools should have separate permission tiers

---

## Integration Points — Life Manager Ecosystem

| Integration | Detail |
|---|---|
| **Bills → Calendar** | Due dates auto-create Life Manager calendar events |
| **Overdue bills → Tasks** | Missed payment generates a task: "Pay [bill] — overdue" |
| **Budget alerts → Notifications** | Existing notification system used for 80% / 100% pot threshold alerts |
| **Finance summary → Weekly review** | Monthly / weekly spending digest feeds into second brain weekly review |
| **Recipe Collection** | Grocery shopping lists from meal plans feed into the grocery pot; no double-entry |
| **Nutrition Module** | Food cost per meal (from Pantry Tracker) contributes to running monthly food cost |
| **Financial Health Score** | Surfaced on the main Life Manager dashboard widget |

---

## Phase Roadmap (Updated)

| Phase | Features | Priority |
|---|---|---|
| Phase 41 (P1) — MVP Core | CSV import (7 UK bank formats), transaction parsing, accounts & transactions model, `finance` DB schema | P1 |
| Phase 42 (P1) — Budgeting & Pots | Spending pots, budget allocation, transaction auto-categorisation, envelope budgeting UI | P1 |
| Phase 43 (P2) — Bills & Savings | Recurring payment auto-detection, bills dashboard, bills calendar, savings goals | P2 |
| Phase 44 (P1) — Dashboard | Monthly summary, reporting, spend vs budget charts, financial health score | P1 |
| Phase 45 (P2) — UK Specifics | ISA / SIPP / Premium Bond account types, UK tax year reporting, cash flow forecasting, net worth timeline | P2 |
| Phase 46 (P3) — Investment | Investment tracking, net worth view, FTSE / S&P benchmark comparison | P2 |
| Phase 47 (P3) — Debt | Debt tracker, avalanche / snowball payoff planner, multi-currency, split transactions | P3 |
| Phase 48 (P3) — AI Insights | Subscription Auditor, Negotiation Engine, Spending Velocity, Anomaly Detection, financial health score | P3 |
| Phase 49 (P3) — MCP | Local MCP server, `finance_*` tools, AI Chat Interface ("How much did I spend on food last month?"), remote access via Tailscale | P3 |
| Phase 50 (P3) — Household Sharing | Cross-login account sharing (view-only, `AccountShare` — mirrors `EventShare`), "Include household accounts" toggle on Affordability/Debt/AI Insights | P3 |

---

## Decisions Needed Before Phase 41

- [ ] **Open Banking vs CSV-first** — TrueLayer / Enable Banking now, or CSV import first and OB later? (Recommendation: CSV first)
- [ ] **DB isolation** — Separate `finance` PostgreSQL schema now, or keep in main schema?
- [ ] **Encryption at rest** — Which fields get AES-256? (Account numbers, balances, transaction descriptions?)
- [ ] **Phase ordering** — Finance was originally planned after Stocks (Phase 60+). Is it being pulled forward?
- [ ] **AI provider** — Spec references OpenAI for categorisation. Worth switching to Claude API given existing tooling?
- [x] **Multi-user scope** — Strictly single-user (UserId-scoped) through Phase 49. Resolved for the future by Phase 50 — Household Sharing (User Story 10): opt-in, per-account, view-only sharing between two logins, not a merged household account.
- [ ] **ISA / pension account types** — Add to Phase 41 data model or defer to Phase 45?
- [ ] **MCP server scope** — Combined Life Manager MCP server from day one, or finance MCP built standalone first?
