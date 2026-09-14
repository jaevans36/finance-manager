using FinanceApi.Data;
using FinanceApi.Features.Assets.Models;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Assets.Services;

/// <summary>CRUD for manually-tracked real assets (property, vehicle, other).</summary>
public class AssetService : IAssetService
{
    private readonly FinanceDbContext _db;
    private readonly IActivityLogService _activityLog;

    public AssetService(FinanceDbContext db, IActivityLogService activityLog)
    {
        _db = db;
        _activityLog = activityLog;
    }

    public async Task<IEnumerable<AssetDto>> GetAssetsAsync(Guid userId, CancellationToken ct = default)
    {
        // Name is column-encrypted — sort after materialization, SQL can't ORDER BY ciphertext.
        var assets = await _db.Assets
            .Where(a => a.UserId == userId)
            .ToListAsync(ct);

        return assets.OrderBy(a => a.Name).Select(ToDto);
    }

    public async Task<AssetDto> CreateAssetAsync(Guid userId, CreateAssetRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var asset = new Asset
        {
            UserId = userId,
            Name = request.Name,
            Type = request.Type,
            Value = request.Value,
            Notes = request.Notes,
        };
        _db.Assets.Add(asset);
        await _db.SaveChangesAsync(ct);

        // Name/Notes are column-encrypted — never put their values in a log.
        await _activityLog.LogAsync(userId, FinanceActivityType.AssetCreated, $"Created {asset.Type} asset", ipAddress, userAgent);
        return ToDto(asset);
    }

    public async Task<AssetDto?> UpdateAssetAsync(Guid userId, Guid assetId, UpdateAssetRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var asset = await _db.Assets.FirstOrDefaultAsync(a => a.Id == assetId && a.UserId == userId, ct);
        if (asset is null) return null;

        var changedFields = new List<string>();
        if (request.Name is not null) { asset.Name = request.Name; changedFields.Add(nameof(Asset.Name)); }
        if (request.Type is not null) { asset.Type = request.Type.Value; changedFields.Add(nameof(Asset.Type)); }
        if (request.Value is not null) { asset.Value = request.Value.Value; changedFields.Add(nameof(Asset.Value)); }
        if (request.Notes is not null) { asset.Notes = request.Notes; changedFields.Add(nameof(Asset.Notes)); }
        asset.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        if (changedFields.Count > 0)
        {
            await _activityLog.LogAsync(userId, FinanceActivityType.AssetUpdated, $"Updated: {string.Join(", ", changedFields)}", ipAddress, userAgent);
        }
        return ToDto(asset);
    }

    public async Task<bool> DeleteAssetAsync(Guid userId, Guid assetId, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var asset = await _db.Assets.FirstOrDefaultAsync(a => a.Id == assetId && a.UserId == userId, ct);
        if (asset is null) return false;

        _db.Assets.Remove(asset);
        await _db.SaveChangesAsync(ct);
        await _activityLog.LogAsync(userId, FinanceActivityType.AssetDeleted, $"Deleted {asset.Type} asset", ipAddress, userAgent);
        return true;
    }

    private static AssetDto ToDto(Asset a) => new(a.Id, a.Name, a.Type, a.Value, a.Notes, a.CreatedAt, a.UpdatedAt);
}
