/** Mirrors apps/finance-api/Features/Transactions/Controllers/TransactionsController.cs DTOs. */

export const TRANSACTION_TYPES = ['Debit', 'Credit', 'Transfer'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const IMPORT_SOURCES = ['Manual', 'CsvImport', 'BankSync'] as const;
export type ImportSource = (typeof IMPORT_SOURCES)[number];

export interface TransactionDto {
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
  notes: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/** GET /api/v1/finance/transactions query params. accountId is mandatory server-side. */
export interface ListTransactionsParams {
  accountId: string;
  from?: string;
  to?: string;
  categoryId?: string;
  type?: TransactionType;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** POST /api/v1/finance/transactions body. */
export interface CreateTransactionInput {
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

/** Bank formats finance-api's importer understands natively — see GET /transactions/import/formats. */
export const KNOWN_BANK_FORMATS = ['barclays', 'hsbc', 'lloyds', 'monzo', 'starling', 'natwest', 'generic'] as const;

/** POST /api/v1/finance/transactions/import response. */
export interface CsvImportResult {
  imported: number;
  duplicates: number;
  errors: number;
  errorMessages: string[];
  batchId: string;
  skipped: number;
  skipMessages: string[] | null;
}
