namespace FinanceApi.Features.Version.DTOs;

/// <summary>
/// DTO for version information response
/// </summary>
public class VersionDto
{
    public string Version { get; set; } = string.Empty;
    public string ReleaseDate { get; set; } = string.Empty;
    public string Codename { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool Breaking { get; set; }
    public List<ChangelogEntryDto> Changelog { get; set; } = new();
}

/// <summary>
/// DTO for a single changelog entry
/// </summary>
public class ChangelogEntryDto
{
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Impact { get; set; }
}

/// <summary>
/// DTO for version history response
/// </summary>
public class VersionHistoryDto
{
    public List<VersionHistoryItemDto> Versions { get; set; } = new();
    public int TotalVersions { get; set; }
    public string? EarliestVersion { get; set; }
    public string? LatestVersion { get; set; }
}

/// <summary>
/// DTO for a single version in the history list
/// </summary>
public class VersionHistoryItemDto
{
    public string Version { get; set; } = string.Empty;
    public string ReleaseDate { get; set; } = string.Empty;
    public string Codename { get; set; } = string.Empty;
    public List<ChangelogSectionDto> Changelog { get; set; } = new();
}

/// <summary>
/// DTO for a changelog section (Added, Changed, Fixed, etc.)
/// </summary>
public class ChangelogSectionDto
{
    public string Section { get; set; } = string.Empty;
    public List<ChangelogItemDto> Items { get; set; } = new();
}

/// <summary>
/// DTO for a changelog item within a section
/// </summary>
public class ChangelogItemDto
{
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
}
