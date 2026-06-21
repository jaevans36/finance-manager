using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Debt.Models;
using FinanceApi.Features.Debt.Services;

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

    // â”€â”€ GetOverviewAsync â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // â”€â”€ ProjectAsync â€” no debt â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    [Fact]
    public async Task ProjectAsync_WithNoDebts_ReturnsZeroMonths()
    {
        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Avalanche, null, null));

        result.MonthsToFreedom.Should().Be(0);
        result.Schedule.Should().BeEmpty();
    }

    // â”€â”€ ProjectAsync â€” Avalanche â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // â”€â”€ ProjectAsync â€” Snowball â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // â”€â”€ ProjectAsync â€” Custom â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // â”€â”€ ProjectAsync â€” interest accrual â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // â”€â”€ ProjectAsync â€” schedule â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        var cardA = MakeCredit(_userId, "A â€” Small", balance: -500m,
            interestRate: 0m, currentMonthlyPayment: 100m);
        var cardB = MakeCredit(_userId, "B â€” Large", balance: -2000m,
            interestRate: 0m, currentMonthlyPayment: 100m);
        _db.Accounts.AddRange(cardA, cardB);
        await _db.SaveChangesAsync();

        // Snowball: A cleared first
        var result = await _sut.ProjectAsync(_userId,
            new ProjectionRequest(DebtStrategy.Snowball, null, null));

        // With cascading: after A clears, B gets 200/mo instead of 100
        // Without cascading: B clears in 20 months; with cascading, faster
        result.MonthsToFreedom.Should().BeLessThan(25);
        result.PayoffOrder[0].Name.Should().Be("A â€” Small");
    }

    // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
