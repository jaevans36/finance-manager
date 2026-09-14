using FinanceApi.Features.SavingsGoals.Models;

namespace FinanceApi.Features.SavingsGoals.Services;

public interface ISavingsGoalService
{
    Task<IEnumerable<SavingsGoalWithProjection>> GetGoalsAsync(Guid userId, CancellationToken ct = default);
    Task<SavingsGoalWithProjection> CreateGoalAsync(Guid userId, CreateSavingsGoalRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<SavingsGoalWithProjection?> UpdateGoalAsync(Guid userId, Guid goalId, UpdateSavingsGoalRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<bool> DeleteGoalAsync(Guid userId, Guid goalId, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<SavingsGoalWithProjection?> ContributeAsync(Guid userId, Guid goalId, decimal amount, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
}
