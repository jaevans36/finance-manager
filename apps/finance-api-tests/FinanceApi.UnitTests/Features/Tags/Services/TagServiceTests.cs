using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Tags.Models;
using FinanceApi.Features.Tags.Services;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.UnitTests.Features.Tags.Services;

public class TagServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly TagService _sut;
    private readonly Guid _userId = Guid.NewGuid();

    public TagServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options, FinanceApi.UnitTests.TestHelpers.TestEncryption.Service);
        _sut = new TagService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ── GetTagsAsync ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetTagsAsync_ReturnsOnlyTheCallersTags()
    {
        _db.Tags.AddRange(
            MakeTag(_userId, "Wales holiday 2026"),
            MakeTag(Guid.NewGuid(), "Someone else's tag")
        );
        await _db.SaveChangesAsync();

        var result = await _sut.GetTagsAsync(_userId);

        result.Should().ContainSingle(t => t.Name == "Wales holiday 2026");
    }

    [Fact]
    public async Task GetTagsAsync_IncludesTheTransactionCount()
    {
        var tag = MakeTag(_userId, "Kitchen reno");
        _db.Tags.Add(tag);
        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            AccountId = Guid.NewGuid(),
            Description = "B&Q",
            Amount = 50m,
            BaseCurrencyAmount = 50m,
            Currency = "GBP",
            TransactionDate = new DateOnly(2026, 1, 1),
        };
        _db.Transactions.Add(transaction);
        _db.TransactionTags.Add(new TransactionTag { TransactionId = transaction.Id, TagId = tag.Id });
        await _db.SaveChangesAsync();

        var result = await _sut.GetTagsAsync(_userId);

        result.Should().ContainSingle(t => t.Name == "Kitchen reno" && t.TransactionCount == 1);
    }

    [Fact]
    public async Task GetTagsAsync_WhenNoTags_ReturnsEmpty()
    {
        var result = await _sut.GetTagsAsync(_userId);
        result.Should().BeEmpty();
    }

    // ── CreateTagAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task CreateTagAsync_StoresTagWithCorrectFields()
    {
        var request = new CreateTagRequest("Wales holiday 2026", "#22C55E");

        var result = await _sut.CreateTagAsync(_userId, request);

        result.Name.Should().Be("Wales holiday 2026");
        result.Colour.Should().Be("#22C55E");
        (await _db.Tags.CountAsync()).Should().Be(1);
    }

    // ── DeleteTagAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteTagAsync_WhenTagExists_RemovesItAndReturnsTrue()
    {
        var tag = MakeTag(_userId, "To delete");
        _db.Tags.Add(tag);
        await _db.SaveChangesAsync();

        var result = await _sut.DeleteTagAsync(_userId, tag.Id);

        result.Should().BeTrue();
        (await _db.Tags.FindAsync(tag.Id)).Should().BeNull();
    }

    [Fact]
    public async Task DeleteTagAsync_WhenTagBelongsToOtherUser_ReturnsFalse()
    {
        var tag = MakeTag(Guid.NewGuid(), "Other");
        _db.Tags.Add(tag);
        await _db.SaveChangesAsync();

        var result = await _sut.DeleteTagAsync(_userId, tag.Id);

        result.Should().BeFalse();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static Tag MakeTag(Guid userId, string name) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Name = name,
    };
}
