using FinanceApi.Data;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;
using FinanceApi.Features.SavingsGoals.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.SavingsGoals.Services;

public class SavingsGoalService : ISavingsGoalService
{
    private readonly FinanceDbContext _db;
    private readonly IActivityLogService _activityLog;

    public SavingsGoalService(FinanceDbContext db, IActivityLogService activityLog)
    {
        _db = db;
        _activityLog = activityLog;
    }

    public async Task<IEnumerable<SavingsGoalWithProjection>> GetGoalsAsync(Guid userId, CancellationToken ct = default)
    {
        // Name is column-encrypted — sort after materialization, SQL can't ORDER BY ciphertext.
        var goals = await _db.SavingsGoals
            .Where(g => g.UserId == userId)
            .ToListAsync(ct);

        return goals.OrderBy(g => g.Name).Select(Project);
    }

    public async Task<SavingsGoalWithProjection> CreateGoalAsync(Guid userId, CreateSavingsGoalRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
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
        // Name is column-encrypted, and — matching AccountService's convention — amounts
        // aren't logged either, just the fact that a goal was created.
        await _activityLog.LogAsync(userId, FinanceActivityType.SavingsGoalCreated, "Created savings goal", ipAddress, userAgent);
        return Project(goal);
    }

    public async Task<SavingsGoalWithProjection?> UpdateGoalAsync(Guid userId, Guid goalId, UpdateSavingsGoalRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var goal = await _db.SavingsGoals
            .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId, ct);

        if (goal is null) return null;

        var changedFields = new List<string>();
        if (request.Name is not null) { goal.Name = request.Name; changedFields.Add(nameof(SavingsGoal.Name)); }
        if (request.TargetAmount.HasValue) { goal.TargetAmount = request.TargetAmount.Value; changedFields.Add(nameof(SavingsGoal.TargetAmount)); }
        if (request.TargetDate.HasValue) { goal.TargetDate = request.TargetDate.Value; changedFields.Add(nameof(SavingsGoal.TargetDate)); }
        if (request.MonthlyContribution.HasValue) { goal.MonthlyContribution = request.MonthlyContribution.Value; changedFields.Add(nameof(SavingsGoal.MonthlyContribution)); }
        goal.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        if (changedFields.Count > 0)
        {
            await _activityLog.LogAsync(userId, FinanceActivityType.SavingsGoalUpdated, $"Updated: {string.Join(", ", changedFields)}", ipAddress, userAgent);
        }
        return Project(goal);
    }

    public async Task<bool> DeleteGoalAsync(Guid userId, Guid goalId, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var goal = await _db.SavingsGoals
            .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId, ct);

        if (goal is null) return false;
        _db.SavingsGoals.Remove(goal);
        await _db.SaveChangesAsync(ct);
        await _activityLog.LogAsync(userId, FinanceActivityType.SavingsGoalDeleted, "Deleted savings goal", ipAddress, userAgent);
        return true;
    }

    public async Task<SavingsGoalWithProjection?> ContributeAsync(Guid userId, Guid goalId, decimal amount, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var goal = await _db.SavingsGoals
            .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId, ct);

        if (goal is null) return null;

        goal.CurrentAmount += amount;
        if (goal.CurrentAmount >= goal.TargetAmount)
            goal.Status = SavingsGoalStatus.Achieved;

        goal.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _activityLog.LogAsync(userId, FinanceActivityType.SavingsGoalUpdated, "Added a contribution", ipAddress, userAgent);
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
