import type { AxiosInstance } from 'axios';
import type {
  CreateTransactionInput,
  CsvImportResult,
  ListTransactionsParams,
  PagedResult,
  TransactionDto,
} from '../types/finance-transaction.js';

const BASE = '/api/v1/finance/transactions';

function pruneUndefined<T extends object>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

export async function listTransactions(
  http: AxiosInstance,
  params: ListTransactionsParams,
): Promise<PagedResult<TransactionDto>> {
  const res = await http.get<PagedResult<TransactionDto>>(BASE, { params: pruneUndefined(params) });
  return res.data;
}

export async function createTransaction(
  http: AxiosInstance,
  input: CreateTransactionInput,
): Promise<TransactionDto> {
  const res = await http.post<TransactionDto>(BASE, pruneUndefined({ ...input }));
  return res.data;
}

/**
 * Import a CSV (a real bank export, or a `generic`-format CSV built from a PDF
 * statement Claude has already read) via the same multipart endpoint the web app uses.
 * Duplicate detection happens server-side, against the real database.
 */
export async function importTransactionsCsv(
  http: AxiosInstance,
  accountId: string,
  csvContent: string,
  bankFormat: string,
): Promise<CsvImportResult> {
  const form = new FormData();
  form.append('file', new Blob([csvContent], { type: 'text/csv' }), 'import.csv');

  const res = await http.post<CsvImportResult>(`${BASE}/import`, form, {
    params: { accountId, bankFormat },
  });
  return res.data;
}
