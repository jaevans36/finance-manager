# Feature Specification: Debt Burndown & Financial Affordability

**Feature ID**: `finance-debt-burndown`
**Created**: 2026-06-19
**Status**: Ready for implementation
**Priority**: P2
**Dependencies**: Finance Phase 41 (accounts, transactions), Phase 42 (budgets), Phase 43 (bills)
**Task range**: T1322–T1360
**Implements / expands**: Phase 47 (debt management — replaces the thin original spec)

---

## Overview

Three interconnected features that work together to give the user a clear picture of their debt
burden and a realistic, data-driven plan to eliminate it:

1. **Bill-to-Account Linking** — connects recurring bills to the bank account they debit from,
   enabling accurate committed-outgoing totals per account.

2. **Financial Affordability Engine** — uses real transaction data (income patterns), bills
   (committed costs), and budgets (planned spend) to calculate a "safe surplus" figure: the
   amount the user can realistically direct toward debt each month without going into the red.

3. **Debt Burndown** — severity-scored debt overview, Avalanche/Snowball/Custom payoff
   strategies, projection calculator fed by the affordability engine, and a waterfall
   visualisation showing when each debt is eliminated.

---

## Background: Why Some Debt is Worse Than Others

This context informs the severity scoring algorithm and the default strategy recommendation.

### Interest rate (primary driver)
A £2,000 credit card at 24.9% APR costs £498/year in interest. The same balance on a mortgage
at 4% costs £80/year. Rate dominates.

### Compounding type
Revolving debt (credit cards) compounds monthly on whatever balance remains — minimum-only
payments barely touch the principal. Fixed installment debt (loans, mortgage) has a
predetermined amortisation schedule; the payoff date is known.

### Promotional rate expiry
A 0% credit card deal expiring in 45 days that reverts to 29.9% APR is *more urgent* than a
15% card with no expiry risk, even though the current rate is lower. The severity algorithm
must account for imminent rate jumps.

### Unsecured vs. secured
Credit card and personal loan debt is unsecured — no asset backing it, and the rate reflects
that risk. Mortgage debt is secured against a property that typically appreciates. Mortgage
debt is broadly "good debt" by comparison; the affordability engine should allow, but not
recommend, treating it as a burndown target.

### Credit utilisation
For credit cards, balance-to-limit ratio above 80% signals financial stress and impacts
credit score. This adds urgency beyond the rate.

---

## The Two Evidence-Backed Strategies

Both strategies are offered; the system defaults to Avalanche but shows the cost difference.

**Avalanche** — minimums on all debts; all extra money to the highest-rate debt first.
Mathematically optimal: minimises total interest paid.
*(Source: Northwestern University, 2016)*

**Snowball** — minimums on all debts; all extra money to the smallest-balance debt first.
Behaviourally optimal: quick account closures provide psychological wins that increase
follow-through rate. Costs more in interest but higher completion probability.
*(Source: Harvard Business Review, 2012)*

**Custom** — user drags accounts into their preferred priority order.

The UI shows: *"Snowball costs you an extra £X in interest but clears Y accounts Z months sooner"*
so the user can make an informed choice.

---

## Feature 1: Bill-to-Account Linking

### Rationale
Bills currently float independently of accounts. Without linking, the system cannot calculate
"what actually leaves this account each month" — which is essential for the affordability engine
and for transaction-to-bill matching on import.

### Data model change

```
Bill
  + AccountId?   Guid?   FK → Accounts.Id (nullable — bills may not yet be linked)
```

Migration: `AddBillAccountLink`

### Behaviour

- **Linking**: `BillForm` shows an optional account selector (dropdown of the user's active
  accounts). Selecting an account means "this bill debits from this account."
- **Per-account committed total**: `AccountsDashboard` shows a "Monthly commitments" line
  beneath each account's balance — the sum of all active bills linked to that account.
- **Transaction matching on import**: when a transaction is imported, the system attempts
  to match it against linked bills for that account. Match criteria: payee/description
  contains the bill name (fuzzy), amount within 10%, transaction date within 5 days of
  the bill's due day. A matched transaction marks the bill as paid for that period and
  links the transaction back to the bill.
- **Affordability engine integration**: the engine uses linked bills (not estimates) for
  committed-cost calculation on the account the bill is linked to.

### Acceptance scenarios

1. **Given** a user is creating/editing a bill, **When** they select an account, **Then** the
   bill is linked and appears in that account's "Monthly commitments" total.
2. **Given** a bill is linked to an account, **When** a matching transaction is imported for
   that account, **Then** the bill is automatically marked as paid and the transaction shows
   a "Bill payment" badge.
3. **Given** an account with linked bills, **When** the user views `AccountsDashboard`, **Then**
   they see "£X/month committed" beneath the balance.
4. **Given** a bill with no account selected, **When** the system calculates affordability,
   **Then** the bill's amount is still included in total committed costs (just not
   account-specific).

---

## Feature 2: Financial Affordability Engine

### Rationale
Without knowing how much money is genuinely available, a debt payoff plan is fiction. The
engine derives a real number from three data sources:

| Source | Contribution |
|--------|-------------|
| Transactions (last 3 months) | Income detection — identifies salary/regular large credits |
| Bills | Committed recurring costs — known monthly floor |
| Budgets | Planned discretionary spend — what the user has decided to allocate |

The output is a single figure: **"Safe monthly surplus"** — what can be redirected to debt
acceleration without causing financial stress.

### Income detection logic

The system scans credit transactions (not Transfers) over the last 90 days and identifies
"income events" by:
- Large regular credits (> median transaction amount × 5)
- Monthly or weekly cadence (±3 days tolerance)
- Payee matching known employer/payroll patterns (BACS, "SALARY", "PAYROLL", employer name)

The average monthly income is calculated from the 3-month window. If < 2 income events
detected, the engine flags that it cannot reliably determine income and asks the user to
confirm a manual income figure (stored in `UserFinanceSettings.ManualMonthlyIncome`).

### Committed costs calculation

```
Total committed = SUM(active bill amounts, annualised to monthly)
               + SUM(debt minimum monthly payments)
```

Bills linked to accounts are used directly. Bills without accounts are still included in the
total.

### Discretionary spend calculation

```
Discretionary = SUM(budget amounts for current month)
               - bills already captured in committed costs (avoid double-count)
```

If the user has no budgets, the engine falls back to average monthly spend from transactions
(excluding income, transfers, and identified bill payments).

### Safe surplus formula

```
Safe surplus = Monthly income
             - Committed costs
             - Discretionary spend
             - Emergency buffer (configurable, default £200/month)
```

The engine presents this as a range: *"Based on the last 3 months, you have between £X and £Y
available each month. We suggest directing £Z toward debt — keeping £200 as a monthly buffer."*

### API endpoint

`GET /finance/affordability`

Response:
```json
{
  "monthlyIncome": 3200,
  "incomeConfidence": "High|Medium|Low",
  "committedCosts": 1100,
  "discretionarySpend": 800,
  "emergencyBuffer": 200,
  "safeSurplus": 1100,
  "suggestedDebtPayment": 900,
  "incomeSource": "Detected|Manual",
  "calculatedAt": "2026-06-19"
}
```

`PUT /finance/affordability/income` — allows user to set/override manual monthly income.

### Acceptance scenarios

1. **Given** 3 months of imported transactions, **When** the user opens the Debt tab,
   **Then** the system shows detected monthly income, committed costs, and safe surplus.
2. **Given** income cannot be reliably detected (< 2 events), **When** the affordability
   panel is shown, **Then** it prompts the user to enter their monthly income manually.
3. **Given** a manually entered income, **When** income is later detectable from transactions,
   **Then** the system offers to switch back to auto-detected (does not override silently).
4. **Given** a user has budgets set, **When** affordability is calculated, **Then** budget
   amounts are used for discretionary spend (not raw transaction average).
5. **Given** the affordability calculation, **When** the user views the Debt Burndown page,
   **Then** the safe surplus figure is pre-filled as the "extra payment" in the projection
   calculator (user can adjust).

---

## Feature 3: Debt Burndown

### Additional account fields required

The existing `Account` model needs four new fields for accurate debt projection:

| Field | Type | Applies to |
|-------|------|-----------|
| `MinimumMonthlyPayment` | `decimal?` | Credit, Loan |
| `CurrentMonthlyPayment` | `decimal?` | All debt types |
| `LoanEndDate` | `DateOnly?` | Loan (mortgage already has term) |
| `IsInterestOnly` | `bool` | Mortgage (default false = repayment) |

These are displayed in `AccountForm` conditional on account type, alongside the existing
mortgage/credit fields.

Migration: `AddDebtPaymentFields`

### Debt severity scoring

Each debt account is assigned a severity score (higher = pay off sooner):

```
base = interestRate (e.g. 24.9 for 24.9% APR)

if promotionalExpiry is not null:
  daysToExpiry = daysUntil(promotionalExpiry)
  if daysToExpiry <= 90:
    revertRate = promotionalRevertRate ?? interestRate
    base = max(base, revertRate) + (90 - daysToExpiry) * 0.1  // urgency bonus

if type == 'Credit' and creditLimit > 0:
  utilisation = abs(balance) / creditLimit
  if utilisation > 0.8:
    base += 5  // utilisation penalty

if type == 'Mortgage':
  base *= 0.4  // significantly downweight — secured, appreciating asset
```

The scored list determines:
- Default **Avalanche order** (highest score first)
- Visual severity badges: Critical (red, score > 20), High (amber, 10–20), Moderate (blue, 5–10), Low (grey, < 5)

### Projection algorithm

```
function project(debts, extraPayment, strategy, months = 360):
  for each month:
    for each included debt:
      monthlyRate = annualRate / 12
      interest = abs(balance) * monthlyRate
      balance -= interest                  // interest accrues
      minPayment = minimumMonthlyPayment ?? estimatedMinimum(balance, type)
      balance += minPayment                // minimum payment applied
      record interest and payment

    available = extraPayment
    priorityDebt = nextByStrategy(debts, strategy)
    priorityDebt.balance += available      // extra payment applied

    remove debts where balance >= 0 (paid off)
    if no debts remain: break

  return monthly snapshots, total interest, payoff month per debt
```

**Estimated minimum** (used when `MinimumMonthlyPayment` is null):
- Credit card: `max(25, abs(balance) * 0.025)` — UK standard (2.5% or £25)
- Loan/Mortgage: derived from remaining balance, rate, and end date using standard annuity formula

### API endpoints

`GET /finance/debt/overview`
Returns: all debt accounts with severity scores, total debt, weighted average rate, total
monthly interest, estimated payoff date at minimum-only payments.

`POST /finance/debt/projection`
Request body:
```json
{
  "strategy": "Avalanche|Snowball|Custom",
  "customOrder": ["accountId1", "accountId2"],
  "extraMonthlyPayment": 400,
  "includedAccountIds": ["id1", "id2"],
  "excludeMortgage": false
}
```
Response: monthly snapshots, per-debt payoff month, total interest paid, total interest
saved vs minimum-only, Avalanche vs Snowball comparison (always calculated both ways).

### Frontend components

**`DebtOverviewCard`**
- Total debt (excluding mortgage if toggle set)
- Weighted average interest rate
- Total monthly interest cost (what debt is costing right now)
- Estimated debt-free date at minimums only
- Severity-ranked account list with badges (Critical/High/Moderate/Low)
- Toggle: include/exclude mortgage from overview

**`DebtStrategySelector`**
- Three-way toggle: Avalanche / Snowball / Custom
- Extra payment slider — pre-filled from affordability engine safe surplus (user can adjust)
- Per-account include/exclude toggles
- Strategy comparison summary: "Snowball costs £X more but closes Y accounts Z months sooner"

**`DebtProjectionPanel`**
- "Debt-free in X months (Month, Year)" — headline figure
- "Total interest you'll pay: £X" / "Interest you'll save vs minimums: £Y"
- Table: account name → current balance → estimated payoff date

**`DebtWaterfallChart`**
- Horizontal stacked bar chart (Recharts)
- X axis: months from now
- Each debt is a row; bar spans from now until payoff month
- Bars colour-coded by severity
- Vertical "today" marker; hover shows balance at that point

**`DebtBurndownDashboard`**
- Orchestrator: `AffordabilityPanel` (top) + `DebtOverviewCard` + `DebtStrategySelector` + `DebtProjectionPanel` + `DebtWaterfallChart`
- New **"Debt"** tab added to `FinancePage`

**`AffordabilityPanel`**
- Inline summary at top of Debt tab
- Shows: detected income, committed costs, discretionary, buffer, safe surplus
- "How is this calculated?" expandable explanation
- Manual income override input (if confidence is Low or user requests)

### Acceptance scenarios

1. **Given** a user with Credit and Loan accounts, **When** they open the Debt tab, **Then**
   they see a severity-ranked list with badges, total debt, and monthly interest cost.
2. **Given** the affordability engine has calculated a safe surplus, **When** the user opens
   the projection calculator, **Then** the extra payment field is pre-filled with that figure.
3. **Given** Avalanche strategy selected, **When** projection is run, **Then** the highest-rate
   debt is eliminated first, and the freed minimum payment is cascaded to the next debt.
4. **Given** Snowball strategy selected, **When** projection is run, **Then** the smallest
   balance debt is eliminated first, and the comparison shows cost vs Avalanche.
5. **Given** a credit card with a 0% deal expiring in 30 days, **When** severity scores are
   calculated, **Then** that card is rated Critical and appears at the top of the Avalanche
   order even if another card has a technically higher standard rate.
6. **Given** the user excludes their mortgage, **When** the projection runs, **Then** only
   Credit and Loan accounts appear in the waterfall chart and calculations.
7. **Given** a projection result, **When** the user moves the extra payment slider, **Then**
   the chart and figures update immediately (client-side recalculation for responsiveness).
8. **Given** no transaction history (new user), **When** the Debt tab is opened, **Then**
   the affordability panel prompts for manual income and shows a simplified calculator.

---

## Integration with Existing Features

| Existing feature | Integration point |
|-----------------|------------------|
| AccountsDashboard | Shows "Monthly commitments" per account (linked bills total) |
| BillsDashboard | Bills show linked account name; matched bill payments badge |
| CSV Import | On import, runs bill-matching pass; shows matched count in import result |
| AccountForm | New fields: min payment, current payment, loan end date, interest-only toggle |
| Phase 45 CashFlowForecast | Debt repayments included in 30/60/90-day balance projection |
| Phase 48 AI Insights | Debt severity alerts surface in InsightsDashboard |

---

## Out of Scope (Explicitly Deferred)

- Open Banking / live balance feeds (CSV-first policy; see Phase 41 decisions)
- Student loan repayment (income-contingent, Plan 1/2/5 — too complex for MVP)
- Joint debt / shared liability (multi-user deferred post-MVP)
- Credit score simulation ("if I pay this off, my score will...")
- PDF payoff plan report (QuestPDF deferred post-MVP)
