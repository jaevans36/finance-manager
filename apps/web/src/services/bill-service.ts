import financeApiClient from './finance-api-client';
import type {
  Bill,
  CreateBillRequest,
  RecurringPattern,
  UpdateBillRequest,
  UpcomingBill,
} from '../types/finance';

export const billService = {
  getBills(): Promise<Bill[]> {
    return financeApiClient.get<Bill[]>('/api/v1/finance/bills').then(r => r.data);
  },

  getUpcoming(days = 30): Promise<UpcomingBill[]> {
    return financeApiClient
      .get<UpcomingBill[]>('/api/v1/finance/bills/upcoming', { params: { days } })
      .then(r => r.data);
  },

  createBill(data: CreateBillRequest): Promise<Bill> {
    return financeApiClient.post<Bill>('/api/v1/finance/bills', data).then(r => r.data);
  },

  updateBill(id: string, data: UpdateBillRequest): Promise<Bill> {
    return financeApiClient.put<Bill>(`/api/v1/finance/bills/${id}`, data).then(r => r.data);
  },

  markAsPaid(id: string): Promise<void> {
    return financeApiClient.patch(`/api/v1/finance/bills/${id}/pay`).then(() => undefined);
  },

  deleteBill(id: string): Promise<void> {
    return financeApiClient.delete(`/api/v1/finance/bills/${id}`).then(() => undefined);
  },

  detectRecurring(): Promise<RecurringPattern[]> {
    return financeApiClient
      .post<RecurringPattern[]>('/api/v1/finance/bills/detect-recurring')
      .then(r => r.data);
  },
};
