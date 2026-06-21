namespace FinanceApi.Features.Debt.Models;

public enum DebtStrategy { Avalanche, Snowball, Custom }

public record DebtAccountSummary(
    Guid AccountId,
    string Name,
    string Type,
    decimal Balance,
    decimal? CreditLimit,
    decimal? InterestRate,
    decimal? PromotionalBalance,
    decimal? MinimumMonthlyPayment,
    decimal? CurrentMonthlyPayment,
    decimal? PromotionalRate,
    DateOnly? PromotionalExpiry,
    DateOnly? LoanEndDate,
    int SeverityScore,
    string SeverityLabel,
    string? SeverityReason,
    decimal? MonthlyInterestCost,
    int? MonthsToPayoffAtCurrentPayment,
    string? PayoffDateAtCurrentPayment
);

public record DebtOverviewResponse(
    IReadOnlyList<DebtAccountSummary> Debts,
    decimal TotalDebt,
    decimal TotalMinimumPayments,
    decimal TotalCurrentPayments
);

public record ProjectionRequest(
    DebtStrategy Strategy,
    decimal? ExtraMonthlyPayment,
    IReadOnlyList<CustomAllocation>? CustomAllocations,
    IReadOnlyList<Guid>? ExcludedAccountIds = null
);

public record CustomAllocation(Guid AccountId, decimal MonthlyPayment);

public record DebtProjectionMonth(
    int Month,
    string Label,
    IReadOnlyList<AccountBalance> Balances,
    decimal TotalRemaining
);

public record AccountBalance(Guid AccountId, string Name, decimal Balance);

public record DebtProjectionResponse(
    DebtStrategy Strategy,
    int MonthsToFreedom,
    string EstimatedFreedomDate,
    decimal TotalInterestPaid,
    IReadOnlyList<DebtProjectionMonth> Schedule,
    IReadOnlyList<PayoffOrder> PayoffOrder
);

public record PayoffOrder(Guid AccountId, string Name, int MonthPaidOff, string PaidOffDate);
