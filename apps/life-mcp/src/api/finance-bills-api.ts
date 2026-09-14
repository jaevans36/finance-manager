import type { AxiosInstance } from 'axios';
import type { UpcomingBillResponse } from '../types/finance-bill.js';

const BASE = '/api/v1/finance/bills';

export async function getUpcomingBills(http: AxiosInstance, days = 30): Promise<UpcomingBillResponse[]> {
  const res = await http.get<UpcomingBillResponse[]>(`${BASE}/upcoming`, { params: { days } });
  return res.data;
}
