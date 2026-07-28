namespace FinanceApi.Features.Affordability.Models;

public record AffordabilityResponse(
    decimal MonthlyIncome,
    string IncomeConfidence,
    string IncomeSource,
    decimal CommittedCosts,
    decimal DiscretionarySpend,
    decimal EmergencyBuffer,
    decimal SafeSurplus,
    decimal SuggestedDebtPayment,
    DateOnly CalculatedAt,
    IReadOnlyList<Guid> IncomeAccountIds);

public record UpdateManualIncomeRequest(decimal MonthlyIncome);

public record UpdateIncomeAccountsRequest(IReadOnlyList<Guid> AccountIds);
