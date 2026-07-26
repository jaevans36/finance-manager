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

    public async Task<IEnumerable<RecurringPattern>> DetectAsync(Guid userId, int days = 365, CancellationToken ct = default)
    {
        var cutoff = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-days));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var transactions = await _db.Transactions
            .Include(t => t.Account)
            .Where(t => t.UserId == userId
                     && t.Type == TransactionType.Debit
                     && t.TransactionDate >= cutoff
                     && !t.IsDuplicate)
            .OrderBy(t => t.TransactionDate)
            .ToListAsync(ct);

        // Group by merchant *and* account — the same merchant appearing on two
        // different accounts (e.g. a subscription moved between cards) is two
        // separate real-world patterns, not one, and each must resolve to
        // exactly one account so it can be displayed and linked unambiguously.
        var groups = transactions
            .GroupBy(t => (Merchant: NormalizeMerchant(t.Payee, t.Description), t.AccountId))
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

            var expectedIntervalDays = frequency switch
            {
                RecurringFrequency.Weekly => 7.0,
                RecurringFrequency.Monthly => 30.0,
                RecurringFrequency.Quarterly => 91.0,
                RecurringFrequency.Annual => 365.0,
                _ => 30.0
            };
            var daysSinceLast = (today.ToDateTime(TimeOnly.MinValue) -
                                 items.Last().TransactionDate.ToDateTime(TimeOnly.MinValue)).TotalDays;
            var isLikelyInactive = daysSinceLast > expectedIntervalDays * 1.5;

            patterns.Add(new RecurringPattern(
                group.Key.Merchant,
                Math.Round(avg, 2),
                items.Last().Amount,
                amounts.Min(),
                amounts.Max(),
                frequency,
                patternType,
                trend,
                items.Count,
                items.Last().TransactionDate,
                group.Key.AccountId,
                items[0].Account?.Name ?? "Unknown account",
                isLikelyInactive));
        }

        return patterns.OrderByDescending(p => p.AverageAmount);
    }

    // Payment-processor payees that don't identify the actual merchant — the bank
    // labels these transactions with the processor's name, not the underlying
    // subscription/store, so the real merchant only survives in the description.
    private static readonly string[] GenericProcessorPayees = ["paypal"];

    private static string NormalizeMerchant(string? payee, string description)
    {
        // Prefer the payee, UNLESS it's a generic payment-processor label — in that
        // case every merchant routed through it (Spotify, GitHub, Steam, ...) would
        // otherwise collapse into one meaningless "PayPal" group.
        var source = string.IsNullOrWhiteSpace(payee) || GenericProcessorPayees.Contains(payee.Trim().ToLowerInvariant())
            ? description
            : payee;

        // Strip a "PAYPAL *" / "PP*" marker (optionally preceded by an "INT'L <ref>"
        // prefix) to recover the real merchant, e.g. "INT'L 0004846501 PAYPAL *GITHUB
        // INC 4029357733 VIS" -> "GITHUB INC 4029357733 VIS".
        var match = PayPalPrefixRegex().Match(source);
        var merchant = match.Success ? match.Groups[1].Value : source;

        // Strip per-transaction reference/merchant-ID numbers (6+ digits) that vary
        // between occurrences of the same merchant and would otherwise prevent
        // grouping — while leaving short store-number codes (typically 4-5 digits)
        // alone since those aren't the source of the problem.
        merchant = ReferenceNumberRegex().Replace(merchant, " ");
        merchant = TrailingVisSuffixRegex().Replace(merchant, "");

        return WhitespaceRegex().Replace(merchant.ToUpperInvariant().Trim(), " ");
    }

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

    [GeneratedRegex(@"^(?:INT'L\s+\d+\s+)?(?:PAYPAL|PP)\s*\*\s*(.+)$", RegexOptions.IgnoreCase)]
    private static partial Regex PayPalPrefixRegex();

    [GeneratedRegex(@"\d{6,}")]
    private static partial Regex ReferenceNumberRegex();

    [GeneratedRegex(@"\s+VIS$", RegexOptions.IgnoreCase)]
    private static partial Regex TrailingVisSuffixRegex();
}
