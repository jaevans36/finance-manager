using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Auth.Models;
using FinanceApi.Features.Tasks.Services;
using FinanceApi.Features.Tasks.DTOs;
using FinanceApi.Features.Notifications.Services;
using FinanceApi.Features.Common.ActivityLogs.Services;
using FinanceApi.Features.Settings.Services;
using FinanceApi.Features.Notifications.Models;

namespace FinanceApi.IntegrationTests.Features.Tasks;

public class TaskAssignmentTests : IDisposable
{
    private readonly FinanceDbContext _context;
    private readonly ITaskService _taskService;
    private readonly INotificationService _notificationService;
    private readonly User _owner;
    private readonly User _assignee;

    public TaskAssignmentTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new FinanceDbContext(options);

        _notificationService = new NotificationService(_context);
        var mockActivityLog = new Mock<IActivityLogService>().Object;
        var taskGroupService = new TaskGroupService(_context, mockActivityLog);
        var mockWip = new Mock<IWipService>().Object;
        _taskService = new TaskService(_context, mockActivityLog, taskGroupService, mockWip, _notificationService);

        _owner = new User { Id = Guid.NewGuid(), Email = "owner@test.com", Username = "owner", PasswordHash = "x", EmailVerified = true };
        _assignee = new User { Id = Guid.NewGuid(), Email = "assignee@test.com", Username = "assignee", PasswordHash = "x", EmailVerified = true };
        _context.Users.AddRange(_owner, _assignee);
        _context.SaveChanges();
    }

    [Fact]
    public async Task AssignTask_ValidAssignee_TaskHasAssignedToUserId()
    {
        var task = await _taskService.CreateTaskAsync(_owner.Id, new CreateTaskRequest { Title = "Test Task" });

        var result = await _taskService.AssignTaskAsync(_owner.Id, task.Id, _assignee.Username);

        result.AssignedTo.Should().NotBeNull();
        result.AssignedTo!.Username.Should().Be("assignee");
        result.IsOwner.Should().BeTrue();
    }

    [Fact]
    public async Task AssignTask_CreatesNotificationForAssignee()
    {
        var task = await _taskService.CreateTaskAsync(_owner.Id, new CreateTaskRequest { Title = "Important Task" });
        await _taskService.AssignTaskAsync(_owner.Id, task.Id, _assignee.Username);

        var notifications = await _notificationService.GetNotificationsAsync(_assignee.Id);
        notifications.Should().HaveCount(1);
        notifications[0].Type.Should().Be(NotificationType.TaskAssigned);
        notifications[0].EntityTitle.Should().Be("Important Task");
    }

    [Fact]
    public async Task AssignTask_NonOwner_ThrowsKeyNotFoundException()
    {
        var task = await _taskService.CreateTaskAsync(_owner.Id, new CreateTaskRequest { Title = "Test" });

        await _taskService.Invoking(s => s.AssignTaskAsync(_assignee.Id, task.Id, _owner.Username))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task AssignTask_Self_ThrowsInvalidOperationException()
    {
        var task = await _taskService.CreateTaskAsync(_owner.Id, new CreateTaskRequest { Title = "Test" });

        await _taskService.Invoking(s => s.AssignTaskAsync(_owner.Id, task.Id, _owner.Username))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task GetTasksAsync_AssignedToMe_ReturnsOnlyAssignedTasks()
    {
        var ownTask = await _taskService.CreateTaskAsync(_owner.Id, new CreateTaskRequest { Title = "My task" });
        await _taskService.AssignTaskAsync(_owner.Id, ownTask.Id, _assignee.Username);
        await _taskService.CreateTaskAsync(_assignee.Id, new CreateTaskRequest { Title = "Assignee's own task" });

        var result = await _taskService.GetTasksAsync(_assignee.Id, view: "assigned-to-me");
        result.Should().HaveCount(1);
        result[0].Title.Should().Be("My task");
        result[0].IsOwner.Should().BeFalse();
    }

    [Fact]
    public async Task AssigneeCannotDeleteTask()
    {
        var task = await _taskService.CreateTaskAsync(_owner.Id, new CreateTaskRequest { Title = "Test" });
        await _taskService.AssignTaskAsync(_owner.Id, task.Id, _assignee.Username);

        await _taskService.Invoking(s => s.DeleteTaskAsync(_assignee.Id, task.Id))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task UnassignTask_CreatesNotificationForPreviousAssignee()
    {
        var task = await _taskService.CreateTaskAsync(_owner.Id, new CreateTaskRequest { Title = "Task" });
        await _taskService.AssignTaskAsync(_owner.Id, task.Id, _assignee.Username);

        await _taskService.UnassignTaskAsync(_owner.Id, task.Id);

        var notifications = await _notificationService.GetNotificationsAsync(_assignee.Id);
        notifications.Should().Contain(n => n.Type == NotificationType.TaskUnassigned);
    }

    public void Dispose() => _context.Dispose();
}
