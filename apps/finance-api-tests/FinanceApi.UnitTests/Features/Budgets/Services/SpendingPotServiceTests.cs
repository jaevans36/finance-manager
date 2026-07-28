using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.Budgets.Services;
using FinanceApi.Features.Categories.Models;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.UnitTests.Features.Budgets.Services;

public class SpendingPotServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly SpendingPotService _sut;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _accountId = Guid.NewGuid();
    private readonly Guid _groceriesCategoryId = Guid.NewGuid();
    private readonly Guid _fuelCategoryId = Guid.NewGuid();

    public SpendingPotServiceTests()
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
        _db.Categories.AddRange(
            new Category { Id = _groceriesCategoryId, Name = "Groceries", IsSystem = true },
            new Category { Id = _fuelCategoryId, Name = "Fuel", IsSystem = true }
        );
        _db.SaveChanges();

        _sut = new SpendingPotService(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task GetPotsWithProgressAsync_WhenTransactionInMappedCategory_CountsTowardSpent()
    {
        var now = DateTime.UtcNow;
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Food", Type = PotType.Groceries,
            BudgetAmount = 300m, CategoryIds = new List<Guid> { _groceriesCategoryId }
        });
        _db.Transactions.Add(MakeTx(60m, _groceriesCategoryId, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetPotsWithProgressAsync(_userId, now.Month, now.Year)).ToList();

        result.Should().HaveCount(1);
        result[0].Spent.Should().Be(60m);
        result[0].Remaining.Should().Be(240m);
    }

    [Fact]
    public async Task GetPotsWithProgressAsync_WhenTransactionInUnmappedCategory_NotCounted()
    {
        var now = DateTime.UtcNow;
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Groceries Pot", Type = PotType.Groceries,
            BudgetAmount = 200m, CategoryIds = new List<Guid> { _groceriesCategoryId }
        });
        _db.Transactions.Add(MakeTx(50m, _fuelCategoryId, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetPotsWithProgressAsync(_userId, now.Month, now.Year)).ToList();

        result[0].Spent.Should().Be(0m);
    }

    [Fact]
    public async Task GetPotsWithProgressAsync_WhenPotMapsMultipleCategories_SumsAllTransactions()
    {
        var now = DateTime.UtcNow;
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Transport", Type = PotType.Fuel,
            BudgetAmount = 200m, CategoryIds = new List<Guid> { _groceriesCategoryId, _fuelCategoryId }
        });
        _db.Transactions.AddRange(
            MakeTx(30m, _groceriesCategoryId, DateOnly.FromDateTime(now)),
            MakeTx(45m, _fuelCategoryId, DateOnly.FromDateTime(now))
        );
        await _db.SaveChangesAsync();

        var result = (await _sut.GetPotsWithProgressAsync(_userId, now.Month, now.Year)).ToList();

        result[0].Spent.Should().Be(75m);
    }

    [Fact]
    public async Task GetPotsWithProgressAsync_WhenSpentIsEightyPercent_IsWarningTrue()
    {
        var now = DateTime.UtcNow;
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Pot", Type = PotType.Custom,
            BudgetAmount = 100m, CategoryIds = new List<Guid> { _groceriesCategoryId }
        });
        _db.Transactions.Add(MakeTx(80m, _groceriesCategoryId, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetPotsWithProgressAsync(_userId, now.Month, now.Year)).ToList();

        result[0].IsWarning.Should().BeTrue();
        result[0].IsExceeded.Should().BeFalse();
    }

    [Fact]
    public async Task GetPotsWithProgressAsync_WhenSpentExceedsBudget_RemainingIsNegative()
    {
        var now = DateTime.UtcNow;
        _db.SpendingPots.Add(new SpendingPot
        {
            UserId = _userId, Name = "Pot", Type = PotType.Custom,
            BudgetAmount = 50m, CategoryIds = new List<Guid> { _groceriesCategoryId }
        });
        _db.Transactions.Add(MakeTx(80m, _groceriesCategoryId, DateOnly.FromDateTime(now)));
        await _db.SaveChangesAsync();

        var result = (await _sut.GetPotsWithProgressAsync(_userId, now.Month, now.Year)).ToList();

        result[0].IsExceeded.Should().BeTrue();
        result[0].Remaining.Should().BeNegative();
    }

    [Fact]
    public async Task CreatePotAsync_StoresPotWithCategoryIds()
    {
        var request = new CreateSpendingPotRequest(
            "Groceries", PotType.Groceries, 250m, false, "shopping-cart", "#22C55E",
            new[] { _groceriesCategoryId });

        var result = await _sut.CreatePotAsync(_userId, request);

        result.Name.Should().Be("Groceries");
        result.BudgetAmount.Should().Be(250m);
        result.CategoryIds.Should().Contain(_groceriesCategoryId);
    }

    [Fact]
    public async Task UpdatePotAsync_WhenPotExists_UpdatesFields()
    {
        var pot = new SpendingPot
        {
            UserId = _userId, Name = "Old Name", Type = PotType.Custom,
            BudgetAmount = 100m, CategoryIds = new List<Guid>()
        };
        _db.SpendingPots.Add(pot);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdatePotAsync(_userId, pot.Id,
            new UpdateSpendingPotRequest("New Name", 200m, null, null, null, null));

        result.Should().NotBeNull();
        result!.Name.Should().Be("New Name");
        result.BudgetAmount.Should().Be(200m);
    }

    [Fact]
    public async Task UpdatePotAsync_WhenPotNotFound_ReturnsNull()
    {
        var result = await _sut.UpdatePotAsync(_userId, Guid.NewGuid(),
            new UpdateSpendingPotRequest("X", null, null, null, null, null));

        result.Should().BeNull();
    }

    [Fact]
    public async Task DeletePotAsync_WhenPotExists_RemovesPotAndReturnsTrue()
    {
        var pot = new SpendingPot
        {
            UserId = _userId, Name = "To Delete", Type = PotType.Custom,
            BudgetAmount = 100m, CategoryIds = new List<Guid>()
        };
        _db.SpendingPots.Add(pot);
        await _db.SaveChangesAsync();

        var result = await _sut.DeletePotAsync(_userId, pot.Id);

        result.Should().BeTrue();
        (await _db.SpendingPots.FindAsync(pot.Id)).Should().BeNull();
    }

    [Fact]
    public async Task DeletePotAsync_WhenPotNotFound_ReturnsFalse()
    {
        var result = await _sut.DeletePotAsync(_userId, Guid.NewGuid());
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetPotsWithProgressAsync_WhenUserHasNoPots_ReturnsEmptyCollection()
    {
        var now = DateTime.UtcNow;

        var result = await _sut.GetPotsWithProgressAsync(_userId, now.Month, now.Year);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task AssignTransactionAsync_WhenTransactionCategoryNotInPot_AddsCategoryAndReturnsTrue()
    {
        var pot = new SpendingPot
        {
            UserId = _userId, Name = "Pot", Type = PotType.Custom,
            BudgetAmount = 100m, CategoryIds = new List<Guid>()
        };
        var tx = new Transaction
        {
            UserId = _userId, AccountId = _accountId, CategoryId = _groceriesCategoryId,
            Type = TransactionType.Debit, Amount = 20m, BaseCurrencyAmount = 20m,
            Currency = "GBP", Description = "TEST", TransactionDate = DateOnly.FromDateTime(DateTime.UtcNow)
        };
        _db.SpendingPots.Add(pot);
        _db.Transactions.Add(tx);
        await _db.SaveChangesAsync();

        var result = await _sut.AssignTransactionAsync(_userId, pot.Id, tx.Id);

        result.Should().BeTrue();
        var updated = await _db.SpendingPots.FindAsync(pot.Id);
        updated!.CategoryIds.Should().Contain(_groceriesCategoryId);
    }

    [Fact]
    public async Task AssignTransactionAsync_WhenCategoryAlreadyMapped_IsIdempotentAndReturnsTrue()
    {
        var pot = new SpendingPot
        {
            UserId = _userId, Name = "Pot", Type = PotType.Custom,
            BudgetAmount = 100m, CategoryIds = new List<Guid> { _groceriesCategoryId }
        };
        var tx = new Transaction
        {
            UserId = _userId, AccountId = _accountId, CategoryId = _groceriesCategoryId,
            Type = TransactionType.Debit, Amount = 20m, BaseCurrencyAmount = 20m,
            Currency = "GBP", Description = "TEST", TransactionDate = DateOnly.FromDateTime(DateTime.UtcNow)
        };
        _db.SpendingPots.Add(pot);
        _db.Transactions.Add(tx);
        await _db.SaveChangesAsync();

        var result = await _sut.AssignTransactionAsync(_userId, pot.Id, tx.Id);

        result.Should().BeTrue();
        var updated = await _db.SpendingPots.FindAsync(pot.Id);
        updated!.CategoryIds.Should().HaveCount(1); // not duplicated
    }

    [Fact]
    public async Task AssignTransactionAsync_WhenPotNotFound_ReturnsFalse()
    {
        var tx = new Transaction
        {
            UserId = _userId, AccountId = _accountId, CategoryId = _groceriesCategoryId,
            Type = TransactionType.Debit, Amount = 20m, BaseCurrencyAmount = 20m,
            Currency = "GBP", Description = "TEST", TransactionDate = DateOnly.FromDateTime(DateTime.UtcNow)
        };
        _db.Transactions.Add(tx);
        await _db.SaveChangesAsync();

        var result = await _sut.AssignTransactionAsync(_userId, Guid.NewGuid(), tx.Id);

        result.Should().BeFalse();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Transaction MakeTx(decimal amount, Guid categoryId, DateOnly date) =>
        new()
        {
            UserId = _userId, AccountId = _accountId, CategoryId = categoryId,
            Type = TransactionType.Debit, Amount = amount, BaseCurrencyAmount = amount,
            Currency = "GBP", Description = "TEST", TransactionDate = date
        };
}
