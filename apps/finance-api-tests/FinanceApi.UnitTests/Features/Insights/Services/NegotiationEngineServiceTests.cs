using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Insights.Services;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.UnitTests.Features.Insights.Services;

public class NegotiationEngineServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly NegotiationEngineService _sut;
    private readonly Guid _userId = Guid.NewGuid();

    public NegotiationEngineServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options);
        _db.Database.EnsureCreated();
        _sut = new NegotiationEngineService(_db);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task GetScriptAsync_WithNoMatchingTransactions_ReturnsNull()
    {
        var result = await _sut.GetScriptAsync(_userId, "Unknown Provider");

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetScriptAsync_ComputesTenureAndTotalSpent()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var account = MakeAccount();
        _db.Accounts.Add(account);
        _db.Transactions.AddRange(
            MakeDebit(account.Id, 30m, today.AddMonths(-2), "SKY BROADBAND"),
            MakeDebit(account.Id, 30m, today.AddMonths(-1), "SKY BROADBAND"),
            MakeDebit(account.Id, 30m, today, "SKY BROADBAND"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetScriptAsync(_userId, "sky broadband");

        result.Should().NotBeNull();
        result!.MerchantName.Should().Be("SKY BROADBAND");
        result.TenureMonths.Should().Be(3);
        result.TotalSpent.Should().Be(90m);
        result.PaymentCount.Should().Be(3);
    }

    [Fact]
    public async Task GetScriptAsync_MatchIsCaseAndWhitespaceInsensitive()
    {
        var account = MakeAccount();
        _db.Accounts.Add(account);
        _db.Transactions.Add(MakeDebit(account.Id, 20m, DateOnly.FromDateTime(DateTime.UtcNow), "  Virgin   Media  "));
        await _db.SaveChangesAsync();

        var result = await _sut.GetScriptAsync(_userId, "virgin media");

        result.Should().NotBeNull();
    }

    [Fact]
    public async Task GetScriptAsync_ScriptIncludesMerchantNameAndDisclaimer()
    {
        var account = MakeAccount();
        _db.Accounts.Add(account);
        _db.Transactions.Add(MakeDebit(account.Id, 20m, DateOnly.FromDateTime(DateTime.UtcNow), "TalkTalk"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetScriptAsync(_userId, "TalkTalk");

        result!.Script.Should().Contain("TalkTalk");
        result.Disclaimer.Should().Contain("suggestion");
    }

    [Fact]
    public async Task GetScriptAsync_ExcludesDuplicateTransactions()
    {
        var account = MakeAccount();
        _db.Accounts.Add(account);
        var dup = MakeDebit(account.Id, 20m, DateOnly.FromDateTime(DateTime.UtcNow), "EE Mobile");
        dup.IsDuplicate = true;
        _db.Transactions.Add(dup);
        await _db.SaveChangesAsync();

        var result = await _sut.GetScriptAsync(_userId, "EE Mobile");

        result.Should().BeNull();
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

    private Transaction MakeDebit(Guid accountId, decimal amount, DateOnly date, string payee) => new()
    {
        Id = Guid.NewGuid(),
        UserId = _userId,
        AccountId = accountId,
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
