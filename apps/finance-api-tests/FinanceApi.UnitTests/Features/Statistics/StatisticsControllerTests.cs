using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using FinanceApi.Features.Statistics.Controllers;
using FinanceApi.Features.Statistics.Services;
using FinanceApi.Features.Statistics.DTOs;

namespace FinanceApi.UnitTests.Features.Statistics;

public class StatisticsControllerTests
{
    private readonly Mock<IStatisticsService> _mockStatisticsService;
    private readonly StatisticsController _controller;
    private readonly Guid _userId = Guid.NewGuid();

    public StatisticsControllerTests()
    {
        _mockStatisticsService = new Mock<IStatisticsService>();
        _controller = new StatisticsController(_mockStatisticsService.Object);

        // Setup user claims for authorization
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _userId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    [Fact]
    public async Task GetWeeklyStatistics_WithValidWeekStart_ReturnsOkWithStatistics()
    {
        // Arrange
        var weekStart = new DateTime(2026, 1, 6, 0, 0, 0, DateTimeKind.Utc); // Monday
        var expectedStats = new WeeklyStatisticsDto
        {
            WeekStart = weekStart,
            WeekEnd = weekStart.AddDays(7),
            TotalTasks = 10,
            CompletedTasks = 7,
            CompletionPercentage = 70.0m,
            DailyBreakdown = new List<DailyStatisticsDto>()
        };

        _mockStatisticsService
            .Setup(s => s.GetWeeklyStatisticsAsync(_userId, weekStart))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _controller.GetWeeklyStatistics(weekStart);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedStats = Assert.IsType<WeeklyStatisticsDto>(okResult.Value);
        Assert.Equal(expectedStats.TotalTasks, returnedStats.TotalTasks);
        Assert.Equal(expectedStats.CompletedTasks, returnedStats.CompletedTasks);
        Assert.Equal(expectedStats.CompletionPercentage, returnedStats.CompletionPercentage);
    }

    [Fact]
    public async Task GetWeeklyStatistics_WithNullWeekStart_UsesCurrentWeek()
    {
        // Arrange
        var expectedStats = new WeeklyStatisticsDto
        {
            WeekStart = DateTime.UtcNow.Date,
            WeekEnd = DateTime.UtcNow.Date.AddDays(7),
            TotalTasks = 5,
            CompletedTasks = 3,
            CompletionPercentage = 60.0m,
            DailyBreakdown = new List<DailyStatisticsDto>()
        };

        _mockStatisticsService
            .Setup(s => s.GetWeeklyStatisticsAsync(_userId, It.IsAny<DateTime>()))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _controller.GetWeeklyStatistics(null);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
        _mockStatisticsService.Verify(
            s => s.GetWeeklyStatisticsAsync(_userId, It.IsAny<DateTime>()),
            Times.Once);
    }

    [Fact]
    public async Task GetWeeklyStatistics_EmptyWeek_ReturnsZeroStatistics()
    {
        // Arrange
        var weekStart = new DateTime(2026, 1, 6, 0, 0, 0, DateTimeKind.Utc);
        var emptyStats = new WeeklyStatisticsDto
        {
            WeekStart = weekStart,
            WeekEnd = weekStart.AddDays(7),
            TotalTasks = 0,
            CompletedTasks = 0,
            CompletionPercentage = 0m,
            DailyBreakdown = new List<DailyStatisticsDto>
            {
                new DailyStatisticsDto { Date = weekStart, TotalTasks = 0, CompletedTasks = 0, CompletionRate = 0m, Tasks = new List<FinanceApi.Features.Tasks.DTOs.TaskDto>() },
                new DailyStatisticsDto { Date = weekStart.AddDays(1), TotalTasks = 0, CompletedTasks = 0, CompletionRate = 0m, Tasks = new List<FinanceApi.Features.Tasks.DTOs.TaskDto>() },
                new DailyStatisticsDto { Date = weekStart.AddDays(2), TotalTasks = 0, CompletedTasks = 0, CompletionRate = 0m, Tasks = new List<FinanceApi.Features.Tasks.DTOs.TaskDto>() },
                new DailyStatisticsDto { Date = weekStart.AddDays(3), TotalTasks = 0, CompletedTasks = 0, CompletionRate = 0m, Tasks = new List<FinanceApi.Features.Tasks.DTOs.TaskDto>() },
                new DailyStatisticsDto { Date = weekStart.AddDays(4), TotalTasks = 0, CompletedTasks = 0, CompletionRate = 0m, Tasks = new List<FinanceApi.Features.Tasks.DTOs.TaskDto>() },
                new DailyStatisticsDto { Date = weekStart.AddDays(5), TotalTasks = 0, CompletedTasks = 0, CompletionRate = 0m, Tasks = new List<FinanceApi.Features.Tasks.DTOs.TaskDto>() },
                new DailyStatisticsDto { Date = weekStart.AddDays(6), TotalTasks = 0, CompletedTasks = 0, CompletionRate = 0m, Tasks = new List<FinanceApi.Features.Tasks.DTOs.TaskDto>() }
            }
        };

        _mockStatisticsService
            .Setup(s => s.GetWeeklyStatisticsAsync(_userId, weekStart))
            .ReturnsAsync(emptyStats);

        // Act
        var result = await _controller.GetWeeklyStatistics(weekStart);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedStats = Assert.IsType<WeeklyStatisticsDto>(okResult.Value);
        Assert.Equal(0, returnedStats.TotalTasks);
        Assert.Equal(0, returnedStats.CompletedTasks);
        Assert.Equal(7, returnedStats.DailyBreakdown.Count);
    }

    [Fact]
    public async Task GetDailyStatistics_WithValidDate_ReturnsOkWithStatistics()
    {
        // Arrange
        var date = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);
        var expectedStats = new DailyStatisticsDto
        {
            Date = date,
            TotalTasks = 5,
            CompletedTasks = 3,
            CompletionRate = 60.0m,
            Tasks = new List<FinanceApi.Features.Tasks.DTOs.TaskDto>()
        };

        _mockStatisticsService
            .Setup(s => s.GetDailyStatisticsAsync(_userId, date))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _controller.GetDailyStatistics(date);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedStats = Assert.IsType<DailyStatisticsDto>(okResult.Value);
        Assert.Equal(expectedStats.TotalTasks, returnedStats.TotalTasks);
        Assert.Equal(expectedStats.CompletedTasks, returnedStats.CompletedTasks);
        Assert.Equal(expectedStats.CompletionRate, returnedStats.CompletionRate);
    }

    [Fact]
    public async Task GetDailyStatistics_WithNullDate_UsesToday()
    {
        // Arrange
        var expectedStats = new DailyStatisticsDto
        {
            Date = DateTime.UtcNow.Date,
            TotalTasks = 3,
            CompletedTasks = 1,
            CompletionRate = 33.33m,
            Tasks = new List<FinanceApi.Features.Tasks.DTOs.TaskDto>()
        };

        _mockStatisticsService
            .Setup(s => s.GetDailyStatisticsAsync(_userId, It.IsAny<DateTime>()))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _controller.GetDailyStatistics(null);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
        _mockStatisticsService.Verify(
            s => s.GetDailyStatisticsAsync(_userId, It.IsAny<DateTime>()),
            Times.Once);
    }

    [Fact]
    public async Task GetUrgentTasks_WithValidWeekStart_ReturnsOkWithTasks()
    {
        // Arrange
        var weekStart = new DateTime(2026, 1, 6, 0, 0, 0, DateTimeKind.Utc);
        var expectedTasks = new List<UrgentTaskDto>
        {
            new UrgentTaskDto
            {
                Id = Guid.NewGuid(),
                Title = "Urgent Task 1",
                Priority = "Critical",
                DueDate = weekStart.AddDays(1),
                DaysUntilDue = 1
            },
            new UrgentTaskDto
            {
                Id = Guid.NewGuid(),
                Title = "Urgent Task 2",
                Priority = "High",
                DueDate = weekStart.AddDays(2),
                DaysUntilDue = 2
            }
        };

        _mockStatisticsService
            .Setup(s => s.GetUrgentTasksAsync(_userId, weekStart))
            .ReturnsAsync(expectedTasks);

        // Act
        var result = await _controller.GetUrgentTasks(weekStart);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedTasks = Assert.IsType<List<UrgentTaskDto>>(okResult.Value);
        Assert.Equal(2, returnedTasks.Count);
        Assert.Equal("Critical", returnedTasks[0].Priority);
    }

    [Fact]
    public async Task GetUrgentTasks_WithNullWeekStart_UsesCurrentWeek()
    {
        // Arrange
        var expectedTasks = new List<UrgentTaskDto>();

        _mockStatisticsService
            .Setup(s => s.GetUrgentTasksAsync(_userId, It.IsAny<DateTime>()))
            .ReturnsAsync(expectedTasks);

        // Act
        var result = await _controller.GetUrgentTasks(null);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
        _mockStatisticsService.Verify(
            s => s.GetUrgentTasksAsync(_userId, It.IsAny<DateTime>()),
            Times.Once);
    }

    [Theory]
    [InlineData(0)] // Sunday -> Monday
    [InlineData(1)] // Monday -> Monday
    [InlineData(2)] // Tuesday -> Monday
    [InlineData(3)] // Wednesday -> Monday
    [InlineData(4)] // Thursday -> Monday
    [InlineData(5)] // Friday -> Monday
    [InlineData(6)] // Saturday -> Monday
    public void GetWeekStart_CalculatesCorrectMonday(int dayOfWeek)
    {
        // Arrange - Create a date with specific day of week
        var testDate = new DateTime(2026, 1, 4 + dayOfWeek); // Jan 4, 2026 is Sunday
        
        // Act - Use reflection to call private method
        var method = typeof(StatisticsController).GetMethod("GetWeekStart",
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        var result = (DateTime)method!.Invoke(null, new object[] { testDate })!;

        // Assert - Should always return Monday Jan 5, 2026
        var expectedMonday = new DateTime(2026, 1, 5);
        Assert.Equal(expectedMonday, result);
        Assert.Equal(DayOfWeek.Monday, result.DayOfWeek);
    }

    // T231.16: Integration tests for historical statistics endpoint
    [Fact]
    public async Task GetHistoricalStatistics_WithDefaultWeeks_ReturnsOkWithStatistics()
    {
        // Arrange
        var expectedStats = new List<HistoricalStatisticsDto>
        {
            new HistoricalStatisticsDto
            {
                WeekStart = new DateTime(2026, 1, 5),
                WeekEnd = new DateTime(2026, 1, 12),
                TotalTasks = 10,
                CompletedTasks = 7,
                CompletionRate = 70.0m
            },
            new HistoricalStatisticsDto
            {
                WeekStart = new DateTime(2026, 1, 12),
                WeekEnd = new DateTime(2026, 1, 19),
                TotalTasks = 8,
                CompletedTasks = 6,
                CompletionRate = 75.0m
            }
        };

        _mockStatisticsService
            .Setup(s => s.GetHistoricalStatisticsAsync(_userId, 8))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _controller.GetHistoricalStatistics(null);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedStats = Assert.IsType<List<HistoricalStatisticsDto>>(okResult.Value);
        Assert.Equal(2, returnedStats.Count);
        _mockStatisticsService.Verify(s => s.GetHistoricalStatisticsAsync(_userId, 8), Times.Once);
    }

    [Theory]
    [InlineData(4)]
    [InlineData(8)]
    [InlineData(12)]
    [InlineData(52)]
    public async Task GetHistoricalStatistics_WithValidWeeks_ReturnsOkWithStatistics(int weeks)
    {
        // Arrange
        var expectedStats = new List<HistoricalStatisticsDto>();
        for (int i = 0; i < weeks; i++)
        {
            expectedStats.Add(new HistoricalStatisticsDto
            {
                WeekStart = new DateTime(2026, 1, 5).AddDays(-7 * i),
                WeekEnd = new DateTime(2026, 1, 12).AddDays(-7 * i),
                TotalTasks = 10,
                CompletedTasks = 7,
                CompletionRate = 70.0m
            });
        }

        _mockStatisticsService
            .Setup(s => s.GetHistoricalStatisticsAsync(_userId, weeks))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _controller.GetHistoricalStatistics(weeks);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedStats = Assert.IsType<List<HistoricalStatisticsDto>>(okResult.Value);
        Assert.Equal(weeks, returnedStats.Count);
        _mockStatisticsService.Verify(s => s.GetHistoricalStatisticsAsync(_userId, weeks), Times.Once);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-10)]
    public async Task GetHistoricalStatistics_WithWeeksLessThanOne_ReturnsBadRequest(int weeks)
    {
        // Act
        var result = await _controller.GetHistoricalStatistics(weeks);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Weeks parameter must be between 1 and 52", badRequestResult.Value);
        _mockStatisticsService.Verify(
            s => s.GetHistoricalStatisticsAsync(It.IsAny<Guid>(), It.IsAny<int>()),
            Times.Never);
    }

    [Theory]
    [InlineData(53)]
    [InlineData(100)]
    [InlineData(500)]
    public async Task GetHistoricalStatistics_WithWeeksGreaterThan52_ReturnsBadRequest(int weeks)
    {
        // Act
        var result = await _controller.GetHistoricalStatistics(weeks);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Weeks parameter must be between 1 and 52", badRequestResult.Value);
        _mockStatisticsService.Verify(
            s => s.GetHistoricalStatisticsAsync(It.IsAny<Guid>(), It.IsAny<int>()),
            Times.Never);
    }

    [Fact]
    public async Task GetHistoricalStatistics_EmptyHistory_ReturnsOkWithEmptyList()
    {
        // Arrange
        var emptyStats = new List<HistoricalStatisticsDto>();

        _mockStatisticsService
            .Setup(s => s.GetHistoricalStatisticsAsync(_userId, 4))
            .ReturnsAsync(emptyStats);

        // Act
        var result = await _controller.GetHistoricalStatistics(4);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedStats = Assert.IsType<List<HistoricalStatisticsDto>>(okResult.Value);
        Assert.Empty(returnedStats);
    }

    [Fact]
    public async Task GetHistoricalStatistics_ServiceReturnsData_ReturnsCorrectStructure()
    {
        // Arrange
        var expectedStats = new List<HistoricalStatisticsDto>
        {
            new HistoricalStatisticsDto
            {
                WeekStart = new DateTime(2026, 1, 5),
                WeekEnd = new DateTime(2026, 1, 12),
                TotalTasks = 15,
                CompletedTasks = 10,
                CompletionRate = 66.67m
            },
            new HistoricalStatisticsDto
            {
                WeekStart = new DateTime(2025, 12, 29),
                WeekEnd = new DateTime(2026, 1, 5),
                TotalTasks = 0,
                CompletedTasks = 0,
                CompletionRate = 0m
            }
        };

        _mockStatisticsService
            .Setup(s => s.GetHistoricalStatisticsAsync(_userId, 2))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _controller.GetHistoricalStatistics(2);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedStats = Assert.IsType<List<HistoricalStatisticsDto>>(okResult.Value);
        Assert.Equal(2, returnedStats.Count);
        
        // Verify first week data
        Assert.Equal(new DateTime(2026, 1, 5), returnedStats[0].WeekStart);
        Assert.Equal(15, returnedStats[0].TotalTasks);
        Assert.Equal(10, returnedStats[0].CompletedTasks);
        Assert.Equal(66.67m, returnedStats[0].CompletionRate);
        
        // Verify second week data (empty week)
        Assert.Equal(0, returnedStats[1].TotalTasks);
        Assert.Equal(0, returnedStats[1].CompletedTasks);
        Assert.Equal(0m, returnedStats[1].CompletionRate);
    }

    [Fact]
    public async Task GetHistoricalStatistics_YearBoundary_HandlesCorrectly()
    {
        // Arrange - Weeks spanning year boundary
        var expectedStats = new List<HistoricalStatisticsDto>
        {
            new HistoricalStatisticsDto
            {
                WeekStart = new DateTime(2026, 1, 5),
                WeekEnd = new DateTime(2026, 1, 12),
                TotalTasks = 5,
                CompletedTasks = 3,
                CompletionRate = 60.0m
            },
            new HistoricalStatisticsDto
            {
                WeekStart = new DateTime(2025, 12, 29),
                WeekEnd = new DateTime(2026, 1, 5),
                TotalTasks = 8,
                CompletedTasks = 8,
                CompletionRate = 100.0m
            }
        };

        _mockStatisticsService
            .Setup(s => s.GetHistoricalStatisticsAsync(_userId, 2))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _controller.GetHistoricalStatistics(2);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedStats = Assert.IsType<List<HistoricalStatisticsDto>>(okResult.Value);
        Assert.Equal(2, returnedStats.Count);
        Assert.Equal(2026, returnedStats[0].WeekStart.Year);
        Assert.Equal(2025, returnedStats[1].WeekStart.Year);
    }
}
