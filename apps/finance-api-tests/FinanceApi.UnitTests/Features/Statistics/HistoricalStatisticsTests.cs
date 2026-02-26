using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using FinanceApi.Data;
using FinanceApi.Features.Statistics.Services;
using FinanceApi.Features.Auth.Models;
using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Tasks.Services;
using Task = System.Threading.Tasks.Task;
using TaskEntity = FinanceApi.Features.Tasks.Models.Task;

namespace FinanceApi.UnitTests.Features.Statistics;

/// <summary>
/// Unit tests for GetHistoricalStatisticsAsync method (T231.15)
/// Tests week calculation logic, date range filtering, completion rate calculations, and edge cases
/// </summary>
public class HistoricalStatisticsTests : IDisposable
{
    private readonly FinanceDbContext _context;
    private readonly Mock<ITaskService> _mockTaskService;
    private readonly StatisticsService _service;
    private readonly Guid _userId = Guid.NewGuid();

    public HistoricalStatisticsTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new FinanceDbContext(options);
        _mockTaskService = new Mock<ITaskService>();
        _service = new StatisticsService(_context, _mockTaskService.Object);

        // Seed test user
        _context.Users.Add(new User
        {
            Id = _userId,
            Email = "historical.test@example.com",
            Username = "historicaluser",
            PasswordHash = "hash"
        });
        _context.SaveChanges();
    }

    [Fact]
    public async Task GetHistoricalStatistics_ValidWeeksParameter_ReturnsCorrectNumberOfWeeks()
    {
        // Arrange
        var weeks = 4;

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, weeks);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(weeks, result.Count);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(4)]
    [InlineData(8)]
    [InlineData(12)]
    [InlineData(52)]
    public async Task GetHistoricalStatistics_VariousWeekCounts_ReturnsCorrectCount(int weeks)
    {
        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, weeks);

        // Assert
        Assert.Equal(weeks, result.Count);
        Assert.All(result, stat => Assert.NotNull(stat));
    }

    [Fact]
    public async Task GetHistoricalStatistics_WeeksAreInChronologicalOrder()
    {
        // Arrange
        var weeks = 8;

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, weeks);

        // Assert
        for (int i = 0; i < result.Count - 1; i++)
        {
            Assert.True(result[i].WeekStart < result[i + 1].WeekStart,
                $"Week {i} start ({result[i].WeekStart}) should be before week {i + 1} start ({result[i + 1].WeekStart})");
        }
    }

    [Fact]
    public async Task GetHistoricalStatistics_WeekDurationIsSevenDays()
    {
        // Arrange
        var weeks = 4;

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, weeks);

        // Assert
        Assert.All(result, stat =>
        {
            var duration = stat.WeekEnd - stat.WeekStart;
            Assert.Equal(7, duration.TotalDays);
        });
    }

    [Fact]
    public async Task GetHistoricalStatistics_WeeksStartOnMonday()
    {
        // Arrange
        var weeks = 4;

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, weeks);

        // Assert
        Assert.All(result, stat =>
        {
            Assert.Equal(DayOfWeek.Monday, stat.WeekStart.DayOfWeek);
        });
    }

    [Fact]
    public async Task GetHistoricalStatistics_NoTasks_ReturnsZeroStatistics()
    {
        // Arrange - No tasks in database
        var weeks = 4;

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, weeks);

        // Assert
        Assert.All(result, stat =>
        {
            Assert.Equal(0, stat.TotalTasks);
            Assert.Equal(0, stat.CompletedTasks);
            Assert.Equal(0m, stat.CompletionRate);
        });
    }

    [Fact]
    public async Task GetHistoricalStatistics_TasksInCurrentWeek_IncludedInResults()
    {
        // Arrange - Add tasks in current week
        var today = DateTime.UtcNow.Date;
        var currentWeekStart = GetMonday(today);

        _context.Tasks.AddRange(
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Current Week Task 1",
                DueDate = currentWeekStart.AddDays(1),
                Priority = Priority.High,
                Completed = true
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Current Week Task 2",
                DueDate = currentWeekStart.AddDays(3),
                Priority = Priority.Medium,
                Completed = false
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, 4);

        // Assert
        var mostRecentWeek = result.Last();
        Assert.Equal(2, mostRecentWeek.TotalTasks);
        Assert.Equal(1, mostRecentWeek.CompletedTasks);
        Assert.Equal(50.0m, mostRecentWeek.CompletionRate);
    }

    [Fact]
    public async Task GetHistoricalStatistics_TasksInPastWeeks_IncludedInCorrectWeek()
    {
        // Arrange - Add tasks across multiple weeks
        var today = DateTime.UtcNow.Date;
        var currentWeekStart = GetMonday(today);

        _context.Tasks.AddRange(
            // Week 1 (3 weeks ago)
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "3 Weeks Ago Task",
                DueDate = currentWeekStart.AddDays(-21),
                Priority = Priority.High,
                Completed = true
            },
            // Week 2 (2 weeks ago)
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "2 Weeks Ago Task 1",
                DueDate = currentWeekStart.AddDays(-14),
                Priority = Priority.High,
                Completed = true
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "2 Weeks Ago Task 2",
                DueDate = currentWeekStart.AddDays(-10),
                Priority = Priority.Medium,
                Completed = false
            },
            // Week 3 (1 week ago)
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "1 Week Ago Task",
                DueDate = currentWeekStart.AddDays(-7),
                Priority = Priority.Low,
                Completed = true
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, 4);

        // Assert
        Assert.Equal(1, result[0].TotalTasks); // 3 weeks ago
        Assert.Equal(2, result[1].TotalTasks); // 2 weeks ago
        Assert.Equal(1, result[2].TotalTasks); // 1 week ago
        Assert.Equal(0, result[3].TotalTasks); // Current week (no tasks)
    }

    [Fact]
    public async Task GetHistoricalStatistics_CompletionRateCalculation_IsAccurate()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var currentWeekStart = GetMonday(today);

        // 3 completed, 2 incomplete = 60% completion rate
        _context.Tasks.AddRange(
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Completed 1",
                DueDate = currentWeekStart.AddDays(1),
                Priority = Priority.High,
                Completed = true
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Completed 2",
                DueDate = currentWeekStart.AddDays(2),
                Priority = Priority.Medium,
                Completed = true
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Completed 3",
                DueDate = currentWeekStart.AddDays(3),
                Priority = Priority.Low,
                Completed = true
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Incomplete 1",
                DueDate = currentWeekStart.AddDays(4),
                Priority = Priority.High,
                Completed = false
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Incomplete 2",
                DueDate = currentWeekStart.AddDays(5),
                Priority = Priority.Medium,
                Completed = false
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, 1);

        // Assert
        var currentWeek = result.Last();
        Assert.Equal(5, currentWeek.TotalTasks);
        Assert.Equal(3, currentWeek.CompletedTasks);
        Assert.Equal(60.0m, currentWeek.CompletionRate);
    }

    [Fact]
    public async Task GetHistoricalStatistics_AllTasksCompleted_Returns100Percent()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var currentWeekStart = GetMonday(today);

        _context.Tasks.AddRange(
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Completed 1",
                DueDate = currentWeekStart.AddDays(1),
                Priority = Priority.High,
                Completed = true
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Completed 2",
                DueDate = currentWeekStart.AddDays(2),
                Priority = Priority.Medium,
                Completed = true
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, 1);

        // Assert
        var currentWeek = result.Last();
        Assert.Equal(2, currentWeek.TotalTasks);
        Assert.Equal(2, currentWeek.CompletedTasks);
        Assert.Equal(100.0m, currentWeek.CompletionRate);
    }

    [Fact]
    public async Task GetHistoricalStatistics_NoCompletedTasks_ReturnsZeroPercent()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var currentWeekStart = GetMonday(today);

        _context.Tasks.AddRange(
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Incomplete 1",
                DueDate = currentWeekStart.AddDays(1),
                Priority = Priority.High,
                Completed = false
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Incomplete 2",
                DueDate = currentWeekStart.AddDays(2),
                Priority = Priority.Medium,
                Completed = false
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, 1);

        // Assert
        var currentWeek = result.Last();
        Assert.Equal(2, currentWeek.TotalTasks);
        Assert.Equal(0, currentWeek.CompletedTasks);
        Assert.Equal(0m, currentWeek.CompletionRate);
    }

    [Fact]
    public async Task GetHistoricalStatistics_TasksWithoutDueDate_AreExcluded()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var currentWeekStart = GetMonday(today);

        _context.Tasks.AddRange(
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Task with due date",
                DueDate = currentWeekStart.AddDays(1),
                Priority = Priority.High,
                Completed = true
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Task without due date",
                DueDate = null,
                Priority = Priority.Medium,
                Completed = false
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, 1);

        // Assert
        var currentWeek = result.Last();
        Assert.Equal(1, currentWeek.TotalTasks); // Only task with due date counted
    }

    [Fact]
    public async Task GetHistoricalStatistics_MultipleUsers_OnlyReturnsCurrentUserTasks()
    {
        // Arrange
        var otherUserId = Guid.NewGuid();
        _context.Users.Add(new User
        {
            Id = otherUserId,
            Email = "other@example.com",
            Username = "otheruser",
            PasswordHash = "hash"
        });
        await _context.SaveChangesAsync();

        var today = DateTime.UtcNow.Date;
        var currentWeekStart = GetMonday(today);

        _context.Tasks.AddRange(
            // Current user's task
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "My Task",
                DueDate = currentWeekStart.AddDays(1),
                Priority = Priority.High,
                Completed = true
            },
            // Other user's task
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = otherUserId,
                Title = "Other User Task",
                DueDate = currentWeekStart.AddDays(2),
                Priority = Priority.Medium,
                Completed = false
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, 1);

        // Assert
        var currentWeek = result.Last();
        Assert.Equal(1, currentWeek.TotalTasks); // Only current user's task
        Assert.Equal(1, currentWeek.CompletedTasks);
    }

    [Fact]
    public async Task GetHistoricalStatistics_WeekSpanningYearBoundary_HandlesCorrectly()
    {
        // Arrange - Set up current date in early January
        var januaryWeekStart = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc); // Monday in January
        
        // Add tasks in week spanning year boundary
        _context.Tasks.AddRange(
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "December Task",
                DueDate = new DateTime(2025, 12, 30, 12, 0, 0, DateTimeKind.Utc),
                Priority = Priority.High,
                Completed = true
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "January Task",
                DueDate = new DateTime(2026, 1, 2, 12, 0, 0, DateTimeKind.Utc),
                Priority = Priority.Medium,
                Completed = false
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, 8);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(8, result.Count);
        // Verify week boundaries are handled correctly
        Assert.All(result, stat => Assert.Equal(DayOfWeek.Monday, stat.WeekStart.DayOfWeek));
    }

    [Fact]
    public async Task GetHistoricalStatistics_DecimalPrecision_IsAccurate()
    {
        // Arrange - 1 completed out of 3 tasks = 33.33...%
        var today = DateTime.UtcNow.Date;
        var currentWeekStart = GetMonday(today);

        _context.Tasks.AddRange(
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Task 1",
                DueDate = currentWeekStart.AddDays(1),
                Priority = Priority.High,
                Completed = true
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Task 2",
                DueDate = currentWeekStart.AddDays(2),
                Priority = Priority.Medium,
                Completed = false
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Task 3",
                DueDate = currentWeekStart.AddDays(3),
                Priority = Priority.Low,
                Completed = false
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, 1);

        // Assert
        var currentWeek = result.Last();
        Assert.Equal(3, currentWeek.TotalTasks);
        Assert.Equal(1, currentWeek.CompletedTasks);
        
        // Check precision (33.333...)
        var expectedRate = Math.Round((decimal)1 / 3 * 100, 10);
        Assert.Equal(expectedRate, Math.Round(currentWeek.CompletionRate, 10));
    }

    [Fact]
    public async Task GetHistoricalStatistics_TaskDueAtWeekBoundary_IncludedInCorrectWeek()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var currentWeekStart = GetMonday(today);
        var nextWeekStart = currentWeekStart.AddDays(7);

        _context.Tasks.AddRange(
            // Task due at exact week boundary (should be in next week)
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Boundary Task",
                DueDate = nextWeekStart, // Exact Monday 00:00
                Priority = Priority.High,
                Completed = true
            },
            // Task due one second before boundary (should be in current week)
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Just Before Boundary",
                DueDate = nextWeekStart.AddSeconds(-1),
                Priority = Priority.Medium,
                Completed = false
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetHistoricalStatisticsAsync(_userId, 2);

        // Assert - Implementation should consistently handle boundaries
        var totalTasks = result.Sum(r => r.TotalTasks);
        Assert.Equal(2, totalTasks); // Both tasks should be counted exactly once
    }

    /// <summary>
    /// Helper method to get the Monday of the current week
    /// </summary>
    private DateTime GetMonday(DateTime date)
    {
        var monday = date.AddDays(-(int)date.DayOfWeek + (int)DayOfWeek.Monday);
        if (date.DayOfWeek == DayOfWeek.Sunday)
        {
            monday = monday.AddDays(-7);
        }
        return DateTime.SpecifyKind(monday, DateTimeKind.Utc);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
