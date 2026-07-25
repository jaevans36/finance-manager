using FinanceApi.Features.Budgets.Models;

namespace FinanceApi.Features.Budgets.Services;

public record SpendingPotWithProgress(
    Guid Id,
    string Name,
    PotType Type,
    decimal BudgetAmount,
    decimal Spent,
    decimal Remaining,
    bool RolloverEnabled,
    string? Icon,
    string? Colour,
    IReadOnlyList<Guid> CategoryIds,
    decimal PercentageUsed,
    bool IsWarning,
    bool IsExceeded,
    decimal? AnnualAmount = null,
    DateOnly? NextPaymentDate = null,
    decimal AccumulatedAmount = 0,
    decimal? MonthlyAllocation = null,
    int? MonthsRemaining = null,
    bool IsReady = false
);

public record CreateSpendingPotRequest(
    string Name,
    PotType Type,
    decimal BudgetAmount,
    bool RolloverEnabled,
    string? Icon,
    string? Colour,
    IEnumerable<Guid> CategoryIds,
    decimal? AnnualAmount = null,
    DateOnly? NextPaymentDate = null
);

public record UpdateSpendingPotRequest(
    string? Name,
    decimal? BudgetAmount,
    bool? RolloverEnabled,
    string? Icon,
    string? Colour,
    IEnumerable<Guid>? CategoryIds,
    decimal? AnnualAmount = null,
    DateOnly? NextPaymentDate = null
);

public interface ISpendingPotService
{
    Task<IEnumerable<SpendingPotWithProgress>> GetPotsWithProgressAsync(Guid userId, int month, int year, CancellationToken ct = default);
    Task<SpendingPotWithProgress> CreatePotAsync(Guid userId, CreateSpendingPotRequest request, CancellationToken ct = default);
    Task<SpendingPotWithProgress?> UpdatePotAsync(Guid userId, Guid potId, UpdateSpendingPotRequest request, CancellationToken ct = default);
    Task<bool> DeletePotAsync(Guid userId, Guid potId, CancellationToken ct = default);
    Task<bool> AssignTransactionAsync(Guid userId, Guid potId, Guid transactionId, CancellationToken ct = default);
    Task<SpendingPotWithProgress?> ContributeToSinkingFundAsync(Guid userId, Guid potId, CancellationToken ct = default);
}
