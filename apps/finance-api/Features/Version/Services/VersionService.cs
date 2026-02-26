using System.Text.Json;
using FinanceApi.Features.Version.DTOs;
using Microsoft.Extensions.Caching.Memory;

namespace FinanceApi.Features.Version.Services;

/// <summary>
/// Service for managing version information with caching
/// </summary>
public class VersionService : IVersionService
{
    private readonly IChangelogParser _changelogParser;
    private readonly ILogger<VersionService> _logger;
    private readonly IMemoryCache _cache;
    private readonly IWebHostEnvironment _env;
    private readonly string _versionJsonPath;
    private const string CACHE_KEY_VERSIONS = "changelog_versions";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public VersionService(
        IChangelogParser changelogParser,
        ILogger<VersionService> logger,
        IMemoryCache cache,
        IWebHostEnvironment env)
    {
        _changelogParser = changelogParser;
        _logger = logger;
        _cache = cache;
        _env = env;
        
        // Navigate from apps/finance-api to project root
        var projectRoot = Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", ".."));
        _versionJsonPath = Path.Combine(projectRoot, "VERSION.json");
        
        _logger.LogInformation("VERSION.json path: {Path}", _versionJsonPath);
    }

    public async Task<VersionDto?> GetCurrentVersionAsync()
    {
        try
        {
            if (!File.Exists(_versionJsonPath))
            {
                _logger.LogWarning("VERSION.json not found at {Path}", _versionJsonPath);
                return null;
            }

            var json = await File.ReadAllTextAsync(_versionJsonPath);
            var versionData = JsonSerializer.Deserialize<JsonElement>(json);

            var dto = new VersionDto
            {
                Version = versionData.GetProperty("version").GetString() ?? string.Empty,
                ReleaseDate = versionData.GetProperty("releaseDate").GetString() ?? string.Empty,
                Codename = versionData.GetProperty("codename").GetString() ?? string.Empty,
                Breaking = versionData.GetProperty("breaking").GetBoolean()
            };

            if (versionData.TryGetProperty("description", out var desc))
            {
                dto.Description = desc.GetString();
            }

            if (versionData.TryGetProperty("changelog", out var changelog))
            {
                foreach (var item in changelog.EnumerateArray())
                {
                    var entry = new ChangelogEntryDto
                    {
                        Type = item.GetProperty("type").GetString() ?? string.Empty,
                        Category = item.GetProperty("category").GetString() ?? string.Empty,
                        Description = item.GetProperty("description").GetString() ?? string.Empty
                    };

                    if (item.TryGetProperty("impact", out var impact))
                    {
                        entry.Impact = impact.GetString();
                    }

                    dto.Changelog.Add(entry);
                }
            }

            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading VERSION.json");
            return null;
        }
    }

    public async Task<VersionHistoryDto> GetVersionHistoryAsync()
    {
        // Try to get from cache first (skip cache in development)
        if (!_env.IsDevelopment() && _cache.TryGetValue<VersionHistoryDto>(CACHE_KEY_VERSIONS, out var cached))
        {
            _logger.LogDebug("Returning cached version history");
            return cached!;
        }

        _logger.LogDebug("Parsing CHANGELOG.md for version history");
        var versions = await _changelogParser.ParseChangelogAsync();

        var dto = new VersionHistoryDto
        {
            Versions = versions.Select(v => new VersionHistoryItemDto
            {
                Version = v.Version,
                ReleaseDate = v.ReleaseDate.ToString("yyyy-MM-dd"),
                Codename = v.Codename,
                Changelog = v.Sections.Select(s => new ChangelogSectionDto
                {
                    Section = s.Section,
                    Items = s.Items.Select(i => new ChangelogItemDto
                    {
                        Category = i.Category,
                        Description = i.Description,
                        Type = i.Type
                    }).ToList()
                }).ToList()
            }).ToList(),
            TotalVersions = versions.Count,
            EarliestVersion = versions.LastOrDefault()?.Version,
            LatestVersion = versions.FirstOrDefault()?.Version
        };

        // Cache for 5 minutes (skip in development)
        if (!_env.IsDevelopment())
        {
            _cache.Set(CACHE_KEY_VERSIONS, dto, CacheDuration);
        }

        return dto;
    }

    public async Task<VersionHistoryItemDto?> GetVersionByNumberAsync(string version)
    {
        var history = await GetVersionHistoryAsync();
        return history.Versions.FirstOrDefault(v => v.Version == version);
    }
}
