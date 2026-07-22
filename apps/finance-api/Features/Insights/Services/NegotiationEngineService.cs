using System.Text.RegularExpressions;
using FinanceApi.Data;
using FinanceApi.Features.Insights.Models;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Insights.Services;

public class NegotiationEngineService(FinanceDbContext db) : INegotiationEngineService
{
    public async Task<NegotiationScriptResponse?> GetScriptAsync(Guid userId, string merchantName, CancellationToken ct = default)
    {
        var normalisedTarget = NormalizeMerchant(merchantName);
        var cutoff = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-3));

        var transactions = await db.Transactions
            .Where(t => t.UserId == userId
                     && t.Type == TransactionType.Debit
                     && !t.IsDuplicate
                     && t.TransactionDate >= cutoff)
            .ToListAsync(ct);

        var matches = transactions
            .Where(t => NormalizeMerchant(t.Payee ?? t.Description) == normalisedTarget)
            .OrderBy(t => t.TransactionDate)
            .ToList();

        if (matches.Count == 0) return null;

        var first = matches[0].TransactionDate;
        var last = matches[^1].TransactionDate;
        var tenureMonths = Math.Max(1, ((last.Year - first.Year) * 12) + last.Month - first.Month + 1);
        var totalSpent = matches.Sum(t => Math.Abs(t.Amount));
        var averageMonthlyAmount = totalSpent / tenureMonths;

        // Consistency assumes a roughly monthly cadence — actual payments vs expected months, capped at 100%.
        var consistencyPct = Math.Min(100m, Math.Round((decimal)matches.Count / tenureMonths * 100, 0));

        var displayName = matches[0].Payee ?? matches[0].Description;
        var script = BuildScript(displayName, tenureMonths, totalSpent, consistencyPct);

        return new NegotiationScriptResponse(
            displayName,
            tenureMonths,
            Math.Round(totalSpent, 2),
            Math.Round(averageMonthlyAmount, 2),
            matches.Count,
            consistencyPct,
            script,
            "This is a suggestion — always review before sending.");
    }

    private static string BuildScript(string merchant, int tenureMonths, decimal totalSpent, decimal consistencyPct)
    {
        var years = tenureMonths / 12;
        var tenureText = years >= 1
            ? $"{years} year{(years == 1 ? "" : "s")}"
            : $"{tenureMonths} month{(tenureMonths == 1 ? "" : "s")}";

        return $"Hi, I've been a customer with {merchant} for {tenureText} and have paid " +
               $"£{totalSpent:0.00} in total over that time, with {consistencyPct:0}% payment consistency. " +
               "I've noticed other providers offering better rates and wanted to ask whether there's a loyalty " +
               "discount, promotional rate, or retention offer available to keep my business. I'd rather stay " +
               "with you if we can find a fair price — what options do you have?";
    }

    private static string NormalizeMerchant(string name)
        => Regex.Replace(name.ToUpperInvariant().Trim(), @"\s+", " ");
}
