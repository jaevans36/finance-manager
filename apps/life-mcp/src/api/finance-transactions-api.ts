import type { AxiosInstance } from 'axios';
import type {
  CreateTransactionInput,
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
