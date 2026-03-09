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
