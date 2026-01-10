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

public class StatisticsServiceEdgeCaseTests : IDisposable
{
    private readonly FinanceDbContext _context;
    private readonly Mock<ITaskService> _mockTaskService;
    private readonly StatisticsService _service;
    private readonly Guid _userId = Guid.NewGuid();

    public StatisticsServiceEdgeCaseTests()
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
            Email = "test@example.com",
            Username = "testuser",
            PasswordHash = "hash"
        });
        _context.SaveChanges();
    }

    [Fact]
    public async Task GetWeeklyStatistics_EmptyWeek_ReturnsZeroStatistics()
    {
        // Arrange - Week with no tasks
        var weekStart = new DateTime(2026, 1, 6, 0, 0, 0, DateTimeKind.Utc); // Monday

        // Act
        var result = await _service.GetWeeklyStatisticsAsync(_userId, weekStart);

        // Assert
        Assert.Equal(0, result.TotalTasks);
        Assert.Equal(0, result.CompletedTasks);
        Assert.Equal(0m, result.CompletionPercentage);
        Assert.Equal(7, result.DailyBreakdown.Count);
        Assert.All(result.DailyBreakdown, day => Assert.Equal(0, day.TotalTasks));
    }

    [Fact]
    public async Task GetWeeklyStatistics_WeekSpanningMonthBoundary_HandlesCorrectly()
    {
        // Arrange - Week from Dec 30, 2025 (Mon) to Jan 5, 2026 (Sun)
        var weekStart = new DateTime(2025, 12, 30, 0, 0, 0, DateTimeKind.Utc);

        // Add tasks in both months
        _context.Tasks.AddRange(
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "December Task",
                DueDate = new DateTime(2025, 12, 31, 12, 0, 0, DateTimeKind.Utc),
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
        var result = await _service.GetWeeklyStatisticsAsync(_userId, weekStart);

        // Assert
        Assert.Equal(2, result.TotalTasks);
        Assert.Equal(1, result.CompletedTasks);
        Assert.Equal(50.0m, result.CompletionPercentage);
        
        // Verify December task appears on correct day
        var dec31Stats = result.DailyBreakdown.First(d => d.Date.Day == 31 && d.Date.Month == 12);
        Assert.Equal(1, dec31Stats.TotalTasks);
        Assert.Equal(1, dec31Stats.CompletedTasks);

        // Verify January task appears on correct day
        var jan2Stats = result.DailyBreakdown.First(d => d.Date.Day == 2 && d.Date.Month == 1);
        Assert.Equal(1, jan2Stats.TotalTasks);
        Assert.Equal(0, jan2Stats.CompletedTasks);
    }

    [Fact]
    public async Task GetWeeklyStatistics_WeekSpanningYearBoundary_HandlesCorrectly()
    {
        // Arrange - Week from Dec 29, 2025 (Mon) to Jan 4, 2026 (Sun)
        var weekStart = new DateTime(2025, 12, 29, 0, 0, 0, DateTimeKind.Utc);

        // Add tasks in both years
        _context.Tasks.AddRange(
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "2025 Task",
                DueDate = new DateTime(2025, 12, 31, 12, 0, 0, DateTimeKind.Utc),
                Priority = Priority.High,
                Completed = true
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "2026 Task",
                DueDate = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc),
                Priority = Priority.Critical,
                Completed = false
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetWeeklyStatisticsAsync(_userId, weekStart);

        // Assert
        Assert.Equal(2, result.TotalTasks);
        Assert.Equal(1, result.CompletedTasks);
        
        // Verify 2025 task
        var dec2025Stats = result.DailyBreakdown.First(d => d.Date.Year == 2025);
        Assert.True(dec2025Stats.TotalTasks > 0);

        // Verify 2026 task
        var jan2026Stats = result.DailyBreakdown.First(d => d.Date.Year == 2026);
        Assert.True(jan2026Stats.TotalTasks > 0);
    }

    [Fact]
    public async Task GetWeeklyStatistics_TasksAtMidnight_HandledCorrectly()
    {
        // Arrange - Tasks exactly at day boundaries (00:00:00)
        var weekStart = new DateTime(2026, 1, 6, 0, 0, 0, DateTimeKind.Utc);

        _context.Tasks.AddRange(
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Midnight Start",
                DueDate = new DateTime(2026, 1, 6, 0, 0, 0, DateTimeKind.Utc), // Exactly at week start
                Priority = Priority.Medium,
                Completed = false
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Midnight End",
                DueDate = new DateTime(2026, 1, 13, 0, 0, 0, DateTimeKind.Utc), // Exactly at week end
                Priority = Priority.Low,
                Completed = false
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetWeeklyStatisticsAsync(_userId, weekStart);

        // Assert - Should include start boundary, exclude end boundary
        Assert.Equal(1, result.TotalTasks);
        var mondayStats = result.DailyBreakdown.First();
        Assert.Equal(1, mondayStats.TotalTasks);
    }

    [Fact]
    public async Task GetWeeklyStatistics_MultipleTasksSameDay_CorrectlyCounted()
    {
        // Arrange
        var weekStart = new DateTime(2026, 1, 6, 0, 0, 0, DateTimeKind.Utc);
        var targetDate = weekStart.AddDays(2); // Wednesday

        _context.Tasks.AddRange(
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Task 1",
                DueDate = targetDate.AddHours(8),
                Priority = Priority.High,
                Completed = true
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Task 2",
                DueDate = targetDate.AddHours(14),
                Priority = Priority.Medium,
                Completed = true
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Task 3",
                DueDate = targetDate.AddHours(20),
                Priority = Priority.Low,
                Completed = false
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetWeeklyStatisticsAsync(_userId, weekStart);

        // Assert
        var wednesdayStats = result.DailyBreakdown[2]; // Wednesday is index 2
        Assert.Equal(3, wednesdayStats.TotalTasks);
        Assert.Equal(2, wednesdayStats.CompletedTasks);
        Assert.Equal(66.67m, Math.Round(wednesdayStats.CompletionRate, 2));
    }

    [Fact]
    public async Task GetWeeklyStatistics_DifferentTimezones_UsesUtcCorrectly()
    {
        // Arrange
        var weekStart = new DateTime(2026, 1, 6, 0, 0, 0, DateTimeKind.Utc);

        // Task with unspecified kind should be treated as UTC
        _context.Tasks.Add(new TaskEntity
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            Title = "Task with unspecified timezone",
            DueDate = new DateTime(2026, 1, 7, 12, 0, 0, DateTimeKind.Unspecified),
            Priority = Priority.Medium,
            Completed = false
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetWeeklyStatisticsAsync(_userId, weekStart);

        // Assert
        Assert.Equal(1, result.TotalTasks);
        Assert.Equal(weekStart, result.WeekStart);
        Assert.Equal(DateTimeKind.Utc, result.WeekStart.Kind);
    }

    [Fact]
    public async Task GetDailyStatistics_EmptyDay_ReturnsZeroStatistics()
    {
        // Arrange
        var date = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);

        // Act
        var result = await _service.GetDailyStatisticsAsync(_userId, date);

        // Assert
        Assert.Equal(0, result.TotalTasks);
        Assert.Equal(0, result.CompletedTasks);
        Assert.Equal(0m, result.CompletionRate);
        Assert.Empty(result.Tasks);
    }

    [Fact]
    public async Task GetDailyStatistics_DayBoundaryEdgeCase_IncludesCorrectTasks()
    {
        // Arrange
        var date = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);

        _context.Tasks.AddRange(
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "23:59:59 Previous Day",
                DueDate = date.AddSeconds(-1), // 2026-01-09 23:59:59
                Priority = Priority.High,
                Completed = true
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "00:00:00 Target Day",
                DueDate = date, // 2026-01-10 00:00:00
                Priority = Priority.Medium,
                Completed = false
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "23:59:59 Target Day",
                DueDate = date.AddDays(1).AddSeconds(-1), // 2026-01-10 23:59:59
                Priority = Priority.Low,
                Completed = false
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "00:00:00 Next Day",
                DueDate = date.AddDays(1), // 2026-01-11 00:00:00
                Priority = Priority.High,
                Completed = true
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetDailyStatisticsAsync(_userId, date);

        // Assert - Should include only tasks 2 and 3
        Assert.Equal(2, result.TotalTasks);
        Assert.Equal(0, result.CompletedTasks);
        Assert.Contains(result.Tasks, t => t.Title == "00:00:00 Target Day");
        Assert.Contains(result.Tasks, t => t.Title == "23:59:59 Target Day");
        Assert.DoesNotContain(result.Tasks, t => t.Title.Contains("Previous Day"));
        Assert.DoesNotContain(result.Tasks, t => t.Title.Contains("Next Day"));
    }

    [Fact]
    public async Task GetUrgentTasks_OnlyIncludesIncompleteHighPriorityTasks()
    {
        // Arrange
        var weekStart = new DateTime(2026, 1, 6, 0, 0, 0, DateTimeKind.Utc);

        _context.Tasks.AddRange(
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Critical Incomplete",
                DueDate = weekStart.AddDays(1),
                Priority = Priority.Critical,
                Completed = false
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Critical Complete",
                DueDate = weekStart.AddDays(1),
                Priority = Priority.Critical,
                Completed = true
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "High Incomplete",
                DueDate = weekStart.AddDays(2),
                Priority = Priority.High,
                Completed = false
            },
            new TaskEntity
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Title = "Medium Incomplete",
                DueDate = weekStart.AddDays(3),
                Priority = Priority.Medium,
                Completed = false
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUrgentTasksAsync(_userId, weekStart);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains(result, t => t.Title == "Critical Incomplete");
        Assert.Contains(result, t => t.Title == "High Incomplete");
        Assert.DoesNotContain(result, t => t.Title == "Critical Complete");
        Assert.DoesNotContain(result, t => t.Title == "Medium Incomplete");
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
