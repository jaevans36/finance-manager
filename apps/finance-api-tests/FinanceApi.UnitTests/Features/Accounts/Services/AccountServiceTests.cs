using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Accounts.Services;

namespace FinanceApi.UnitTests.Features.Accounts.Services;

public class AccountServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly AccountService _sut;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _otherUserId = Guid.NewGuid();

    public AccountServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new FinanceDbContext(options);
        _sut = new AccountService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ── GetAccountsAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetAccountsAsync_ReturnsOnlyActiveAccountsForUser()
    {
        _db.Accounts.AddRange(
            MakeAccount(_userId, "Current", isActive: true),
            MakeAccount(_userId, "Old Account", isActive: false),
            MakeAccount(_otherUserId, "Other User", isActive: true)
        );
        await _db.SaveChangesAsync();

        var result = await _sut.GetAccountsAsync(_userId);

        result.Should().HaveCount(1);
        result.Single().Name.Should().Be("Current");
    }

    [Fact]
    public async Task GetAccountsAsync_ReturnsAccountsOrderedByName()
    {
        _db.Accounts.AddRange(
            MakeAccount(_userId, "Zorro Savings"),
            MakeAccount(_userId, "Apple Current"),
            MakeAccount(_userId, "Monzo")
        );
        await _db.SaveChangesAsync();

        var result = (await _sut.GetAccountsAsync(_userId)).ToList();

        result.Select(a => a.Name).Should().BeInAscendingOrder();
    }

    [Fact]
    public async Task GetAccountsAsync_DoesNotReturnOtherUsersAccounts()
    {
        _db.Accounts.Add(MakeAccount(_otherUserId, "Their Account"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetAccountsAsync(_userId);

        result.Should().BeEmpty();
    }

    // ── CreateAccountAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAccountAsync_SetsUserIdFromParameter()
    {
        var request = new CreateAccountRequest("Test", AccountType.Checking, "GBP", null, null, null, null, null, false, null);

        var account = await _sut.CreateAccountAsync(_userId, request);

        account.UserId.Should().Be(_userId);
    }

    [Fact]
    public async Task CreateAccountAsync_WhenInitialBalanceProvided_SetsBalance()
    {
        var request = new CreateAccountRequest("ISA", AccountType.CashIsa, "GBP", 5000m, null, null, null, null, false, null);

        var account = await _sut.CreateAccountAsync(_userId, request);

        account.Balance.Should().Be(5000m);
    }

    [Fact]
    public async Task CreateAccountAsync_WhenNoInitialBalance_DefaultsToZero()
    {
        var request = new CreateAccountRequest("Empty", AccountType.Savings, "GBP", null, null, null, null, null, false, null);

        var account = await _sut.CreateAccountAsync(_userId, request);

        account.Balance.Should().Be(0m);
    }

    // ── UpdateAccountAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateAccountAsync_WhenAccountExists_UpdatesProvidedFields()
    {
        var account = MakeAccount(_userId, "Original Name");
        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        var request = new UpdateAccountRequest("Renamed", null, null, null, "Barclays", null, null, null, null, null, null);
        var result = await _sut.UpdateAccountAsync(_userId, account.Id, request);

        result.Should().NotBeNull();
        result!.Name.Should().Be("Renamed");
        result.Institution.Should().Be("Barclays");
    }

    [Fact]
    public async Task UpdateAccountAsync_WhenAccountNotFound_ReturnsNull()
    {
        var request = new UpdateAccountRequest("X", null, null, null, null, null, null, null, null, null, null);

        var result = await _sut.UpdateAccountAsync(_userId, Guid.NewGuid(), request);

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAccountAsync_WhenWrongUser_ReturnsNull()
    {
        var account = MakeAccount(_otherUserId, "Their Account");
        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        var request = new UpdateAccountRequest("Hacked", null, null, null, null, null, null, null, null, null, null);
        var result = await _sut.UpdateAccountAsync(_userId, account.Id, request);

        result.Should().BeNull();
    }

    // ── DeleteAccountAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAccountAsync_SoftDeletesRatherThanPhysicallyRemoving()
    {
        var account = MakeAccount(_userId, "To Delete");
        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        var deleted = await _sut.DeleteAccountAsync(_userId, account.Id);

        deleted.Should().BeTrue();
        var inDb = await _db.Accounts.FindAsync(account.Id);
        inDb.Should().NotBeNull();
        inDb!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAccountAsync_WhenAccountNotFound_ReturnsFalse()
    {
        var result = await _sut.DeleteAccountAsync(_userId, Guid.NewGuid());

        result.Should().BeFalse();
    }

    // ── GetNetWorthAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetNetWorthAsync_SumsAllActiveNonExcludedAccounts()
    {
        _db.Accounts.AddRange(
            MakeAccount(_userId, "Current", balance: 1000m),
            MakeAccount(_userId, "Savings", balance: 5000m),
            MakeAccount(_userId, "Mortgage", balance: -150000m, excludeFromNetWorth: true),
            MakeAccount(_userId, "Closed", balance: 200m, isActive: false)
        );
        await _db.SaveChangesAsync();

        var netWorth = await _sut.GetNetWorthAsync(_userId);

        netWorth.Should().Be(6000m); // only Current + Savings
    }

    [Fact]
    public async Task GetNetWorthAsync_OnlyIncludesCurrentUsersAccounts()
    {
        _db.Accounts.AddRange(
            MakeAccount(_userId, "My Account", balance: 500m),
            MakeAccount(_otherUserId, "Their Account", balance: 10000m)
        );
        await _db.SaveChangesAsync();

        var netWorth = await _sut.GetNetWorthAsync(_userId);

        netWorth.Should().Be(500m);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Account MakeAccount(
        Guid userId,
        string name,
        bool isActive = true,
        decimal balance = 100m,
        bool excludeFromNetWorth = false) =>
        new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = name,
            Type = AccountType.Checking,
            Currency = "GBP",
            Balance = balance,
            IsActive = isActive,
            ExcludeFromNetWorth = excludeFromNetWorth
        };
}
