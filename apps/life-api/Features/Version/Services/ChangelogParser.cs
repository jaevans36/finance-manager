using System.Globalization;
using System.Text.RegularExpressions;
using LifeApi.Features.Version.Models;

namespace LifeApi.Features.Version.Services;

/// <summary>
/// Parser for CHANGELOG.md following Keep a Changelog format
/// </summary>
public class ChangelogParser : IChangelogParser
{
    private readonly ILogger<ChangelogParser> _logger;
    private readonly string _changelogPath;

    public ChangelogParser(ILogger<ChangelogParser> logger, IWebHostEnvironment env)
    {
        _logger = logger;
        
        // Navigate from apps/life-api to project root
        var projectRoot = Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", ".."));
        _changelogPath = Path.Combine(projectRoot, "CHANGELOG.md");
        
        _logger.LogInformation("CHANGELOG.md path: {Path}", _changelogPath);
    }

    public async Task<List<VersionInfo>> ParseChangelogAsync()
    {
        try
        {
            if (!File.Exists(_changelogPath))
            {
                _logger.LogWarning("CHANGELOG.md not found at {Path}", _changelogPath);
                return new List<VersionInfo>();
            }

            var content = await File.ReadAllTextAsync(_changelogPath);
            return ParseVersionsFromContent(content);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing CHANGELOG.md");
            return new List<VersionInfo>();
        }
    }

    public async Task<VersionInfo?> ParseVersionAsync(string version)
    {
        var versions = await ParseChangelogAsync();
        return versions.FirstOrDefault(v => v.Version == version);
    }

    private List<VersionInfo> ParseVersionsFromContent(string content)
    {
        var versions = new List<VersionInfo>();
        
        // Split by version headers: ## [X.Y.Z] - YYYY-MM-DD "Codename"
        var versionPattern = @"## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})(?: ""([^""]+)"")?";
        var matches = Regex.Matches(content, versionPattern);

        for (int i = 0; i < matches.Count; i++)
        {
            var match = matches[i];
            var versionNum = match.Groups[1].Value;
            var dateStr = match.Groups[2].Value;
            var codename = match.Groups[3].Value;

            // Extract content between this version and the next (or end of file)
            var startIndex = match.Index + match.Length;
            var endIndex = i < matches.Count - 1 ? matches[i + 1].Index : content.Length;
            var versionContent = content.Substring(startIndex, endIndex - startIndex);

            var versionInfo = new VersionInfo
            {
                Version = versionNum,
                ReleaseDate = DateTime.ParseExact(dateStr, "yyyy-MM-dd", CultureInfo.InvariantCulture),
                Codename = codename,
                Sections = ParseSections(versionContent)
            };

            versions.Add(versionInfo);
        }

        return versions;
    }

    private List<ChangelogSection> ParseSections(string content)
    {
        var sections = new List<ChangelogSection>();
        
        // Parse sections like ### Added, ### Changed, ### Fixed
        var sectionPattern = @"### (Added|Changed|Fixed|Deprecated|Removed|Security|Performance|Perf)";
        var matches = Regex.Matches(content, sectionPattern);

        for (int i = 0; i < matches.Count; i++)
        {
            var match = matches[i];
            var sectionName = match.Groups[1].Value;
            
            // Extract content between this section and the next (or end)
            var startIndex = match.Index + match.Length;
            var endIndex = i < matches.Count - 1 ? matches[i + 1].Index : content.Length;
            var sectionContent = content.Substring(startIndex, endIndex - startIndex);

            var section = new ChangelogSection
            {
                Section = sectionName,
                Items = ParseItems(sectionContent, sectionName)
            };

            sections.Add(section);
        }

        return sections;
    }

    private List<ChangelogItem> ParseItems(string content, string sectionName)
    {
        var items = new List<ChangelogItem>();
        
        // Parse items like "- **Category**: Description"
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var line in lines)
        {
            var trimmed = line.Trim();
            if (!trimmed.StartsWith("-")) continue;

            // Remove leading "- " or "  - "
            trimmed = trimmed.TrimStart('-').Trim();
            
            // Try to parse "**Category**: Description" or "Category: Description" format
            var match = Regex.Match(trimmed, @"^\*\*([^*]+)\*\*:\s*(.+)$");
            if (!match.Success)
                match = Regex.Match(trimmed, @"^([A-Za-z][A-Za-z0-9 ]+):\s*(.+)$");
            if (match.Success)
            {
                items.Add(new ChangelogItem
                {
                    Category = match.Groups[1].Value.Trim(),
                    Description = match.Groups[2].Value.Trim(),
                    Type = DetermineType(sectionName)
                });
            }
            else if (!string.IsNullOrWhiteSpace(trimmed))
            {
                // No category, just description
                items.Add(new ChangelogItem
                {
                    Category = "General",
                    Description = trimmed,
                    Type = DetermineType(sectionName)
                });
            }
        }

        return items;
    }

    private string DetermineType(string sectionName)
    {
        return sectionName switch
        {
            "Added" => "feat",
            "Fixed" => "fix",
            "Changed" => "feat",
            "Security" => "security",
            "Performance" or "Perf" => "perf",
            "Deprecated" or "Removed" => "docs",
            _ => "feat"
        };
    }
}
