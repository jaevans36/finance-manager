using FinanceApi.Data;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Budgets.Services;

/// <summary>Budget management and spending progress calculation for a given month.</summary>
public class BudgetService : IBudgetService
{
    private readonly FinanceDbContext _db;

    public BudgetService(FinanceDbContext db) => _db = db;

    public Task<IEnumerable<BudgetWithProgress>> GetCurrentBudgetsAsync(Guid userId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        return GetBudgetsAsync(userId, now.Month, now.Year, ct);
    }

    public async Task<IEnumerable<BudgetWithProgress>> GetBudgetsAsync(Guid userId, int month, int year, CancellationToken ct = default)
    {
        var budgets = await _db.Budgets
            .Include(b => b.Category)
            .Where(b => b.UserId == userId && b.Month == month && b.Year == year)
            .OrderBy(b => b.Category!.Name)
            .ToListAsync(ct);

        // Fetch all monthly spending in one query, keyed by category
        var monthlySpend = await _db.Transactions
            .Where(t => t.UserId == userId
                     && t.CategoryId.HasValue
                     && t.TransactionDate.Month == month
                     && t.TransactionDate.Year == year
                     && t.Type == TransactionType.Debit
                     && !t.IsDuplicate)
            .GroupBy(t => t.CategoryId!.Value)
            .Select(g => new { CategoryId = g.Key, Spent = g.Sum(t => t.Amount) })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Spent, ct);

        var results = new List<BudgetWithProgress>(budgets.Count);
        foreach (var budget in budgets)
        {
            var spent = monthlySpend.GetValueOrDefault(budget.CategoryId, 0m);
            var total = budget.Amount + budget.RolloverFromPrevious;
            var pct = total > 0 ? Math.Round(spent / total * 100, 1) : 0;
            results.Add(new BudgetWithProgress(
                budget.Id, budget.CategoryId,
                budget.Category?.Name, budget.Category?.Colour, budget.Category?.Icon,
                budget.Month, budget.Year, budget.Amount, spent, budget.RolloverFromPrevious,
                pct, pct is >= 80 and < 100, pct >= 100));
        }

        return results;
    }

    public async Task<IEnumerable<BudgetTrendPoint>> GetTrendsAsync(Guid userId, int months = 6, CancellationToken ct = default)
    {
        var points = new List<BudgetTrendPoint>();
        var now = DateTime.UtcNow;

        for (var i = months - 1; i >= 0; i--)
        {
            var target = now.AddMonths(-i);
            var budgets = await _db.Budgets
                .Include(b => b.Category)
                .Where(b => b.UserId == userId && b.Month == target.Month && b.Year == target.Year)
                .ToListAsync(ct);

            if (budgets.Count == 0) continue;

            var categorySpends = new List<CategoryBudgetSpend>();
            foreach (var budget in budgets)
            {
                var spent = await GetSpentAsync(budget.UserId, budget.CategoryId, target.Month, target.Year, ct);
                categorySpends.Add(new CategoryBudgetSpend(
                    budget.Category?.Name ?? "Unknown",
                    budget.Category?.Colour,
                    budget.Amount,
                    spent));
            }

            points.Add(new BudgetTrendPoint(target.Month, target.Year, target.ToString("MMM yyyy"), categorySpends));
        }

        return points;
    }

    public async Task<BudgetWithProgress> CreateBudgetAsync(Guid userId, CreateBudgetRequest request, CancellationToken ct = default)
    {
        var budget = new Budget
        {
            UserId = userId,
            CategoryId = request.CategoryId,
            Month = request.Month,
            Year = request.Year,
            Amount = request.Amount
        };
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync(ct);
        await _db.Entry(budget).Reference(b => b.Category).LoadAsync(ct);
        return await BuildProgressAsync(budget, ct);
    }

    public async Task<BudgetWithProgress?> UpdateBudgetAsync(Guid userId, Guid budgetId, UpdateBudgetRequest request, CancellationToken ct = default)
    {
        var budget = await _db.Budgets
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.UserId == userId, ct);

        if (budget is null) return null;

        if (request.Amount.HasValue) budget.Amount = request.Amount.Value;
        budget.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await BuildProgressAsync(budget, ct);
    }

    public async Task<bool> DeleteBudgetAsync(Guid userId, Guid budgetId, CancellationToken ct = default)
    {
        var budget = await _db.Budgets
            .FirstOrDefaultAsync(b => b.Id == budgetId && b.UserId == userId, ct);

        if (budget is null) return false;
        _db.Budgets.Remove(budget);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IEnumerable<BudgetWithProgress>> CopyFromPreviousMonthAsync(Guid userId, int month, int year, CancellationToken ct = default)
    {
        var prev = new DateTime(year, month, 1).AddMonths(-1);
        var previousBudgets = await _db.Budgets
            .Where(b => b.UserId == userId && b.Month == prev.Month && b.Year == prev.Year)
            .ToListAsync(ct);

        var existingCategoryIds = await _db.Budgets
            .Where(b => b.UserId == userId && b.Month == month && b.Year == year)
            .Select(b => b.CategoryId)
            .ToListAsync(ct);

        var newBudgets = previousBudgets
            .Where(p => !existingCategoryIds.Contains(p.CategoryId))
            .Select(p => new Budget
            {
                UserId = userId,
                CategoryId = p.CategoryId,
                Month = month,
                Year = year,
                Amount = p.Amount
            })
            .ToList();

        _db.Budgets.AddRange(newBudgets);
        await _db.SaveChangesAsync(ct);
        return await GetBudgetsAsync(userId, month, year, ct);
    }

    private async Task<BudgetWithProgress> BuildProgressAsync(Budget budget, CancellationToken ct)
    {
        var spent = await GetSpentAsync(budget.UserId, budget.CategoryId, budget.Month, budget.Year, ct);
        var total = budget.Amount + budget.RolloverFromPrevious;
        var pct = total > 0 ? Math.Round(spent / total * 100, 1) : 0;

        return new BudgetWithProgress(
            budget.Id, budget.CategoryId,
            budget.Category?.Name, budget.Category?.Colour, budget.Category?.Icon,
            budget.Month, budget.Year, budget.Amount, spent, budget.RolloverFromPrevious,
            pct, pct is >= 80 and < 100, pct >= 100);
    }

    private Task<decimal> GetSpentAsync(Guid userId, Guid categoryId, int month, int year, CancellationToken ct)
        => _db.Transactions
            .Where(t => t.UserId == userId
                     && t.CategoryId == categoryId
                     && t.TransactionDate.Month == month
                     && t.TransactionDate.Year == year
                     && t.Type == TransactionType.Debit
                     && !t.IsDuplicate)
            .SumAsync(t => t.Amount, ct);

    public async Task<SuggestedBudgetResponse> GetSuggestedBudgetAsync(Guid userId, Guid categoryId, CancellationToken ct = default)
    {
        var windowStart = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-90);
        var transactions = await _db.Transactions
            .Where(t => t.UserId == userId
                     && t.CategoryId == categoryId
                     && t.TransactionDate >= windowStart
                     && t.Type == TransactionType.Debit
                     && !t.IsDuplicate)
            .ToListAsync(ct);

        if (transactions.Count == 0) return new SuggestedBudgetResponse(null, 0);

        var total = transactions.Sum(t => Math.Abs(t.Amount));
        return new SuggestedBudgetResponse(Math.Round(total / 3m, 2), transactions.Count);
    }
}
