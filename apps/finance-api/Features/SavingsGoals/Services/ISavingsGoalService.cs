using FinanceApi.Features.SavingsGoals.Models;

namespace FinanceApi.Features.SavingsGoals.Services;

public interface ISavingsGoalService
{
    Task<IEnumerable<SavingsGoalWithProjection>> GetGoalsAsync(Guid userId, CancellationToken ct = default);
    Task<SavingsGoalWithProjection> CreateGoalAsync(Guid userId, CreateSavingsGoalRequest request, CancellationToken ct = default);
    Task<SavingsGoalWithProjection?> UpdateGoalAsync(Guid userId, Guid goalId, UpdateSavingsGoalRequest request, CancellationToken ct = default);
    Task<bool> DeleteGoalAsync(Guid userId, Guid goalId, CancellationToken ct = default);
    Task<SavingsGoalWithProjection?> ContributeAsync(Guid userId, Guid goalId, decimal amount, CancellationToken ct = default);
}
