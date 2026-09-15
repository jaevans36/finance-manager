import type { AxiosInstance } from 'axios';
import type {
  BillResponse,
  CreateBillInput,
  RecurringPattern,
  UpcomingBillResponse,
  UpdateBillInput,
} from '../types/finance-bill.js';

const BASE = '/api/v1/finance/bills';

export async function getUpcomingBills(http: AxiosInstance, days = 30): Promise<UpcomingBillResponse[]> {
  const res = await http.get<UpcomingBillResponse[]>(`${BASE}/upcoming`, { params: { days } });
  return res.data;
}

export async function listBills(http: AxiosInstance, accountId?: string): Promise<BillResponse[]> {
  const res = await http.get<BillResponse[]>(BASE, { params: accountId ? { accountId } : undefined });
  return res.data;
}

export async function createBill(http: AxiosInstance, input: CreateBillInput): Promise<BillResponse> {
  const res = await http.post<BillResponse>(BASE, input);
  return res.data;
}

export async function updateBill(http: AxiosInstance, billId: string, input: UpdateBillInput): Promise<BillResponse> {
  const res = await http.put<BillResponse>(`${BASE}/${billId}`, input);
  return res.data;
}

export async function markBillPaid(http: AxiosInstance, billId: string): Promise<void> {
  await http.patch(`${BASE}/${billId}/pay`);
}

export async function deleteBill(http: AxiosInstance, billId: string): Promise<void> {
  await http.delete(`${BASE}/${billId}`);
}

/** No side effects despite the POST verb — a detection query over existing transactions. */
export async function detectRecurringPayments(http: AxiosInstance, days = 365): Promise<RecurringPattern[]> {
  const res = await http.post<RecurringPattern[]>(`${BASE}/detect-recurring`, null, { params: { days } });
  return res.data;
}
