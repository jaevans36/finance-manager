using FinanceApi.Data;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Budgets.Services;

/// <summary>Spending pot management with category-based spending aggregation.</summary>
public class SpendingPotService : ISpendingPotService
{
    private readonly FinanceDbContext _db;

    public SpendingPotService(FinanceDbContext db) => _db = db;

    public async Task<IEnumerable<SpendingPotWithProgress>> GetPotsWithProgressAsync(Guid userId, int month, int year, CancellationToken ct = default)
    {
        var pots = await _db.SpendingPots
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.Name)
            .ToListAsync(ct);

        if (pots.Count == 0) return Array.Empty<SpendingPotWithProgress>();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        await ResetDueSinkingFundsAsync(pots, today, ct);

        // Only query transactions for categories actually mapped to a pot
        var allCategoryIds = pots.SelectMany(p => p.CategoryIds).Distinct().ToHashSet();

        Dictionary<Guid, decimal> categorySpend;
        if (allCategoryIds.Count == 0)
        {
            categorySpend = new Dictionary<Guid, decimal>();
        }
        else
        {
            categorySpend = await _db.Transactions
                .Where(t => t.UserId == userId
                         && t.CategoryId.HasValue
                         && allCategoryIds.Contains(t.CategoryId!.Value)
                         && t.TransactionDate.Month == month
                         && t.TransactionDate.Year == year
                         && t.Type == TransactionType.Debit
                         && !t.IsDuplicate)
                .GroupBy(t => t.CategoryId!.Value)
                .Select(g => new { CategoryId = g.Key, Spent = g.Sum(t => t.Amount) })
                .ToDictionaryAsync(x => x.CategoryId, x => x.Spent, ct);
        }

        return pots.Select(pot => BuildProgress(pot, categorySpend, today));
    }

    public async Task<SpendingPotWithProgress> CreatePotAsync(Guid userId, CreateSpendingPotRequest request, CancellationToken ct = default)
    {
        var pot = new SpendingPot
        {
            UserId = userId,
            Name = request.Name,
            Type = request.Type,
            RolloverEnabled = request.RolloverEnabled,
            Icon = request.Icon,
            Colour = request.Colour,
        };

        if (request.Type == PotType.SinkingFund)
        {
            pot.AnnualAmount = request.AnnualAmount;
            pot.NextPaymentDate = request.NextPaymentDate;
            pot.BudgetAmount = Math.Round((request.AnnualAmount ?? 0m) / 12, 2);
            pot.CategoryIds = [];
        }
        else
        {
            pot.BudgetAmount = request.BudgetAmount;
            pot.CategoryIds = request.CategoryIds.ToList();
        }

        _db.SpendingPots.Add(pot);
        await _db.SaveChangesAsync(ct);

        var now = DateTime.UtcNow;
        return (await GetPotsWithProgressAsync(userId, now.Month, now.Year, ct))
            .First(p => p.Id == pot.Id);
    }

    public async Task<SpendingPotWithProgress?> UpdatePotAsync(Guid userId, Guid potId, UpdateSpendingPotRequest request, CancellationToken ct = default)
    {
        var pot = await _db.SpendingPots
            .FirstOrDefaultAsync(p => p.Id == potId && p.UserId == userId, ct);

        if (pot is null) return null;

        if (request.Name is not null) pot.Name = request.Name;
        if (request.RolloverEnabled.HasValue) pot.RolloverEnabled = request.RolloverEnabled.Value;
        if (request.Icon is not null) pot.Icon = request.Icon;
        if (request.Colour is not null) pot.Colour = request.Colour;

        if (pot.Type == PotType.SinkingFund)
        {
            if (request.AnnualAmount.HasValue) pot.AnnualAmount = request.AnnualAmount.Value;
            if (request.NextPaymentDate.HasValue) pot.NextPaymentDate = request.NextPaymentDate.Value;
            pot.BudgetAmount = Math.Round((pot.AnnualAmount ?? 0m) / 12, 2);
        }
        else
        {
            if (request.BudgetAmount.HasValue) pot.BudgetAmount = request.BudgetAmount.Value;
            if (request.CategoryIds is not null) pot.CategoryIds = request.CategoryIds.ToList();
        }

        pot.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var now = DateTime.UtcNow;
        return (await GetPotsWithProgressAsync(userId, now.Month, now.Year, ct))
            .First(p => p.Id == pot.Id);
    }

    public async Task<SpendingPotWithProgress?> ContributeToSinkingFundAsync(Guid userId, Guid potId, CancellationToken ct = default)
    {
        var pot = await _db.SpendingPots
            .FirstOrDefaultAsync(p => p.Id == potId && p.UserId == userId && p.Type == PotType.SinkingFund, ct);

        if (pot is null) return null;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        await ResetDueSinkingFundsAsync([pot], today, ct);

        var annual = pot.AnnualAmount ?? 0m;
        pot.AccumulatedAmount = annual > 0
            ? Math.Min(pot.AccumulatedAmount + pot.BudgetAmount, annual)
            : pot.AccumulatedAmount + pot.BudgetAmount;
        pot.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var now = DateTime.UtcNow;
        return (await GetPotsWithProgressAsync(userId, now.Month, now.Year, ct))
            .First(p => p.Id == pot.Id);
    }

    public async Task<bool> DeletePotAsync(Guid userId, Guid potId, CancellationToken ct = default)
    {
        var pot = await _db.SpendingPots
            .FirstOrDefaultAsync(p => p.Id == potId && p.UserId == userId, ct);

        if (pot is null) return false;
        _db.SpendingPots.Remove(pot);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> AssignTransactionAsync(Guid userId, Guid potId, Guid transactionId, CancellationToken ct = default)
    {
        var pot = await _db.SpendingPots.FirstOrDefaultAsync(p => p.Id == potId && p.UserId == userId, ct);
        var tx = await _db.Transactions.FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId, ct);

        if (pot is null || tx is null) return false;

        if (tx.CategoryId.HasValue && !pot.CategoryIds.Contains(tx.CategoryId.Value))
        {
            pot.CategoryIds.Add(tx.CategoryId.Value);
            pot.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
        return true;
    }

    /// <summary>
    /// Lazily resets any sinking fund whose next payment date has passed — no background
    /// job needed since progress is always read through <see cref="GetPotsWithProgressAsync"/>.
    /// </summary>
    private async Task ResetDueSinkingFundsAsync(List<SpendingPot> pots, DateOnly today, CancellationToken ct)
    {
        var due = pots.Where(p => p.Type == PotType.SinkingFund
                                && p.NextPaymentDate.HasValue
                                && p.NextPaymentDate.Value < today).ToList();
        if (due.Count == 0) return;

        foreach (var pot in due)
        {
            pot.AccumulatedAmount = 0;
            pot.NextPaymentDate = pot.NextPaymentDate!.Value.AddYears(1);
            pot.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync(ct);
    }

    private static SpendingPotWithProgress BuildProgress(SpendingPot pot, Dictionary<Guid, decimal> categorySpend, DateOnly today)
    {
        if (pot.Type == PotType.SinkingFund)
        {
            var annual = pot.AnnualAmount ?? 0m;
            var accumulated = pot.AccumulatedAmount;
            var remaining = annual - accumulated;
            var pct = annual > 0 ? Math.Round(Math.Min(accumulated / annual * 100, 100m), 1) : 0m;
            var monthsRemaining = pot.NextPaymentDate.HasValue
                ? (int?)Math.Max(0, MonthsBetween(today, pot.NextPaymentDate.Value))
                : null;
            var isReady = annual > 0 && accumulated >= annual;

            return new SpendingPotWithProgress(
                pot.Id, pot.Name, pot.Type, pot.BudgetAmount, accumulated, remaining,
                pot.RolloverEnabled, pot.Icon, pot.Colour, pot.CategoryIds,
                pct, false, false,
                pot.AnnualAmount, pot.NextPaymentDate, accumulated, pot.BudgetAmount, monthsRemaining, isReady);
        }

        var spent = pot.CategoryIds.Sum(id => categorySpend.GetValueOrDefault(id, 0m));
        var spendPct = pot.BudgetAmount > 0 ? Math.Round(spent / pot.BudgetAmount * 100, 1) : 0;

        return new SpendingPotWithProgress(
            pot.Id, pot.Name, pot.Type, pot.BudgetAmount, spent,
            pot.BudgetAmount - spent, pot.RolloverEnabled, pot.Icon, pot.Colour,
            pot.CategoryIds, spendPct, spendPct is >= 80 and < 100, spendPct >= 100);
    }

    private static int MonthsBetween(DateOnly from, DateOnly to)
        => (to.Year - from.Year) * 12 + (to.Month - from.Month) - (to.Day < from.Day ? 1 : 0);
}
