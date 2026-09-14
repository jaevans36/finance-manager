import type { AxiosInstance } from 'axios';
import type { AccountSummary, NetWorthResponse, UpdateAccountInput } from '../types/finance-account.js';

const BASE = '/api/v1/finance/accounts';

export async function listFinanceAccounts(http: AxiosInstance): Promise<AccountSummary[]> {
  const res = await http.get<AccountSummary[]>(BASE);
  return res.data;
}

export async function getFinanceAccount(http: AxiosInstance, accountId: string): Promise<AccountSummary> {
  const res = await http.get<AccountSummary>(`${BASE}/${accountId}`);
  return res.data;
}

export async function updateFinanceAccount(
  http: AxiosInstance,
  accountId: string,
  input: UpdateAccountInput,
): Promise<AccountSummary> {
  const res = await http.patch<AccountSummary>(`${BASE}/${accountId}`, input);
  return res.data;
}

export async function getNetWorth(http: AxiosInstance): Promise<NetWorthResponse> {
  const res = await http.get<NetWorthResponse>(`${BASE}/net-worth`);
  return res.data;
}
