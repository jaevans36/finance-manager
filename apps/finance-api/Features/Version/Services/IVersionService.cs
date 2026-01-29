using FinanceApi.Features.Version.DTOs;

namespace FinanceApi.Features.Version.Services;

/// <summary>
/// Service interface for version information
/// </summary>
public interface IVersionService
{
    /// <summary>
    /// Get current version from VERSION.json
    /// </summary>
    Task<VersionDto?> GetCurrentVersionAsync();
    
    /// <summary>
    /// Get all version history from CHANGELOG.md
    /// </summary>
    Task<VersionHistoryDto> GetVersionHistoryAsync();
    
    /// <summary>
    /// Get specific version by number
    /// </summary>
    Task<VersionHistoryItemDto?> GetVersionByNumberAsync(string version);
}
