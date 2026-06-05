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

        // Fetch all relevant transaction spending in a single query
        var categorySpend = await _db.Transactions
            .Where(t => t.UserId == userId
                     && t.CategoryId.HasValue
                     && t.TransactionDate.Month == month
                     && t.TransactionDate.Year == year
                     && t.Type == TransactionType.Debit
                     && !t.IsDuplicate)
            .GroupBy(t => t.CategoryId!.Value)
            .Select(g => new { CategoryId = g.Key, Spent = g.Sum(t => t.Amount) })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Spent, ct);

        return pots.Select(pot => BuildProgress(pot, categorySpend));
    }

    public async Task<SpendingPotWithProgress> CreatePotAsync(Guid userId, CreateSpendingPotRequest request, CancellationToken ct = default)
    {
        var pot = new SpendingPot
        {
            UserId = userId,
            Name = request.Name,
            Type = request.Type,
            BudgetAmount = request.BudgetAmount,
            RolloverEnabled = request.RolloverEnabled,
            Icon = request.Icon,
            Colour = request.Colour,
            CategoryIds = request.CategoryIds.ToList()
        };
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
        if (request.BudgetAmount.HasValue) pot.BudgetAmount = request.BudgetAmount.Value;
        if (request.RolloverEnabled.HasValue) pot.RolloverEnabled = request.RolloverEnabled.Value;
        if (request.Icon is not null) pot.Icon = request.Icon;
        if (request.Colour is not null) pot.Colour = request.Colour;
        if (request.CategoryIds is not null) pot.CategoryIds = request.CategoryIds.ToList();
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

    private static SpendingPotWithProgress BuildProgress(SpendingPot pot, Dictionary<Guid, decimal> categorySpend)
    {
        var spent = pot.CategoryIds.Sum(id => categorySpend.GetValueOrDefault(id, 0m));
        var pct = pot.BudgetAmount > 0 ? Math.Round(spent / pot.BudgetAmount * 100, 1) : 0;

        return new SpendingPotWithProgress(
            pot.Id, pot.Name, pot.Type, pot.BudgetAmount, spent,
            pot.BudgetAmount - spent, pot.RolloverEnabled, pot.Icon, pot.Colour,
            pot.CategoryIds, pct, pct is >= 80 and < 100, pct >= 100);
    }
}
