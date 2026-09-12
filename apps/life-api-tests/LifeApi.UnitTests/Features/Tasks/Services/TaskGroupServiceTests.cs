using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using LifeApi.Data;
using LifeApi.Features.Tasks.Services;
using LifeApi.Features.Tasks.Models;
using LifeApi.Features.Auth.Models;
using LifeApi.Features.Common.ActivityLogs.Services;
using TaskModel = LifeApi.Features.Tasks.Models.Task; // Alias to avoid ambiguity

namespace LifeApi.UnitTests.Features.Tasks.Services;

public class TaskGroupServiceTests : IDisposable
{
    private readonly FinanceDbContext _context;
    private readonly Mock<IActivityLogService> _mockActivityLogService;
    private readonly TaskGroupService _taskGroupService;
    private readonly User _testUser;

    public TaskGroupServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new FinanceDbContext(options);
        _mockActivityLogService = new Mock<IActivityLogService>();
        _taskGroupService = new TaskGroupService(_context, _mockActivityLogService.Object);

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

    [Fact]
    public async System.Threading.Tasks.Task GetUserGroupsAsync_ShouldCountOnlyRootLevelTasks()
    {
        // Arrange — a group with 1 root task and 2 subtasks of that root task.
        // The group task list only ever surfaces root tasks (subtasks are nested
        // inside their parent's card), so the badge count must match that, not
        // the raw row count in the group.
        var group = new TaskGroup { UserId = _testUser.Id, Name = "Home Renovation" };
        _context.TaskGroups.Add(group);
        await _context.SaveChangesAsync();

        var rootTask = new TaskModel { UserId = _testUser.Id, GroupId = group.Id, Title = "Root task", Priority = Priority.Medium };
        _context.Tasks.Add(rootTask);
        await _context.SaveChangesAsync();

        _context.Tasks.AddRange(
            new TaskModel { UserId = _testUser.Id, GroupId = group.Id, ParentTaskId = rootTask.Id, Title = "Subtask 1", Priority = Priority.Medium },
            new TaskModel { UserId = _testUser.Id, GroupId = group.Id, ParentTaskId = rootTask.Id, Title = "Subtask 2", Priority = Priority.Medium }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _taskGroupService.GetUserGroupsAsync(_testUser.Id);

        // Assert
        var groupResponse = result.Should().ContainSingle(g => g.Id == group.Id).Subject;
        groupResponse.TaskCount.Should().Be(1);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
