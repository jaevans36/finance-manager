using FinanceApi.Features.Assets.Models;

namespace FinanceApi.Features.Assets.Services;

public interface IAssetService
{
    Task<IEnumerable<AssetDto>> GetAssetsAsync(Guid userId, CancellationToken ct = default);
    Task<AssetDto> CreateAssetAsync(Guid userId, CreateAssetRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<AssetDto?> UpdateAssetAsync(Guid userId, Guid assetId, UpdateAssetRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<bool> DeleteAssetAsync(Guid userId, Guid assetId, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
}
