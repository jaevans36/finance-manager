using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Debt.Models;
using FinanceApi.Features.Debt.Services;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.UnitTests.Features.Debt.Services;

public class DebtProjectionServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly DebtProjectionService _sut;
    private readonly Guid _userId = Guid.NewGuid();

    public DebtProjectionServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options);
        _db.Database.EnsureCreated();
        _sut = new DebtProjectionService(_db, new DebtSeverityService());
    }

    public void Dispose() => _db.Dispose();

    // â"€â"€ GetOverviewAsync â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

    [Fact]
    public async Task GetOverviewAsync_WithNoDebtAccounts_ReturnsEmptyOverview()
    {
        _db.Accounts.Add(MakeSavings(_userId));
        await _db.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync(_userId);

        result.Debts.Should().BeEmpty();
        result.TotalDebt.Should().Be(0m);
    }

    [Fact]
    public async Task GetOverviewAsync_WithCreditCard_IncludesItInOverview()
    {
        _db.Accounts.Add(MakeCredit(_userId, balance: -1500m, interestRate: 24.9m));
        await _db.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync(_userId);

        result.Debts.Should().HaveCount(1);
        result.TotalDebt.Should().Be(1500m);
        result.Debts[0].SeverityScore.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetOverviewAsync_ExcludesPositiveBalanceAccounts()
    {
        _db.Accounts.Add(MakeCredit(_userId, balance: 50m)); // credit with positive balance (overpaid)
        _db.Accounts.Add(MakeSavings(_userId));
        await _db.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync(_userId);

        result.Debts.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOverviewAsync_SortsDebtsByDescendingSeverity()
    {
        _db.Accounts.AddRange(
            MakeCredit(_userId, "Low Rate Card", balance: -500m, interestRate: 5m),
            MakeCredit(_userId, "High Rate Card", balance: -500m, interestRate: 35m));
        await _db.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync(_userId);

        result.Debts[0].Name.Should().Be("High Rate Card");
        result.Debts[1].Name.Should().Be("Low Rate Card");
    }

    [Fact]
    public async Task GetOverviewAsync_SumsTotalMinimumPayments()
    {
        _db.Accounts.AddRange(
            MakeCredit(_userId, balance: -1000m, minimumMonthlyPayment: 25m),
            MakeLoan(_userId, balance: -5000m, minimumMonthlyPayment: 200m));
        await _db.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync(_userId);

        result.TotalMinimumPayments.Should().Be(225m);
    }

    [Fact]
    public async Task GetOverviewAsync_ComputesMonthlyInterestCost()
    {
        _db.Accounts.Add(MakeCredit(_userId, balance: -1200m, interestRate: 24m));
        await _db.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync(_userId);

        // 1200 * 24% / 12 = £24/month
        result.Debts[0].MonthlyInterestCost.Should().BeApproximately(24m, 0.01m);
    }

    [Fact]
    public async Task GetOverviewAsync_ComputesPayoffDateAtCurrentPayment()
    {
        _db.Accounts.Add(MakeCredit(_userId, balance: -600m, interestRate: 0m, currentMonthlyPayment: 200m));
        await _db.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync(_userId);

        // 600 / 200 = 3 months (no interest)
        result.Debts[0].MonthsToPayoffAtCurrentPayment.Should().Be(3);
        result.Debts[0].PayoffDateAtCurrentPayment.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task GetOverviewAsync_ExplicitZeroCurrentPayment_FallsBackToMinimumForPayoffEstimate()
    {
        // CurrentMonthlyPayment = 0 (not null) means "not actually paying anything right
        // now" was never intended by the user — it should still fall back to the lender's
        // minimum rather than being treated as an authoritative "£0/month" payment.
        _db.Accounts.Add(MakeCredit(
            _userId, balance: -600m, interestRate: 0m,
            minimumMonthlyPayment: 200m, currentMonthlyPayment: 0m));
        await _db.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync(_userId);

        // 600 / 200 = 3 months (no interest), using the minimum since current is 0
        result.Debts[0].MonthsToPayoffAtCurrentPayment.Should().Be(3);
    }

    [Fact]
    public async Task GetOverviewAsync_ExplicitZeroCurrentPayment_FallsBackToMinimumInTotalCurrentPayments()
    {
        _db.Accounts.Add(MakeCredit(
            _userId, balance: -1000m, minimumMonthlyPayment: 103.56m, currentMonthlyPayment: 0m));
        await _db.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync(_userId);

        result.TotalCurrentPayments.Should().Be(103.56m);
    }

    [Fact]
    public async Task GetOverviewAsync_NoAccountPaymentFields_FallsBackToLinkedBillForEffectivePayment()
    {
        // A loan/mortgage tracked via a linked Bill rather than the Account's own
        // payment fields must still be picked up — both for the payoff estimate and
        // for TotalCurrentPayments, so callers (e.g. Affordability) can rely on
        // EffectiveMonthlyPayment as the single source of truth.
        var loan = MakeLoan(_userId, "Car Loan", balance: -5000m, interestRate: 0m);
        _db.Accounts.Add(loan);
        _db.Bills.Add(new Bill
        {
            Id = Guid.NewGuid(), UserId = _userId, Name = "Car Loan DD",
            Amount = 250m, Frequency = BillFrequency.Monthly, DueDay = 1,
            IsActive = true, AccountId = loan.Id,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync(_userId);

        result.Debts[0].EffectiveMonthlyPayment.Should().Be(250m);
        result.Debts[0].MonthsToPayoffAtCurrentPayment.Should().Be(20); // 5000 / 250
        result.TotalCurrentPayments.Should().Be(250m);
    }

    [Fact]
    public async Task GetOverviewAsync_AccountCurrentPaymentTakesPriorityOverLinkedBill()
    {
        // When both a linked Bill and an explicit CurrentMonthlyPayment exist for the
        // same debt, the account field wins — the bill amount must not also be added.
        var card = MakeCredit(_userId, "Card", balance: -2000m, interestRate: 0m, currentMonthlyPayment: 100m);
        _db.Accounts.Add(card);
        _db.Bills.Add(new Bill
        {
            Id = Guid.NewGuid(), UserId = _userId, Name = "Card DD",
            Amount = 90m, Frequency = BillFrequency.Monthly, DueDay = 1,
            IsActive = true, AccountId = card.Id,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync(_userId);

        result.Debts[0].EffectiveMonthlyPayment.Should().Be(100m);
        result.TotalCurrentPayments.Should().Be(100m);
    }

    [Fact]
    public async Task GetOverviewAsync_ComputesInterestOnlyOnStandardBalanceWhenPromotionalBalanceExists()
    {
        // £1,500 BT at 0%, £300 spend at 24.9% — interest should be on £300 only
        _db.Accounts.Add(new Account
        {
            Id = Guid.NewGuid(), UserId = _userId, Type = AccountType.Credit,
            Name = "Virgin Card", Currency = "GBP", Balance = -1800m,
            InterestRate = 24.9m,
            PromotionalBalance = 1500m, PromotionalRate = 0m,
            IsActive = true,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync(_userId);

        // 300 * 24.9% / 12 = £6.23 (not 1800 * 24.9% / 12 = £37.35)
        result.Debts[0].MonthlyInterestCost.Should().BeApproximately(6.23m, 0.01m);
    }

    [Fact]
    public async Task GetOverviewAsync_DetectsMonthlyPaymentFromRecentTransactions()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var card = MakeCredit(_userId, balance: -1200m, interestRate: 24m);
        _db.Accounts.Add(card);

        // Add £100 credit transactions in each of the 3 most recently completed months
        var startOfCurrentMonth = new DateOnly(today.Year, today.Month, 1);
        for (int i = 1; i <= 3; i++)
        {
            _db.Transactions.Add(new Transaction
            {
                Id = Guid.NewGuid(), UserId = _userId, AccountId = card.Id,
                Type = TransactionType.Credit, Amount = 100m,
                TransactionDate = startOfCurrentMonth.AddMonths(-i),
                Currency = "GBP", Description = "Payment",
            });
        }
        await _db.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync(_userId);

        result.Debts[0].DetectedMonthlyPayment.Should().BeApproximately(100m, 0.01m);
    }

    [Fact]
    public async Task GetOverviewAsync_ReturnsNullPayoffDate_WhenPaymentCoversInterestOnly()
    {
        // £10/mo on £1200 at 10% APR = £10 monthly interest — payment never reduces balance
        _db.Accounts.Add(MakeCredit(_userId, balance: -1200m, interestRate: 10m, currentMonthlyPayment: 10m));
        await _db.SaveChangesAsync();

        var result = await _sut.GetOverviewAsync(_userId);

        result.Debts[0].MonthsToPayoffAtCurrentPayment.Should().BeNull();
        result.Debts[0].PayoffDateAtCurrentPayment.Should().BeNull();
    }

    // â"€â"€ ProjectAsync â€" no debt â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

    [Fact]
    public async Task ProjectAsync_WithNoDebts_ReturnsZeroMonths()
    {
        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Avalanche, null, null));

        result.MonthsToFreedom.Should().Be(0);
        result.Schedule.Should().BeEmpty();
    }

    // â"€â"€ ProjectAsync â€" Avalanche â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

    [Fact]
    public async Task ProjectAsync_Avalanche_PaysHighestRateFirst()
    {
        var highRate = MakeCredit(_userId, "High Rate", balance: -1000m,
            interestRate: 30m, currentMonthlyPayment: 200m);
        var lowRate = MakeCredit(_userId, "Low Rate", balance: -1000m,
            interestRate: 10m, currentMonthlyPayment: 200m);
        _db.Accounts.AddRange(highRate, lowRate);
        await _db.SaveChangesAsync();

        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Avalanche, ExtraMonthlyPayment: 100m, null));

        // High-rate card should be paid off first
        result.PayoffOrder.Should().NotBeEmpty();
        result.PayoffOrder[0].Name.Should().Be("High Rate");
    }

    // â"€â"€ ProjectAsync â€" Snowball â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

    [Fact]
    public async Task ProjectAsync_Snowball_PaysSmallestBalanceFirst()
    {
        var small = MakeCredit(_userId, "Small Debt", balance: -300m,
            interestRate: 5m, currentMonthlyPayment: 100m);
        var large = MakeCredit(_userId, "Large Debt", balance: -3000m,
            interestRate: 5m, currentMonthlyPayment: 100m);
        _db.Accounts.AddRange(small, large);
        await _db.SaveChangesAsync();

        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Snowball, ExtraMonthlyPayment: 50m, null));

        result.PayoffOrder[0].Name.Should().Be("Small Debt");
    }

    // â"€â"€ ProjectAsync â€" Custom â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

    [Fact]
    public async Task ProjectAsync_Custom_UsesSpecifiedAllocations()
    {
        var card = MakeCredit(_userId, "Card", balance: -500m, interestRate: 20m);
        _db.Accounts.Add(card);
        await _db.SaveChangesAsync();

        var allocations = new List<CustomAllocation>
        {
            new(card.Id, MonthlyPayment: 300m)
        };

        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Custom, null, allocations));

        result.MonthsToFreedom.Should().BeGreaterThan(0).And.BeLessThan(6); // 500 / 300 â‰ˆ 2 months
    }

    // â"€â"€ ProjectAsync â€" interest accrual â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

    [Fact]
    public async Task ProjectAsync_AccruesTotalInterest()
    {
        var card = MakeCredit(_userId, "Card", balance: -1200m,
            interestRate: 24m, currentMonthlyPayment: 100m);
        _db.Accounts.Add(card);
        await _db.SaveChangesAsync();

        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Avalanche, null, null));

        result.TotalInterestPaid.Should().BeGreaterThan(0m);
        result.MonthsToFreedom.Should().BeGreaterThan(12); // 2% monthly vs 2% minimum = very slow
    }

    // â"€â"€ ProjectAsync â€" schedule â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

    [Fact]
    public async Task ProjectAsync_ScheduleContainsDecreasingBalances()
    {
        var card = MakeCredit(_userId, "Card", balance: -600m,
            interestRate: 0m, currentMonthlyPayment: 200m);
        _db.Accounts.Add(card);
        await _db.SaveChangesAsync();

        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Avalanche, null, null));

        result.Schedule.Should().HaveCountGreaterThan(0);
        // Each month total should be â‰¤ previous
        for (int i = 1; i < result.Schedule.Count; i++)
        {
            result.Schedule[i].TotalRemaining
                .Should().BeLessThanOrEqualTo(result.Schedule[i - 1].TotalRemaining);
        }
        result.Schedule.Last().TotalRemaining.Should().Be(0m);
    }

    [Fact]
    public async Task ProjectAsync_FreedMinimumsAreCascadedToNextDebt()
    {
        // With no extra payment: card A clears in month 5 (500/100).
        // That freed minimum (100) should cascade to card B.
        var cardA = MakeCredit(_userId, "A - Small", balance: -500m,
            interestRate: 0m, currentMonthlyPayment: 100m);
        var cardB = MakeCredit(_userId, "B - Large", balance: -2000m,
            interestRate: 0m, currentMonthlyPayment: 100m);
        _db.Accounts.AddRange(cardA, cardB);
        await _db.SaveChangesAsync();

        // Snowball: A cleared first
        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Snowball, null, null));

        // With cascading: after A clears, B gets 200/mo instead of 100
        // Without cascading: B clears in 20 months; with cascading, faster
        result.MonthsToFreedom.Should().BeLessThan(25);
        result.PayoffOrder[0].Name.Should().Be("A - Small");
    }

    [Fact]
    public async Task ProjectAsync_Snowball_FreedMinimumPersistsAsExtraInAllFutureMonths()
    {
        // A (£200 @ £100/mo min) clears in month 2. Its freed £100/mo minimum should
        // permanently join the £50 extra pool for every month afterwards — not just the
        // payoff month — so B keeps receiving £150 extra indefinitely, not £50.
        var cardA = MakeCredit(_userId, "A - Small", balance: -200m,
            interestRate: 0m, currentMonthlyPayment: 100m);
        var cardB = MakeCredit(_userId, "B - Large", balance: -10000m,
            interestRate: 0m, currentMonthlyPayment: 100m);
        _db.Accounts.AddRange(cardA, cardB);
        await _db.SaveChangesAsync();

        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Snowball, 50m, null));

        result.PayoffOrder[0].Name.Should().Be("A - Small");
        result.PayoffOrder[0].MonthPaidOff.Should().Be(2);

        // Check several months after the payoff, not just the one right after it —
        // this is what distinguishes "permanent momentum" from a one-off bump.
        foreach (var monthIndex in new[] { 2, 4, 9 })
        {
            var bPayment = result.Schedule[monthIndex].Payments.Single(p => p.Name == "B - Large");
            bPayment.MinimumPaid.Should().Be(100m);
            bPayment.ExtraPaid.Should().Be(150m);
            bPayment.TotalPaid.Should().Be(250m);
        }
    }

    [Fact]
    public async Task ProjectAsync_Snowball_SameMonthDominoPaysOffTwoDebtsAndCreditsBoth()
    {
        // A (£100) and B (£100) are both small enough that a single £300 extra payment
        // clears both in the same month — the cascade must chain through more than one
        // hop, and both freed minimums must join the pool for C from the next month on.
        var cardA = MakeCredit(_userId, "A - Tiny", balance: -100m,
            interestRate: 0m, currentMonthlyPayment: 50m);
        var cardB = MakeCredit(_userId, "B - Small", balance: -100m,
            interestRate: 0m, currentMonthlyPayment: 50m);
        var cardC = MakeCredit(_userId, "C - Large", balance: -10000m,
            interestRate: 0m, currentMonthlyPayment: 100m);
        _db.Accounts.AddRange(cardA, cardB, cardC);
        await _db.SaveChangesAsync();

        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Snowball, 300m, null));

        // Both A and B are wiped out in month 1: each has £50 minimum + £50 balance
        // remaining after their own minimum, and the £300 extra pool covers both in
        // the same month.
        var monthOne = result.Schedule[0];
        monthOne.PaidOffThisMonth.Should().BeEquivalentTo(["A - Tiny", "B - Small"]);

        // From month 2 onward, C should receive its own £100 minimum plus the full
        // £400 extra (£300 original + £50 freed from A + £50 freed from B).
        var cPayment = result.Schedule[1].Payments.Single(p => p.Name == "C - Large");
        cPayment.MinimumPaid.Should().Be(100m);
        cPayment.ExtraPaid.Should().Be(400m);
    }

    // ── ProjectAsync — monthly payment tracking ─────────────────────────────

    [Fact]
    public async Task ProjectAsync_SingleDebtNoExtra_PaymentEqualsMinimumWithNoExtra()
    {
        var card = MakeCredit(_userId, "Card", balance: -600m,
            interestRate: 0m, currentMonthlyPayment: 200m);
        _db.Accounts.Add(card);
        await _db.SaveChangesAsync();

        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Avalanche, null, null));

        var firstMonth = result.Schedule[0];
        firstMonth.Payments.Should().ContainSingle();
        firstMonth.Payments[0].MinimumPaid.Should().Be(200m);
        firstMonth.Payments[0].ExtraPaid.Should().Be(0m);
        firstMonth.Payments[0].TotalPaid.Should().Be(200m);
        firstMonth.TotalPaidThisMonth.Should().Be(200m);
    }

    [Fact]
    public async Task ProjectAsync_ExplicitZeroCurrentPayment_UsesMinimumNotZero()
    {
        // CurrentMonthlyPayment = 0 (not null) must not be simulated as "paying nothing" —
        // it should fall back to the account's real minimum, same as GetOverviewAsync.
        var card = MakeCredit(_userId, "Card", balance: -600m,
            interestRate: 0m, minimumMonthlyPayment: 200m, currentMonthlyPayment: 0m);
        _db.Accounts.Add(card);
        await _db.SaveChangesAsync();

        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Avalanche, null, null));

        var firstMonth = result.Schedule[0];
        firstMonth.Payments[0].MinimumPaid.Should().Be(200m);
        firstMonth.Payments[0].TotalPaid.Should().Be(200m);
    }

    [Fact]
    public async Task ProjectAsync_FreedMinimum_ShowsUpAsExtraPaidOnPriorityDebtThatMonth()
    {
        // A (£500 @ £100/mo) clears in month 5; its freed £100 minimum cascades
        // to B (£2000 @ £100/mo) as an extra payment in that same month.
        var cardA = MakeCredit(_userId, "A - Small", balance: -500m,
            interestRate: 0m, currentMonthlyPayment: 100m);
        var cardB = MakeCredit(_userId, "B - Large", balance: -2000m,
            interestRate: 0m, currentMonthlyPayment: 100m);
        _db.Accounts.AddRange(cardA, cardB);
        await _db.SaveChangesAsync();

        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Snowball, null, null));

        var payoffMonth = result.Schedule[4]; // month 5
        var paymentA = payoffMonth.Payments.Single(p => p.Name == "A - Small");
        var paymentB = payoffMonth.Payments.Single(p => p.Name == "B - Large");

        paymentA.TotalPaid.Should().Be(100m); // clears exactly, no leftover to cascade to itself
        paymentB.MinimumPaid.Should().Be(100m);
        paymentB.ExtraPaid.Should().Be(100m); // A's freed minimum
        paymentB.TotalPaid.Should().Be(200m);
        payoffMonth.TotalPaidThisMonth.Should().Be(300m);
        payoffMonth.PaidOffThisMonth.Should().ContainSingle().Which.Should().Be("A - Small");
    }

    [Fact]
    public async Task ProjectAsync_PaidOffThisMonth_IsEmptyExceptInThePayoffMonth()
    {
        var card = MakeCredit(_userId, "Card", balance: -300m,
            interestRate: 0m, currentMonthlyPayment: 100m);
        _db.Accounts.Add(card);
        await _db.SaveChangesAsync();

        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Avalanche, null, null));

        result.Schedule.Should().HaveCount(3);
        result.Schedule[0].PaidOffThisMonth.Should().BeEmpty();
        result.Schedule[1].PaidOffThisMonth.Should().BeEmpty();
        result.Schedule[2].PaidOffThisMonth.Should().ContainSingle().Which.Should().Be("Card");
    }

    [Fact]
    public async Task ProjectAsync_ExcludedAccount_OnlyReceivesMinimumPayment()
    {
        // Mortgage has lower rate than card, but in Avalanche the card should still be paid first.
        // Exclusion ensures the mortgage never receives any extra payment regardless of strategy.
        var mortgage = new Account
        {
            Id = Guid.NewGuid(), UserId = _userId, Type = AccountType.Mortgage,
            Name = "Mortgage", Currency = "GBP", Balance = -50000m,
            InterestRate = 30m, CurrentMonthlyPayment = 800m, IsActive = true,
        };
        var card = MakeCredit(_userId, "Card", balance: -1000m,
            interestRate: 20m, currentMonthlyPayment: 50m);
        _db.Accounts.AddRange(mortgage, card);
        await _db.SaveChangesAsync();

        // Avalanche with mortgage excluded: extra should target the card despite mortgage having higher rate
        var result = await _sut.ProjectAsync(_userId, new ProjectionRequest(
            DebtStrategy.Avalanche,
            ExtraMonthlyPayment: 200m,
            CustomAllocations: null,
            ExcludedAccountIds: [mortgage.Id]));

        result.PayoffOrder.Should().NotBeEmpty();
        result.PayoffOrder[0].Name.Should().Be("Card");
    }

    // â"€â"€ Helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

    private Account MakeCredit(
        Guid userId,
        string name = "Credit Card",
        decimal balance = -1000m,
        decimal interestRate = 0m,
        decimal? minimumMonthlyPayment = null,
        decimal? currentMonthlyPayment = null)
    {
        return new Account
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = AccountType.Credit,
            Name = name,
            Currency = "GBP",
            Balance = balance,
            InterestRate = interestRate,
            MinimumMonthlyPayment = minimumMonthlyPayment,
            CurrentMonthlyPayment = currentMonthlyPayment,
            IsActive = true,
        };
    }

    private Account MakeLoan(
        Guid userId,
        string name = "Personal Loan",
        decimal balance = -5000m,
        decimal interestRate = 0m,
        decimal? minimumMonthlyPayment = null)
    {
        return new Account
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = AccountType.Loan,
            Name = name,
            Currency = "GBP",
            Balance = balance,
            InterestRate = interestRate,
            MinimumMonthlyPayment = minimumMonthlyPayment,
            IsActive = true,
        };
    }

    private Account MakeSavings(Guid userId, string name = "Savings")
    {
        return new Account
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = AccountType.Savings,
            Name = name,
            Currency = "GBP",
            Balance = 5000m,
            IsActive = true,
        };
    }
}
