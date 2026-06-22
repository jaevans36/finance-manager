# Finance Manager — User Guide

The Finance Manager lets you track all your accounts in one place, import transactions, set budgets, manage bills, plan savings goals, and plot a course to becoming debt-free.

---

## Getting Started

### 1. Make sure you're logged in

All Finance Manager features require you to be signed in to Life Manager. If you're redirected to the login page, sign in and you'll be taken back automatically.

### 2. Navigate to Finance

Use the sidebar navigation and select **Finance**.

The Finance page has eight tabs across the top:

| Tab | What it's for |
|-----|--------------|
| **Accounts** | Add and manage your bank accounts, credit cards, loans, and investments |
| **Transactions** | View, search, and categorise transactions within an account |
| **Budgets** | Monthly spending limits per category, with progress tracking |
| **Spending Pots** | Envelope-style spending buckets (e.g. "Holiday fund") |
| **Bills** | Track recurring bills and subscriptions with due-date reminders |
| **Savings Goals** | Set a target and track your progress towards it |
| **Trends** | Budget spending over time |
| **Debt** | Severity-scored debt overview and paydown projection calculator |

---

## Accounts

### Adding an account

1. Go to **Finance → Accounts**
2. Click **Add account**
3. Fill in the details:

| Field | Description |
|-------|-------------|
| **Name** | A name you'll recognise, e.g. "Barclays Current" |
| **Type** | Choose the account type (see below) |
| **Institution** | The bank or provider name, e.g. "Barclays" |
| **Account number suffix** | Last 4 digits — used to match CSV imports |
| **Currency** | Defaults to GBP |
| **Starting balance** | Enter your current balance (negative for debt accounts) |
| **Exclude from net worth** | Tick for accounts you don't want included, such as a mortgage |

Additional fields appear depending on the account type (see sections below).

### Account types

| Type | Description |
|------|-------------|
| Current account | Day-to-day current account |
| Savings | Standard savings account |
| Credit card | Credit card |
| Cash ISA | Cash Individual Savings Account |
| Stocks & Shares ISA | Stocks & Shares ISA |
| SIPP | Self-Invested Personal Pension |
| Premium Bonds | NS&I Premium Bonds |
| Lifetime ISA | Lifetime Individual Savings Account |
| Investment account | General investment account |
| Mortgage | Mortgage (typically excluded from net worth) |
| Loan | Personal loan |
| Other | Anything else |

### Credit card fields

When **Credit card** is selected, additional fields appear:

| Field | Description |
|-------|-------------|
| **Credit limit** | The card's total credit limit |
| **Interest rate (APR %)** | Annual Percentage Rate — used for debt severity scoring |
| **Promotional balance** | Balance covered by a 0% or promotional rate deal |
| **Promotional rate (%)** | The promotional interest rate (typically 0%) |
| **Promotional expiry** | When the promotional period ends — triggers urgency alerts |
| **Revert rate (%)** | The rate the card reverts to after the promotional period |
| **Minimum monthly payment** | The minimum payment required each month |
| **Current monthly payment** | What you are actually paying each month |

### Mortgage fields

When **Mortgage** is selected, additional fields appear:

| Field | Description |
|-------|-------------|
| **Interest rate (%)** | Your current mortgage rate |
| **Fixed rate expiry** | Date your fixed-rate deal ends |
| **Mortgage start date** | When the mortgage began — used to calculate remaining term |
| **Mortgage term (years)** | Total term in years; the remaining term is calculated automatically |
| **Interest only** | Tick if this is an interest-only mortgage |
| **Current monthly payment** | Your current monthly mortgage payment |

### Loan fields

When **Loan** is selected, additional fields appear:

| Field | Description |
|-------|-------------|
| **Interest rate (%)** | Your loan's annual interest rate |
| **Minimum monthly payment** | The minimum repayment required |
| **Current monthly payment** | What you are actually paying each month |
| **Loan end date** | When the loan is scheduled to be fully repaid |

### Monthly commitments

On the Accounts screen, any account with linked bills shows a **Monthly commitments: £X/mo** line beneath its balance. Hover over it to see the list of linked bills. See the [Bills](#bills) section for how to link bills to accounts.

### Editing an account

Click the edit icon on an account card to update any of its details.

### Archiving an account

Click **Archive** on an account to hide it. Archived accounts no longer appear in your account list and are excluded from net worth. Transactions are preserved.

---

## Net Worth

The **Net Worth** figure at the top of the Accounts screen shows the sum of all your active account balances, excluding any accounts you've marked as "Exclude from net worth".

---

## Transactions

### Viewing transactions

Go to **Finance → Transactions** to see all transactions for a selected account. You can filter by:

- Date range
- Category
- Transaction type (Debit / Credit / Transfer)
- Free text search (searches description and payee)

### Adding a transaction manually

1. Select an account from the Accounts tab (this sets the context for the Transactions tab)
2. Switch to **Transactions** and click **Add manually**
3. Enter the date, amount, and description
4. Optionally assign a category and payee
5. Click **Save**

The account balance is updated automatically.

### Editing a transaction

Click any transaction row to open the detail panel. You can update the category, description, payee, date, and amount.

### Deleting a transaction

Open a transaction and click **Delete**. The account balance is reversed automatically.

---

## Importing Transactions from Your Bank

### Supported banks

| Bank | Format name to select |
|------|----------------------|
| Barclays | Barclays |
| HSBC | HSBC |
| Lloyds / Halifax / Bank of Scotland | Lloyds |
| Monzo | Monzo |
| Starling | Starling |
| NatWest / Royal Bank of Scotland | NatWest |
| Other banks | Generic |

### How to export a CSV from your bank

**Barclays**
1. Log in to Barclays Online Banking
2. Go to your account → **Statements**
3. Choose a date range and click **Export** → select **CSV**

**HSBC**
1. Log in to HSBC Online Banking
2. Select your account → **View statements**
3. Choose a date range → **Download** → **CSV**

**Lloyds / Halifax / Bank of Scotland**
1. Log in → select account
2. **Export transactions** → choose date range → **Export as CSV**

**Monzo**
1. Open the Monzo app
2. **Account** tab → scroll down → **Export transactions**
3. Choose a date range → **Export to CSV**

**Starling**
1. Log in to the Starling app or web
2. **Spaces** → **Spending Insights** → **Download CSV**

**NatWest / RBS**
1. Log in → select account → **Statements**
2. Choose date range → **Export** → **CSV**

### Importing a file

1. Go to **Finance → Transactions**
2. Click **Import CSV**
3. Select your bank from the **Bank format** dropdown
4. Choose the account you want to import into
5. Drag and drop your CSV file (or click to browse)
6. Click **Import**

After import you'll see a summary:

- **Imported**: New transactions added
- **Duplicates**: Transactions already in the system (flagged, not double-counted)
- **Errors**: Rows that couldn't be parsed

### Automatic bill matching on import

When transactions are imported, the system automatically checks them against your active bills. A transaction is matched to a bill if:

- The payee or description contains the bill name (case-insensitive)
- The amount is within ±10% of the bill amount
- The date falls within ±5 days of the bill's due day for that month

When a match is found, the bill is automatically marked as **Paid** for that month and the transaction is linked to it.

### Duplicate transactions

If a transaction already exists with the same date, amount, account, and description, it is imported as a **duplicate** and flagged rather than rejected. Review flagged duplicates from the Transactions list by filtering for them.

---

## Categories

Categories help you understand your spending. Life Manager comes with a set of built-in system categories that cover most common spending types.

### System categories (built-in)

| Category | Sub-categories |
|----------|----------------|
| Food & Drink | Groceries, Restaurants, Coffee, Takeaway |
| Transport | Fuel, Public Transport, Parking, Car Insurance, Road Tax |
| Bills & Utilities | Electricity, Gas, Water, Internet, Mobile, Council Tax, Rent, Mortgage |
| Shopping | Clothing, Electronics, Home & Garden |
| Health | Pharmacy, GP/Dentist, Gym |
| Entertainment | Streaming, Cinema, Hobbies, Games |
| Income | Salary, Freelance, Benefits, Interest |
| Savings & Investments | ISA, Pension, Emergency Fund |
| Transfers | Between own accounts |
| Other | Uncategorised |

### Creating a custom category

1. Go to **Finance → Categories**
2. Click **New Category**
3. Enter a name and optionally choose a parent category, colour, and icon
4. Click **Save**

### Assigning a category to a transaction

Open any transaction and use the **Category** dropdown to assign or change its category.

---

## Budgets

Budgets let you set a monthly spending limit per category and track how much you've spent against it.

### Creating a budget

1. Go to **Finance → Budgets**
2. Click **Add budget**
3. Choose a category and enter a monthly limit
4. Click **Save**

### Reading the budget dashboard

Each budget shows a progress bar:

| Colour | Meaning |
|--------|---------|
| Green | Spending is on track |
| Amber | Approaching the limit (over 80% used) |
| Red | Limit exceeded |

The amount spent and remaining is shown below each bar. If you've exceeded a limit, the overspend amount is shown in red.

### Editing and deleting budgets

Click the edit icon on any budget row to update the amount or category. Budgets can be deleted from the edit view.

---

## Spending Pots

Spending pots are envelope-style buckets you can use to ringfence money for a specific purpose, such as a holiday, a home project, or a car service fund.

### Creating a pot

1. Go to **Finance → Spending Pots**
2. Click **Add pot** (or **Create a pot** if no pots exist yet)
3. Enter a name, monthly budget amount, and optionally a colour
4. Click **Save**

### Reading the pot cards

Each pot shows:

- The amount spent this month against the monthly target
- A progress bar (green → amber at 80% → red if exceeded)
- Percentage used

Pots reset at the start of each month based on your imported transactions in the matching category.

---

## Bills

The Bills tab helps you track all your recurring payments — direct debits, standing orders, subscriptions — and get reminded before they're due.

### Adding a bill

1. Go to **Finance → Bills**
2. Click **Add bill**
3. Fill in the details:

| Field | Description |
|-------|-------------|
| **Name** | e.g. "Netflix", "Council Tax", "Vodafone" |
| **Description** | Optional — e.g. "Shared with partner" |
| **Amount** | The amount charged each time |
| **Frequency** | Weekly, Monthly, Quarterly, or Annual |
| **Due day** | Day of the month the payment is taken (1–31) |
| **Remind me** | How many days before the due date to flag a reminder |
| **Linked account** | Optionally link to an account (see below) |

### Linking a bill to an account

Setting a **Linked account** on a bill connects the bill to one of your accounts. The dropdown groups accounts into two sections:

**Pays debt account** (Credit card, Loan, Mortgage)

- Links this bill as the monthly payment for that debt
- The Debt tab automatically uses this bill's amount as the monthly payment in its projections — you do not need to also set **Current monthly payment** on the account separately
- The debt overview card will reflect the bill amount when calculating payoff timelines

**Debits from** (Current account, Savings)

- Records which account the money comes out of
- The Accounts screen shows a **Monthly commitments** total for that account
- When you import transactions from that account, matching debits are automatically matched to the bill and it is marked paid (see [Automatic bill matching](#automatic-bill-matching-on-import))

If no account is linked, the bill shows **Not linked** on its card. You can add or change the link at any time by editing the bill.

> **Tip:** If you add a recurring credit card payment as a bill and link it to the credit card account, the Debt projection will use that amount automatically. There is no need to enter the same figure under both Bills and the account's Current monthly payment field.

### Bill status

| Status | Description |
|--------|-------------|
| (no badge) | Upcoming — not yet due |
| Due today / Due tomorrow | Highlighted in amber |
| Due in N days | Shown beneath the bill name |
| Paid | Bill has been matched to an imported transaction this month |

### Recurring transactions detected automatically

When you import bank transactions, Life Manager scans them for recurring payment patterns (regular amounts, consistent payees). If it spots a pattern not already in your bills list, it surfaces a **Recurring transaction detected** prompt at the bottom of the Bills tab, letting you add it as a bill with one click.

### Deactivating and reactivating bills

- Click **Mark inactive** on any bill to pause it (e.g. for a suspended subscription). Inactive bills are hidden from the main list and excluded from the monthly total.
- Click **Reactivate** to reinstate it.
- Inactive bills can be deleted; active bills cannot be deleted directly — deactivate first.

---

## Savings Goals

Savings Goals let you set a financial target (e.g. emergency fund, house deposit, new car) and track your progress towards it.

### Creating a goal

1. Go to **Finance → Savings Goals**
2. Click **Add goal**
3. Enter a name, target amount, current amount saved, and optionally a monthly contribution and target date
4. Click **Save**

### Reading goal cards

Each goal shows:

- Amount saved vs target
- A progress bar (blue when on track, amber when behind)
- Percentage complete
- Projected completion time ("X months to go") if a monthly contribution is set
- **Achieved** badge and green bar when the target is reached

If no monthly contribution is set, the card prompts you to set one in order to see a projection.

---

## Trends

The Trends tab shows how your budget spending has changed over time. Use it to spot categories where your spending is consistently creeping up or to see which months you stayed within budget.

---

## Debt

The **Debt** tab gives you a severity-scored overview of all your debt accounts and a paydown projection calculator to find the most efficient route to becoming debt-free.

> The Debt tab automatically picks up any account with a negative balance that is of type Credit card, Loan, or Mortgage. Make sure you've added those accounts with their current balances and interest rates.

---

### Affordability panel

Before showing your debt strategy, the Debt tab calculates your **safe monthly surplus** — the amount you can realistically put towards extra debt payments without leaving yourself short.

#### How income is detected

The system scans the last 90 days of transactions for large, regular credits that follow a payroll pattern (consistent amount, consistent cadence ±3 days). This is shown as **High confidence** or **Medium confidence** income.

If income cannot be detected (e.g. you haven't imported enough transactions yet), the confidence shows as **Low** and you'll be prompted to enter your monthly take-home pay manually.

#### Editing your income manually

You can override the detected figure at any time:

1. Click **Edit** next to the income figure (or **Enter monthly income** if no income was detected)
2. Type your monthly take-home pay
3. Click **Save**

#### Monthly breakdown

Once income is known, the panel shows:

| Line | Description |
|------|-------------|
| Income | Detected or manually entered monthly income |
| Committed costs (bills) | Total of your active bills |
| Discretionary spend | Estimated from your budget totals (or transaction history if no budgets are set) |
| Emergency buffer | A safety buffer held back from the surplus |

**Safe monthly surplus** = Income − Committed costs − Discretionary spend − Emergency buffer

A green surplus means you have money available to accelerate debt repayment. An amber or zero surplus means your commitments are consuming most of your income — the Bills and Budgets tabs can help you identify what to cut.

---

### Debt overview

Below the affordability panel, the **Debt overview** card lists all your debt accounts ranked by severity.

#### Severity scores

Each debt is scored from 0–100 and given a badge:

| Badge | Score | Typical cause |
|-------|-------|---------------|
| **Critical** | 75–100 | Very high interest rate; or a promotional deal expiring within 30 days on a large balance |
| **High** | 50–74 | High interest rate; or promotional deal expiring within 90 days |
| **Medium** | 25–49 | Moderate interest rate |
| **Low** | 0–24 | Low interest rate |

The score takes into account:

- **Interest rate** — the primary driver (up to 60 points; high-rate cards score higher)
- **Promotional expiry urgency** — up to 25 bonus points if a 0% or promotional deal is about to expire
- **Credit utilisation** — up to 15 bonus points if you're using more than 75% of a card's credit limit

#### Per-debt detail

Each debt card shows:

- **Monthly interest cost** — the interest accruing this month. For credit cards with a promotional balance transfer at a different rate, the cost is split: e.g. "£6/mo interest (£300 at 24.9% · £1,500 at 0%)". This means only the non-promotional portion is costing you interest.
- **Payoff estimate** — how many months until paid off at your current payment, and the estimated payoff date. Uses a blended effective rate when part of the balance is at a promotional rate.
- **Actual payments (3-month average)** — if transaction history is available, the system looks at the last three completed calendar months of payments into the account and shows the observed average, e.g. "£100/mo actual payments". Below this it shows **→ £76/mo to balance**, the amount by which the balance is actually reducing (payment minus interest). A green figure means the debt is shrinking; amber means it is not.
- **Credit utilisation** — shown for credit cards as a percentage of the credit limit used.

#### Overview totals

At the top of the debt overview:

- **Total debt** — combined balance across all debt accounts
- **Total minimum payments** — sum of all minimum monthly payments
- **Total current payments** — what you are actually paying each month in total

---

### Paydown calculator

The **Paydown calculator** lets you choose a repayment strategy and see exactly when you'll be debt-free.

#### Strategies

| Strategy | How it works | Best for |
|----------|-------------|----------|
| **Avalanche** | Directs extra payments to the highest interest rate debt first | Minimising total interest paid |
| **Snowball** | Directs extra payments to the smallest balance first | Motivation — clears individual debts faster |
| **Custom** | You specify a monthly payment amount for each debt individually | Complex situations or specific priorities |

#### Monthly focus payment (Avalanche and Snowball)

The **Monthly focus payment** is an amount applied in full to a single target debt each month, on top of all minimum payments already being made. It is pre-filled from your safe surplus but you can adjust it freely.

- Setting it to zero shows what happens if you pay minimums only
- Increasing it moves the freedom date closer
- The target debt is shown beneath the field — Avalanche targets the highest interest rate; Snowball targets the smallest balance

Below the field, a breakdown shows:

| Line | Description |
|------|-------------|
| Minimums across all debts | Sum of current monthly payments on all included debts |
| Focus payment | The extra amount you've entered |
| **Total monthly out** | The combined total leaving your accounts each month for debt |

#### Excluding individual debts

When using Avalanche or Snowball, a checkbox list lets you exclude specific debts from receiving any extra payment. Excluded debts still receive their minimum payment — this is useful for a mortgage on a fixed rate where overpayment charges would apply.

#### Custom allocation

For the Custom strategy, a payment field appears for each debt. Enter the amount you intend to pay on each one per month.

#### Running a projection

Click **Calculate projection** to send your strategy to the server and compute the result.

---

### Projection results

After calculating, the results appear below the calculator.

#### Attention warnings

If any debt's current monthly payment is less than its monthly interest charge (meaning the balance would grow indefinitely at that payment level), an amber warning panel appears at the top. Each flagged debt is listed with:

- The monthly payment and the monthly interest it needs to cover
- The minimum extra payment needed to stop the balance growing

The projection still runs for all other debts. The flagged debts have their interest counted toward the total but their balances are held flat — the projection shows the realistic picture for the debts that are making progress.

#### Summary cards

| Card | Description |
|------|-------------|
| Time to debt-free | Total months displayed as "X yr Y mo" |
| Freedom date | The calendar month you become debt-free, e.g. "January 2029" |
| Total interest | The total interest you will pay under this strategy |

**Payoff order** — a numbered list showing which debt is paid off in which month and the estimated payoff date for each.

---

### Debt burndown chart

The **Debt burndown** chart is a stacked area chart showing the balance of each debt over time. As the months progress, each band shrinks — when a debt reaches zero, that band disappears. This gives a visual picture of your paydown journey from now to debt-free.

- Each debt has its own colour band; click a debt chip at the top to hide or show it
- Hovering over any point shows the balance remaining per debt at that month
- The chart is sampled to a maximum of 48 data points for performance on long projections

#### Date range filter

For long projections (more than two years), range buttons appear in the top-right corner of the chart: **2 yr**, **5 yr**, **10 yr**, **20 yr**, **All**. Selecting a shorter range zooms the chart into that window, making it easier to read near-term progress on projections that span decades.

---

## Tips

- **Import regularly** — importing once a month keeps your data up to date without accumulating a backlog.
- **Link debt payments as bills** — add your credit card or loan payments as bills and link them to the debt account under "Pays debt account". The Debt projection will pick up the amount automatically; there is no need to also enter it as Current monthly payment on the account.
- **Link non-debt bills to accounts too** — once linked, bill-matching on import happens automatically and your monthly commitments are visible on each account card.
- **Enter your mortgage details** — start date, term, and rate allow the system to calculate remaining term and flag upcoming fixed-rate expiries.
- **Use the Affordability panel to guide extra payments** — the safe surplus figure is a reliable ceiling for how much extra you can put towards debt without impacting day-to-day finances.
- **If "No surplus available" appears** — this means your committed bills and estimated spending account for all of your detected income. Check that your income is being detected correctly (the system looks for regular large credits); if not, enter it manually. Also check whether any bills have been duplicated.
- **Try Avalanche first** — it almost always produces the lowest total interest paid; switch to Snowball if you need the motivational boost of clearing a debt quickly.
- **Archive old accounts** — accounts you no longer use can be archived rather than deleted to preserve transaction history.
- **Mark transactions as reviewed** — once you've checked a transaction use the "reviewed" toggle so you know it's been verified.
