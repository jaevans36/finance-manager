using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using Microsoft.Extensions.Logging;
using FinanceApi.Features.Version.Controllers;
using FinanceApi.Features.Version.Services;
using FinanceApi.Features.Version.DTOs;
using FinanceApi.Features.Version.Models;

namespace FinanceApi.UnitTests.Features.Version;

/// <summary>
/// Integration tests for VersionController (T795)
/// Tests all API endpoints with various scenarios and edge cases
/// </summary>
public class VersionControllerTests
{
    private readonly Mock<IVersionService> _mockVersionService;
    private readonly Mock<ILogger<VersionController>> _mockLogger;
    private readonly VersionController _controller;

    public VersionControllerTests()
    {
        _mockVersionService = new Mock<IVersionService>();
        _mockLogger = new Mock<ILogger<VersionController>>();
        _controller = new VersionController(_mockVersionService.Object, _mockLogger.Object);
    }

    #region GetCurrentVersion Tests

    [Fact]
    public async Task GetCurrentVersion_ServiceReturnsVersion_ReturnsOkWithVersion()
    {
        // Arrange
        var expectedVersion = new VersionDto
        {
            Version = "0.15.0",
            ReleaseDate = "2026-02-01",
            Codename = "Security First",
            Description = "Security and authentication improvements",
            Breaking = false,
            Changelog = new List<ChangelogEntryDto>
            {
                new() { Type = "feat", Category = "Auth", Description = "User registration" },
                new() { Type = "fix", Category = "Tasks", Description = "Fixed completion bug" }
            }
        };

        _mockVersionService
            .Setup(s => s.GetCurrentVersionAsync())
            .ReturnsAsync(expectedVersion);

        // Act
        var result = await _controller.GetCurrentVersion();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedVersion = Assert.IsType<VersionDto>(okResult.Value);
        
        Assert.Equal(expectedVersion.Version, returnedVersion.Version);
        Assert.Equal(expectedVersion.Codename, returnedVersion.Codename);
        Assert.Equal(expectedVersion.ReleaseDate, returnedVersion.ReleaseDate);
        Assert.Equal(expectedVersion.Breaking, returnedVersion.Breaking);
        Assert.Equal(2, returnedVersion.Changelog.Count);
    }

    [Fact]
    public async Task GetCurrentVersion_ServiceReturnsNull_ReturnsNotFound()
    {
        // Arrange
        _mockVersionService
            .Setup(s => s.GetCurrentVersionAsync())
            .ReturnsAsync((VersionDto?)null);

        // Act
        var result = await _controller.GetCurrentVersion();

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.NotNull(notFoundResult.Value);
    }

    [Fact]
    public async Task GetCurrentVersion_CallsServiceOnce()
    {
        // Arrange
        _mockVersionService
            .Setup(s => s.GetCurrentVersionAsync())
            .ReturnsAsync(new VersionDto { Version = "0.14.0", ReleaseDate = "2026-01-01", Codename = "Test" });

        // Act
        await _controller.GetCurrentVersion();

        // Assert
        _mockVersionService.Verify(s => s.GetCurrentVersionAsync(), Times.Once);
    }

    #endregion

    #region GetVersionHistory Tests

    [Fact]
    public async Task GetVersionHistory_ServiceReturnsHistory_ReturnsOkWithHistory()
    {
        // Arrange
        var expectedHistory = new VersionHistoryDto
        {
            Versions = new List<VersionHistoryItemDto>
            {
                new()
                {
                    Version = "0.15.0",
                    ReleaseDate = "2026-02-01",
                    Codename = "Security First",
                    Changelog = new List<ChangelogSectionDto>
                    {
                        new()
                        {
                            Section = "Added",
                            Items = new List<ChangelogItemDto>
                            {
                                new() { Category = "Auth", Description = "User registration", Type = "feat" }
                            }
                        }
                    }
                },
                new()
                {
                    Version = "0.14.0",
                    ReleaseDate = "2026-01-01",
                    Codename = "Calendar View",
                    Changelog = new List<ChangelogSectionDto>
                    {
                        new()
                        {
                            Section = "Added",
                            Items = new List<ChangelogItemDto>
                            {
                                new() { Category = "Calendar", Description = "Monthly view", Type = "feat" }
                            }
                        }
                    }
                }
            },
            TotalVersions = 2,
            EarliestVersion = "0.14.0",
            LatestVersion = "0.15.0"
        };

        _mockVersionService
            .Setup(s => s.GetVersionHistoryAsync())
            .ReturnsAsync(expectedHistory);

        // Act
        var result = await _controller.GetVersionHistory();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedHistory = Assert.IsType<VersionHistoryDto>(okResult.Value);
        
        Assert.Equal(2, returnedHistory.TotalVersions);
        Assert.Equal(2, returnedHistory.Versions.Count);
        Assert.Equal("0.15.0", returnedHistory.LatestVersion);
        Assert.Equal("0.14.0", returnedHistory.EarliestVersion);
    }

    [Fact]
    public async Task GetVersionHistory_EmptyHistory_ReturnsOkWithEmptyList()
    {
        // Arrange
        var emptyHistory = new VersionHistoryDto
        {
            Versions = new List<VersionHistoryItemDto>(),
            TotalVersions = 0,
            EarliestVersion = null,
            LatestVersion = null
        };

        _mockVersionService
            .Setup(s => s.GetVersionHistoryAsync())
            .ReturnsAsync(emptyHistory);

        // Act
        var result = await _controller.GetVersionHistory();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedHistory = Assert.IsType<VersionHistoryDto>(okResult.Value);
        
        Assert.Empty(returnedHistory.Versions);
        Assert.Equal(0, returnedHistory.TotalVersions);
        Assert.Null(returnedHistory.EarliestVersion);
        Assert.Null(returnedHistory.LatestVersion);
    }

    [Fact]
    public async Task GetVersionHistory_CallsServiceOnce()
    {
        // Arrange
        _mockVersionService
            .Setup(s => s.GetVersionHistoryAsync())
            .ReturnsAsync(new VersionHistoryDto { Versions = new List<VersionHistoryItemDto>(), TotalVersions = 0 });

        // Act
        await _controller.GetVersionHistory();

        // Assert
        _mockVersionService.Verify(s => s.GetVersionHistoryAsync(), Times.Once);
    }

    [Fact]
    public async Task GetVersionHistory_MultipleVersionsWithMultipleSections_ReturnsCompleteStructure()
    {
        // Arrange
        var expectedHistory = new VersionHistoryDto
        {
            Versions = new List<VersionHistoryItemDto>
            {
                new()
                {
                    Version = "0.15.0",
                    ReleaseDate = "2026-02-01",
                    Codename = "Complete",
                    Changelog = new List<ChangelogSectionDto>
                    {
                        new()
                        {
                            Section = "Added",
                            Items = new List<ChangelogItemDto>
                            {
                                new() { Category = "Feature1", Description = "Description 1", Type = "feat" },
                                new() { Category = "Feature2", Description = "Description 2", Type = "feat" }
                            }
                        },
                        new()
                        {
                            Section = "Fixed",
                            Items = new List<ChangelogItemDto>
                            {
                                new() { Category = "Bug1", Description = "Fixed bug 1", Type = "fix" },
                                new() { Category = "Bug2", Description = "Fixed bug 2", Type = "fix" },
                                new() { Category = "Bug3", Description = "Fixed bug 3", Type = "fix" }
                            }
                        }
                    }
                }
            },
            TotalVersions = 1,
            EarliestVersion = "0.15.0",
            LatestVersion = "0.15.0"
        };

        _mockVersionService
            .Setup(s => s.GetVersionHistoryAsync())
            .ReturnsAsync(expectedHistory);

        // Act
        var result = await _controller.GetVersionHistory();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedHistory = Assert.IsType<VersionHistoryDto>(okResult.Value);
        
        var version = returnedHistory.Versions[0];
        Assert.Equal(2, version.Changelog.Count);
        Assert.Equal(2, version.Changelog[0].Items.Count);
        Assert.Equal(3, version.Changelog[1].Items.Count);
    }

    #endregion

    #region GetVersion Tests

    [Fact]
    public async Task GetVersion_ValidVersionNumber_ReturnsOkWithVersion()
    {
        // Arrange
        var versionNumber = "0.14.0";
        var expectedVersion = new VersionHistoryItemDto
        {
            Version = "0.14.0",
            ReleaseDate = "2026-01-01",
            Codename = "Calendar View",
            Changelog = new List<ChangelogSectionDto>
            {
                new()
                {
                    Section = "Added",
                    Items = new List<ChangelogItemDto>
                    {
                        new() { Category = "Calendar", Description = "Monthly view", Type = "feat" }
                    }
                }
            }
        };

        _mockVersionService
            .Setup(s => s.GetVersionByNumberAsync(versionNumber))
            .ReturnsAsync(expectedVersion);

        // Act
        var result = await _controller.GetVersion(versionNumber);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedVersion = Assert.IsType<VersionHistoryItemDto>(okResult.Value);
        
        Assert.Equal(expectedVersion.Version, returnedVersion.Version);
        Assert.Equal(expectedVersion.Codename, returnedVersion.Codename);
        Assert.Equal(expectedVersion.ReleaseDate, returnedVersion.ReleaseDate);
    }

    [Fact]
    public async Task GetVersion_NonExistentVersion_ReturnsNotFound()
    {
        // Arrange
        var versionNumber = "9.9.9";
        
        _mockVersionService
            .Setup(s => s.GetVersionByNumberAsync(versionNumber))
            .ReturnsAsync((VersionHistoryItemDto?)null);

        // Act
        var result = await _controller.GetVersion(versionNumber);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.NotNull(notFoundResult.Value);
    }

    [Fact]
    public async Task GetVersion_CallsServiceWithCorrectParameter()
    {
        // Arrange
        var versionNumber = "0.14.0";
        
        _mockVersionService
            .Setup(s => s.GetVersionByNumberAsync(versionNumber))
            .ReturnsAsync(new VersionHistoryItemDto { Version = versionNumber, ReleaseDate = "2026-01-01", Codename = "Test" });

        // Act
        await _controller.GetVersion(versionNumber);

        // Assert
        _mockVersionService.Verify(s => s.GetVersionByNumberAsync(versionNumber), Times.Once);
    }

    [Theory]
    [InlineData("0.14.0")]
    [InlineData("0.15.0")]
    [InlineData("1.0.0")]
    [InlineData("10.20.30")]
    public async Task GetVersion_VariousVersionFormats_HandlesCorrectly(string versionNumber)
    {
        // Arrange
        _mockVersionService
            .Setup(s => s.GetVersionByNumberAsync(versionNumber))
            .ReturnsAsync(new VersionHistoryItemDto { Version = versionNumber, ReleaseDate = "2026-01-01", Codename = "Test" });

        // Act
        var result = await _controller.GetVersion(versionNumber);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedVersion = Assert.IsType<VersionHistoryItemDto>(okResult.Value);
        Assert.Equal(versionNumber, returnedVersion.Version);
    }

    #endregion

    #region Error Handling Tests

    [Fact]
    public async Task GetCurrentVersion_ServiceThrowsException_PropagatesException()
    {
        // Arrange
        _mockVersionService
            .Setup(s => s.GetCurrentVersionAsync())
            .ThrowsAsync(new Exception("File system error"));

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _controller.GetCurrentVersion());
    }

    [Fact]
    public async Task GetVersionHistory_ServiceThrowsException_PropagatesException()
    {
        // Arrange
        _mockVersionService
            .Setup(s => s.GetVersionHistoryAsync())
            .ThrowsAsync(new Exception("Parsing error"));

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _controller.GetVersionHistory());
    }

    [Fact]
    public async Task GetVersion_ServiceThrowsException_PropagatesException()
    {
        // Arrange
        _mockVersionService
            .Setup(s => s.GetVersionByNumberAsync(It.IsAny<string>()))
            .ThrowsAsync(new Exception("Parsing error"));

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _controller.GetVersion("0.14.0"));
    }

    #endregion
}
