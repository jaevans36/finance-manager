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
    public async Task DetectAsync_WhenDaysParam90_IgnoresTransactionsOutsideWindow()
    {
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx("OLD SERVICE", 10m, now.AddDays(-95)),
            MakeTx("OLD SERVICE", 10m, now.AddDays(-91)));
        await _db.SaveChangesAsync();

        var result = await _sut.DetectAsync(_userId, days: 90);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task DetectAsync_DefaultLookback365Days_IncludesTransactionsWithinWindow()
    {
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx("OLD SERVICE", 10m, now.AddDays(-200)),
            MakeTx("OLD SERVICE", 10m, now.AddDays(-170)));
        await _db.SaveChangesAsync();

        var result = (await _sut.DetectAsync(_userId)).ToList();

        result.Should().HaveCount(1);
    }

    [Fact]
    public async Task DetectAsync_IgnoresCreditTransactions()
    {
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx("SALARY", 2000m, now.AddDays(-60), type: TransactionType.Credit),
            MakeTx("SALARY", 2000m, now.AddDays(-30), type: TransactionType.Credit));
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

    // ── Generic payment-processor payees (e.g. PayPal) ──────────────────────────

    [Fact]
    public async Task DetectAsync_WhenPayeeIsGenericPayPal_UsesDescriptionToDistinguishMerchants()
    {
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx("PayPal", 12.99m, now.AddDays(-60), "PAYPAL *SPOTIFY*P4 35314369001 VIS"),
            MakeTx("PayPal", 12.99m, now.AddDays(-30), "PAYPAL *SPOTIFY*P4 35314369001 VIS"),
            MakeTx("PayPal", 12.99m, now.AddDays(-1), "PAYPAL *SPOTIFY*P4 35314369001 VIS"),
            MakeTx("PayPal", 5.99m, now.AddDays(-58), "PAYPAL *WARHAMMER 35314369001 VIS"),
            MakeTx("PayPal", 5.99m, now.AddDays(-28), "PAYPAL *WARHAMMER 35314369001 VIS"));
        await _db.SaveChangesAsync();

        var result = (await _sut.DetectAsync(_userId)).ToList();

        result.Should().HaveCount(2);
        result.Should().Contain(p => p.MerchantName == "SPOTIFY*P4" && p.OccurrencesInPeriod == 3);
        result.Should().Contain(p => p.MerchantName == "WARHAMMER" && p.OccurrencesInPeriod == 2);
    }

    [Fact]
    public async Task DetectAsync_WhenPayeeIsGenericPayPal_DoesNotGroupUnrelatedMerchantsTogether()
    {
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx("PayPal", 12.99m, now.AddDays(-60), "PAYPAL *SPOTIFY*P4 35314369001 VIS"),
            MakeTx("PayPal", 12.99m, now.AddDays(-30), "PAYPAL *SPOTIFY*P4 35314369001 VIS"),
            MakeTx("PayPal", 29.99m, now.AddDays(-45), "PAYPAL *EBAY UK 795653703 VIS"));
        await _db.SaveChangesAsync();

        var result = (await _sut.DetectAsync(_userId)).ToList();

        // eBay only occurs once — must not be folded into a catch-all "PayPal" group with Spotify
        result.Should().HaveCount(1);
        result[0].MerchantName.Should().Be("SPOTIFY*P4");
    }

    [Fact]
    public async Task DetectAsync_WhenPayPalDescriptionHasVaryingReferenceNumbers_StillGroupsAsSameMerchant()
    {
        // Reference-numbered PayPal payments (e.g. Humble Bundle) carry a different
        // "INT'L <ref>" prefix on every occurrence — the merchant name after it is
        // what should be grouped on.
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx(null, 22.12m, now.AddDays(-90), "INT'L 0004564105 PP*HUMBLEBUNDL HUM 4029357733 VIS"),
            MakeTx(null, 18.50m, now.AddDays(-60), "INT'L 0010638152 PP*HUMBLEBUNDL HUM 4029357733 VIS"),
            MakeTx(null, 11.85m, now.AddDays(-30), "INT'L 0057128380 PP*HUMBLEBUNDL HUM 4029357733 VIS"));
        await _db.SaveChangesAsync();

        var result = (await _sut.DetectAsync(_userId)).ToList();

        result.Should().HaveCount(1);
        result[0].MerchantName.Should().Be("HUMBLEBUNDL HUM");
        result[0].OccurrencesInPeriod.Should().Be(3);
    }

    [Fact]
    public async Task DetectAsync_WhenPayeeIsGenuineMerchantNamedPayPalLike_StillUsesItDirectly()
    {
        // Sanity check: a normal merchant whose name merely contains similar text
        // shouldn't be treated as a processor passthrough — only an exact "PayPal" payee is.
        var now = DateTime.UtcNow;
        _db.Transactions.AddRange(
            MakeTx("Netflix", 9.99m, now.AddDays(-60), "NETFLIX.COM"),
            MakeTx("Netflix", 9.99m, now.AddDays(-30), "NETFLIX.COM"));
        await _db.SaveChangesAsync();

        var result = (await _sut.DetectAsync(_userId)).ToList();

        result.Should().HaveCount(1);
        result[0].MerchantName.Should().Be("NETFLIX");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Transaction MakeTx(
        string? payee,
        decimal amount,
        DateTime date,
        string? description = null,
        TransactionType type = TransactionType.Debit,
        bool isDuplicate = false) => new()
    {
        Id = Guid.NewGuid(),
        UserId = _userId,
        AccountId = _accountId,
        Payee = payee,
        Description = description ?? payee ?? string.Empty,
        Amount = amount,
        Currency = "GBP",
        Type = type,
        TransactionDate = DateOnly.FromDateTime(date),
        IsDuplicate = isDuplicate,
        ImportSource = ImportSource.Manual,
    };
}
