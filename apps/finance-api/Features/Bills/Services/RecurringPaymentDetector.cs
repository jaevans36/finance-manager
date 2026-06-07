using System.Text.RegularExpressions;
using FinanceApi.Data;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Bills.Services;

public partial class RecurringPaymentDetector : IRecurringPaymentDetector
{
    private readonly FinanceDbContext _db;

    public RecurringPaymentDetector(FinanceDbContext db) => _db = db;

    public async Task<IEnumerable<RecurringPattern>> DetectAsync(Guid userId, CancellationToken ct = default)
    {
        var cutoff = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-90));
        var transactions = await _db.Transactions
            .Where(t => t.UserId == userId
                     && t.Type == TransactionType.Debit
                     && t.TransactionDate >= cutoff
                     && !t.IsDuplicate)
            .OrderBy(t => t.TransactionDate)
            .ToListAsync(ct);

        var groups = transactions
            .GroupBy(t => NormalizeMerchant(t.Payee ?? t.Description))
            .Where(g => g.Count() >= 2)
            .ToList();

        var patterns = new List<RecurringPattern>();
        foreach (var group in groups)
        {
            var items = group.OrderBy(t => t.TransactionDate).ToList();
            var frequency = DetectFrequency(items);
            if (frequency == RecurringFrequency.Unknown) continue;

            var amounts = items.Select(t => t.Amount).ToList();
            var avg = amounts.Average();
            var trend = DetectAmountTrend(amounts);
            var patternType = ClassifyPattern(frequency, amounts.Min(), amounts.Max(), avg);

            patterns.Add(new RecurringPattern(
                group.Key,
                Math.Round(avg, 2),
                amounts.Min(),
                amounts.Max(),
                frequency,
                patternType,
                trend,
                items.Count,
                items.Last().TransactionDate));
        }

        return patterns.OrderByDescending(p => p.AverageAmount);
    }

    private static string NormalizeMerchant(string name)
        => WhitespaceRegex().Replace(name.ToUpperInvariant().Trim(), " ");

    private static RecurringFrequency DetectFrequency(List<Transactions.Models.Transaction> items)
    {
        if (items.Count < 2) return RecurringFrequency.Unknown;

        var gaps = new List<double>();
        for (var i = 1; i < items.Count; i++)
            gaps.Add((items[i].TransactionDate.ToDateTime(TimeOnly.MinValue) -
                      items[i - 1].TransactionDate.ToDateTime(TimeOnly.MinValue)).TotalDays);

        var avgGap = gaps.Average();
        return avgGap switch
        {
            <= 10 => RecurringFrequency.Weekly,
            <= 35 => RecurringFrequency.Monthly,
            <= 100 => RecurringFrequency.Quarterly,
            <= 400 => RecurringFrequency.Annual,
            _ => RecurringFrequency.Unknown
        };
    }

    private static AmountTrend DetectAmountTrend(List<decimal> amounts)
    {
        if (amounts.Count < 2) return AmountTrend.Stable;
        var half = amounts.Count / 2;
        var firstHalf = (double)amounts.Take(half).Average();
        var secondHalf = (double)amounts.Skip(half).Average();
        var diff = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf : 0;
        return diff switch
        {
            > 0.05 => AmountTrend.Increasing,
            < -0.05 => AmountTrend.Decreasing,
            _ => AmountTrend.Stable
        };
    }

    private static RecurringPatternType ClassifyPattern(
        RecurringFrequency frequency, decimal min, decimal max, decimal avg)
    {
        var variancePct = avg > 0 ? (max - min) / avg : 0m;
        if (variancePct < 0.05m)
            return frequency is RecurringFrequency.Monthly or RecurringFrequency.Annual
                ? RecurringPatternType.Subscription
                : RecurringPatternType.FixedBill;
        return variancePct < 0.30m
            ? RecurringPatternType.VariableBill
            : RecurringPatternType.RegularSpend;
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRegex();
}
