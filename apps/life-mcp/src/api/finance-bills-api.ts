import type { AxiosInstance } from 'axios';
import type { RecurringPattern, UpcomingBillResponse } from '../types/finance-bill.js';

const BASE = '/api/v1/finance/bills';

export async function getUpcomingBills(http: AxiosInstance, days = 30): Promise<UpcomingBillResponse[]> {
  const res = await http.get<UpcomingBillResponse[]>(`${BASE}/upcoming`, { params: { days } });
  return res.data;
}

/** No side effects despite the POST verb — a detection query over existing transactions. */
export async function detectRecurringPayments(http: AxiosInstance, days = 365): Promise<RecurringPattern[]> {
  const res = await http.post<RecurringPattern[]>(`${BASE}/detect-recurring`, null, { params: { days } });
  return res.data;
}
