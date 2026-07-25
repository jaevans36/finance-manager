using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.Features.Affordability.Services;

/// <summary>
/// Shared credit-classification heuristic used to detect income from transaction history.
/// Extracted from <see cref="AffordabilityService"/> so both the global multi-account
/// reconciliation and a single-account "detect" preview use identical classification.
/// </summary>
internal static class IncomeDetectionHeuristics
{
    private static readonly string[] IncomeKeywords = ["salary", "payroll", "bacs", "wages", "pay"];

    /// <summary>Classifies which credits look like income events, grouped by calendar month.</summary>
    internal static List<IGrouping<(int Year, int Month), Transaction>> ClassifyByMonth(List<Transaction> credits)
    {
        if (credits.Count == 0) return [];

        var amounts = credits.Select(t => t.Amount).OrderBy(a => a).ToList();
        var median = amounts[amounts.Count / 2];
        var threshold = median * 5m;

        var incomeEvents = credits
            .Where(t => t.Amount > threshold || IsIncomeTransaction(t))
            .ToList();

        return incomeEvents
            .GroupBy(t => (t.TransactionDate.Year, t.TransactionDate.Month))
            .ToList();
    }

    internal static bool IsIncomeTransaction(Transaction t)
    {
        var text = $"{t.Description} {t.Payee ?? string.Empty}".ToLowerInvariant();
        return Array.Exists(IncomeKeywords, kw => text.Contains(kw));
    }
}
