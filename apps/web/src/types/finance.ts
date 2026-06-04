// Finance Manager — shared TypeScript types
// Mirrors the Finance API models

export type AccountType =
  | 'Checking'
  | 'Savings'
  | 'Credit'
  | 'CashIsa'
  | 'StocksIsa'
  | 'Sipp'
  | 'PremiumBonds'
  | 'LifetimeIsa'
  | 'Investment'
  | 'Mortgage'
  | 'Loan'
  | 'Other';

export type TransactionType = 'Debit' | 'Credit' | 'Transfer';
export type ImportSource = 'Manual' | 'CsvImport' | 'BankSync';
export type BankFormat = 'barclays' | 'hsbc' | 'lloyds' | 'monzo' | 'starling' | 'natwest' | 'generic';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  institution: string | null;
  accountNumberSuffix: string | null;
  isActive: boolean;
  excludeFromNetWorth: boolean;
  colour: string | null;
  icon: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSummary {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  institution: string | null;
  colour: string | null;
  icon: string | null;
  isActive: boolean;
  excludeFromNetWorth: boolean;
}

export interface CreateAccountRequest {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance?: number;
  institution?: string;
  accountNumberSuffix?: string;
  colour?: string;
  icon?: string;
  excludeFromNetWorth: boolean;
  notes?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  type?: AccountType;
  currency?: string;
  balance?: number;
  institution?: string;
  accountNumberSuffix?: string;
  isActive?: boolean;
  colour?: string;
  icon?: string;
  excludeFromNetWorth?: boolean;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  colour: string | null;
  icon: string | null;
  isSystem: boolean;
  parentId: string | null;
  children: Category[] | null;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  categoryName: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  payee: string | null;
  transactionDate: string;
  reference: string | null;
  isReviewed: boolean;
  isRecurring: boolean;
  isDuplicate: boolean;
  importSource: ImportSource;
  createdAt: string;
}

export interface CreateTransactionRequest {
  accountId: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  description: string;
  payee?: string;
  transactionDate: string;
  postingDate?: string;
  reference?: string;
  notes?: string;
}

export interface UpdateTransactionRequest {
  categoryId?: string;
  description?: string;
  payee?: string;
  notes?: string;
  isReviewed?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CsvImportResult {
  imported: number;
  duplicates: number;
  errors: number;
  errorMessages: string[];
  batchId: string;
}

export interface NetWorthResponse {
  netWorth: number;
}
