using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.Budgets.Services;
using FinanceApi.Features.Categories.Models;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.UnitTests.Features.Budgets.Services;

public class BudgetServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly BudgetService _sut;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _accountId = Guid.NewGuid();
    private readonly Guid _categoryId = Guid.NewGuid();

    public BudgetServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options);

        _db.Accounts.Add(new Account
        {
            Id = _accountId, UserId = _userId, Name = "Test",
            Type = AccountType.Checking, Currency = "GBP", Balance = 0
        });
        _db.Categories.Add(new Category
        {
            Id = _categoryId, Name = "Groceries",
            Colour = "#22C55E", Icon = "shopping-cart", IsSystem = true
        });
        _db.SaveChanges();

        _sut = new BudgetService(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task GetCurrentBudgetsAsync_WhenDebitTransactionInCategory_CalculatesSpentCorrectly()
    {
        var now = DateTime.UtcNow;
        _db.Budgets.Add(MakeBudget(now.Month, now.Year, 200m));
        _db.Transactions.Add(MakeTx(75m, TransactionType.Debit, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetCurrentBudgetsAsync(_userId)).ToList();

        result.Should().HaveCount(1);
        result[0].Spent.Should().Be(75m);
    }

    [Fact]
    public async Task GetCurrentBudgetsAsync_WhenNoTransactions_SpentIsZero()
    {
        var now = DateTime.UtcNow;
        _db.Budgets.Add(MakeBudget(now.Month, now.Year, 300m));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetCurrentBudgetsAsync(_userId)).ToList();

        result[0].Spent.Should().Be(0m);
    }

    [Fact]
    public async Task GetCurrentBudgetsAsync_WhenSpentIsEightyPercent_IsWarningTrueAndExceededFalse()
    {
        var now = DateTime.UtcNow;
        _db.Budgets.Add(MakeBudget(now.Month, now.Year, 100m));
        _db.Transactions.Add(MakeTx(80m, TransactionType.Debit, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetCurrentBudgetsAsync(_userId)).ToList();

        result[0].IsWarning.Should().BeTrue();
        result[0].IsExceeded.Should().BeFalse();
    }

    [Fact]
    public async Task GetCurrentBudgetsAsync_WhenSpentExceedsBudget_IsExceededTrue()
    {
        var now = DateTime.UtcNow;
        _db.Budgets.Add(MakeBudget(now.Month, now.Year, 50m));
        _db.Transactions.Add(MakeTx(75m, TransactionType.Debit, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetCurrentBudgetsAsync(_userId)).ToList();

        result[0].IsExceeded.Should().BeTrue();
        result[0].IsWarning.Should().BeFalse();
    }

    [Fact]
    public async Task GetCurrentBudgetsAsync_DoesNotCountTransactionsFromOtherMonths()
    {
        var now = DateTime.UtcNow;
        _db.Budgets.Add(MakeBudget(now.Month, now.Year, 200m));
        _db.Transactions.Add(MakeTx(100m, TransactionType.Debit, DateOnly.FromDateTime(now.AddMonths(-1))));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetCurrentBudgetsAsync(_userId)).ToList();

        result[0].Spent.Should().Be(0m);
    }

    [Fact]
    public async Task GetCurrentBudgetsAsync_DoesNotCountCreditTransactions()
    {
        var now = DateTime.UtcNow;
        _db.Budgets.Add(MakeBudget(now.Month, now.Year, 200m));
        _db.Transactions.Add(MakeTx(500m, TransactionType.Credit, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetCurrentBudgetsAsync(_userId)).ToList();

        result[0].Spent.Should().Be(0m);
    }

    [Fact]
    public async Task GetCurrentBudgetsAsync_DoesNotCountDuplicateTransactions()
    {
        var now = DateTime.UtcNow;
        _db.Budgets.Add(MakeBudget(now.Month, now.Year, 200m));
        var tx = MakeTx(50m, TransactionType.Debit, DateOnly.FromDateTime(now));
        tx.IsDuplicate = true;
        _db.Transactions.Add(tx);
        await _db.SaveChangesAsync();

        var result = (await _sut.GetCurrentBudgetsAsync(_userId)).ToList();

        result[0].Spent.Should().Be(0m);
    }

    [Fact]
    public async Task CreateBudgetAsync_StoresBudgetWithCorrectFields()
    {
        var request = new CreateBudgetRequest(_categoryId, 6, 2025, 250m);

        var result = await _sut.CreateBudgetAsync(_userId, request);

        result.CategoryId.Should().Be(_categoryId);
        result.Amount.Should().Be(250m);
        result.Month.Should().Be(6);
        result.Year.Should().Be(2025);
        result.Spent.Should().Be(0m);
    }

    [Fact]
    public async Task UpdateBudgetAsync_WhenBudgetExists_UpdatesAmount()
    {
        var now = DateTime.UtcNow;
        var budget = MakeBudget(now.Month, now.Year, 100m);
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateBudgetAsync(_userId, budget.Id, new UpdateBudgetRequest(200m));

        result.Should().NotBeNull();
        result!.Amount.Should().Be(200m);
    }

    [Fact]
    public async Task CreateBudgetAsync_WithTitleAndNote_StoresBothFields()
    {
        var request = new CreateBudgetRequest(_categoryId, 6, 2025, 250m, Title: "Big shop", Note: "Includes Christmas presents");

        var result = await _sut.CreateBudgetAsync(_userId, request);

        result.Title.Should().Be("Big shop");
        result.Note.Should().Be("Includes Christmas presents");
    }

    [Fact]
    public async Task UpdateBudgetAsync_WithTitleAndNote_UpdatesBothFields()
    {
        var now = DateTime.UtcNow;
        var budget = MakeBudget(now.Month, now.Year, 100m);
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateBudgetAsync(_userId, budget.Id, new UpdateBudgetRequest(null, Title: "Renamed", Note: "Updated note"));

        result.Should().NotBeNull();
        result!.Title.Should().Be("Renamed");
        result.Note.Should().Be("Updated note");
    }

    [Fact]
    public async Task UpdateBudgetAsync_WhenTitleNotProvided_LeavesExistingTitleUnchanged()
    {
        var now = DateTime.UtcNow;
        var budget = MakeBudget(now.Month, now.Year, 100m);
        budget.Title = "Original title";
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateBudgetAsync(_userId, budget.Id, new UpdateBudgetRequest(200m));

        result!.Title.Should().Be("Original title");
    }

    [Fact]
    public async Task CopyFromPreviousMonthAsync_CarriesTitleAndNoteForward()
    {
        var prev = DateTime.UtcNow.AddMonths(-1);
        var budget = MakeBudget(prev.Month, prev.Year, 150m);
        budget.Title = "Groceries pot";
        budget.Note = "Weekly big shop";
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();

        var now = DateTime.UtcNow;
        var result = (await _sut.CopyFromPreviousMonthAsync(_userId, now.Month, now.Year)).ToList();

        result.Should().HaveCount(1);
        result[0].Title.Should().Be("Groceries pot");
        result[0].Note.Should().Be("Weekly big shop");
    }

    [Fact]
    public async Task UpdateBudgetAsync_WhenBudgetNotFound_ReturnsNull()
    {
        var result = await _sut.UpdateBudgetAsync(_userId, Guid.NewGuid(), new UpdateBudgetRequest(100m));

        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteBudgetAsync_WhenBudgetExists_RemovesBudgetAndReturnsTrue()
    {
        var budget = MakeBudget(1, 2025, 100m);
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();

        var result = await _sut.DeleteBudgetAsync(_userId, budget.Id);

        result.Should().BeTrue();
        (await _db.Budgets.FindAsync(budget.Id)).Should().BeNull();
    }

    [Fact]
    public async Task DeleteBudgetAsync_WhenBudgetNotFound_ReturnsFalse()
    {
        var result = await _sut.DeleteBudgetAsync(_userId, Guid.NewGuid());
        result.Should().BeFalse();
    }

    [Fact]
    public async Task CopyFromPreviousMonthAsync_WhenPreviousMonthHasBudgets_CreatesCopiesForTargetMonth()
    {
        var prev = DateTime.UtcNow.AddMonths(-1);
        _db.Budgets.Add(MakeBudget(prev.Month, prev.Year, 150m));
        await _db.SaveChangesAsync();

        var now = DateTime.UtcNow;
        var result = (await _sut.CopyFromPreviousMonthAsync(_userId, now.Month, now.Year)).ToList();

        result.Should().HaveCount(1);
        result[0].Month.Should().Be(now.Month);
        result[0].Year.Should().Be(now.Year);
        result[0].Amount.Should().Be(150m);
    }

    [Fact]
    public async Task GetTrendsAsync_DoesNotReturnOtherUsersData()
    {
        var otherUser = Guid.NewGuid();
        _db.Budgets.Add(new Budget
        {
            UserId = otherUser, CategoryId = _categoryId, Month = 1, Year = 2025, Amount = 100m
        });
        await _db.SaveChangesAsync();

        var result = (await _sut.GetTrendsAsync(_userId, 12)).ToList();

        result.Should().BeEmpty();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Budget MakeBudget(int month, int year, decimal amount) =>
        new() { UserId = _userId, CategoryId = _categoryId, Month = month, Year = year, Amount = amount };

    private Transaction MakeTx(decimal amount, TransactionType type, DateOnly date) =>
        new()
        {
            UserId = _userId, AccountId = _accountId, CategoryId = _categoryId,
            Type = type, Amount = amount, BaseCurrencyAmount = amount,
            Currency = "GBP", Description = "TEST", TransactionDate = date
        };
}
