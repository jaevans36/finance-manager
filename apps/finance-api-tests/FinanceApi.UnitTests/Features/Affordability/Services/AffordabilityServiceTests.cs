using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Affordability.Services;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.IncomeStreams.Models;
using FinanceApi.Features.SavingsGoals.Models;
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
        _db.UserFinanceSettings.Add(new UserFinanceSettings { UserId = _userId, EmergencyBuffer = 200m });
        _db.IncomeStreams.Add(new IncomeStream { UserId = _userId, Name = "My income", MonthlyAmount = 2800m });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.MonthlyIncome.Should().Be(2800m);
        result.IncomeSource.Should().Be("Manual");
        result.IncomeConfidence.Should().Be("Low");
    }

    [Fact]
    public async Task GetAffordabilityAsync_WhenIncomeUndetectable_SumsMultipleIncomeStreams()
    {
        _db.IncomeStreams.AddRange(
            new IncomeStream { UserId = _userId, Name = "My salary", MonthlyAmount = 2800m },
            new IncomeStream { UserId = _userId, Name = "Wife's salary", MonthlyAmount = 2200m });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.MonthlyIncome.Should().Be(5000m);
        result.IncomeSource.Should().Be("Manual");
    }

    [Fact]
    public async Task GetAffordabilityAsync_WithManualStreamsAndDetectedCredits_PrefersManual()
    {
        // Manual income streams are user-asserted (often set up specifically to
        // correct an over-eager detection, e.g. a partner's salary landing on a
        // joint account) — they must win even when detection has 3 months of data.
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var account = MakeAccount();
        _db.Accounts.Add(account);
        _db.Transactions.AddRange(
            MakeCredit(account.Id, 4000m, today.AddMonths(-2), "SALARY ACME LTD"),
            MakeCredit(account.Id, 4000m, today.AddMonths(-1), "SALARY ACME LTD"),
            MakeCredit(account.Id, 4000m, today, "SALARY ACME LTD")
        );
        _db.IncomeStreams.AddRange(
            new IncomeStream { UserId = _userId, Name = "Jay income", MonthlyAmount = 2800m },
            new IncomeStream { UserId = _userId, Name = "Jade Income", MonthlyAmount = 2200m });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.MonthlyIncome.Should().Be(5000m);
        result.IncomeSource.Should().Be("Manual");
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

    // ── Existing debt repayments ──────────────────────────────────────────────

    [Fact]
    public async Task GetAffordabilityAsync_WithDebtAccount_IncludesCurrentPaymentAsExistingDebtPayments()
    {
        _db.Accounts.Add(MakeDebtAccount(AccountType.Credit, balance: -1000m, currentMonthlyPayment: 150m));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.ExistingDebtPayments.Should().Be(150m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_WithDebtAccount_FallsBackToMinimumWhenCurrentPaymentUnset()
    {
        _db.Accounts.Add(MakeDebtAccount(AccountType.Loan, balance: -5000m, minimumMonthlyPayment: 200m));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.ExistingDebtPayments.Should().Be(200m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_SumsExistingDebtPaymentsAcrossAllDebtAccounts()
    {
        _db.Accounts.AddRange(
            MakeDebtAccount(AccountType.Credit, balance: -1000m, currentMonthlyPayment: 150m),
            MakeDebtAccount(AccountType.Mortgage, balance: -200000m, currentMonthlyPayment: 900m));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.ExistingDebtPayments.Should().Be(1050m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_ExistingDebtPayments_ReducesSafeSurplus()
    {
        var account = MakeAccount();
        _db.Accounts.Add(account);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        _db.Transactions.AddRange(
            MakeCredit(account.Id, 3000m, today.AddMonths(-2), "SALARY ACME LTD"),
            MakeCredit(account.Id, 3000m, today.AddMonths(-1), "SALARY ACME LTD"),
            MakeCredit(account.Id, 3000m, today, "SALARY ACME LTD"));
        _db.Accounts.Add(MakeDebtAccount(AccountType.Loan, balance: -5000m, currentMonthlyPayment: 300m));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.ExistingDebtPayments.Should().Be(300m);
        // 3000 income - 300 debt - 200 default buffer, no bills/discretionary/savings
        result.SafeSurplus.Should().Be(2500m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_FallbackDiscretionarySpend_ExcludesExistingDebtPaymentsFromDoubleCounting()
    {
        // A £600/mo loan repayment shows up as an ordinary, unmatched debit
        // transaction (no Bill link) — it must not also inflate the discretionary
        // spend fallback on top of being counted as ExistingDebtPayments.
        var account = MakeAccount();
        _db.Accounts.Add(account);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        _db.Transactions.AddRange(
            MakeDebit(account.Id, 600m, today.AddMonths(-1), "LOAN CO DD"),
            MakeDebit(account.Id, 600m, today, "LOAN CO DD"));
        _db.Accounts.Add(MakeDebtAccount(AccountType.Loan, balance: -5000m, currentMonthlyPayment: 600m));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        // Raw average = (600+600)/3 = 400; existing debt payments (600) already
        // exceed that, so the fallback discretionary spend floors at 0 rather than
        // going negative.
        result.DiscretionarySpend.Should().Be(0m);
        result.ExistingDebtPayments.Should().Be(600m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_DebtTrackedOnlyViaLinkedBill_CountsAsExistingDebtPaymentNotCommittedCost()
    {
        // A mortgage/loan with no Account-level payment fields, tracked only via a
        // Bill linked to the account (Bill.AccountId) — must still land in
        // ExistingDebtPayments, and must NOT also appear in CommittedCosts.
        var mortgage = MakeDebtAccount(AccountType.Mortgage, balance: -200000m);
        _db.Accounts.Add(mortgage);
        _db.Bills.Add(MakeBill(1000m, BillFrequency.Monthly, accountId: mortgage.Id));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.ExistingDebtPayments.Should().Be(1000m);
        result.CommittedCosts.Should().Be(0m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_DebtWithBothCurrentPaymentAndLinkedBill_UsesCurrentPaymentOnlyNoDoubleCount()
    {
        // Some debts are tracked both ways at once (an Account payment field AND a
        // linked Bill for the same repayment) — the account field must win, and the
        // bill amount must not also inflate CommittedCosts.
        var card = MakeDebtAccount(AccountType.Credit, balance: -1000m, currentMonthlyPayment: 250m);
        _db.Accounts.Add(card);
        _db.Bills.Add(MakeBill(240m, BillFrequency.Monthly, accountId: card.Id));
        _db.Bills.Add(MakeBill(50m, BillFrequency.Monthly)); // unrelated bill, still committed
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.ExistingDebtPayments.Should().Be(250m);
        result.CommittedCosts.Should().Be(50m);
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

    [Fact]
    public async Task GetAffordabilityAsync_DiscretionarySpend_IsNotReducedByUnrelatedCommittedCosts()
    {
        // A small Food budget has nothing to do with a much larger bills total —
        // DiscretionarySpend must equal the actual budget amount (matching the
        // itemized category shown elsewhere), not get floored to 0 just because
        // committed costs happen to be bigger.
        var today = DateTime.UtcNow;
        _db.Bills.Add(MakeBill(4000m, BillFrequency.Monthly));
        _db.Budgets.Add(new Budget
        {
            Id = Guid.NewGuid(), UserId = _userId,
            CategoryId = Guid.Parse("10000000-0000-0000-0000-000000000001"),
            Month = today.Month, Year = today.Year, Amount = 400m,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.CommittedCosts.Should().Be(4000m);
        result.DiscretionarySpend.Should().Be(400m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_WithNonSinkingFundPot_IncludesInDiscretionarySpend()
    {
        // Regular pots (Groceries, Fuel, etc.) are a second way users budget for
        // day-to-day categories — they must count the same as Budgets, not just
        // Sinking Funds, otherwise pot-only users get an overstated surplus.
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Groceries", Type = PotType.Groceries, BudgetAmount = 300m,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.DiscretionarySpend.Should().Be(300m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_WithBudgetsAndPots_SumsBothForDiscretionary()
    {
        var today = DateTime.UtcNow;
        _db.Budgets.Add(new Budget
        {
            Id = Guid.NewGuid(), UserId = _userId,
            CategoryId = Guid.Parse("10000000-0000-0000-0000-000000000001"),
            Month = today.Month, Year = today.Year, Amount = 500m,
        });
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Fuel", Type = PotType.Fuel, BudgetAmount = 200m,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.DiscretionarySpend.Should().Be(700m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_SinkingFundPot_NotDoubleCountedInDiscretionarySpend()
    {
        // A sinking fund only belongs in PlannedSavings (see the existing sinking-fund
        // tests below) — it must not also inflate DiscretionarySpend.
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Car insurance", Type = PotType.SinkingFund,
            AnnualAmount = 600m, BudgetAmount = 50m, AccumulatedAmount = 100m,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.DiscretionarySpend.Should().Be(0m);
        result.PlannedSavings.Should().Be(50m);
    }

    // ── Planned savings & upcoming costs ──────────────────────────────────────

    [Fact]
    public async Task GetAffordabilityAsync_WithActiveSavingsGoal_DeductsMonthlyContributionFromSurplus()
    {
        _db.SavingsGoals.Add(new SavingsGoal
        {
            UserId = _userId, Name = "Washing machine", TargetAmount = 400m,
            MonthlyContribution = 50m, Status = SavingsGoalStatus.Active,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.PlannedSavings.Should().Be(50m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_ExcludesAchievedSavingsGoalsFromPlannedSavings()
    {
        _db.SavingsGoals.Add(new SavingsGoal
        {
            UserId = _userId, Name = "Holiday", TargetAmount = 1000m, CurrentAmount = 1000m,
            MonthlyContribution = 100m, Status = SavingsGoalStatus.Achieved,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.PlannedSavings.Should().Be(0m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_WithActiveSinkingFund_DeductsMonthlyAllocationFromSurplus()
    {
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Car insurance", Type = PotType.SinkingFund,
            AnnualAmount = 600m, BudgetAmount = 50m, AccumulatedAmount = 100m,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.PlannedSavings.Should().Be(50m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_ExcludesReadySinkingFundsFromPlannedSavings()
    {
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Car insurance", Type = PotType.SinkingFund,
            AnnualAmount = 600m, BudgetAmount = 50m, AccumulatedAmount = 600m,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.PlannedSavings.Should().Be(0m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_SumsSavingsGoalsAndSinkingFundsTogether()
    {
        _db.SavingsGoals.Add(new SavingsGoal
        {
            UserId = _userId, Name = "Washing machine", TargetAmount = 400m,
            MonthlyContribution = 50m, Status = SavingsGoalStatus.Active,
        });
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Car insurance", Type = PotType.SinkingFund,
            AnnualAmount = 600m, BudgetAmount = 50m,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAffordabilityAsync(_userId);

        result.PlannedSavings.Should().Be(100m);
    }

    [Fact]
    public async Task GetAffordabilityAsync_PlannedSavingsReducesSafeSurplus()
    {
        _db.IncomeStreams.Add(new IncomeStream { UserId = _userId, Name = "Salary", MonthlyAmount = 3000m });
        _db.SavingsGoals.Add(new SavingsGoal
        {
            UserId = _userId, Name = "Washing machine", TargetAmount = 400m,
            MonthlyContribution = 50m, Status = SavingsGoalStatus.Active,
        });
        await _db.SaveChangesAsync();

        var withGoal = await _sut.GetAffordabilityAsync(_userId);

        _db.SavingsGoals.RemoveRange(_db.SavingsGoals);
        await _db.SaveChangesAsync();
        var withoutGoal = await _sut.GetAffordabilityAsync(_userId);

        (withoutGoal.SafeSurplus - withGoal.SafeSurplus).Should().Be(50m);
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

    private Transaction MakeDebit(Guid accountId, decimal amount, DateOnly date, string description = "Debit") => new()
    {
        Id = Guid.NewGuid(),
        UserId = _userId,
        AccountId = accountId,
        Type = TransactionType.Debit,
        Amount = amount,
        BaseCurrencyAmount = amount,
        Currency = "GBP",
        Description = description,
        TransactionDate = date,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };

    private Account MakeDebtAccount(
        AccountType type, decimal balance, decimal? currentMonthlyPayment = null, decimal? minimumMonthlyPayment = null) => new()
    {
        Id = Guid.NewGuid(),
        UserId = _userId,
        Name = "Test Debt Account",
        Type = type,
        Currency = "GBP",
        Balance = balance,
        IsActive = true,
        CurrentMonthlyPayment = currentMonthlyPayment,
        MinimumMonthlyPayment = minimumMonthlyPayment,
    };

    private Bill MakeBill(decimal amount, BillFrequency frequency, bool isActive = true, Guid? accountId = null) => new()
    {
        Id = Guid.NewGuid(),
        UserId = _userId,
        Name = "Test Bill",
        Amount = amount,
        Frequency = frequency,
        DueDay = 1,
        ReminderDaysBefore = 3,
        IsActive = isActive,
        AccountId = accountId,
    };
}
