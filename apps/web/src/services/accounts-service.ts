import financeApiClient from './finance-api-client';
import type {
  AccountSummary,
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
  NetWorthResponse,
} from '../types/finance';

export const accountsService = {
  getAccounts(): Promise<AccountSummary[]> {
    return financeApiClient.get<AccountSummary[]>('/api/v1/finance/accounts').then((r) => r.data);
  },

  getAccount(id: string): Promise<Account> {
    return financeApiClient.get<Account>(`/api/v1/finance/accounts/${id}`).then((r) => r.data);
  },

  createAccount(data: CreateAccountRequest): Promise<Account> {
    return financeApiClient.post<Account>('/api/v1/finance/accounts', data).then((r) => r.data);
  },

  updateAccount(id: string, data: UpdateAccountRequest): Promise<Account> {
    return financeApiClient.patch<Account>(`/api/v1/finance/accounts/${id}`, data).then((r) => r.data);
  },

  deleteAccount(id: string): Promise<void> {
    return financeApiClient.delete(`/api/v1/finance/accounts/${id}`).then(() => undefined);
  },

  getNetWorth(): Promise<NetWorthResponse> {
    return financeApiClient.get<NetWorthResponse>('/api/v1/finance/accounts/net-worth').then((r) => r.data);
  },
};
