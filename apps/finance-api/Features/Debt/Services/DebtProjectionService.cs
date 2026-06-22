using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Debt.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Debt.Services;

public class DebtProjectionService(FinanceDbContext db, IDebtSeverityService severity) : IDebtProjectionService
{
    private static readonly AccountType[] DebtTypes =
        [AccountType.Credit, AccountType.Loan, AccountType.Mortgage];

    public async Task<DebtOverviewResponse> GetOverviewAsync(Guid userId, CancellationToken ct = default)
    {
        var accounts = await LoadDebtAccountsAsync(userId, ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Detect actual monthly payments from the 3 most recently completed calendar months.
        // Positive-amount transactions on a debt account represent money paid in (reducing balance).
        var startOfCurrentMonth = new DateOnly(today.Year, today.Month, 1);
        var threeMonthsAgo = startOfCurrentMonth.AddMonths(-3);
        var accountIds = accounts.Select(a => a.Id).ToHashSet();

        var detectedPayments = await db.Transactions
            .Where(t => accountIds.Contains(t.AccountId)
                     && t.Amount > 0
                     && t.TransactionDate >= threeMonthsAgo
                     && t.TransactionDate < startOfCurrentMonth)
            .GroupBy(t => t.AccountId)
            .Select(g => new { AccountId = g.Key, Total = g.Sum(t => t.Amount) })
            .ToDictionaryAsync(x => x.AccountId, x => Math.Round(x.Total / 3m, 2), ct);

        var summaries = accounts
            .Select(a =>
            {
                var (score, label, reason) = severity.Score(a, today);
                var balance = Math.Abs(a.Balance);

                // Split interest: part of the balance may be at a promotional rate (e.g. 0% BT)
                var promoBalance = Math.Min(a.PromotionalBalance ?? 0m, balance);
                var standardBalance = balance - promoBalance;
                var promoRate = a.PromotionalRate ?? 0m;

                decimal? monthlyInterestCost = null;
                if (a.InterestRate is > 0 || promoRate > 0)
                {
                    decimal interest = standardBalance * (a.InterestRate ?? 0m) / 100m / 12m
                                     + promoBalance * promoRate / 100m / 12m;
                    if (interest > 0m)
                        monthlyInterestCost = Math.Round(interest, 2);
                }

                // Weighted effective rate for payoff estimate (reflects current blended cost)
                decimal? effectiveRateForPayoff = balance > 0 && a.InterestRate.HasValue
                    ? (standardBalance * a.InterestRate.Value + promoBalance * promoRate) / balance
                    : a.InterestRate;

                int? monthsToPayoff = null;
                string? payoffDate = null;
                if (!a.IsInterestOnly)
                {
                    var payment = a.CurrentMonthlyPayment ?? a.MinimumMonthlyPayment;
                    monthsToPayoff = CalculateMonthsToPayoff(balance, effectiveRateForPayoff, payment);
                    if (monthsToPayoff.HasValue)
                        payoffDate = today.AddMonths(monthsToPayoff.Value).ToString("yyyy-MM");
                }

                detectedPayments.TryGetValue(a.Id, out var detectedPayment);

                return new DebtAccountSummary(
                    a.Id, a.Name, a.Type.ToString(), a.Balance, a.CreditLimit,
                    a.InterestRate, a.PromotionalBalance, a.MinimumMonthlyPayment, a.CurrentMonthlyPayment,
                    a.PromotionalRate, a.PromotionalExpiry, a.LoanEndDate,
                    score, label, reason,
                    monthlyInterestCost, monthsToPayoff, payoffDate,
                    detectedPayment > 0 ? detectedPayment : null);
            })
            .OrderByDescending(s => s.SeverityScore)
            .ToList();

        return new DebtOverviewResponse(
            summaries,
            summaries.Sum(s => Math.Abs(s.Balance)),
            summaries.Sum(s => s.MinimumMonthlyPayment ?? 0m),
            summaries.Sum(s => s.CurrentMonthlyPayment ?? s.MinimumMonthlyPayment ?? 0m));
    }

    public async Task<DebtProjectionResponse> ProjectAsync(
        Guid userId, ProjectionRequest request, CancellationToken ct = default)
    {
        var accounts = await LoadDebtAccountsAsync(userId, ct);
        if (accounts.Count == 0)
        {
            return new DebtProjectionResponse(request.Strategy, 0,
                DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM"),
                0m, [], []);
        }

        // Working state: mutable balances and monthly payments
        var state = accounts.ToDictionary(
            a => a.Id,
            a => new DebtState(a, DetermineMonthlyPayment(a, request)));

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var schedule = new List<DebtProjectionMonth>();
        var payoffOrder = new List<PayoffOrder>();
        decimal totalInterest = 0m;
        int month = 0;
        const int MaxMonths = 600; // 50-year safety cap

        while (state.Values.Any(s => s.Balance > 0) && month < MaxMonths)
        {
            month++;
            var label = MonthLabel(today, month);

            // 1. Apply monthly interest to each remaining debt
            foreach (var s in state.Values.Where(s => s.Balance > 0))
            {
                decimal monthlyRate = (s.EffectiveRate / 100m) / 12m;
                decimal interest = Math.Round(s.Balance * monthlyRate, 2);
                s.Balance += interest;
                totalInterest += interest;
            }

            // 2. Pay minimums on all debts
            foreach (var s in state.Values.Where(s => s.Balance > 0))
            {
                decimal payment = Math.Min(s.MonthlyPayment, s.Balance);
                s.Balance -= payment;
                s.Balance = Math.Max(0m, s.Balance);
            }

            // 3. Apply extra payment cascade to the priority debt
            decimal extraPool = request.ExtraMonthlyPayment ?? 0m;

            // Collect freed minimums from accounts paid off this month
            var justPaidOff = state.Values.Where(s => s.Balance == 0 && !s.IsPaidOff).ToList();
            foreach (var s in justPaidOff)
            {
                s.IsPaidOff = true;
                extraPool += s.MonthlyPayment;
                payoffOrder.Add(new PayoffOrder(s.Account.Id, s.Account.Name, month,
                    MonthLabel(today, month)));
            }

            if (extraPool > 0)
            {
                var priority = GetPriorityDebt(state, request);
                if (priority is not null)
                {
                    decimal extra = Math.Min(extraPool, priority.Balance);
                    priority.Balance -= extra;
                    priority.Balance = Math.Max(0m, priority.Balance);

                    if (priority.Balance == 0 && !priority.IsPaidOff)
                    {
                        priority.IsPaidOff = true;
                        extraPool -= extra;
                        payoffOrder.Add(new PayoffOrder(priority.Account.Id, priority.Account.Name,
                            month, MonthLabel(today, month)));

                        // Cascade remaining extra to next priority
                        if (extraPool > 0)
                        {
                            var next = GetPriorityDebt(state, request);
                            if (next is not null)
                            {
                                decimal cascade = Math.Min(extraPool, next.Balance);
                                next.Balance -= cascade;
                                next.Balance = Math.Max(0m, next.Balance);
                            }
                        }
                    }
                }
            }

            // 4. Record month snapshot
            var balances = state.Values
                .Select(s => new AccountBalance(s.Account.Id, s.Account.Name,
                    Math.Round(s.Balance, 2)))
                .ToList();

            schedule.Add(new DebtProjectionMonth(month, label, balances,
                balances.Sum(b => b.Balance)));

        }

        var freedomDate = MonthLabel(today, month);
        return new DebtProjectionResponse(request.Strategy, month, freedomDate,
            Math.Round(totalInterest, 2), schedule, payoffOrder);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task<List<Account>> LoadDebtAccountsAsync(Guid userId, CancellationToken ct)
    {
        return await db.Accounts
            .Where(a => a.UserId == userId && a.IsActive && DebtTypes.Contains(a.Type) && a.Balance < 0)
            .OrderBy(a => a.Name)
            .ToListAsync(ct);
    }

    private static decimal DetermineMonthlyPayment(Account account, ProjectionRequest request)
    {
        if (request.Strategy == DebtStrategy.Custom && request.CustomAllocations is not null)
        {
            var custom = request.CustomAllocations.FirstOrDefault(c => c.AccountId == account.Id);
            if (custom is not null) return custom.MonthlyPayment;
        }
        return account.CurrentMonthlyPayment
            ?? account.MinimumMonthlyPayment
            ?? Math.Abs(account.Balance) * 0.02m; // 2% fallback for credit cards
    }

    private static DebtState? GetPriorityDebt(Dictionary<Guid, DebtState> state, ProjectionRequest request)
    {
        var excluded = request.ExcludedAccountIds ?? [];
        var remaining = state.Values
            .Where(s => s.Balance > 0 && !s.IsPaidOff && !excluded.Contains(s.Account.Id))
            .ToList();
        if (remaining.Count == 0) return null;

        return request.Strategy switch
        {
            // Avalanche: highest effective interest rate first
            DebtStrategy.Avalanche => remaining.OrderByDescending(s => s.EffectiveRate).First(),
            // Snowball: smallest balance first
            DebtStrategy.Snowball => remaining.OrderBy(s => s.Balance).First(),
            // Custom: highest allocated payment first (already set per account)
            DebtStrategy.Custom => remaining.OrderByDescending(s => s.MonthlyPayment).First(),
            _ => remaining.OrderByDescending(s => s.EffectiveRate).First(),
        };
    }

    // Standard amortisation: returns null when payment cannot cover interest or data is missing.
    private static int? CalculateMonthsToPayoff(decimal balance, decimal? interestRate, decimal? payment)
    {
        if (payment is null or <= 0 || balance <= 0) return null;

        if (interestRate is null or <= 0)
            return (int)Math.Ceiling((double)balance / (double)payment);

        double monthlyRate = (double)(interestRate.Value / 100m / 12m);
        double monthlyInterest = (double)balance * monthlyRate;

        if ((double)payment <= monthlyInterest) return null;

        double n = -Math.Log(1.0 - (double)balance * monthlyRate / (double)payment)
                   / Math.Log(1.0 + monthlyRate);
        return (int)Math.Ceiling(n);
    }

    private static string MonthLabel(DateOnly today, int monthsAhead)
    {
        var date = today.AddMonths(monthsAhead);
        return date.ToString("yyyy-MM");
    }

    private sealed class DebtState(Account account, decimal monthlyPayment)
    {
        public Account Account { get; } = account;
        // Balance as a positive number (owed amount)
        public decimal Balance { get; set; } = Math.Abs(account.Balance);
        public decimal MonthlyPayment { get; } = monthlyPayment;
        public bool IsPaidOff { get; set; }

        public decimal EffectiveRate
        {
            get
            {
                var totalBalance = Math.Abs(Account.Balance);
                if (totalBalance <= 0) return Account.InterestRate ?? 0m;
                var promoBalance = Math.Min(Account.PromotionalBalance ?? 0m, totalBalance);
                var standardBalance = totalBalance - promoBalance;
                var promoRate = Account.PromotionalRate ?? 0m;
                return (standardBalance * (Account.InterestRate ?? 0m) + promoBalance * promoRate) / totalBalance;
            }
        }
    }
}
