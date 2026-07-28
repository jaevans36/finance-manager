using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Affordability.Services;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.Settings.Models;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.UnitTests.Features.Affordability.Services;

public class AffordabilityServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly AffordabilityService _sut;
    private readonly Guid _userId = Guid.NewGuid();

    public AffordabilityServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options);
        _db.Database.EnsureCreated();
        _sut = new AffordabilityService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ── Income detection ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetAffordabilityAsync_WithNoTransactions_ReturnsZeroIncomeLowConfidence()
    {
        var result = await _sut.GetAffordabilityAsync(_userId);

        result.MonthlyIncome.Should().Be(0m);
        result.IncomeConfidence.Should().Be("Low");
        result.IncomeSource.Should().Be("Detected");
    }

    [Fact]
    public async Task GetAffordabilityAsync_WithSalaryTransactions_InThreeMonths_ReturnsHighConfidence()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var account = MakeAccount();
        _db.Accounts.Add(account);
        _db.Transactions.AddRange(
            MakeCredit(account.Id, 3000m, today.AddMonths(-2), "SALARY ACME LTD"),
            MakeCredit(account.Id, 3000m, today.AddMonths(-1), "SALARY ACME LTD"),
            MakeCredit(account.Id, 3000m, today, "SALARY ACME LTD")
        );
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.MonthlyIncome.Should().Be(3000m);
        result.IncomeConfidence.Should().Be("High");
        result.IncomeSource.Should().Be("Detected");
    }

    [Fact]
    public async Task GetAffordabilityAsync_WithSalaryInTwoMonths_ReturnsMediumConfidence()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var account = MakeAccount();
        _db.Accounts.Add(account);
        _db.Transactions.AddRange(
            MakeCredit(account.Id, 2500m, today.AddMonths(-1), "BACS SALARY"),
            MakeCredit(account.Id, 2500m, today, "BACS SALARY")
        );
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.MonthlyIncome.Should().Be(2500m);
        result.IncomeConfidence.Should().Be("Medium");
    }

    [Fact]
    public async Task GetAffordabilityAsync_WhenIncomeUndetectable_UsesManualIncome()
    {
        _db.UserFinanceSettings.Add(new UserFinanceSettings
        {
            UserId = _userId,
            ManualMonthlyIncome = 2800m,
            EmergencyBuffer = 200m,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.MonthlyIncome.Should().Be(2800m);
        result.IncomeSource.Should().Be("Manual");
        result.IncomeConfidence.Should().Be("Low");
    }

    [Fact]
    public async Task GetAffordabilityAsync_WithLargeCredits_DetectsThemAsIncome()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var account = MakeAccount();
        _db.Accounts.Add(account);
        // Many small credits (£5–£15) keep the median low; large salary credits exceed the 5× threshold
        for (var i = 0; i < 10; i++)
            _db.Transactions.Add(MakeCredit(account.Id, 5m + i, today.AddDays(-80 + i), "Refund"));
        _db.Transactions.AddRange(
            MakeCredit(account.Id, 3000m, today.AddMonths(-2), "Monthly deposit"),
            MakeCredit(account.Id, 3000m, today.AddMonths(-1), "Monthly deposit"),
            MakeCredit(account.Id, 3000m, today, "Monthly deposit")
        );
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.MonthlyIncome.Should().BeGreaterThan(2000m);
        result.IncomeConfidence.Should().Be("High");
    }

    // ── Committed costs ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetAffordabilityAsync_WithMonthlyBills_CalculatesCommittedCosts()
    {
        _db.Bills.AddRange(
            MakeBill(100m, BillFrequency.Monthly),
            MakeBill(50m, BillFrequency.Monthly)
        );
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.CommittedCosts.Should().Be(150m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_WithAnnualBill_AnnualisesToMonthly()
    {
        _db.Bills.Add(MakeBill(1200m, BillFrequency.Annual));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.CommittedCosts.Should().Be(100m); // 1200 / 12
    }

    [Fact]
    public async Task GetAffordabilityAsync_WithWeeklyBill_AnnualisesToMonthly()
    {
        _db.Bills.Add(MakeBill(100m, BillFrequency.Weekly));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        // 100 × 52 / 12 ≈ 433.33
        result.CommittedCosts.Should().BeApproximately(433.33m, 0.01m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_DoesNotIncludeInactiveBillsInCommittedCosts()
    {
        _db.Bills.Add(MakeBill(500m, BillFrequency.Monthly, isActive: false));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.CommittedCosts.Should().Be(0m);
    }

    // ── Discretionary spend ──────────────────────────────────────────────────

    [Fact]
    public async Task GetAffordabilityAsync_WithBudgets_UsesBudgetForDiscretionary()
    {
        var today = DateTime.UtcNow;
        _db.Budgets.Add(new Budget
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            CategoryId = Guid.Parse("10000000-0000-0000-0000-000000000001"),
            Month = today.Month,
            Year = today.Year,
            Amount = 500m,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.DiscretionarySpend.Should().Be(500m);
    }

    // ── Safe surplus ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAffordabilityAsync_UsesDefaultEmergencyBufferOf200()
    {
        var result = await _sut.GetAffordabilityAsync(_userId);

        result.EmergencyBuffer.Should().Be(200m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_UsesCustomEmergencyBuffer()
    {
        _db.UserFinanceSettings.Add(new UserFinanceSettings { UserId = _userId, EmergencyBuffer = 350m });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.EmergencyBuffer.Should().Be(350m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_SafeSurplusIsNeverNegative()
    {
        // Bills far exceed any income → surplus should floor at 0
        _db.Bills.Add(MakeBill(10000m, BillFrequency.Monthly));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.SafeSurplus.Should().Be(0m);
        result.SuggestedDebtPayment.Should().Be(0m);
    }

    // ── UpdateManualIncomeAsync ───────────────────────────────────────────────

    [Fact]
    public async Task UpdateManualIncomeAsync_CreatesSettingsIfNotExist()
    {
        await _sut.UpdateManualIncomeAsync(_userId, 3500m);

        var settings = await _db.UserFinanceSettings.FindAsync(_userId);
        settings.Should().NotBeNull();
        settings!.ManualMonthlyIncome.Should().Be(3500m);
    }

    [Fact]
    public async Task UpdateManualIncomeAsync_UpdatesExistingSettings()
    {
        _db.UserFinanceSettings.Add(new UserFinanceSettings { UserId = _userId, ManualMonthlyIncome = 1000m });
        await _db.SaveChangesAsync();

        await _sut.UpdateManualIncomeAsync(_userId, 4000m);

        var settings = await _db.UserFinanceSettings.FindAsync(_userId);
        settings!.ManualMonthlyIncome.Should().Be(4000m);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Account MakeAccount() => new()
    {
        Id = Guid.NewGuid(),
        UserId = _userId,
        Name = "Test Account",
        Type = AccountType.Checking,
        Currency = "GBP",
        Balance = 0m,
    };

    private Transaction MakeCredit(Guid accountId, decimal amount, DateOnly date, string description = "Credit") => new()
    {
        Id = Guid.NewGuid(),
        UserId = _userId,
        AccountId = accountId,
        Type = TransactionType.Credit,
        Amount = amount,
        BaseCurrencyAmount = amount,
        Currency = "GBP",
        Description = description,
        TransactionDate = date,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };

    private Bill MakeBill(decimal amount, BillFrequency frequency, bool isActive = true) => new()
    {
        Id = Guid.NewGuid(),
        UserId = _userId,
        Name = "Test Bill",
        Amount = amount,
        Frequency = frequency,
        DueDay = 1,
        ReminderDaysBefore = 3,
        IsActive = isActive,
    };
}
