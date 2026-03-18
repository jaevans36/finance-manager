using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FinanceApi.Features.Version.Services;

namespace FinanceApi.UnitTests.Features.Version;

/// <summary>
/// Unit tests for ChangelogParser (T794)
/// Tests parsing of CHANGELOG.md with various formats and edge cases
/// </summary>
public class ChangelogParserTests : IDisposable
{
    private readonly Mock<ILogger<ChangelogParser>> _mockLogger;
    private readonly Mock<IWebHostEnvironment> _mockEnv;
    private readonly ChangelogParser _parser;
    private readonly string _testDirectory;
    private readonly string _testChangelogPath;

    public ChangelogParserTests()
    {
        _mockLogger = new Mock<ILogger<ChangelogParser>>();
        _mockEnv = new Mock<IWebHostEnvironment>();
        
        // Create a two-level-deep temp structure so the parser's "../.." stays within the temp root,
        // not at the filesystem root (which is not writable on Linux CI).
        // Parser navigates: ContentRootPath/../../CHANGELOG.md → tempRoot/CHANGELOG.md
        var tempRoot = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        _testDirectory = Path.Combine(tempRoot, "apps", "finance-api");
        Directory.CreateDirectory(_testDirectory);

        // Mock ContentRootPath to point to test directory
        _mockEnv.Setup(e => e.ContentRootPath).Returns(_testDirectory);

        _testChangelogPath = Path.Combine(_testDirectory, "..", "..", "CHANGELOG.md");
        var changelogDirectory = Path.GetDirectoryName(Path.GetFullPath(_testChangelogPath))!;
        Directory.CreateDirectory(changelogDirectory);
        
        _parser = new ChangelogParser(_mockLogger.Object, _mockEnv.Object);
    }

    public void Dispose()
    {
        // Clean up the entire temp root (two levels up from _testDirectory = apps/finance-api)
        var tempRoot = Path.GetFullPath(Path.Combine(_testDirectory, "..", ".."));
        if (Directory.Exists(tempRoot))
        {
            try
            {
                Directory.Delete(tempRoot, true);
            }
            catch
            {
                // Ignore cleanup errors
            }
        }
    }

    private async Task WriteChangelogAsync(string content)
    {
        var changelogPath = Path.GetFullPath(Path.Combine(_testDirectory, "..", "..", "CHANGELOG.md"));
        await File.WriteAllTextAsync(changelogPath, content);
    }

    [Fact]
    public async Task ParseChangelogAsync_ValidChangelog_ReturnsVersions()
    {
        // Arrange
        var changelog = @"# Changelog

## [0.15.0] - 2026-02-01 ""Security First""

### Added
- Authentication: User registration with email verification
- Security: Rate limiting for API endpoints

### Fixed
- Tasks: Task completion not updating in real-time
";
        await WriteChangelogAsync(changelog);

        // Act
        var result = await _parser.ParseChangelogAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        
        var version = result[0];
        Assert.Equal("0.15.0", version.Version);
        Assert.Equal("Security First", version.Codename);
        Assert.Equal(new DateTime(2026, 2, 1), version.ReleaseDate);
        Assert.Equal(2, version.Sections.Count);
    }

    [Fact]
    public async Task ParseChangelogAsync_MultipleVersions_ReturnsInCorrectOrder()
    {
        // Arrange
        var changelog = @"# Changelog

## [0.16.0] - 2026-03-01 ""Latest""

### Added
- Feature: New dashboard

## [0.15.0] - 2026-02-01 ""Middle""

### Fixed
- Bug: Fixed critical bug

## [0.14.0] - 2026-01-01 ""Oldest""

### Added
- Feature: Initial release
";
        await WriteChangelogAsync(changelog);

        // Act
        var result = await _parser.ParseChangelogAsync();

        // Assert
        Assert.Equal(3, result.Count);
        Assert.Equal("0.16.0", result[0].Version);
        Assert.Equal("0.15.0", result[1].Version);
        Assert.Equal("0.14.0", result[2].Version);
    }

    [Fact]
    public async Task ParseChangelogAsync_AllSectionTypes_ParsesCorrectly()
    {
        // Arrange
        var changelog = @"# Changelog

## [0.14.0] - 2026-01-01 ""Complete""

### Added
- Dashboard: New analytics view

### Changed
- UI: Updated button styles

### Deprecated
- API: Old endpoint will be removed

### Removed
- Feature: Removed beta feature

### Fixed
- Tasks: Fixed completion bug

### Security
- Auth: Updated JWT library
";
        await WriteChangelogAsync(changelog);

        // Act
        var result = await _parser.ParseChangelogAsync();

        // Assert
        var version = result[0];
        Assert.Equal(6, version.Sections.Count);
        
        Assert.Contains(version.Sections, s => s.Section == "Added");
        Assert.Contains(version.Sections, s => s.Section == "Changed");
        Assert.Contains(version.Sections, s => s.Section == "Deprecated");
        Assert.Contains(version.Sections, s => s.Section == "Removed");
        Assert.Contains(version.Sections, s => s.Section == "Fixed");
        Assert.Contains(version.Sections, s => s.Section == "Security");
    }

    [Fact]
    public async Task ParseChangelogAsync_ItemsWithCategory_ParsesCategoryCorrectly()
    {
        // Arrange
        var changelog = @"# Changelog

## [0.14.0] - 2026-01-01 ""Test""

### Added
- **Dashboard**: New analytics view
- **Tasks**: Quick add button
- **API**: Bulk update endpoint
";
        await WriteChangelogAsync(changelog);

        // Act
        var result = await _parser.ParseChangelogAsync();

        // Assert
        var addedSection = result[0].Sections.First(s => s.Section == "Added");
        Assert.Equal(3, addedSection.Items.Count);
        
        Assert.Equal("Dashboard", addedSection.Items[0].Category);
        Assert.Equal("New analytics view", addedSection.Items[0].Description);
        
        Assert.Equal("Tasks", addedSection.Items[1].Category);
        Assert.Equal("Quick add button", addedSection.Items[1].Description);
        
        Assert.Equal("API", addedSection.Items[2].Category);
        Assert.Equal("Bulk update endpoint", addedSection.Items[2].Description);
    }

    [Fact]
    public async Task ParseChangelogAsync_ItemsWithoutCategory_UsesGeneralCategory()
    {
        // Arrange
        var changelog = @"# Changelog

## [0.14.0] - 2026-01-01 ""Test""

### Added
- Item without category
- Another item without category
";
        await WriteChangelogAsync(changelog);

        // Act
        var result = await _parser.ParseChangelogAsync();

        // Assert
        var addedSection = result[0].Sections.First(s => s.Section == "Added");
        Assert.All(addedSection.Items, item => Assert.Equal("General", item.Category));
    }

    [Fact]
    public async Task ParseChangelogAsync_DeterminesCorrectChangeType()
    {
        // Arrange
        var changelog = @"# Changelog

## [0.14.0] - 2026-01-01 ""Test""

### Added
- **Feature**: New feature

### Fixed
- **Bug**: Fixed bug

### Changed
- **Change**: Some change

### Security
- **Security**: Updated deps
";
        await WriteChangelogAsync(changelog);

        // Act
        var result = await _parser.ParseChangelogAsync();

        // Assert
        var addedItem = result[0].Sections.First(s => s.Section == "Added").Items[0];
        Assert.Equal("feat", addedItem.Type);

        var fixedItem = result[0].Sections.First(s => s.Section == "Fixed").Items[0];
        Assert.Equal("fix", fixedItem.Type);

        var changedItem = result[0].Sections.First(s => s.Section == "Changed").Items[0];
        Assert.Equal("feat", changedItem.Type);

        var securityItem = result[0].Sections.First(s => s.Section == "Security").Items[0];
        Assert.Equal("security", securityItem.Type);
    }

    [Fact]
    public async Task ParseChangelogAsync_EmptyFile_ReturnsEmptyList()
    {
        // Arrange
        await WriteChangelogAsync("");

        // Act
        var result = await _parser.ParseChangelogAsync();

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task ParseChangelogAsync_NoVersions_ReturnsEmptyList()
    {
        // Arrange
        var changelog = @"# Changelog

Just some text without versions
";
        await WriteChangelogAsync(changelog);

        // Act
        var result = await _parser.ParseChangelogAsync();

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task ParseChangelogAsync_VersionWithoutCodename_UsesEmptyCodename()
    {
        // Arrange
        var changelog = @"# Changelog

## [0.14.0] - 2026-01-01

### Added
- Feature: Something
";
        await File.WriteAllTextAsync(_testChangelogPath, changelog);

        // Act
        var result = await _parser.ParseChangelogAsync();

        // Assert
        Assert.Single(result);
        Assert.Equal(string.Empty, result[0].Codename);
    }

    [Fact]
    public async Task ParseChangelogAsync_VersionWithoutDate_SkipsVersion()
    {
        // Arrange
        var changelog = @"# Changelog

## [0.14.0]

### Added
- Feature: Something
";
        await WriteChangelogAsync(changelog);

        // Act
        var result = await _parser.ParseChangelogAsync();

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task ParseChangelogAsync_InvalidDateFormat_SkipsVersion()
    {
        // Arrange
        var changelog = @"# Changelog

## [0.14.0] - Invalid-Date

### Added
- Feature: Something
";
        await WriteChangelogAsync(changelog);

        // Act
        var result = await _parser.ParseChangelogAsync();

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task ParseChangelogAsync_MissingChangelogFile_ReturnsEmptyList()
    {
        // Arrange
        // Don't create the file

        // Act
        var result = await _parser.ParseChangelogAsync();

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task ParseChangelogAsync_VersionWithNoSections_ParsesVersionWithEmptySections()
    {
        // Arrange
        var changelog = @"# Changelog

## [0.14.0] - 2026-01-01 ""Test""

Some description text without section headers.
";
        await WriteChangelogAsync(changelog);

        // Act
        var result = await _parser.ParseChangelogAsync();

        // Assert
        Assert.Single(result);
        Assert.Equal("0.14.0", result[0].Version);
        Assert.Empty(result[0].Sections);
    }

    [Fact]
    public async Task ParseChangelogAsync_SectionWithNoItems_ParsesSectionWithEmptyItems()
    {
        // Arrange
        var changelog = @"# Changelog

## [0.14.0] - 2026-01-01 ""Test""

### Added

### Fixed
- Bug: Fixed something
";
        await WriteChangelogAsync(changelog);

        // Act
        var result = await _parser.ParseChangelogAsync();

        // Assert
        var sections = result[0].Sections;
        var addedSection = sections.First(s => s.Section == "Added");
        var fixedSection = sections.First(s => s.Section == "Fixed");
        
        Assert.Empty(addedSection.Items);
        Assert.Single(fixedSection.Items);
    }
}
