import type { AxiosInstance } from 'axios';
import type { AccountSummary, NetWorthResponse } from '../types/finance-account.js';

const BASE = '/api/v1/finance/accounts';

export async function listFinanceAccounts(http: AxiosInstance): Promise<AccountSummary[]> {
  const res = await http.get<AccountSummary[]>(BASE);
  return res.data;
}

export async function getNetWorth(http: AxiosInstance): Promise<NetWorthResponse> {
  const res = await http.get<NetWorthResponse>(`${BASE}/net-worth`);
  return res.data;
}
