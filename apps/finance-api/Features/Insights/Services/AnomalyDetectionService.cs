using System.Text.RegularExpressions;
using FinanceApi.Data;
using FinanceApi.Features.Insights.Models;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Insights.Services;

public class AnomalyDetectionService(FinanceDbContext db) : IAnomalyDetectionService
{
    private const decimal NewMerchantThreshold = 100m;
    private const decimal CategorySpikeNoiseFloor = 20m;

    public async Task<IReadOnlyList<AnomalyAlert>> GetAnomaliesAsync(Guid userId, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var transactions = await db.Transactions
            .Where(t => t.UserId == userId && t.Type == TransactionType.Debit && !t.IsDuplicate)
            .OrderBy(t => t.TransactionDate)
            .ToListAsync(ct);

        var categoryIds = transactions.Where(t => t.CategoryId.HasValue).Select(t => t.CategoryId!.Value).Distinct().ToList();
        var categoryNames = await db.Categories
            .Where(c => categoryIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => c.Name, ct);

        var alerts = new List<AnomalyAlert>();
        alerts.AddRange(DetectCategorySpikes(transactions, today, categoryNames));
        alerts.AddRange(DetectNewMerchants(transactions, today));
        alerts.AddRange(DetectPotentialDuplicates(transactions));

        return alerts;
    }

    private static IEnumerable<AnomalyAlert> DetectCategorySpikes(
        List<Transaction> transactions, DateOnly today, IReadOnlyDictionary<Guid, string> categoryNames)
    {
        var currentMonthStart = new DateOnly(today.Year, today.Month, 1);

        foreach (var group in transactions.Where(t => t.CategoryId.HasValue).GroupBy(t => t.CategoryId!.Value))
        {
            var monthlyTotals = group
                .Where(t => t.TransactionDate < currentMonthStart)
                .GroupBy(t => t.TransactionDate.Year * 12 + t.TransactionDate.Month)
                .OrderByDescending(g => g.Key)
                .Take(3)
                .Select(g => (double)g.Sum(t => Math.Abs(t.Amount)))
                .ToList();

            if (monthlyTotals.Count < 3) continue;

            var mean = monthlyTotals.Average();
            var stddev = Math.Sqrt(monthlyTotals.Average(v => Math.Pow(v - mean, 2)));

            var currentMonthTransactions = group.Where(t => t.TransactionDate >= currentMonthStart).ToList();
            var currentSpend = (double)currentMonthTransactions.Sum(t => Math.Abs(t.Amount));

            if (currentSpend <= mean) continue;
            if (currentSpend <= mean + (2 * stddev)) continue;
            if (currentSpend <= (double)CategorySpikeNoiseFloor) continue;
            if (currentMonthTransactions.Count == 0) continue;

            var latest = currentMonthTransactions.OrderByDescending(t => t.TransactionDate).First();
            var categoryName = categoryNames.GetValueOrDefault(group.Key, "Uncategorised");
            var pctAbove = mean > 0 ? Math.Round((currentSpend / mean * 100) - 100) : 0;

            yield return new AnomalyAlert(
                $"spike:{group.Key}:{today.Year:D4}{today.Month:D2}",
                AnomalyType.CategorySpike,
                latest.Id,
                categoryName,
                Math.Round((decimal)currentSpend, 2),
                today,
                $"{categoryName} spending is {pctAbove}% above your 3-month average (£{Math.Round((decimal)mean, 2)}).",
                InsightSeverity.Warning);
        }
    }

    private static IEnumerable<AnomalyAlert> DetectNewMerchants(List<Transaction> transactions, DateOnly today)
    {
        var windowStart = today.AddDays(-30);

        foreach (var group in transactions.GroupBy(t => NormalizeMerchant(t.Payee ?? t.Description)))
        {
            var first = group.OrderBy(t => t.TransactionDate).First();
            if (first.TransactionDate < windowStart) continue;
            if (Math.Abs(first.Amount) <= NewMerchantThreshold) continue;

            yield return new AnomalyAlert(
                $"new:{first.Id}",
                AnomalyType.NewMerchant,
                first.Id,
                first.Payee ?? first.Description,
                Math.Round(Math.Abs(first.Amount), 2),
                first.TransactionDate,
                $"First transaction with this merchant — £{Math.Round(Math.Abs(first.Amount), 2)} on {first.TransactionDate:d MMM yyyy}.",
                InsightSeverity.Info);
        }
    }

    private static IEnumerable<AnomalyAlert> DetectPotentialDuplicates(List<Transaction> transactions)
    {
        foreach (var group in transactions.GroupBy(t => NormalizeMerchant(t.Payee ?? t.Description)))
        {
            var items = group.OrderBy(t => t.TransactionDate).ToList();
            for (var i = 0; i < items.Count; i++)
            {
                for (var j = i + 1; j < items.Count; j++)
                {
                    var gapDays = (items[j].TransactionDate.ToDateTime(TimeOnly.MinValue) -
                                   items[i].TransactionDate.ToDateTime(TimeOnly.MinValue)).TotalDays;
                    if (gapDays > 2) break;
                    if (items[i].Amount != items[j].Amount) continue;

                    yield return new AnomalyAlert(
                        $"dup:{items[i].Id}:{items[j].Id}",
                        AnomalyType.PotentialDuplicate,
                        items[j].Id,
                        items[j].Payee ?? items[j].Description,
                        Math.Round(Math.Abs(items[j].Amount), 2),
                        items[j].TransactionDate,
                        $"Possible duplicate charge of £{Math.Round(Math.Abs(items[j].Amount), 2)} within 2 days of a matching transaction on {items[i].TransactionDate:d MMM yyyy}.",
                        InsightSeverity.Warning);
                }
            }
        }
    }

    private static string NormalizeMerchant(string name)
        => Regex.Replace(name.ToUpperInvariant().Trim(), @"\s+", " ");
}
