import financeApiClient from './finance-api-client';
import type {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  PagedResult,
  CsvImportResult,
} from '../types/finance';

export interface TransactionFilters {
  accountId: string;
  from?: string;
  to?: string;
  categoryId?: string;
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const transactionsService = {
  getTransactions(filters: TransactionFilters): Promise<PagedResult<Transaction>> {
    return financeApiClient
      .get<PagedResult<Transaction>>('/api/v1/finance/transactions', { params: filters })
      .then((r) => r.data);
  },

  getTransaction(id: string): Promise<Transaction> {
    return financeApiClient.get<Transaction>(`/api/v1/finance/transactions/${id}`).then((r) => r.data);
  },

  createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    return financeApiClient
      .post<Transaction>('/api/v1/finance/transactions', data)
      .then((r) => r.data);
  },

  updateTransaction(id: string, data: UpdateTransactionRequest): Promise<Transaction> {
    return financeApiClient
      .patch<Transaction>(`/api/v1/finance/transactions/${id}`, data)
      .then((r) => r.data);
  },

  deleteTransaction(id: string): Promise<void> {
    return financeApiClient.delete(`/api/v1/finance/transactions/${id}`).then(() => undefined);
  },

  importCsv(accountId: string, bankFormat: string, file: File): Promise<CsvImportResult> {
    const form = new FormData();
    form.append('file', file);
    return financeApiClient
      .post<CsvImportResult>('/api/v1/finance/transactions/import', form, {
        params: { accountId, bankFormat },
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  getSupportedFormats(): Promise<string[]> {
    return financeApiClient
      .get<string[]>('/api/v1/finance/transactions/import/formats')
      .then((r) => r.data);
  },
};
