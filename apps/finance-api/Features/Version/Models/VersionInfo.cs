namespace FinanceApi.Features.Version.Models;

/// <summary>
/// Represents version information from VERSION.json or CHANGELOG.md
/// </summary>
public class VersionInfo
{
    public string Version { get; set; } = string.Empty;
    public DateTime ReleaseDate { get; set; }
    public string Codename { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool Breaking { get; set; }
    public List<ChangelogSection> Sections { get; set; } = new();
}

/// <summary>
/// Represents a section in the changelog (Added, Changed, Fixed, etc.)
/// </summary>
public class ChangelogSection
{
    public string Section { get; set; } = string.Empty; // Added, Changed, Fixed, etc.
    public List<ChangelogItem> Items { get; set; } = new();
}

/// <summary>
/// Represents a single changelog item
/// </summary>
public class ChangelogItem
{
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = "feat"; // feat, fix, perf, docs, test
    public string? Impact { get; set; } // high, medium, low
}
