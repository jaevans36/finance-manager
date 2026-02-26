using FinanceApi.Features.Version.Models;

namespace FinanceApi.Features.Version.Services;

/// <summary>
/// Service interface for parsing CHANGELOG.md
/// </summary>
public interface IChangelogParser
{
    /// <summary>
    /// Parse all versions from CHANGELOG.md
    /// </summary>
    Task<List<VersionInfo>> ParseChangelogAsync();
    
    /// <summary>
    /// Parse a specific version from CHANGELOG.md
    /// </summary>
    Task<VersionInfo?> ParseVersionAsync(string version);
}
