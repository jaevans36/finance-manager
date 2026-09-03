using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.IncomeStreams.Models;
using FinanceApi.Features.IncomeStreams.Services;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.UnitTests.Features.IncomeStreams.Services;

public class IncomeStreamServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly IncomeStreamService _sut;
    private readonly Guid _userId = Guid.NewGuid();

    public IncomeStreamServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options);
        _db.Database.EnsureCreated();
        _sut = new IncomeStreamService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ── GetStreamsAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetStreamsAsync_WhenNoneExist_ReturnsEmpty()
    {
        var result = await _sut.GetStreamsAsync(_userId);
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetStreamsAsync_ReturnsOnlyStreamsForRequestingUser()
    {
        _db.IncomeStreams.Add(MakeStream(_userId, "My salary"));
        _db.IncomeStreams.Add(MakeStream(Guid.NewGuid(), "Other"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetStreamsAsync(_userId);

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("My salary");
    }

    [Fact]
    public async Task GetStreamsAsync_WhenLinkedToAccount_IncludesAccountName()
    {
        var account = MakeAccount("Barclays Current");
        _db.Accounts.Add(account);
        _db.IncomeStreams.Add(MakeStream(_userId, "My salary", accountId: account.Id));
        await _db.SaveChangesAsync();

        var result = await _sut.GetStreamsAsync(_userId);

        result.First().AccountName.Should().Be("Barclays Current");
    }

    // ── CreateStreamAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task CreateStreamAsync_WithValidRequest_CreatesStreamAndReturnsIt()
    {
        var request = new CreateIncomeStreamRequest("Wife's salary", 2200m);

        var result = await _sut.CreateStreamAsync(_userId, request);

        result.Name.Should().Be("Wife's salary");
        result.MonthlyAmount.Should().Be(2200m);
        (await _db.IncomeStreams.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task CreateStreamAsync_WithAccountId_LinksToAccount()
    {
        var account = MakeAccount("Joint Account");
        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        var result = await _sut.CreateStreamAsync(_userId, new CreateIncomeStreamRequest("Wife's salary", 2200m, account.Id));

        result.AccountId.Should().Be(account.Id);
        result.AccountName.Should().Be("Joint Account");
    }

    // ── UpdateStreamAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateStreamAsync_WhenStreamExists_UpdatesAmount()
    {
        var stream = MakeStream(_userId, "My salary");
        _db.IncomeStreams.Add(stream);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateStreamAsync(_userId, stream.Id, new UpdateIncomeStreamRequest(MonthlyAmount: 3200m));

        result!.MonthlyAmount.Should().Be(3200m);
    }

    [Fact]
    public async Task UpdateStreamAsync_CanLinkStreamToAccount()
    {
        var account = MakeAccount("Barclays Current");
        _db.Accounts.Add(account);
        var stream = MakeStream(_userId, "My salary");
        _db.IncomeStreams.Add(stream);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateStreamAsync(_userId, stream.Id, new UpdateIncomeStreamRequest(AccountId: account.Id));

        result!.AccountId.Should().Be(account.Id);
        result.AccountName.Should().Be("Barclays Current");
    }

    [Fact]
    public async Task UpdateStreamAsync_CanUnlinkStreamFromAccount()
    {
        var account = MakeAccount("Barclays Current");
        _db.Accounts.Add(account);
        var stream = MakeStream(_userId, "My salary", accountId: account.Id);
        _db.IncomeStreams.Add(stream);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateStreamAsync(_userId, stream.Id, new UpdateIncomeStreamRequest(AccountId: null));

        result!.AccountId.Should().BeNull();
        result.AccountName.Should().BeNull();
    }

    [Fact]
    public async Task UpdateStreamAsync_WhenStreamBelongsToOtherUser_ReturnsNull()
    {
        var stream = MakeStream(Guid.NewGuid(), "Other");
        _db.IncomeStreams.Add(stream);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateStreamAsync(_userId, stream.Id, new UpdateIncomeStreamRequest(MonthlyAmount: 50m));

        result.Should().BeNull();
    }

    // ── DeleteStreamAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteStreamAsync_WhenStreamExists_RemovesItFromDatabase()
    {
        var stream = MakeStream(_userId, "My salary");
        _db.IncomeStreams.Add(stream);
        await _db.SaveChangesAsync();

        var success = await _sut.DeleteStreamAsync(_userId, stream.Id);

        success.Should().BeTrue();
        (await _db.IncomeStreams.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task DeleteStreamAsync_WhenStreamBelongsToOtherUser_ReturnsFalse()
    {
        var stream = MakeStream(Guid.NewGuid(), "Other");
        _db.IncomeStreams.Add(stream);
        await _db.SaveChangesAsync();

        var success = await _sut.DeleteStreamAsync(_userId, stream.Id);

        success.Should().BeFalse();
    }

    // ── GetDetectedIncomeAsync ───────────────────────────────────────────────

    [Fact]
    public async Task GetDetectedIncomeAsync_WhenNoCredits_ReturnsNullAmount()
    {
        var account = MakeAccount("Barclays Current");
        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        var result = await _sut.GetDetectedIncomeAsync(_userId, account.Id);

        result.DetectedMonthlyAmount.Should().BeNull();
        result.MatchedTransactions.Should().BeEmpty();
    }

    [Fact]
    public async Task GetDetectedIncomeAsync_WithSalaryCredits_ReturnsAverageAndMatchedTransactions()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var account = MakeAccount("Barclays Current");
        _db.Accounts.Add(account);
        _db.Transactions.AddRange(
            MakeCredit(account.Id, 2400m, today.AddMonths(-1), "SALARY ACME LTD"),
            MakeCredit(account.Id, 2400m, today, "SALARY ACME LTD"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetDetectedIncomeAsync(_userId, account.Id);

        result.DetectedMonthlyAmount.Should().Be(2400m);
        result.TransactionCount.Should().Be(2);
        result.MatchedTransactions.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetDetectedIncomeAsync_OnlyConsidersCreditsForTheSpecifiedAccount()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var account1 = MakeAccount("Account 1");
        var account2 = MakeAccount("Account 2");
        _db.Accounts.AddRange(account1, account2);
        _db.Transactions.Add(MakeCredit(account2.Id, 2400m, today, "SALARY ACME LTD"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetDetectedIncomeAsync(_userId, account1.Id);

        result.DetectedMonthlyAmount.Should().BeNull();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private IncomeStream MakeStream(Guid userId, string name, decimal monthlyAmount = 2000m, Guid? accountId = null) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Name = name,
        MonthlyAmount = monthlyAmount,
        AccountId = accountId,
    };

    private Account MakeAccount(string name) => new()
    {
        Id = Guid.NewGuid(),
        UserId = _userId,
        Name = name,
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
}
