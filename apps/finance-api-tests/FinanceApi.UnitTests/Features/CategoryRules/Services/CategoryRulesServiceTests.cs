using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.CategoryRules.Models;
using FinanceApi.Features.CategoryRules.Services;
using FinanceApi.Features.Categories.Models;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.UnitTests.Features.CategoryRules.Services;

public class CategoryRulesServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly CategoryRulesService _sut;
    private readonly Guid _userId = Guid.NewGuid();
    private Guid _groceriesId;
    private Guid _transportId;

    public CategoryRulesServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new FinanceDbContext(options);

        _groceriesId = Guid.NewGuid();
        _transportId = Guid.NewGuid();

        _db.Categories.AddRange(
            new Category { Id = _groceriesId, Name = "Groceries", IsSystem = true },
            new Category { Id = _transportId, Name = "Transport", IsSystem = true }
        );
        _db.SaveChanges();

        _sut = new CategoryRulesService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ── ApplyRuleToTransaction — Contains ────────────────────────────────────

    [Fact]
    public async Task ApplyRuleAsync_WhenContainsRuleMatchesPayee_ReturnsCategoryId()
    {
        await SeedRuleAsync("Tesco", RuleMatchType.Contains, _groceriesId);
        var tx = MakeTx(payee: "Tesco");

        var result = await _sut.ApplyRuleAsync(_userId, tx);

        result.Should().Be(_groceriesId);
    }

    [Fact]
    public async Task ApplyRuleAsync_WhenContainsRuleMatchesDescription_ReturnsCategoryId()
    {
        await SeedRuleAsync("TESCO", RuleMatchType.Contains, _groceriesId);
        var tx = MakeTx(description: "TESCO METRO", payee: null);

        var result = await _sut.ApplyRuleAsync(_userId, tx);

        result.Should().Be(_groceriesId);
    }

    // ── ApplyRuleToTransaction — StartsWith ──────────────────────────────────

    [Fact]
    public async Task ApplyRuleAsync_WhenStartsWithRuleMatches_ReturnsCategoryId()
    {
        await SeedRuleAsync("TFL", RuleMatchType.StartsWith, _transportId);
        var tx = MakeTx(payee: "TFL TRAVEL LONDON");

        var result = await _sut.ApplyRuleAsync(_userId, tx);

        result.Should().Be(_transportId);
    }

    [Fact]
    public async Task ApplyRuleAsync_WhenStartsWithRuleDoesNotMatchMidString_ReturnsNull()
    {
        await SeedRuleAsync("TFL", RuleMatchType.StartsWith, _transportId);
        var tx = MakeTx(payee: "UBER TFL PASS");

        var result = await _sut.ApplyRuleAsync(_userId, tx);

        result.Should().BeNull();
    }

    // ── ApplyRuleToTransaction — Exact ───────────────────────────────────────

    [Fact]
    public async Task ApplyRuleAsync_WhenExactRuleMatchesExactly_ReturnsCategoryId()
    {
        await SeedRuleAsync("Amazon", RuleMatchType.Exact, _groceriesId);
        var tx = MakeTx(payee: "Amazon");

        var result = await _sut.ApplyRuleAsync(_userId, tx);

        result.Should().Be(_groceriesId);
    }

    [Fact]
    public async Task ApplyRuleAsync_WhenExactRuleDoesNotMatchSubstring_ReturnsNull()
    {
        await SeedRuleAsync("Amazon", RuleMatchType.Exact, _groceriesId);
        var tx = MakeTx(payee: "Amazon Prime");

        var result = await _sut.ApplyRuleAsync(_userId, tx);

        result.Should().BeNull();
    }

    // ── Priority ordering ────────────────────────────────────────────────────

    [Fact]
    public async Task ApplyRuleAsync_WhenMultipleRulesMatch_ReturnsHighestPriority()
    {
        await SeedRuleAsync("Tesco", RuleMatchType.Contains, _groceriesId, priority: 10);
        await SeedRuleAsync("Tesco", RuleMatchType.Contains, _transportId, priority: 1);
        var tx = MakeTx(payee: "Tesco");

        var result = await _sut.ApplyRuleAsync(_userId, tx);

        result.Should().Be(_transportId); // priority 1 wins (lower = higher priority)
    }

    // ── Inactive rules ignored ───────────────────────────────────────────────

    [Fact]
    public async Task ApplyRuleAsync_WhenMatchingRuleIsInactive_ReturnsNull()
    {
        await SeedRuleAsync("Tesco", RuleMatchType.Contains, _groceriesId, isActive: false);
        var tx = MakeTx(payee: "Tesco");

        var result = await _sut.ApplyRuleAsync(_userId, tx);

        result.Should().BeNull();
    }

    // ── Other user's rules not applied ──────────────────────────────────────

    [Fact]
    public async Task ApplyRuleAsync_WhenRuleBelongsToOtherUser_ReturnsNull()
    {
        var otherUserId = Guid.NewGuid();
        _db.CategoryRules.Add(new CategoryRule
        {
            UserId = otherUserId,
            Pattern = "Tesco",
            MatchType = RuleMatchType.Contains,
            CategoryId = _groceriesId,
            Priority = 1,
            IsActive = true
        });
        await _db.SaveChangesAsync();

        var tx = MakeTx(payee: "Tesco");
        var result = await _sut.ApplyRuleAsync(_userId, tx);

        result.Should().BeNull();
    }

    // ── No matching rule ─────────────────────────────────────────────────────

    [Fact]
    public async Task ApplyRuleAsync_WhenNoRulesExist_ReturnsNull()
    {
        var tx = MakeTx(payee: "Unknown Merchant");

        var result = await _sut.ApplyRuleAsync(_userId, tx);

        result.Should().BeNull();
    }

    // ── Case insensitivity ────────────────────────────────────────────────────

    [Fact]
    public async Task ApplyRuleAsync_MatchingIsCaseInsensitive()
    {
        await SeedRuleAsync("tesco", RuleMatchType.Contains, _groceriesId);
        var tx = MakeTx(payee: "TESCO METRO");

        var result = await _sut.ApplyRuleAsync(_userId, tx);

        result.Should().Be(_groceriesId);
    }

    // ── AppliedCount incremented ─────────────────────────────────────────────

    [Fact]
    public async Task ApplyRuleAsync_WhenRuleMatches_IncrementsAppliedCount()
    {
        await SeedRuleAsync("Tesco", RuleMatchType.Contains, _groceriesId);

        var rule = await _db.CategoryRules.FirstAsync(r => r.UserId == _userId);
        rule.AppliedCount.Should().Be(0);

        await _sut.ApplyRuleAsync(_userId, MakeTx(payee: "Tesco"));
        await _db.Entry(rule).ReloadAsync();

        rule.AppliedCount.Should().Be(1);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task SeedRuleAsync(string pattern, RuleMatchType matchType, Guid categoryId,
        int priority = 1, bool isActive = true)
    {
        _db.CategoryRules.Add(new CategoryRule
        {
            UserId = _userId,
            Pattern = pattern,
            MatchType = matchType,
            CategoryId = categoryId,
            Priority = priority,
            IsActive = isActive
        });
        await _db.SaveChangesAsync();
    }

    private static Transaction MakeTx(string? payee = null, string description = "Test")
        => new()
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            AccountId = Guid.NewGuid(),
            Description = description,
            Payee = payee,
            Amount = 10m,
            TransactionDate = DateOnly.FromDateTime(DateTime.UtcNow)
        };
}
