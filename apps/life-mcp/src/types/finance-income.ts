/** Mirrors apps/finance-api/Features/IncomeStreams/Controllers/IncomeStreamsController.cs DTOs. */

export interface IncomeStream {
  id: string;
  userId: string;
  name: string;
  monthlyAmount: number;
  accountId: string | null;
  accountName: string | null;
  createdAt: string;
  updatedAt: string;
}
