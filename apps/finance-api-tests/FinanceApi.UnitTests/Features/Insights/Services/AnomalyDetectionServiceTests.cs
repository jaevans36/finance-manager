using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Categories.Models;
using FinanceApi.Features.Insights.Models;
using FinanceApi.Features.Insights.Services;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.UnitTests.Features.Insights.Services;

public class AnomalyDetectionServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly AnomalyDetectionService _sut;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly DateOnly _today = DateOnly.FromDateTime(DateTime.UtcNow);

    public AnomalyDetectionServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options);
        _db.Database.EnsureCreated();
        _sut = new AnomalyDetectionService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ── Category spike ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetAnomaliesAsync_DetectsCategorySpike_WhenCurrentMonthFarExceedsAverage()
    {
        var account = MakeAccount();
        var category = new Category { Id = Guid.NewGuid(), Name = "Dining" };
        _db.Accounts.Add(account);
        _db.Categories.Add(category);
        _db.Transactions.AddRange(
            MakeDebit(account.Id, 100m, _today.AddMonths(-3), category.Id, "Restaurant A"),
            MakeDebit(account.Id, 100m, _today.AddMonths(-2), category.Id, "Restaurant A"),
            MakeDebit(account.Id, 100m, _today.AddMonths(-1), category.Id, "Restaurant A"),
            MakeDebit(account.Id, 500m, _today, category.Id, "Restaurant A"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAnomaliesAsync(_userId);

        result.Should().Contain(a => a.Type == AnomalyType.CategorySpike && a.MerchantName == "Dining");
    }

    [Fact]
    public async Task GetAnomaliesAsync_DoesNotFlagCategorySpike_WhenSpendIsConsistentWithHistory()
    {
        var account = MakeAccount();
        var category = new Category { Id = Guid.NewGuid(), Name = "Dining" };
        _db.Accounts.Add(account);
        _db.Categories.Add(category);
        _db.Transactions.AddRange(
            MakeDebit(account.Id, 100m, _today.AddMonths(-3), category.Id, "Restaurant A"),
            MakeDebit(account.Id, 100m, _today.AddMonths(-2), category.Id, "Restaurant A"),
            MakeDebit(account.Id, 100m, _today.AddMonths(-1), category.Id, "Restaurant A"),
            MakeDebit(account.Id, 100m, _today, category.Id, "Restaurant A"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAnomaliesAsync(_userId);

        result.Should().NotContain(a => a.Type == AnomalyType.CategorySpike);
    }

    [Fact]
    public async Task GetAnomaliesAsync_DoesNotFlagCategorySpike_WithFewerThanThreeMonthsOfHistory()
    {
        var account = MakeAccount();
        var category = new Category { Id = Guid.NewGuid(), Name = "Dining" };
        _db.Accounts.Add(account);
        _db.Categories.Add(category);
        _db.Transactions.AddRange(
            MakeDebit(account.Id, 100m, _today.AddMonths(-2), category.Id, "Restaurant A"),
            MakeDebit(account.Id, 100m, _today.AddMonths(-1), category.Id, "Restaurant A"),
            MakeDebit(account.Id, 900m, _today, category.Id, "Restaurant A"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAnomaliesAsync(_userId);

        result.Should().NotContain(a => a.Type == AnomalyType.CategorySpike);
    }

    // ── New merchant ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAnomaliesAsync_FlagsNewMerchant_AboveThreshold()
    {
        var account = MakeAccount();
        _db.Accounts.Add(account);
        _db.Transactions.Add(MakeDebit(account.Id, 250m, _today, null, "Electronics Store"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAnomaliesAsync(_userId);

        result.Should().Contain(a => a.Type == AnomalyType.NewMerchant && a.MerchantName == "Electronics Store");
    }

    [Fact]
    public async Task GetAnomaliesAsync_DoesNotFlagNewMerchant_BelowThreshold()
    {
        var account = MakeAccount();
        _db.Accounts.Add(account);
        _db.Transactions.Add(MakeDebit(account.Id, 20m, _today, null, "Corner Shop"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAnomaliesAsync(_userId);

        result.Should().NotContain(a => a.Type == AnomalyType.NewMerchant);
    }

    [Fact]
    public async Task GetAnomaliesAsync_DoesNotFlagMerchant_WithPriorHistory()
    {
        var account = MakeAccount();
        _db.Accounts.Add(account);
        _db.Transactions.AddRange(
            MakeDebit(account.Id, 50m, _today.AddDays(-200), null, "Regular Shop"),
            MakeDebit(account.Id, 250m, _today, null, "Regular Shop"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAnomaliesAsync(_userId);

        result.Should().NotContain(a => a.Type == AnomalyType.NewMerchant && a.MerchantName == "Regular Shop");
    }

    // ── Potential duplicate ──────────────────────────────────────────────────

    [Fact]
    public async Task GetAnomaliesAsync_FlagsPotentialDuplicate_SameAmountWithinTwoDays()
    {
        var account = MakeAccount();
        _db.Accounts.Add(account);
        _db.Transactions.AddRange(
            MakeDebit(account.Id, 45.99m, _today.AddDays(-1), null, "Coffee Shop"),
            MakeDebit(account.Id, 45.99m, _today, null, "Coffee Shop"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAnomaliesAsync(_userId);

        result.Should().Contain(a => a.Type == AnomalyType.PotentialDuplicate);
    }

    [Fact]
    public async Task GetAnomaliesAsync_DoesNotFlagDuplicate_WhenAmountsDiffer()
    {
        var account = MakeAccount();
        _db.Accounts.Add(account);
        _db.Transactions.AddRange(
            MakeDebit(account.Id, 45.99m, _today.AddDays(-1), null, "Coffee Shop"),
            MakeDebit(account.Id, 50.00m, _today, null, "Coffee Shop"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAnomaliesAsync(_userId);

        result.Should().NotContain(a => a.Type == AnomalyType.PotentialDuplicate);
    }

    [Fact]
    public async Task GetAnomaliesAsync_DoesNotFlagDuplicate_WhenMoreThanTwoDaysApart()
    {
        var account = MakeAccount();
        _db.Accounts.Add(account);
        _db.Transactions.AddRange(
            MakeDebit(account.Id, 45.99m, _today.AddDays(-5), null, "Coffee Shop"),
            MakeDebit(account.Id, 45.99m, _today, null, "Coffee Shop"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAnomaliesAsync(_userId);

        result.Should().NotContain(a => a.Type == AnomalyType.PotentialDuplicate);
    }

    [Fact]
    public async Task GetAnomaliesAsync_ExcludesTransactionsAlreadyMarkedDuplicate()
    {
        var account = MakeAccount();
        _db.Accounts.Add(account);
        var tx1 = MakeDebit(account.Id, 45.99m, _today.AddDays(-1), null, "Coffee Shop");
        var tx2 = MakeDebit(account.Id, 45.99m, _today, null, "Coffee Shop");
        tx2.IsDuplicate = true;
        _db.Transactions.AddRange(tx1, tx2);
        await _db.SaveChangesAsync();

        var result = await _sut.GetAnomaliesAsync(_userId);

        result.Should().NotContain(a => a.Type == AnomalyType.PotentialDuplicate);
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

    private Transaction MakeDebit(Guid accountId, decimal amount, DateOnly date, Guid? category, string payee) => new()
    {
        Id = Guid.NewGuid(),
        UserId = _userId,
        AccountId = accountId,
        CategoryId = category,
        Type = TransactionType.Debit,
        Amount = amount,
        BaseCurrencyAmount = amount,
        Currency = "GBP",
        Description = payee,
        Payee = payee,
        TransactionDate = date,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };
}
