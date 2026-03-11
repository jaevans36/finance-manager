using FinanceApi.Data;
using FinanceApi.Features.Statistics.Services;
using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Tasks.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using Task = System.Threading.Tasks.Task;
using TaskEntity = FinanceApi.Features.Tasks.Models.Task;

namespace FinanceApi.UnitTests.Features.Statistics;

public class UrgentTaskIdentificationTests
{
    private readonly FinanceDbContext _context;
    private readonly StatisticsService _service;
    private readonly Guid _testUserId = Guid.NewGuid();

    public UrgentTaskIdentificationTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new FinanceDbContext(options);
        var mockTaskService = new Mock<ITaskService>();
        _service = new StatisticsService(_context, mockTaskService.Object);
    }

    [Fact]
    public async Task GetUrgentTasks_FiltersOnlyIncompleteHighAndCriticalPriority()
    {
        // Arrange: Create tasks with different priorities and completion states
        var weekStart = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc); // Monday
        var now = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);
        
        await _context.Tasks.AddRangeAsync(
            // Should be included (incomplete, high priority, due within week)
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Critical Task", Priority = Priority.Critical, DueDate = now.AddDays(1), Completed = false },
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "High Task", Priority = Priority.High, DueDate = now.AddDays(1).AddHours(2), Completed = false },
            
            // Should be excluded (wrong priority)
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Medium Task", Priority = Priority.Medium, DueDate = now.AddDays(1), Completed = false },
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Low Task", Priority = Priority.Low, DueDate = now.AddDays(1), Completed = false },
            
            // Should be excluded (already completed)
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Completed Critical", Priority = Priority.Critical, DueDate = now.AddDays(1), Completed = true }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUrgentTasksAsync(_testUserId, weekStart);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, task => Assert.True(task.Priority == "Critical" || task.Priority == "High"));
    }

    [Fact]
    public async Task GetUrgentTasks_ExcludesTasksDueInPast()
    {
        // Arrange - use weekStart-relative dates so tasks fall in the right window
        var weekStart = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc);

        await _context.Tasks.AddRangeAsync(
            // Should be excluded (before weekStart)
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Overdue", Priority = Priority.Critical, DueDate = weekStart.AddDays(-5), Completed = false },
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Yesterday", Priority = Priority.High, DueDate = weekStart.AddDays(-1), Completed = false },

            // Should be included (within [weekStart, weekStart+7))
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Tomorrow", Priority = Priority.Critical, DueDate = weekStart.AddDays(1), Completed = false },
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Day Five", Priority = Priority.High, DueDate = weekStart.AddDays(5), Completed = false }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUrgentTasksAsync(_testUserId, weekStart);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, task => Assert.True(task.DueDate >= weekStart));
    }

    [Fact]
    public async Task GetUrgentTasks_OnlyIncludesTasksWithinWeek()
    {
        // Arrange
        var weekStart = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc); // Monday
        var weekEnd = weekStart.AddDays(7); // Next Monday
        var now = DateTime.UtcNow;
        
        await _context.Tasks.AddRangeAsync(
            // Should be included (within week)
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Day 1", Priority = Priority.Critical, DueDate = weekStart.AddDays(1), Completed = false },
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Day 6", Priority = Priority.High, DueDate = weekStart.AddDays(6), Completed = false },
            
            // Should be excluded (beyond week)
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Next Week", Priority = Priority.Critical, DueDate = weekEnd.AddDays(1), Completed = false },
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Far Future", Priority = Priority.High, DueDate = weekEnd.AddDays(30), Completed = false }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUrgentTasksAsync(_testUserId, weekStart);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, task => Assert.True(task.DueDate < weekEnd));
    }

    [Fact]
    public async Task GetUrgentTasks_SortsByDueDateThenPriority()
    {
        // Arrange - baseDate chosen so baseDate+3 stays within [weekStart, weekStart+7)
        var weekStart = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc);
        var baseDate = new DateTime(2026, 1, 6, 0, 0, 0, DateTimeKind.Utc);

        var task1 = new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Later High", Priority = Priority.High, DueDate = baseDate.AddDays(3), Completed = false };
        var task2 = new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Soon High", Priority = Priority.High, DueDate = baseDate.AddDays(1), Completed = false };
        var task3 = new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Soon Critical", Priority = Priority.Critical, DueDate = baseDate.AddDays(1), Completed = false };
        
        await _context.Tasks.AddRangeAsync(task1, task2, task3);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUrgentTasksAsync(_testUserId, weekStart);

        // Assert
        Assert.Equal(3, result.Count);
        // First: earliest due date with highest priority
        Assert.Equal("Soon Critical", result[0].Title);
        Assert.Equal("Critical", result[0].Priority);
        // Second: same due date but lower priority
        Assert.Equal("Soon High", result[1].Title);
        Assert.Equal("High", result[1].Priority);
        // Third: later due date
        Assert.Equal("Later High", result[2].Title);
    }

    [Fact]
    public async Task GetUrgentTasks_LimitsResultsTo10Tasks()
    {
        // Arrange - spread 15 tasks within the 7-day window using 10-hour offsets
        var weekStart = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc);

        // Create 15 urgent tasks, all within [weekStart, weekStart+7)
        var tasks = Enumerable.Range(1, 15).Select(i => new TaskEntity
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = $"Task {i}",
            Priority = Priority.Critical,
            DueDate = weekStart.AddHours(i * 10), // max: 150h = Jan 11 06:00, within window
            Completed = false
        });
        
        await _context.Tasks.AddRangeAsync(tasks);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUrgentTasksAsync(_testUserId, weekStart);

        // Assert - only first 10 by date order
        Assert.Equal(10, result.Count);
    }

    [Fact]
    public async Task GetUrgentTasks_CalculatesDaysUntilDueCorrectly()
    {
        // Arrange - weekStart must contain today so due dates fall within the window
        // and DaysUntilDue (computed relative to DateTime.UtcNow) returns correct values
        var todayDate = DateTime.UtcNow.Date;
        var weekStart = DateTime.SpecifyKind(todayDate.AddDays(-1), DateTimeKind.Utc); // yesterday, so today+3 is within 7-day window
        var now = todayDate;

        await _context.Tasks.AddRangeAsync(
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Today", Priority = Priority.Critical, DueDate = now, Completed = false },
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Tomorrow", Priority = Priority.High, DueDate = now.AddDays(1), Completed = false },
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "In 3 Days", Priority = Priority.Critical, DueDate = now.AddDays(3), Completed = false }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUrgentTasksAsync(_testUserId, weekStart);

        // Assert
        Assert.Equal(3, result.Count);
        var today = result.FirstOrDefault(t => t.Title == "Today");
        var tomorrow = result.FirstOrDefault(t => t.Title == "Tomorrow");
        var threeDays = result.FirstOrDefault(t => t.Title == "In 3 Days");
        
        Assert.NotNull(today);
        Assert.Equal(0, today.DaysUntilDue);
        
        Assert.NotNull(tomorrow);
        Assert.Equal(1, tomorrow.DaysUntilDue);
        
        Assert.NotNull(threeDays);
        Assert.Equal(3, threeDays.DaysUntilDue);
    }

    [Fact]
    public async Task GetUrgentTasks_HandlesNullDueDates()
    {
        // Arrange
        var weekStart = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc);
        var now = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);
        
        await _context.Tasks.AddRangeAsync(
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Has Due Date", Priority = Priority.Critical, DueDate = now.AddDays(1), Completed = false },
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "No Due Date", Priority = Priority.Critical, DueDate = null, Completed = false }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUrgentTasksAsync(_testUserId, weekStart);

        // Assert - only tasks with due dates should be included
        Assert.Single(result);
        Assert.Equal("Has Due Date", result[0].Title);
    }

    [Fact]
    public async Task GetUrgentTasks_FiltersByUserId()
    {
        // Arrange
        var weekStart = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc);
        var otherUserId = Guid.NewGuid();
        var now = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);
        
        await _context.Tasks.AddRangeAsync(
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "My Task", Priority = Priority.Critical, DueDate = now.AddDays(1), Completed = false },
            new TaskEntity { Id = Guid.NewGuid(), UserId = otherUserId, Title = "Other User Task", Priority = Priority.Critical, DueDate = now.AddDays(1), Completed = false }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUrgentTasksAsync(_testUserId, weekStart);

        // Assert
        Assert.Single(result);
        Assert.Equal("My Task", result[0].Title);
    }

    [Fact]
    public async Task GetUrgentTasks_ReturnsEmptyListWhenNoUrgentTasks()
    {
        // Arrange
        var weekStart = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc);
        var now = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);
        
        // Only add low priority or completed tasks
        await _context.Tasks.AddRangeAsync(
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Low Priority", Priority = Priority.Low, DueDate = now.AddDays(1), Completed = false },
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Completed", Priority = Priority.Critical, DueDate = now.AddDays(1), Completed = true }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUrgentTasksAsync(_testUserId, weekStart);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetUrgentTasks_IncludesGroupIdInResults()
    {
        // Arrange
        var weekStart = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc);
        var now = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);
        var groupId = Guid.NewGuid();
        
        await _context.Tasks.AddAsync(
            new TaskEntity 
            { 
                Id = Guid.NewGuid(), 
                UserId = _testUserId, 
                Title = "Grouped Task", 
                Priority = Priority.Critical, 
                DueDate = now.AddDays(1), 
                Completed = false,
                GroupId = groupId
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUrgentTasksAsync(_testUserId, weekStart);

        // Assert
        Assert.Single(result);
        Assert.Equal(groupId, result[0].GroupId);
    }

    [Fact]
    public async Task GetUrgentTasks_PrioritizesCriticalOverHighWhenSameDueDate()
    {
        // Arrange - dueDate must be < weekStart+7 (Jan 12), so use Jan 11
        var weekStart = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc);
        var dueDate = new DateTime(2026, 1, 11, 0, 0, 0, DateTimeKind.Utc);
        
        await _context.Tasks.AddRangeAsync(
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "High Priority", Priority = Priority.High, DueDate = dueDate, Completed = false },
            new TaskEntity { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Critical Priority", Priority = Priority.Critical, DueDate = dueDate, Completed = false }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUrgentTasksAsync(_testUserId, weekStart);

        // Assert
        Assert.Equal(2, result.Count);
        // Critical should come before High when due dates are the same
        Assert.Equal("Critical Priority", result[0].Title);
        Assert.Equal("Critical", result[0].Priority);
        Assert.Equal("High Priority", result[1].Title);
        Assert.Equal("High", result[1].Priority);
    }
}
