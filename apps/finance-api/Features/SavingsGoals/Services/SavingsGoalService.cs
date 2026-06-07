using FinanceApi.Data;
using FinanceApi.Features.SavingsGoals.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.SavingsGoals.Services;

public class SavingsGoalService : ISavingsGoalService
{
    private readonly FinanceDbContext _db;

    public SavingsGoalService(FinanceDbContext db) => _db = db;

    public async Task<IEnumerable<SavingsGoalWithProjection>> GetGoalsAsync(Guid userId, CancellationToken ct = default)
    {
        var goals = await _db.SavingsGoals
            .Where(g => g.UserId == userId)
            .OrderBy(g => g.Name)
            .ToListAsync(ct);

        return goals.Select(Project);
    }

    public async Task<SavingsGoalWithProjection> CreateGoalAsync(Guid userId, CreateSavingsGoalRequest request, CancellationToken ct = default)
    {
        var goal = new SavingsGoal
        {
            UserId = userId,
            Name = request.Name,
            TargetAmount = request.TargetAmount,
            TargetDate = request.TargetDate,
            MonthlyContribution = request.MonthlyContribution,
        };
        _db.SavingsGoals.Add(goal);
        await _db.SaveChangesAsync(ct);
        return Project(goal);
    }

    public async Task<SavingsGoalWithProjection?> UpdateGoalAsync(Guid userId, Guid goalId, UpdateSavingsGoalRequest request, CancellationToken ct = default)
    {
        var goal = await _db.SavingsGoals
            .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId, ct);

        if (goal is null) return null;

        if (request.Name is not null) goal.Name = request.Name;
        if (request.TargetAmount.HasValue) goal.TargetAmount = request.TargetAmount.Value;
        if (request.TargetDate.HasValue) goal.TargetDate = request.TargetDate.Value;
        if (request.MonthlyContribution.HasValue) goal.MonthlyContribution = request.MonthlyContribution.Value;
        goal.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Project(goal);
    }

    public async Task<bool> DeleteGoalAsync(Guid userId, Guid goalId, CancellationToken ct = default)
    {
        var goal = await _db.SavingsGoals
            .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId, ct);

        if (goal is null) return false;
        _db.SavingsGoals.Remove(goal);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<SavingsGoalWithProjection?> ContributeAsync(Guid userId, Guid goalId, decimal amount, CancellationToken ct = default)
    {
        var goal = await _db.SavingsGoals
            .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId, ct);

        if (goal is null) return null;

        goal.CurrentAmount += amount;
        if (goal.CurrentAmount >= goal.TargetAmount)
            goal.Status = SavingsGoalStatus.Achieved;

        goal.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Project(goal);
    }

    private static SavingsGoalWithProjection Project(SavingsGoal goal)
    {
        var remaining = goal.TargetAmount - goal.CurrentAmount;
        var pct = goal.TargetAmount > 0
            ? Math.Min(Math.Round(goal.CurrentAmount / goal.TargetAmount * 100, 1), 100m)
            : 0m;

        if (goal.Status == SavingsGoalStatus.Achieved || remaining <= 0)
            return new SavingsGoalWithProjection(goal, 100m, 0, null, true);

        int monthsToTarget;
        DateTime? projectedDate;
        if (goal.MonthlyContribution > 0)
        {
            monthsToTarget = (int)Math.Ceiling((double)remaining / (double)goal.MonthlyContribution);
            projectedDate = DateTime.UtcNow.AddMonths(monthsToTarget);
        }
        else
        {
            monthsToTarget = int.MaxValue;
            projectedDate = null;
        }

        var isOnTrack = goal.TargetDate.HasValue && projectedDate.HasValue
            ? projectedDate.Value <= goal.TargetDate.Value
            : true;

        return new SavingsGoalWithProjection(goal, pct, monthsToTarget, projectedDate, isOnTrack);
    }
}
