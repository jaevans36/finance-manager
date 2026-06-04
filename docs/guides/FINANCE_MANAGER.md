# Finance Manager — User Guide

The Finance Manager lets you track all your bank accounts in one place, import transactions from your bank's CSV export, categorise your spending, and see your net worth at a glance.

---

## Getting Started

### 1. Make sure you're logged in

All Finance Manager features require you to be signed in to Life Manager. If you're redirected to the login page, sign in and you'll be taken back automatically.

### 2. Navigate to Finance

Use the sidebar navigation and select **Finance**.

---

## Accounts

### Adding an account

1. Go to **Finance → Accounts**
2. Click **Add Account**
3. Fill in the details:

| Field | Description |
|-------|-------------|
| **Name** | A name you'll recognise, e.g. "Barclays Current" |
| **Type** | Choose the account type (see below) |
| **Institution** | The bank or provider name, e.g. "Barclays" |
| **Account number suffix** | Last 4 digits — used to match CSV imports |
| **Currency** | Defaults to GBP |
| **Starting balance** | Enter your current balance |
| **Exclude from net worth** | Tick for accounts you don't want included (e.g. a mortgage) |

### Account types

| Type | Description |
|------|-------------|
| Checking | Day-to-day current account |
| Savings | Standard savings account |
| Credit | Credit card |
| Cash ISA | Cash Individual Savings Account |
| Stocks ISA | Stocks & Shares ISA |
| SIPP | Self-Invested Personal Pension |
| Premium Bonds | NS&I Premium Bonds |
| Lifetime ISA | Lifetime Individual Savings Account |
| Investment | General investment account |
| Mortgage | Mortgage (typically excluded from net worth) |
| Loan | Personal loan |
| Other | Anything else |

### Editing an account

Click on an account card to open it. You can update the name, balance, institution, colour, and settings.

### Archiving an account

Click **Archive** on an account to hide it. Archived accounts no longer appear in your account list and are excluded from net worth. Transactions are preserved.

---

## Net Worth

The **Net Worth** figure at the top of the Accounts screen shows the sum of all your active account balances, excluding any accounts you've marked as "Exclude from net worth" (typically mortgages and loans).

---

## Transactions

### Viewing transactions

Go to **Finance → Transactions** to see all your transactions. You can filter by:
- Account
- Date range
- Category
- Transaction type (Debit / Credit / Transfer)
- Free text search (searches description and payee)

### Adding a transaction manually

1. Click **Add Transaction**
2. Select the account
3. Enter the date, amount, and description
4. Optionally assign a category and payee
5. Click **Save**

The account balance is updated automatically.

### Editing a transaction

Click any transaction row to open the edit panel. You can update the category, description, payee, date, and amount.

### Deleting a transaction

Open a transaction and click **Delete**. The account balance is reversed automatically.

---

## Importing Transactions from your Bank

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

### Duplicate transactions

If a transaction already exists with the same date, amount, account, and description, it is imported as a **duplicate** and flagged rather than rejected. You can review and delete flagged duplicates from the Transactions list — filter by toggling **Show duplicates**.

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

### Deleting a custom category

Open the category and click **Delete**. System categories cannot be deleted. Transactions assigned to a deleted category are moved to **Uncategorised**.

### Assigning a category to a transaction

Open any transaction and use the **Category** dropdown to assign or change its category.

---

## Tips

- **Import regularly** — importing once a month keeps your data up to date without accumulating a backlog.
- **Mark transactions as reviewed** — once you've checked a transaction use the "reviewed" toggle so you know it's been verified.
- **Use recurring flags** — flag standing orders and subscriptions as "recurring" to quickly spot unexpected changes.
- **Archive old accounts** — accounts you no longer use can be archived rather than deleted to preserve transaction history.
