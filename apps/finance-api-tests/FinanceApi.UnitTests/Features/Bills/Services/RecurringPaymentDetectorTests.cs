using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Bills.Services;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.UnitTests.Features.Bills.Services;

public class RecurringPaymentDetectorTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly RecurringPaymentDetector _sut;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _accountId = Guid.NewGuid();

    public RecurringPaymentDetectorTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options);
        _db.Database.EnsureCreated();

        _db.Accounts.Add(new Account
        {
            Id = _accountId, UserId = _userId, Name = "Current",
            Type = AccountType.Checking, Currency = "GBP", Balance = 0
        });
        _db.SaveChanges();

        _sut = new RecurringPaymentDetector(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task DetectAsync_WhenNoTransactions_ReturnsEmpty()
    {
        var result = await _sut.DetectAsync(_userId);
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task DetectAsync_WhenSingleOccurrenceOnly_ExcludesFromResults()
    {
        _db.Transactions.Add(MakeTx("Netflix", 9.99m, DateTime.UtcNow.AddDays(-10)));
        await _db.SaveChangesAsync();

        var result = await _sut.DetectAsync(_userId);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task DetectAsync_WhenTransactionsHaveMonthlyGap_DetectsMonthlyFrequency()
    {
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx("NETFLIX", 9.99m, now.AddDays(-60)),
            MakeTx("NETFLIX", 9.99m, now.AddDays(-30)),
            MakeTx("NETFLIX", 9.99m, now.AddDays(-1)));
        await _db.SaveChangesAsync();

        var result = (await _sut.DetectAsync(_userId)).ToList();

        result.Should().HaveCount(1);
        result[0].DetectedFrequency.Should().Be(RecurringFrequency.Monthly);
        result[0].MerchantName.Should().Be("NETFLIX");
    }

    [Fact]
    public async Task DetectAsync_WhenTransactionsHaveWeeklyGap_DetectsWeeklyFrequency()
    {
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx("TESCO", 55m, now.AddDays(-21)),
            MakeTx("TESCO", 58m, now.AddDays(-14)),
            MakeTx("TESCO", 52m, now.AddDays(-7)),
            MakeTx("TESCO", 60m, now.AddDays(-1)));
        await _db.SaveChangesAsync();

        var result = (await _sut.DetectAsync(_userId)).ToList();

        result.Should().HaveCount(1);
        result[0].DetectedFrequency.Should().Be(RecurringFrequency.Weekly);
    }

    [Fact]
    public async Task DetectAsync_WhenAmountsAreIdentical_ClassifiesAsSubscription()
    {
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx("SPOTIFY", 9.99m, now.AddDays(-60)),
            MakeTx("SPOTIFY", 9.99m, now.AddDays(-30)),
            MakeTx("SPOTIFY", 9.99m, now.AddDays(-1)));
        await _db.SaveChangesAsync();

        var result = (await _sut.DetectAsync(_userId)).ToList();

        result[0].PatternType.Should().Be(RecurringPatternType.Subscription);
        result[0].AmountTrend.Should().Be(AmountTrend.Stable);
    }

    [Fact]
    public async Task DetectAsync_WhenAmountsVarySignificantly_ClassifiesAsRegularSpend()
    {
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx("SHELL", 40m, now.AddDays(-21)),
            MakeTx("SHELL", 80m, now.AddDays(-14)),
            MakeTx("SHELL", 30m, now.AddDays(-7)));
        await _db.SaveChangesAsync();

        var result = (await _sut.DetectAsync(_userId)).ToList();

        result[0].PatternType.Should().Be(RecurringPatternType.RegularSpend);
    }

    [Fact]
    public async Task DetectAsync_WhenAmountsIncreaseSteadily_DetectsIncreasingTrend()
    {
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx("UTILITY CO", 80m, now.AddDays(-60)),
            MakeTx("UTILITY CO", 85m, now.AddDays(-30)),
            MakeTx("UTILITY CO", 90m, now.AddDays(-2)));
        await _db.SaveChangesAsync();

        var result = (await _sut.DetectAsync(_userId)).ToList();

        result[0].AmountTrend.Should().Be(AmountTrend.Increasing);
    }

    [Fact]
    public async Task DetectAsync_IgnoresTransactionsOlderThan90Days()
    {
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx("OLD SERVICE", 10m, now.AddDays(-95)),
            MakeTx("OLD SERVICE", 10m, now.AddDays(-91)));
        await _db.SaveChangesAsync();

        var result = await _sut.DetectAsync(_userId);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task DetectAsync_IgnoresCreditTransactions()
    {
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx("SALARY", 2000m, now.AddDays(-60), TransactionType.Credit),
            MakeTx("SALARY", 2000m, now.AddDays(-30), TransactionType.Credit));
        await _db.SaveChangesAsync();

        var result = await _sut.DetectAsync(_userId);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task DetectAsync_IgnoresDuplicateTransactions()
    {
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx("SERVICE", 10m, now.AddDays(-30), isDuplicate: true),
            MakeTx("SERVICE", 10m, now.AddDays(-1), isDuplicate: true));
        await _db.SaveChangesAsync();

        var result = await _sut.DetectAsync(_userId);

        result.Should().BeEmpty();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Transaction MakeTx(
        string payee,
        decimal amount,
        DateTime date,
        TransactionType type = TransactionType.Debit,
        bool isDuplicate = false) => new()
    {
        Id = Guid.NewGuid(),
        UserId = _userId,
        AccountId = _accountId,
        Payee = payee,
        Description = payee,
        Amount = amount,
        Currency = "GBP",
        Type = type,
        TransactionDate = DateOnly.FromDateTime(date),
        IsDuplicate = isDuplicate,
        ImportSource = ImportSource.Manual,
    };
}
