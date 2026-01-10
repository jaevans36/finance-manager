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
}
