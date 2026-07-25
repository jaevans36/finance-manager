namespace FinanceApi.Features.Affordability.Models;

public record AffordabilityResponse(
    decimal MonthlyIncome,
    string IncomeConfidence,
    string IncomeSource,
    decimal CommittedCosts,
    decimal ExistingDebtPayments,
    decimal DiscretionarySpend,
    decimal PlannedSavings,
    decimal EmergencyBuffer,
    decimal SafeSurplus,
    decimal SuggestedDebtPayment,
    DateOnly CalculatedAt,
    IReadOnlyList<Guid> IncomeAccountIds);

public record UpdateIncomeAccountsRequest(IReadOnlyList<Guid> AccountIds);
