using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Assets.Models;
using FinanceApi.Features.Assets.Services;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;

namespace FinanceApi.UnitTests.Features.Assets.Services;

public class AssetServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly AssetService _sut;
    private readonly Guid _userId = Guid.NewGuid();

    public AssetServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options, FinanceApi.UnitTests.TestHelpers.TestEncryption.Service);
        _sut = new AssetService(_db, new ActivityLogService(_db));
    }

    public void Dispose() => _db.Dispose();

    // ── GetAssetsAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetAssetsAsync_ReturnsOnlyTheCallersAssets()
    {
        _db.Assets.AddRange(
            MakeAsset(_userId, "House"),
            MakeAsset(Guid.NewGuid(), "Someone else's car")
        );
        await _db.SaveChangesAsync();

        var result = await _sut.GetAssetsAsync(_userId);

        result.Should().ContainSingle(a => a.Name == "House");
    }

    [Fact]
    public async Task GetAssetsAsync_WhenNoAssets_ReturnsEmpty()
    {
        var result = await _sut.GetAssetsAsync(_userId);
        result.Should().BeEmpty();
    }

    // ── CreateAssetAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAssetAsync_StoresAssetWithCorrectFields()
    {
        var request = new CreateAssetRequest("The house", AssetType.Property, 350000m, "3-bed semi");

        var result = await _sut.CreateAssetAsync(_userId, request);

        result.Name.Should().Be("The house");
        result.Type.Should().Be(AssetType.Property);
        result.Value.Should().Be(350000m);
        result.Notes.Should().Be("3-bed semi");
        (await _db.Assets.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task CreateAssetAsync_WritesAnAssetCreatedLogEntry()
    {
        var request = new CreateAssetRequest("The car", AssetType.Vehicle, 8000m);

        await _sut.CreateAssetAsync(_userId, request, "203.0.113.5", "TestAgent/1.0");

        var log = await _db.ActivityLogs.SingleAsync();
        log.Action.Should().Be(FinanceActivityType.AssetCreated);
        log.IpAddress.Should().Be("203.0.113.5");
        // Name is column-encrypted — never put its value in a log.
        log.Description.Should().NotContain("The car");
    }

    // ── UpdateAssetAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateAssetAsync_WhenAssetExists_UpdatesValue()
    {
        var asset = MakeAsset(_userId, "House", value: 350000m);
        _db.Assets.Add(asset);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateAssetAsync(_userId, asset.Id, new UpdateAssetRequest(Value: 375000m));

        result.Should().NotBeNull();
        result!.Value.Should().Be(375000m);
    }

    [Fact]
    public async Task UpdateAssetAsync_WhenAssetBelongsToOtherUser_ReturnsNull()
    {
        var asset = MakeAsset(Guid.NewGuid(), "Other");
        _db.Assets.Add(asset);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateAssetAsync(_userId, asset.Id, new UpdateAssetRequest(Value: 1m));

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAssetAsync_LogsChangedFieldNamesOnly_NeverTheEncryptedValue()
    {
        var asset = MakeAsset(_userId, "Original Name", value: 350000m);
        _db.Assets.Add(asset);
        await _db.SaveChangesAsync();

        await _sut.UpdateAssetAsync(_userId, asset.Id, new UpdateAssetRequest(Name: "Renamed House", Value: 375000m));

        var log = await _db.ActivityLogs.SingleAsync(l => l.Action == FinanceActivityType.AssetUpdated);
        log.Description.Should().Contain("Name").And.Contain("Value");
        log.Description.Should().NotContain("Renamed House");
    }

    [Fact]
    public async Task UpdateAssetAsync_WhenRequestChangesNothing_DoesNotWriteALogEntry()
    {
        var asset = MakeAsset(_userId, "Untouched");
        _db.Assets.Add(asset);
        await _db.SaveChangesAsync();

        await _sut.UpdateAssetAsync(_userId, asset.Id, new UpdateAssetRequest());

        (await _db.ActivityLogs.CountAsync()).Should().Be(0);
    }

    // ── DeleteAssetAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAssetAsync_WhenAssetExists_RemovesItAndReturnsTrue()
    {
        var asset = MakeAsset(_userId, "To delete");
        _db.Assets.Add(asset);
        await _db.SaveChangesAsync();

        var result = await _sut.DeleteAssetAsync(_userId, asset.Id);

        result.Should().BeTrue();
        (await _db.Assets.FindAsync(asset.Id)).Should().BeNull();
    }

    [Fact]
    public async Task DeleteAssetAsync_WhenAssetBelongsToOtherUser_ReturnsFalse()
    {
        var asset = MakeAsset(Guid.NewGuid(), "Other");
        _db.Assets.Add(asset);
        await _db.SaveChangesAsync();

        var result = await _sut.DeleteAssetAsync(_userId, asset.Id);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAssetAsync_WritesAnAssetDeletedLogEntry()
    {
        var asset = MakeAsset(_userId, "To delete");
        _db.Assets.Add(asset);
        await _db.SaveChangesAsync();

        await _sut.DeleteAssetAsync(_userId, asset.Id);

        var log = await _db.ActivityLogs.SingleAsync();
        log.Action.Should().Be(FinanceActivityType.AssetDeleted);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static Asset MakeAsset(Guid userId, string name, decimal value = 1000m, AssetType type = AssetType.Other) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Name = name,
        Type = type,
        Value = value,
    };
}
