using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Transactions.Models;
using FinanceApi.Features.Transactions.Services;

namespace FinanceApi.UnitTests.Features.Transactions.Services;

public class TransactionServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly TransactionService _sut;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _otherUserId = Guid.NewGuid();
    private readonly Guid _accountId = Guid.NewGuid();

    public TransactionServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new FinanceDbContext(options);

        _db.Accounts.Add(new Account
        {
            Id = _accountId,
            UserId = _userId,
            Name = "Test Account",
            Type = AccountType.Checking,
            Currency = "GBP",
            Balance = 1000m
        });
        _db.SaveChanges();

        _sut = new TransactionService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ── GetTransactionsAsync ──────────────────────────────────────────────────

    [Fact]
    public async Task GetTransactionsAsync_ReturnsOnlyTransactionsForRequestedAccount()
    {
        var otherAccountId = Guid.NewGuid();
        _db.Transactions.AddRange(
            MakeTransaction(_userId, _accountId, "TESCO"),
            MakeTransaction(_userId, otherAccountId, "ASDA")
        );
        await _db.SaveChangesAsync();

        var result = await _sut.GetTransactionsAsync(_userId, MakeListRequest(_accountId));

        result.Items.Should().HaveCount(1);
        result.Items.Single().Description.Should().Be("TESCO");
    }

    [Fact]
    public async Task GetTransactionsAsync_FiltersByDateRangeFromInclusive()
    {
        _db.Transactions.AddRange(
            MakeTransaction(_userId, _accountId, "Old", date: new DateOnly(2024, 12, 31)),
            MakeTransaction(_userId, _accountId, "Current", date: new DateOnly(2025, 1, 1)),
            MakeTransaction(_userId, _accountId, "Future", date: new DateOnly(2025, 6, 1))
        );
        await _db.SaveChangesAsync();

        var request = MakeListRequest(_accountId) with { From = new DateOnly(2025, 1, 1) };
        var result = await _sut.GetTransactionsAsync(_userId, request);

        result.Items.Should().HaveCount(2);
        result.Items.Should().NotContain(t => t.Description == "Old");
    }

    [Fact]
    public async Task GetTransactionsAsync_FiltersByTypeDebit()
    {
        _db.Transactions.AddRange(
            MakeTransaction(_userId, _accountId, "DEBIT", type: TransactionType.Debit),
            MakeTransaction(_userId, _accountId, "CREDIT", type: TransactionType.Credit)
        );
        await _db.SaveChangesAsync();

        var request = MakeListRequest(_accountId) with { Type = TransactionType.Debit };
        var result = await _sut.GetTransactionsAsync(_userId, request);

        result.Items.Should().HaveCount(1);
        result.Items.Single().Description.Should().Be("DEBIT");
    }

    [Fact]
    public async Task GetTransactionsAsync_SearchFiltersOnDescription()
    {
        _db.Transactions.AddRange(
            MakeTransaction(_userId, _accountId, "NETFLIX SUBSCRIPTION"),
            MakeTransaction(_userId, _accountId, "TESCO PETROL")
        );
        await _db.SaveChangesAsync();

        var request = MakeListRequest(_accountId) with { Search = "netflix" };
        var result = await _sut.GetTransactionsAsync(_userId, request);

        result.Items.Should().HaveCount(1);
        result.Items.Single().Description.Should().Contain("NETFLIX");
    }

    [Fact]
    public async Task GetTransactionsAsync_PaginatesResults()
    {
        for (var i = 0; i < 10; i++)
            _db.Transactions.Add(MakeTransaction(_userId, _accountId, $"TX {i}"));
        await _db.SaveChangesAsync();

        var request = MakeListRequest(_accountId) with { Page = 1, PageSize = 3 };
        var result = await _sut.GetTransactionsAsync(_userId, request);

        result.Items.Should().HaveCount(3);
        result.TotalCount.Should().Be(10);
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(3);
    }

    // ── CreateTransactionAsync ────────────────────────────────────────────────

    [Fact]
    public async Task CreateTransactionAsync_DebitTransactionReducesAccountBalance()
    {
        var request = new CreateTransactionRequest(
            _accountId, null, TransactionType.Debit, 200m, "GBP",
            "RENT", null, new DateOnly(2025, 1, 1), null, null, null);

        await _sut.CreateTransactionAsync(_userId, request);

        var account = await _db.Accounts.FindAsync(_accountId);
        account!.Balance.Should().Be(800m); // 1000 - 200
    }

    [Fact]
    public async Task CreateTransactionAsync_CreditTransactionIncreasesAccountBalance()
    {
        var request = new CreateTransactionRequest(
            _accountId, null, TransactionType.Credit, 500m, "GBP",
            "SALARY", null, new DateOnly(2025, 1, 1), null, null, null);

        await _sut.CreateTransactionAsync(_userId, request);

        var account = await _db.Accounts.FindAsync(_accountId);
        account!.Balance.Should().Be(1500m); // 1000 + 500
    }

    [Fact]
    public async Task CreateTransactionAsync_SetsImportSourceToManual()
    {
        var request = new CreateTransactionRequest(
            _accountId, null, TransactionType.Debit, 10m, "GBP",
            "COFFEE", null, new DateOnly(2025, 1, 1), null, null, null);

        var result = await _sut.CreateTransactionAsync(_userId, request);

        result.ImportSource.Should().Be(ImportSource.Manual);
    }

    // ── UpdateTransactionAsync ────────────────────────────────────────────────

    [Fact]
    public async Task UpdateTransactionAsync_UpdatesDescriptionAndCategory()
    {
        var categoryId = Guid.NewGuid();
        var transaction = MakeTransaction(_userId, _accountId, "INITIAL DESC");
        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();

        var request = new UpdateTransactionRequest(categoryId, "UPDATED DESC", null, null, null);
        var result = await _sut.UpdateTransactionAsync(_userId, transaction.Id, request);

        result.Should().NotBeNull();
        result!.Description.Should().Be("UPDATED DESC");
        result.CategoryId.Should().Be(categoryId);
    }

    [Fact]
    public async Task UpdateTransactionAsync_WhenTransactionNotFound_ReturnsNull()
    {
        var request = new UpdateTransactionRequest(null, "X", null, null, null);

        var result = await _sut.UpdateTransactionAsync(_userId, Guid.NewGuid(), request);

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateTransactionAsync_CanMarkTransactionAsReviewed()
    {
        var transaction = MakeTransaction(_userId, _accountId, "PENDING");
        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();

        var request = new UpdateTransactionRequest(null, null, null, null, true);
        var result = await _sut.UpdateTransactionAsync(_userId, transaction.Id, request);

        result!.IsReviewed.Should().BeTrue();
    }

    // ── DeleteTransactionAsync ────────────────────────────────────────────────

    [Fact]
    public async Task DeleteTransactionAsync_WhenDebit_ReversesByAddingBackToBalance()
    {
        var transaction = MakeTransaction(_userId, _accountId, "DEBIT TX", amount: 300m, type: TransactionType.Debit);
        _db.Transactions.Add(transaction);
        var account = await _db.Accounts.FindAsync(_accountId);
        account!.Balance -= 300m; // simulate the debit having already been applied
        await _db.SaveChangesAsync();

        await _sut.DeleteTransactionAsync(_userId, transaction.Id);

        var updatedAccount = await _db.Accounts.FindAsync(_accountId);
        updatedAccount!.Balance.Should().Be(1000m); // back to original
    }

    [Fact]
    public async Task DeleteTransactionAsync_WhenCredit_ReversesBySubtractingFromBalance()
    {
        var transaction = MakeTransaction(_userId, _accountId, "CREDIT TX", amount: 500m, type: TransactionType.Credit);
        _db.Transactions.Add(transaction);
        var account = await _db.Accounts.FindAsync(_accountId);
        account!.Balance += 500m; // simulate the credit having already been applied
        await _db.SaveChangesAsync();

        await _sut.DeleteTransactionAsync(_userId, transaction.Id);

        var updatedAccount = await _db.Accounts.FindAsync(_accountId);
        updatedAccount!.Balance.Should().Be(1000m); // back to original
    }

    [Fact]
    public async Task DeleteTransactionAsync_WhenTransactionNotFound_ReturnsFalse()
    {
        var result = await _sut.DeleteTransactionAsync(_userId, Guid.NewGuid());

        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteTransactionAsync_RemovesTransactionFromDatabase()
    {
        var transaction = MakeTransaction(_userId, _accountId, "TO DELETE");
        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();

        await _sut.DeleteTransactionAsync(_userId, transaction.Id);

        var inDb = await _db.Transactions.FindAsync(transaction.Id);
        inDb.Should().BeNull();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Transaction MakeTransaction(
        Guid userId,
        Guid accountId,
        string description,
        decimal amount = 50m,
        TransactionType type = TransactionType.Debit,
        DateOnly? date = null) =>
        new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AccountId = accountId,
            Description = description,
            Amount = amount,
            BaseCurrencyAmount = amount,
            Currency = "GBP",
            Type = type,
            TransactionDate = date ?? new DateOnly(2025, 1, 15),
            ImportSource = ImportSource.Manual
        };

    private static TransactionListRequest MakeListRequest(Guid accountId) =>
        new(accountId, null, null, null, null, null, 1, 50);
}
