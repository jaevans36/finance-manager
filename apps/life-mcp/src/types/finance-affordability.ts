/** Mirrors apps/finance-api/Features/Affordability/Controllers/AffordabilityController.cs DTOs. */

export interface AffordabilityResponse {
  monthlyIncome: number;
  incomeConfidence: string;
  incomeSource: string;
  committedCosts: number;
  existingDebtPayments: number;
  discretionarySpend: number;
  plannedSavings: number;
  emergencyBuffer: number;
  safeSurplus: number;
  suggestedDebtPayment: number;
  calculatedAt: string;
  incomeAccountIds: string[];
}
