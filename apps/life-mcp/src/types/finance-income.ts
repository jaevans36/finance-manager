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

/** POST /api/v1/finance/income-streams body. */
export interface CreateIncomeStreamInput {
  name: string;
  monthlyAmount: number;
  accountId?: string;
}

/** PUT /api/v1/finance/income-streams/{id} body — every field optional, omitted = unchanged. */
export interface UpdateIncomeStreamInput {
  name?: string;
  monthlyAmount?: number;
  accountId?: string;
}

/** GET /api/v1/finance/income-streams/detect response. */
export interface DetectedIncomeTransaction {
  date: string;
  payee: string | null;
  description: string | null;
  amount: number;
}

export interface DetectedIncomeResponse {
  detectedMonthlyAmount: number | null;
  transactionCount: number;
  matchedTransactions: DetectedIncomeTransaction[];
}
