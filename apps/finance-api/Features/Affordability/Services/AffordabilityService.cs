using FinanceApi.Data;
using FinanceApi.Features.Affordability.Models;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Settings.Models;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Affordability.Services;

public class AffordabilityService(FinanceDbContext db) : IAffordabilityService
{
    private static readonly string[] IncomeKeywords = ["salary", "payroll", "bacs", "wages", "pay"];

    public async Task<AffordabilityResponse> GetAffordabilityAsync(Guid userId, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var windowStart = today.AddDays(-90);

        var settings = await db.UserFinanceSettings.FindAsync([userId], ct);
        var emergencyBuffer = settings?.EmergencyBuffer ?? 200m;

        // ── Income detection ─────────────────────────────────────────────────
        // When the user has scoped income detection to specific accounts, only
        // consider credits from those accounts so that transfers and a partner's
        // salary on a joint account aren't misclassified as the user's income.
        var incomeAccountIds = settings?.IncomeAccountIds;
        var hasScope = incomeAccountIds is { Count: > 0 };

        var creditTransactions = await db.Transactions
            .Where(t => t.UserId == userId
                     && t.Type == TransactionType.Credit
                     && t.TransactionDate >= windowStart
                     && (!hasScope || incomeAccountIds!.Contains(t.AccountId)))
            .ToListAsync(ct);

        var (monthlyIncome, incomeConfidence, incomeSource) =
            DetectIncome(creditTransactions, settings?.ManualMonthlyIncome);

        // ── Committed costs ──────────────────────────────────────────────────
        var activeBills = await db.Bills
            .Where(b => b.UserId == userId && b.IsActive)
            .ToListAsync(ct);

        var committedCosts = activeBills.Sum(b => b.Frequency switch
        {
            BillFrequency.Weekly => b.Amount * 52m / 12m,
            BillFrequency.Monthly => b.Amount,
            BillFrequency.Quarterly => b.Amount / 3m,
            BillFrequency.Annual => b.Amount / 12m,
            _ => b.Amount,
        });

        // ── Discretionary spend ──────────────────────────────────────────────
        var budgetTotal = await db.Budgets
            .Where(b => b.UserId == userId && b.Month == today.Month && b.Year == today.Year)
            .SumAsync(b => b.Amount, ct);

        decimal discretionarySpend;
        if (budgetTotal > 0)
        {
            // Subtract bills already in committed costs to avoid double-counting
            discretionarySpend = Math.Max(0m, budgetTotal - committedCosts);
        }
        else
        {
            // Fallback: average monthly debit spend, excluding bill-matched transactions
            var billIds = activeBills.Select(b => b.Id).ToArray();
            var debitTransactions = await db.Transactions
                .Where(t => t.UserId == userId
                         && t.Type == TransactionType.Debit
                         && t.TransactionDate >= windowStart
                         && (t.BillId == null || !billIds.Contains(t.BillId.Value)))
                .ToListAsync(ct);

            var totalSpend = debitTransactions.Sum(t => Math.Abs(t.Amount));
            discretionarySpend = Math.Round(totalSpend / 3m, 2);
        }

        // ── Safe surplus ─────────────────────────────────────────────────────
        var safeSurplus = Math.Max(0m, monthlyIncome - committedCosts - discretionarySpend - emergencyBuffer);
        // Suggest 90% of surplus toward debt; keep 10% as breathing room
        var suggestedDebtPayment = Math.Round(safeSurplus * 0.9m, 2);

        return new AffordabilityResponse(
            MonthlyIncome: Math.Round(monthlyIncome, 2),
            IncomeConfidence: incomeConfidence,
            IncomeSource: incomeSource,
            CommittedCosts: Math.Round(committedCosts, 2),
            DiscretionarySpend: Math.Round(discretionarySpend, 2),
            EmergencyBuffer: emergencyBuffer,
            SafeSurplus: Math.Round(safeSurplus, 2),
            SuggestedDebtPayment: suggestedDebtPayment,
            CalculatedAt: today,
            IncomeAccountIds: (IReadOnlyList<Guid>?)incomeAccountIds?.AsReadOnly() ?? []);
    }

    public async Task UpdateManualIncomeAsync(Guid userId, decimal monthlyIncome, CancellationToken ct = default)
    {
        var settings = await db.UserFinanceSettings.FindAsync([userId], ct);
        if (settings is null)
        {
            settings = new UserFinanceSettings { UserId = userId };
            db.UserFinanceSettings.Add(settings);
        }
        settings.ManualMonthlyIncome = monthlyIncome;
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateIncomeAccountsAsync(Guid userId, IReadOnlyList<Guid> accountIds, CancellationToken ct = default)
    {
        var settings = await db.UserFinanceSettings.FindAsync([userId], ct);
        if (settings is null)
        {
            settings = new UserFinanceSettings { UserId = userId };
            db.UserFinanceSettings.Add(settings);
        }
        settings.IncomeAccountIds = accountIds.Count > 0 ? accountIds.ToList() : null;
        await db.SaveChangesAsync(ct);
    }

    // ── Income detection ─────────────────────────────────────────────────────

    internal static (decimal monthlyIncome, string confidence, string source) DetectIncome(
        List<Transactions.Models.Transaction> credits,
        decimal? manualIncome)
    {
        if (credits.Count == 0)
        {
            return manualIncome.HasValue
                ? (manualIncome.Value, "Low", "Manual")
                : (0m, "Low", "Detected");
        }

        var amounts = credits.Select(t => t.Amount).OrderBy(a => a).ToList();
        var median = amounts[amounts.Count / 2];
        var threshold = median * 5m;

        // Income events: large credits or keyword-matched payee/description
        var incomeEvents = credits
            .Where(t => t.Amount > threshold || IsIncomeTransaction(t))
            .ToList();

        // Group by calendar month to check cadence across the 3-month window
        var byMonth = incomeEvents
            .GroupBy(t => new { t.TransactionDate.Year, t.TransactionDate.Month })
            .ToList();

        if (byMonth.Count >= 3)
        {
            var monthlyIncome = (decimal)byMonth.Average(g => (double)g.Sum(t => t.Amount));
            return (Math.Round(monthlyIncome, 2), "High", "Detected");
        }

        if (byMonth.Count == 2)
        {
            var monthlyIncome = (decimal)byMonth.Average(g => (double)g.Sum(t => t.Amount));
            return (Math.Round(monthlyIncome, 2), "Medium", "Detected");
        }

        // Only 1 month or no income detected
        if (manualIncome.HasValue)
            return (manualIncome.Value, "Low", "Manual");

        if (byMonth.Count == 1)
        {
            var income = byMonth[0].Sum(t => t.Amount);
            return (Math.Round(income, 2), "Low", "Detected");
        }

        return (0m, "Low", "Detected");
    }

    private static bool IsIncomeTransaction(Transactions.Models.Transaction t)
    {
        var text = $"{t.Description} {t.Payee ?? string.Empty}".ToLowerInvariant();
        return Array.Exists(IncomeKeywords, kw => text.Contains(kw));
    }
}
