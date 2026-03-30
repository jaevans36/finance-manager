using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using LifeApi.Data;
using LifeApi.Features.Tasks.Services;
using LifeApi.Features.Tasks.DTOs;
using LifeApi.Features.Tasks.Models;
using LifeApi.Features.Auth.Models;
using LifeApi.Features.Common.ActivityLogs.Services;
using LifeApi.Features.Notifications.Services;
using LifeApi.Features.Settings.Services;
using TaskModel = LifeApi.Features.Tasks.Models.Task; // Alias to avoid ambiguity

namespace LifeApi.UnitTests.Features.Tasks.Services;

/// <summary>
/// Unit tests for TaskService
/// 
/// Learning Topics:
/// - Testing CRUD operations
/// - Testing business logic (priority validation, due dates)
/// - Testing user-specific data access
/// - Testing with related entities (User)
/// </summary>
public class TaskServiceTests : IDisposable
{
    private readonly FinanceDbContext _context;
    private readonly Mock<IActivityLogService> _mockActivityLogService;
    private readonly Mock<IWipService> _mockWipService;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly TaskService _taskService;
    private readonly User _testUser;

    public TaskServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new FinanceDbContext(options);
        _mockActivityLogService = new Mock<IActivityLogService>();
        _mockWipService = new Mock<IWipService>();
        _mockNotificationService = new Mock<INotificationService>();

        var taskGroupService = new TaskGroupService(_context, _mockActivityLogService.Object);
        _taskService = new TaskService(_context, _mockActivityLogService.Object, taskGroupService, _mockWipService.Object, _mockNotificationService.Object);

        // Create a test user
        _testUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "testuser@example.com",
            PasswordHash = "hash",
            EmailVerified = true
        };
        _context.Users.Add(_testUser);
        _context.SaveChanges();
    }

    #region CreateTask Tests

    [Fact]
    public async System.Threading.Tasks.Task CreateTaskAsync_WithValidData_ShouldCreateTask()
    {
        // Arrange
        var request = new CreateTaskRequest
        {
            Title = "Test Task",
            Description = "Test Description",
            Priority = "Medium",
            DueDate = DateTime.UtcNow.AddDays(7)
        };

        // Act
        var result = await _taskService.CreateTaskAsync(_testUser.Id, request);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be(request.Title);
        result.Description.Should().Be(request.Description);
        result.Priority.Should().Be("Medium");
        result.Completed.Should().BeFalse();

        // Verify task was saved to database
        var savedTask = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == result.Id);
        savedTask.Should().NotBeNull();
        savedTask!.Title.Should().Be(request.Title);
    }

    // NOTE: Priority validation test removed
    // The service doesn't validate priority enum values - this validation should be done
    // at the controller level using model validation attributes (e.g., [EnumDataType(typeof(TaskPriority))])
    // Testing controller-level validation requires integration tests, not unit tests

    [Theory] // Theory allows testing multiple inputs
    [InlineData("Low")]
    [InlineData("Medium")]
    [InlineData("High")]
    [InlineData(null)] // Null priority should work (defaults to Medium)
    public async System.Threading.Tasks.Task CreateTaskAsync_WithValidPriorities_ShouldSucceed(string? priority)
    {
        // Arrange
        var request = new CreateTaskRequest
        {
            Title = $"Task with {priority ?? "null"} priority",
            Priority = priority
        };

        // Act
        var result = await _taskService.CreateTaskAsync(_testUser.Id, request);

        // Assert
        result.Should().NotBeNull();
        result.Priority.Should().Be(priority ?? "Medium");
    }

    #endregion

    #region UpdateTask Tests

    [Fact]
    public async System.Threading.Tasks.Task UpdateTaskAsync_WithValidData_ShouldUpdateTask()
    {
        // Arrange - Create a task first
        var task = new TaskModel
        {
            UserId = _testUser.Id,
            Title = "Original Title",
            Description = "Original Description",
            Priority = Priority.Low,
            Completed = false
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateTaskRequest
        {
            Title = "Updated Title",
            Description = "Updated Description",
            Priority = "High",
            Completed = true
        };

        // Act
        var result = await _taskService.UpdateTaskAsync(_testUser.Id, task.Id, updateRequest);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Updated Title");
        result.Description.Should().Be("Updated Description");
        result.Priority.Should().Be("High");
        result.Completed.Should().BeTrue();

        // Verify database was updated
        var updatedTask = await _context.Tasks.FindAsync(task.Id);
        updatedTask!.Title.Should().Be("Updated Title");
        updatedTask.Priority.Should().Be(Priority.High);
    }

    [Fact]
    public async System.Threading.Tasks.Task UpdateTaskAsync_WithNonExistentTask_ShouldThrowException()
    {
        // Arrange
        var nonExistentTaskId = Guid.NewGuid();
        var updateRequest = new UpdateTaskRequest { Title = "New Title" };

        // Act & Assert
        var act = async () => await _taskService.UpdateTaskAsync(_testUser.Id, nonExistentTaskId, updateRequest);

        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("Task not found");
    }

    [Fact]
    public async System.Threading.Tasks.Task UpdateTaskAsync_WithDifferentUser_ShouldThrowException()
    {
        // Arrange - Create task for test user
        var task = new TaskModel
        {
            UserId = _testUser.Id,
            Title = "Original Title",
            Priority = Priority.Low
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var otherUserId = Guid.NewGuid(); // Different user
        var updateRequest = new UpdateTaskRequest { Title = "Hacked Title" };

        // Act & Assert - Should not allow updating another user's task
        var act = async () => await _taskService.UpdateTaskAsync(otherUserId, task.Id, updateRequest);

        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("Task not found");
    }

    [Fact]
    public async System.Threading.Tasks.Task UpdateTaskAsync_MarkingAsCompleted_ShouldSetCompletedAt()
    {
        // Arrange
        var task = new TaskModel
        {
            UserId = _testUser.Id,
            Title = "Task to Complete",
            Priority = Priority.Medium,
            Completed = false
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateTaskRequest { Completed = true };

        // Act
        var result = await _taskService.UpdateTaskAsync(_testUser.Id, task.Id, updateRequest);

        // Assert
        result.Completed.Should().BeTrue();

        var updatedTask = await _context.Tasks.FindAsync(task.Id);
        updatedTask!.CompletedAt.Should().NotBeNull();
        updatedTask.CompletedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    #endregion

    #region DeleteTask Tests

    [Fact]
    public async System.Threading.Tasks.Task DeleteTaskAsync_WithExistingTask_ShouldDeleteTask()
    {
        // Arrange
        var task = new TaskModel
        {
            UserId = _testUser.Id,
            Title = "Task to Delete",
            Priority = Priority.Low
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // Act
        await _taskService.DeleteTaskAsync(_testUser.Id, task.Id);

        // Assert
        var deletedTask = await _context.Tasks.FindAsync(task.Id);
        deletedTask.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task DeleteTaskAsync_WithNonExistentTask_ShouldThrowException()
    {
        // Arrange
        var nonExistentTaskId = Guid.NewGuid();

        // Act & Assert
        var act = async () => await _taskService.DeleteTaskAsync(_testUser.Id, nonExistentTaskId);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    #endregion

    #region GetTasks Tests

    [Fact]
    public async System.Threading.Tasks.Task GetTasksAsync_ShouldReturnOnlyUserTasks()
    {
        // Arrange - Create tasks for test user and another user
        var otherUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "other@example.com",
            PasswordHash = "hash",
            EmailVerified = true
        };
        _context.Users.Add(otherUser);

        var userTasks = new[]
        {
            new TaskModel { UserId = _testUser.Id, Title = "Task 1", Priority = Priority.High },
            new TaskModel { UserId = _testUser.Id, Title = "Task 2", Priority = Priority.Low },
        };

        var otherUserTask = new TaskModel
        {
            UserId = otherUser.Id,
            Title = "Other User Task",
            Priority = Priority.Medium
        };

        _context.Tasks.AddRange(userTasks);
        _context.Tasks.Add(otherUserTask);
        await _context.SaveChangesAsync();

        // Act
        var result = await _taskService.GetTasksAsync(_testUser.Id);

        // Assert
        result.Should().HaveCount(2);
        result.Should().NotContain(t => t.Title == "Other User Task");
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTasksAsync_ShouldReturnTasksOrderedByCreatedDate()
    {
        // Arrange
        var tasks = new[]
        {
            new TaskModel
            {
                UserId = _testUser.Id,
                Title = "Third Task",
                Priority = Priority.Low,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new TaskModel
            {
                UserId = _testUser.Id,
                Title = "First Task",
                Priority = Priority.High,
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new TaskModel
            {
                UserId = _testUser.Id,
                Title = "Second Task",
                Priority = Priority.Medium,
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            }
        };

        _context.Tasks.AddRange(tasks);
        await _context.SaveChangesAsync();

        // Act
        var result = await _taskService.GetTasksAsync(_testUser.Id);

        // Assert - Tasks are returned in descending order (newest first)
        result.Should().HaveCount(3);
        result[0].Title.Should().Be("Third Task");
        result[1].Title.Should().Be("Second Task");
        result[2].Title.Should().Be("First Task");
    }

    #endregion

    #region GetTaskById Tests

    [Fact]
    public async System.Threading.Tasks.Task GetTaskByIdAsync_WithExistingTask_ShouldReturnTask()
    {
        // Arrange
        var task = new TaskModel
        {
            UserId = _testUser.Id,
            Title = "Test Task",
            Priority = Priority.Medium
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // Act
        var result = await _taskService.GetTaskByIdAsync(_testUser.Id, task.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(task.Id);
        result.Title.Should().Be("Test Task");
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTaskByIdAsync_WithNonExistentTask_ShouldReturnNull()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var result = await _taskService.GetTaskByIdAsync(_testUser.Id, nonExistentId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task GetTaskByIdAsync_WithDifferentUser_ShouldReturnNull()
    {
        // Arrange
        var task = new TaskModel
        {
            UserId = _testUser.Id,
            Title = "Test Task",
            Priority = Priority.Medium
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var otherUserId = Guid.NewGuid();

        // Act
        var result = await _taskService.GetTaskByIdAsync(otherUserId, task.Id);

        // Assert - Should not return another user's task
        result.Should().BeNull();
    }

    #endregion

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
