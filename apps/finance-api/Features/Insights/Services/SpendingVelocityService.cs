using FinanceApi.Data;
using FinanceApi.Features.Insights.Models;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Insights.Services;

public class SpendingVelocityService(FinanceDbContext db) : ISpendingVelocityService
{
    public async Task<SpendingVelocityResponse> GetVelocityAsync(Guid userId, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var daysInMonth = DateTime.DaysInMonth(today.Year, today.Month);
        var daysElapsed = today.Day;

        var monthTransactions = await db.Transactions
            .Where(t => t.UserId == userId
                     && t.Type == TransactionType.Debit
                     && t.TransactionDate >= monthStart
                     && t.TransactionDate <= today
                     && !t.IsDuplicate)
            .ToListAsync(ct);

        var budgets = await db.Budgets
            .Where(b => b.UserId == userId && b.Month == today.Month && b.Year == today.Year)
            .ToListAsync(ct);

        var categoryIds = monthTransactions
            .Where(t => t.CategoryId.HasValue)
            .Select(t => t.CategoryId!.Value)
            .Distinct()
            .ToList();

        var categoryNames = await db.Categories
            .Where(c => categoryIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => c.Name, ct);

        var totalSpentSoFar = monthTransactions.Sum(t => Math.Abs(t.Amount));
        var dailyAverage = daysElapsed > 0 ? totalSpentSoFar / daysElapsed : 0m;
        var projectedTotal = dailyAverage * daysInMonth;

        var budgetTotal = budgets.Count > 0
            ? budgets.Sum(b => b.Amount + b.RolloverFromPrevious)
            : (decimal?)null;
        var projectedOverspend = budgetTotal is null ? null : (decimal?)Math.Max(0m, projectedTotal - budgetTotal.Value);

        var categories = monthTransactions
            .Where(t => t.CategoryId.HasValue)
            .GroupBy(t => t.CategoryId!.Value)
            .Select(g =>
            {
                var spent = g.Sum(t => Math.Abs(t.Amount));
                var avg = daysElapsed > 0 ? spent / daysElapsed : 0m;
                var projected = avg * daysInMonth;
                var budget = budgets.FirstOrDefault(b => b.CategoryId == g.Key);
                var limit = budget is null ? (decimal?)null : budget.Amount + budget.RolloverFromPrevious;
                var overspend = limit is null ? null : (decimal?)Math.Max(0m, projected - limit.Value);

                return new CategoryVelocity(
                    g.Key,
                    categoryNames.GetValueOrDefault(g.Key, "Uncategorised"),
                    Math.Round(spent, 2),
                    Math.Round(avg, 2),
                    Math.Round(projected, 2),
                    limit,
                    overspend is null ? null : Math.Round(overspend.Value, 2));
            })
            .OrderByDescending(c => c.SpentSoFar)
            .ToList();

        return new SpendingVelocityResponse(
            daysElapsed,
            daysInMonth,
            Math.Round(totalSpentSoFar, 2),
            Math.Round(dailyAverage, 2),
            Math.Round(projectedTotal, 2),
            budgetTotal,
            projectedOverspend is null ? null : Math.Round(projectedOverspend.Value, 2),
            categories);
    }
}
