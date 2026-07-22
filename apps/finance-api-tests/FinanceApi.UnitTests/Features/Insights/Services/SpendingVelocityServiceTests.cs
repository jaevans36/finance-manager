using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.Categories.Models;
using FinanceApi.Features.Insights.Services;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.UnitTests.Features.Insights.Services;

public class SpendingVelocityServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly SpendingVelocityService _sut;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly DateOnly _today = DateOnly.FromDateTime(DateTime.UtcNow);

    public SpendingVelocityServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options);
        _db.Database.EnsureCreated();
        _sut = new SpendingVelocityService(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task GetVelocityAsync_WithNoTransactions_ReturnsZeroSpendAndNullBudget()
    {
        var result = await _sut.GetVelocityAsync(_userId);

        result.TotalSpentSoFar.Should().Be(0m);
        result.DailyAverage.Should().Be(0m);
        result.ProjectedMonthEndTotal.Should().Be(0m);
        result.BudgetTotal.Should().BeNull();
        result.ProjectedOverspend.Should().BeNull();
    }

    [Fact]
    public async Task GetVelocityAsync_WithDebitsThisMonth_ComputesTotalAndDailyAverage()
    {
        var account = MakeAccount();
        _db.Accounts.Add(account);
        _db.Transactions.AddRange(
            MakeDebit(account.Id, 50m, _today, null),
            MakeDebit(account.Id, 30m, _today, null));
        await _db.SaveChangesAsync();

        var result = await _sut.GetVelocityAsync(_userId);

        result.TotalSpentSoFar.Should().Be(80m);
        result.DaysElapsed.Should().Be(_today.Day);
        result.DailyAverage.Should().Be(Math.Round(80m / _today.Day, 2));
    }

    [Fact]
    public async Task GetVelocityAsync_IgnoresCreditsAndDuplicates()
    {
        var account = MakeAccount();
        _db.Accounts.Add(account);
        var credit = MakeDebit(account.Id, 100m, _today, null);
        credit.Type = TransactionType.Credit;
        var duplicate = MakeDebit(account.Id, 40m, _today, null);
        duplicate.IsDuplicate = true;
        _db.Transactions.AddRange(credit, duplicate);
        await _db.SaveChangesAsync();

        var result = await _sut.GetVelocityAsync(_userId);

        result.TotalSpentSoFar.Should().Be(0m);
    }

    [Fact]
    public async Task GetVelocityAsync_WithBudgetAndNoSpend_ReturnsZeroOverspendNotNull()
    {
        _db.Budgets.Add(new Budget
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            CategoryId = Guid.NewGuid(),
            Month = _today.Month,
            Year = _today.Year,
            Amount = 1000m,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetVelocityAsync(_userId);

        result.BudgetTotal.Should().Be(1000m);
        result.ProjectedOverspend.Should().Be(0m);
    }

    [Fact]
    public async Task GetVelocityAsync_BudgetTotal_IncludesRolloverFromPrevious()
    {
        _db.Budgets.Add(new Budget
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            CategoryId = Guid.NewGuid(),
            Month = _today.Month,
            Year = _today.Year,
            Amount = 500m,
            RolloverFromPrevious = 50m,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetVelocityAsync(_userId);

        result.BudgetTotal.Should().Be(550m);
    }

    [Fact]
    public async Task GetVelocityAsync_GroupsSpendByCategory()
    {
        var account = MakeAccount();
        var category = new Category { Id = Guid.NewGuid(), Name = "Groceries" };
        _db.Accounts.Add(account);
        _db.Categories.Add(category);
        _db.Transactions.Add(MakeDebit(account.Id, 60m, _today, category.Id));
        await _db.SaveChangesAsync();

        var result = await _sut.GetVelocityAsync(_userId);

        result.Categories.Should().ContainSingle();
        result.Categories[0].CategoryName.Should().Be("Groceries");
        result.Categories[0].SpentSoFar.Should().Be(60m);
    }

    [Fact]
    public async Task GetVelocityAsync_ExcludesTransactionsFromOtherUsers()
    {
        var account = MakeAccount();
        _db.Accounts.Add(account);
        var otherUsersTx = MakeDebit(account.Id, 999m, _today, null);
        otherUsersTx.UserId = Guid.NewGuid();
        _db.Transactions.Add(otherUsersTx);
        await _db.SaveChangesAsync();

        var result = await _sut.GetVelocityAsync(_userId);

        result.TotalSpentSoFar.Should().Be(0m);
    }

    private Account MakeAccount() => new()
    {
        Id = Guid.NewGuid(),
        UserId = _userId,
        Name = "Test Account",
        Type = AccountType.Checking,
        Currency = "GBP",
        Balance = 0m,
    };

    private Transaction MakeDebit(Guid accountId, decimal amount, DateOnly date, Guid? category) => new()
    {
        Id = Guid.NewGuid(),
        UserId = _userId,
        AccountId = accountId,
        CategoryId = category,
        Type = TransactionType.Debit,
        Amount = amount,
        BaseCurrencyAmount = amount,
        Currency = "GBP",
        Description = "Test spend",
        TransactionDate = date,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };
}
