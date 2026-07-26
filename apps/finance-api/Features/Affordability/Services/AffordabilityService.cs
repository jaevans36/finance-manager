using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Affordability.Models;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.SavingsGoals.Models;
using FinanceApi.Features.Settings.Models;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Affordability.Services;

public class AffordabilityService(FinanceDbContext db) : IAffordabilityService
{
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

        var incomeStreams = await db.IncomeStreams
            .Where(s => s.UserId == userId)
            .ToListAsync(ct);
        decimal? manualIncome = incomeStreams.Count > 0 ? incomeStreams.Sum(s => s.MonthlyAmount) : null;

        var (monthlyIncome, incomeConfidence, incomeSource) =
            DetectIncome(creditTransactions, manualIncome);

        // ── Committed costs ──────────────────────────────────────────────────
        var activeBills = await db.Bills
            .Where(b => b.UserId == userId && b.IsActive)
            .ToListAsync(ct);

        // ── Existing debt repayments ────────────────────────────────────────
        // Mortgage/loan/credit-card minimum (or current) payments are a committed
        // cost too, but live on debt Accounts rather than Bills — without this
        // they'd either vanish from the picture, or (worse) get miscounted as
        // discretionary spend below, since their outgoing transactions rarely
        // have a matching Bill record. Some debts are instead tracked via a Bill
        // linked to the account (Bill.AccountId) — resolve one payment per debt,
        // same precedence as the Debt tab (current → linked bill → minimum), so a
        // debt tracked both ways isn't double-counted in both buckets.
        var debtAccounts = await db.Accounts
            .Where(a => a.UserId == userId && a.IsActive
                     && (a.Type == AccountType.Credit || a.Type == AccountType.Loan || a.Type == AccountType.Mortgage)
                     && a.Balance < 0)
            .ToListAsync(ct);
        var debtAccountIds = debtAccounts.Select(a => a.Id).ToHashSet();

        var debtLinkedBills = activeBills.Where(b => b.AccountId.HasValue && debtAccountIds.Contains(b.AccountId.Value)).ToList();
        var debtLinkedBillIds = debtLinkedBills.Select(b => b.Id).ToHashSet();
        var linkedBillTotalByAccount = debtLinkedBills
            .GroupBy(b => b.AccountId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(b => b.MonthlyEquivalent()));

        var existingDebtPayments = debtAccounts.Sum(a =>
        {
            var current = a.CurrentMonthlyPayment is > 0 ? a.CurrentMonthlyPayment : null;
            var linkedBill = linkedBillTotalByAccount.TryGetValue(a.Id, out var lb) && lb > 0 ? lb : (decimal?)null;
            return current ?? linkedBill ?? a.MinimumMonthlyPayment ?? 0m;
        });

        // A bill already represented above (linked to a debt account) isn't a
        // separate committed cost too.
        var committedCosts = activeBills
            .Where(b => !debtLinkedBillIds.Contains(b.Id))
            .Sum(b => b.MonthlyEquivalent());

        // ── Discretionary spend ──────────────────────────────────────────────
        var budgetTotal = await db.Budgets
            .Where(b => b.UserId == userId && b.Month == today.Month && b.Year == today.Year)
            .SumAsync(b => b.Amount, ct);

        // Regular (non-sinking-fund) spending pots are a second, independent way users
        // budget for day-to-day categories (Groceries, Fuel, etc.) — count them
        // alongside Budgets so surplus isn't overstated for pot-only users. Sinking
        // funds are handled separately below as part of planned savings.
        var potTotal = await db.SpendingPots
            .Where(p => p.UserId == userId && p.Type != PotType.SinkingFund)
            .SumAsync(p => p.BudgetAmount, ct);

        var plannedDiscretionaryTotal = budgetTotal + potTotal;

        decimal discretionarySpend;
        if (plannedDiscretionaryTotal > 0)
        {
            // This is just your actual Budget + Pot total — it must equal the sum of
            // the itemized categories shown elsewhere, so no adjustment here.
            discretionarySpend = plannedDiscretionaryTotal;
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
            var rawAverage = totalSpend / 3m;
            // The raw average still includes existing debt repayments (their
            // transactions aren't linked to a Bill) — subtract the amount already
            // counted above to avoid double-counting it.
            discretionarySpend = Math.Max(0m, Math.Round(rawAverage - existingDebtPayments, 2));
        }

        // ── Planned savings & upcoming costs ───────────────────────────────────
        // Money already earmarked for a savings goal (e.g. a washing machine) or a
        // sinking fund (e.g. annual car insurance) isn't available for debt — treat
        // it the same as a committed cost so the suggested payment doesn't double-book it.
        var savingsGoalContributions = await db.SavingsGoals
            .Where(g => g.UserId == userId && g.Status == SavingsGoalStatus.Active)
            .SumAsync(g => g.MonthlyContribution, ct);

        var sinkingFundAllocations = await db.SpendingPots
            .Where(p => p.UserId == userId
                     && p.Type == PotType.SinkingFund
                     && (p.AnnualAmount == null || p.AccumulatedAmount < p.AnnualAmount))
            .SumAsync(p => p.BudgetAmount, ct);

        var plannedSavings = savingsGoalContributions + sinkingFundAllocations;

        // ── Safe surplus ─────────────────────────────────────────────────────
        var safeSurplus = Math.Max(0m, monthlyIncome - committedCosts - existingDebtPayments - discretionarySpend - plannedSavings - emergencyBuffer);
        // Suggest 90% of surplus toward debt; keep 10% as breathing room
        var suggestedDebtPayment = Math.Round(safeSurplus * 0.9m, 2);

        return new AffordabilityResponse(
            MonthlyIncome: Math.Round(monthlyIncome, 2),
            IncomeConfidence: incomeConfidence,
            IncomeSource: incomeSource,
            CommittedCosts: Math.Round(committedCosts, 2),
            ExistingDebtPayments: Math.Round(existingDebtPayments, 2),
            DiscretionarySpend: Math.Round(discretionarySpend, 2),
            PlannedSavings: Math.Round(plannedSavings, 2),
            EmergencyBuffer: emergencyBuffer,
            SafeSurplus: Math.Round(safeSurplus, 2),
            SuggestedDebtPayment: suggestedDebtPayment,
            CalculatedAt: today,
            IncomeAccountIds: (IReadOnlyList<Guid>?)incomeAccountIds?.AsReadOnly() ?? []);
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
        // Manual income streams are an explicit, user-asserted figure — once set up
        // (often specifically to correct a detection quirk, e.g. a partner's salary
        // landing on a joint account), they take priority over automatic detection
        // rather than only being used as a fallback when detection finds nothing.
        if (manualIncome.HasValue)
            return (manualIncome.Value, "Low", "Manual");

        if (credits.Count == 0)
            return (0m, "Low", "Detected");

        // Group by calendar month to check cadence across the 3-month window
        var byMonth = IncomeDetectionHeuristics.ClassifyByMonth(credits);

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

        if (byMonth.Count == 1)
        {
            var income = byMonth[0].Sum(t => t.Amount);
            return (Math.Round(income, 2), "Low", "Detected");
        }

        return (0m, "Low", "Detected");
    }
}
