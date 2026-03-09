# Feature Specification: Life Manager - Transaction Import & Budgeting

**Feature ID**: `012-finance-manager`  
**Created**: 2026-01-18  
**Status**: Planned  
**Priority**: P1  
**Dependencies**: User Management, Dashboard

## Overview

The **Life Manager** is the namesake feature of this application: a comprehensive personal finance management system that imports CSV transaction data from banks, categorizes expenses, tracks budgets, and provides financial insights through visualizations. This is the core financial functionality the project was originally conceived for.

## Rationale

Personal finance management requires:
- Aggregating transactions from multiple accounts
- Categorizing expenses automatically
- Tracking spending against budgets
- Visualizing financial trends
- Identifying overspending and savings opportunities

**Unlike the To Do app**, which handles tasks and events, the Life Manager focuses on **financial health**.

**Business Value**:
- Solves real user pain: understanding spending patterns
- Differentiates from basic to-do apps
- Provides ROI through budget optimization
- Enables data-driven financial decisions

## Core Concepts

### Transaction Model

```typescript
interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  
  // Transaction Details
  date: Date;
  description: string;
  amount: number; // Positive = income, Negative = expense
  balance?: number; // Running balance after transaction
  
  // Categorization
  categoryId?: string;
  subCategoryId?: string;
  tags: string[];
  
  // Metadata
  merchant?: string;
  location?: string;
  notes?: string;
  
  // Import Info
  importId: string;
  sourceBank: string;
  sourceFile: string;
  isDuplicate: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Account Model

```typescript
interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  institution: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
  createdAt: Date;
}

enum AccountType {
  Checking = 'checking',
  Savings = 'savings',
  CreditCard = 'credit_card',
  Investment = 'investment',
  Cash = 'cash',
}
```

### Budget Model

```typescript
interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  
  // Budget Parameters
  amount: number;
  period: BudgetPeriod;
  startDate: Date;
  endDate?: Date;
  
  // Tracking
  spent: number; // Calculated from transactions
  remaining: number; // amount - spent
  percentUsed: number; // (spent / amount) * 100
  
  // Alerts
  alertThreshold: number; // % to trigger alert (e.g., 80%)
  alertsEnabled: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

enum BudgetPeriod {
  Weekly = 'weekly',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  Yearly = 'yearly',
}
```

### CSV Import Flow

1. **Upload CSV**: User uploads CSV file from bank
2. **Parse CSV**: System detects columns (date, description, amount)
3. **Map Columns**: User confirms/adjusts column mappings
4. **Detect Duplicates**: Check for existing transactions
5. **Categorize**: Auto-categorize based on rules and ML
6. **Review**: User reviews and edits before confirming
7. **Import**: Transactions saved to database
8. **Update Budgets**: Recalculate budget tracking

## User Scenarios & Testing

### User Story 1 - Import Bank CSV (Priority: P1)

**Why this priority**: Foundation - users must be able to import transactions.

**Independent Test**: Upload CSV with 100 transactions, verify all are parsed and imported correctly.

**Acceptance Scenarios**:

1. **Given** accounts page, **When** user clicks "Import Transactions", **Then** file upload modal opens
2. **Given** CSV file selected, **When** uploaded, **Then** preview displays first 10 rows
3. **Given** column mapping, **When** system detects columns, **Then** auto-maps Date, Description, Amount
4. **Given** incorrect mapping, **When** user adjusts, **Then** preview updates immediately
5. **Given** 20 duplicate transactions, **When** importing, **Then** duplicates are flagged and excluded by default

### User Story 2 - Categorize Transactions (Priority: P1)

**Why this priority**: Core value - categorization enables budget tracking.

**Independent Test**: Import uncategorized transactions, apply auto-categorization rules, verify accuracy >80%.

**Acceptance Scenarios**:

1. **Given** imported transactions, **When** viewing list, **Then** auto-categorized transactions show category badge
2. **Given** uncategorized transaction, **When** user clicks, **Then** category picker modal opens
3. **Given** transaction "Tesco Groceries £45", **When** auto-categorizing, **Then** system suggests "Groceries" category
4. **Given** categorization rule "Amazon → Shopping", **When** importing Amazon transaction, **Then** auto-applies Shopping
5. **Given** bulk selection, **When** user selects 10 transactions and assigns category, **Then** all update immediately

### User Story 3 - Create and Track Budgets (Priority: P1)

**Why this priority**: Essential for financial management - users need spending limits.

**Independent Test**: Create monthly budget for groceries, import transactions, verify budget tracking updates.

**Acceptance Scenarios**:

1. **Given** budgets page, **When** user clicks "Create Budget", **Then** form opens with category picker and amount input
2. **Given** "Groceries £400/month" budget, **When** £150 spent, **Then** budget shows 37.5% used with green indicator
3. **Given** budget at 85%, **When** threshold exceeded, **Then** warning notification displays
4. **Given** budget exceeded (110%), **When** viewing, **Then** budget shows red indicator and over-budget amount
5. **Given** multiple budgets, **When** viewing dashboard, **Then** summary shows total budgeted vs. spent

### User Story 4 - Financial Insights Dashboard (Priority: P2)

**Why this priority**: Provides value - visualizations help users understand spending.

**Independent Test**: Generate insights for 6 months of data, verify charts and trends are accurate.

**Acceptance Scenarios**:

1. **Given** dashboard, **When** viewing, **Then** monthly spending trend line chart displays
2. **Given** spending by category, **When** viewing, **Then** pie chart shows top 5 categories
3. **Given** income vs. expenses, **When** viewing, **Then** bar chart compares monthly totals
4. **Given** budget performance, **When** viewing, **Then** shows % of budgets on track vs. over-budget
5. **Given** time range selector, **When** user selects "Last 3 months", **Then** all charts update to show 3-month data

### User Story 5 - Recurring Transactions (Priority: P2)

**Why this priority**: Helps predict spending - identify subscriptions and bills.

**Independent Test**: Import transactions, detect 5 recurring patterns, verify predictions.

**Acceptance Scenarios**:

1. **Given** transaction history, **When** system detects "Netflix £12.99" monthly, **Then** flags as recurring
2. **Given** recurring transaction, **When** viewing, **Then** shows frequency (monthly, weekly) and next expected date
3. **Given** recurring subscriptions, **When** viewing list, **Then** shows total monthly recurring cost
4. **Given** missed recurring transaction, **When** expected date passes, **Then** notification alerts user
5. **Given** recurring transaction, **When** user cancels subscription, **Then** marks as inactive and stops predictions

## Technical Architecture

### Backend Components

**Database Schema**:
```typescript
// Core entities defined above: Transaction, Account, Budget

interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  parentId?: string; // For subcategories
  color: string;
  icon?: string;
  isDefault: boolean;
}

interface ImportJob {
  id: string;
  userId: string;
  accountId: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  errorRows: number;
  errorDetails?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface CategorizationRule {
  id: string;
  userId: string;
  pattern: string; // Regex or substring
  categoryId: string;
  priority: number;
  isActive: boolean;
}
```

**Service Layer**:
- `TransactionService` - CRUD for transactions
- `CsvImportService` - Parse and import CSV files
- `CategorizationService` - Auto-categorize transactions
- `BudgetService` - Manage budgets and tracking
- `InsightsService` - Generate financial insights
- `DuplicateDetectionService` - Identify duplicate transactions
- `RecurringTransactionService` - Detect and predict recurring patterns

**API Endpoints**:
- `POST /api/v1/accounts/:id/import` - Upload and import CSV
- `GET /api/v1/transactions` - List transactions (paginated, filtered)
- `PUT /api/v1/transactions/:id` - Update transaction (category, notes)
- `PUT /api/v1/transactions/bulk-categorize` - Categorize multiple transactions
- `GET /api/v1/budgets` - List budgets
- `POST /api/v1/budgets` - Create budget
- `PUT /api/v1/budgets/:id` - Update budget
- `GET /api/v1/insights/spending-trends` - Get spending trends
- `GET /api/v1/insights/category-breakdown` - Get category breakdown
- `GET /api/v1/insights/budget-performance` - Get budget performance

**Background Jobs**:
- `ProcessCsvImportJob` - Process uploaded CSV files
- `RecalculateBudgetsJob` - Update budget tracking daily
- `DetectRecurringTransactionsJob` - Identify recurring patterns
- `GenerateMonthlyReportJob` - Email monthly financial summary

### Frontend Components

**UI Pages**:
- `AccountsPage` - List and manage accounts
- `TransactionsPage` - List and filter transactions
- `ImportWizard` - Multi-step CSV import flow
- `BudgetsPage` - Create and track budgets
- `InsightsDashboard` - Financial visualizations
- `RecurringTransactionsPage` - Manage subscriptions and recurring bills

**Components**:
- `TransactionList` - Paginated transaction table
- `TransactionRow` - Single transaction with edit capability
- `CategoryPicker` - Dropdown for selecting category
- `ImportPreview` - CSV preview with column mapping
- `BudgetProgressBar` - Visual budget tracking
- `SpendingTrendChart` - Line chart for spending over time
- `CategoryBreakdownChart` - Pie chart for category distribution

**State Management**:
- Transactions stored with pagination metadata
- Accounts and budgets in global context
- Import job status tracked with polling

## Task Breakdown: Phase 23 - Life Manager (8 weeks)

### Week 1-2: Backend Foundation (Days 1-10)

**Database Schema**
- [ ] T1111 [P] Create Account entity - 2h
- [ ] T1112 [P] Create Transaction entity - 3h
- [ ] T1113 [P] Create Category entity - 2h
- [ ] T1114 [P] Create Budget entity - 2h
- [ ] T1115 [P] Create ImportJob entity - 2h
- [ ] T1116 [P] Create CategorizationRule entity - 2h
- [ ] T1117 Create EF Core migrations - 2h
- [ ] T1118 Apply migrations and verify schema - 1h

**Account Service**
- [ ] T1119 Create AccountService - 5h
- [ ] T1120 Implement CreateAccount method - 3h
- [ ] T1121 Implement UpdateBalance method - 3h
- [ ] T1122 Implement GetAccounts method - 2h
- [ ] T1123 Write unit tests for account service (12 tests) - 4h

**Transaction Service**
- [ ] T1124 Create TransactionService - 6h
- [ ] T1125 Implement CreateTransaction method - 4h
- [ ] T1126 Implement GetTransactions with filtering - 5h
- [ ] T1127 Implement UpdateTransaction method - 3h
- [ ] T1128 Implement DeleteTransaction method - 2h
- [ ] T1129 Write unit tests for transaction service (20 tests) - 6h

**CSV Import Service**
- [ ] T1130 Create CsvImportService - 8h
- [ ] T1131 Implement CSV parsing with CsvHelper library - 6h
- [ ] T1132 Implement column detection algorithm - 5h
- [ ] T1133 Implement column mapping - 4h
- [ ] T1134 Write unit tests for CSV import (15 tests) - 5h

**Duplicate Detection**
- [ ] T1135 Create DuplicateDetectionService - 6h
- [ ] T1136 Implement fuzzy matching algorithm - 5h
- [ ] T1137 Implement date/amount matching - 4h
- [ ] T1138 Write unit tests for duplicate detection (12 tests) - 4h

**Checkpoint**: Backend foundation ready

### Week 3-4: Categorization & Budgets (Days 11-20)

**Categorization Service**
- [ ] T1139 Create CategorizationService - 6h
- [ ] T1140 Seed default categories for new users - 3h
- [ ] T1141 Implement rule-based categorization - 5h
- [ ] T1142 Implement merchant detection (regex patterns) - 4h
- [ ] T1143 Implement bulk categorization - 4h
- [ ] T1144 Write unit tests for categorization (18 tests) - 6h

**Budget Service**
- [ ] T1145 Create BudgetService - 6h
- [ ] T1146 Implement CreateBudget method - 4h
- [ ] T1147 Implement CalculateBudgetTracking method - 6h
- [ ] T1148 Implement GetBudgetPerformance method - 5h
- [ ] T1149 Implement budget alerts - 4h
- [ ] T1150 Write unit tests for budget service (20 tests) - 6h

**Recurring Transaction Service**
- [ ] T1151 Create RecurringTransactionService - 6h
- [ ] T1152 Implement pattern detection algorithm - 8h
- [ ] T1153 Implement prediction logic - 6h
- [ ] T1154 Write unit tests for recurring service (15 tests) - 5h

**Background Jobs**
- [ ] T1155 Create ProcessCsvImportJob - 5h
- [ ] T1156 Create RecalculateBudgetsJob - 4h
- [ ] T1157 Create DetectRecurringTransactionsJob - 5h
- [ ] T1158 Configure job scheduling - 3h
- [ ] T1159 Write unit tests for background jobs (12 tests) - 4h

**Checkpoint**: Core finance logic operational

### Week 5-6: API & Insights (Days 21-30)

**API Endpoints - Accounts & Transactions**
- [ ] T1160 Create AccountsController - 4h
- [ ] T1161 POST /api/v1/accounts endpoint - 3h
- [ ] T1162 GET /api/v1/accounts endpoint - 2h
- [ ] T1163 POST /api/v1/accounts/:id/import endpoint - 5h
- [ ] T1164 Create TransactionsController - 4h
- [ ] T1165 GET /api/v1/transactions endpoint with filtering - 5h
- [ ] T1166 PUT /api/v1/transactions/:id endpoint - 3h
- [ ] T1167 PUT /api/v1/transactions/bulk-categorize endpoint - 4h

**API Endpoints - Budgets**
- [ ] T1168 Create BudgetsController - 4h
- [ ] T1169 GET /api/v1/budgets endpoint - 2h
- [ ] T1170 POST /api/v1/budgets endpoint - 3h
- [ ] T1171 PUT /api/v1/budgets/:id endpoint - 3h
- [ ] T1172 DELETE /api/v1/budgets/:id endpoint - 2h

**Insights Service**
- [ ] T1173 Create InsightsService - 6h
- [ ] T1174 Implement GetSpendingTrends method - 6h
- [ ] T1175 Implement GetCategoryBreakdown method - 5h
- [ ] T1176 Implement GetIncomeVsExpenses method - 4h
- [ ] T1177 Implement GetBudgetPerformance method - 5h
- [ ] T1178 Create InsightsController - 4h
- [ ] T1179 Write integration tests for all endpoints (25 tests) - 8h

**Checkpoint**: API complete, insights ready

### Week 7: Frontend (Days 31-35)

**Frontend TypeScript Types**
- [ ] T1180 [P] Create Transaction interface - 2h
- [ ] T1181 [P] Create Account interface - 1h
- [ ] T1182 [P] Create Budget interface - 1h
- [ ] T1183 [P] Create Category interface - 1h

**Frontend Services**
- [ ] T1184 Create accountService.ts - 4h
- [ ] T1185 Create transactionService.ts - 5h
- [ ] T1186 Create budgetService.ts - 4h
- [ ] T1187 Create insightsService.ts - 4h
- [ ] T1188 Write service tests (15 tests) - 5h

**Accounts & Transactions UI**
- [ ] T1189 Create AccountsPage - 6h
- [ ] T1190 Create AccountCard component - 4h
- [ ] T1191 Create TransactionsPage - 8h
- [ ] T1192 Create TransactionList component - 6h
- [ ] T1193 Create TransactionRow component with inline editing - 5h
- [ ] T1194 Create CategoryPicker component - 5h
- [ ] T1195 Implement transaction filtering UI - 5h

**Import Wizard**
- [ ] T1196 Create ImportWizard multi-step component - 8h
- [ ] T1197 Create step 1: File upload - 4h
- [ ] T1198 Create step 2: Column mapping - 6h
- [ ] T1199 Create step 3: Duplicate detection - 5h
- [ ] T1200 Create step 4: Review and confirm - 5h

**Checkpoint**: Frontend transactions and import ready

### Week 8: Budgets, Insights & Polish (Days 36-40)

**Budgets UI**
- [ ] T1201 Create BudgetsPage - 6h
- [ ] T1202 Create BudgetCard component - 5h
- [ ] T1203 Create BudgetForm component - 5h
- [ ] T1204 Create BudgetProgressBar component - 4h
- [ ] T1205 Implement budget alerts UI - 4h

**Insights Dashboard**
- [ ] T1206 Create InsightsDashboard page - 8h
- [ ] T1207 Install recharts library (if not already) - 1h
- [ ] T1208 Create SpendingTrendChart component - 6h
- [ ] T1209 Create CategoryBreakdownChart component - 5h
- [ ] T1210 Create IncomeVsExpensesChart component - 5h
- [ ] T1211 Create BudgetPerformanceWidget component - 5h

**Recurring Transactions**
- [ ] T1212 Create RecurringTransactionsPage - 6h
- [ ] T1213 Create RecurringTransactionCard component - 4h

**Testing**
- [ ] T1214 Write component tests for finance UI (30 tests) - 10h
- [ ] T1215 Write E2E test for CSV import flow - 6h
- [ ] T1216 Write E2E test for transaction categorization - 5h
- [ ] T1217 Write E2E test for budget creation and tracking - 5h
- [ ] T1218 Write E2E test for insights dashboard - 5h

**Documentation**
- [ ] T1219 Write user guide for Life Manager - 6h
- [ ] T1220 Document CSV import requirements (column formats) - 3h
- [ ] T1221 Create budgeting best practices guide - 3h

**Final Review**
- [ ] T1222 Security audit (transaction data protection) - 5h
- [ ] T1223 Performance testing (10,000 transactions) - 5h
- [ ] T1224 Code review and refactoring - 6h

**Checkpoint**: Complete Life Manager feature

## Effort Summary

**Total Tasks**: 114 tasks (T1111-T1224)  
**Total Estimated Time**: ~380 hours (8 weeks)  
**Feature Priorities**:
- CSV import: P1 (foundation)
- Transaction management: P1 (core CRUD)
- Categorization: P1 (essential for budgets)
- Budgets: P1 (core financial tool)
- Insights: P2 (valuable visualizations)
- Recurring transactions: P2 (helpful predictions)

## Dependencies

- **User Management**: Transactions belong to users
- **Dashboard**: Integrate financial widgets into dashboard
- **Categories (Phase 20)**: Can reuse category system if available

## Success Criteria

- ✅ Users can import CSV files from major UK banks
- ✅ Duplicate detection achieves >95% accuracy
- ✅ Auto-categorization achieves >80% accuracy
- ✅ Budgets update in real-time as transactions are added
- ✅ Insights dashboard loads in <2 seconds with 1 year of data
- ✅ Performance: 10,000 transactions load in <1 second
- ✅ CSV import processes 1,000 rows in <10 seconds
- ✅ Recurring transaction detection finds >90% of subscriptions
- ✅ Mobile: Import wizard works smoothly on mobile devices

## Future Enhancements (Phase 2)

- **Bank API Integration**: Direct connection to banks (Open Banking)
- **Receipt Scanning**: OCR to extract transaction details from photos
- **Savings Goals**: Set and track financial goals
- **Investment Tracking**: Track stocks, crypto, bonds
- **Tax Reporting**: Generate tax summaries and reports
- **Multi-Currency Support**: Handle foreign transactions
- **Forecasting**: Predict future spending and income
- **Bill Reminders**: Alert for upcoming bills
- **Split Transactions**: Categorize single transaction across multiple categories
- **Shared Budgets**: Family budgets with multiple users
