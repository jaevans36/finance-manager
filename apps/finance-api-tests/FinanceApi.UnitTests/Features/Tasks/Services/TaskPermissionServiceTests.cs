using Xunit;
using FluentAssertions;
using FinanceApi.Features.Tasks.Services;
using TaskModel = FinanceApi.Features.Tasks.Models.Task;

namespace FinanceApi.UnitTests.Features.Tasks.Services;

public class TaskPermissionServiceTests
{
    private readonly ITaskPermissionService _sut = new TaskPermissionService();

    private static TaskModel MakeTask(Guid ownerId, Guid? assigneeId = null) =>
        new TaskModel { Id = Guid.NewGuid(), UserId = ownerId, AssignedToUserId = assigneeId };

    [Fact]
    public void CanEdit_Owner_ReturnsTrue()
    {
        var ownerId = Guid.NewGuid();
        var task = MakeTask(ownerId);
        _sut.CanEdit(ownerId, task).Should().BeTrue();
    }

    [Fact]
    public void CanEdit_Assignee_ReturnsTrue()
    {
        var ownerId = Guid.NewGuid();
        var assigneeId = Guid.NewGuid();
        var task = MakeTask(ownerId, assigneeId);
        _sut.CanEdit(assigneeId, task).Should().BeTrue();
    }

    [Fact]
    public void CanEdit_RandomUser_ReturnsFalse()
    {
        var task = MakeTask(Guid.NewGuid(), Guid.NewGuid());
        _sut.CanEdit(Guid.NewGuid(), task).Should().BeFalse();
    }

    [Fact]
    public void CanAssign_Owner_ReturnsTrue()
    {
        var ownerId = Guid.NewGuid();
        var task = MakeTask(ownerId);
        _sut.CanAssign(ownerId, task).Should().BeTrue();
    }

    [Fact]
    public void CanAssign_Assignee_ReturnsFalse()
    {
        var ownerId = Guid.NewGuid();
        var assigneeId = Guid.NewGuid();
        var task = MakeTask(ownerId, assigneeId);
        _sut.CanAssign(assigneeId, task).Should().BeFalse();
    }

    [Fact]
    public void CanDelete_Owner_ReturnsTrue()
    {
        var ownerId = Guid.NewGuid();
        var task = MakeTask(ownerId);
        _sut.CanDelete(ownerId, task).Should().BeTrue();
    }

    [Fact]
    public void CanDelete_Assignee_ReturnsFalse()
    {
        var ownerId = Guid.NewGuid();
        var assigneeId = Guid.NewGuid();
        var task = MakeTask(ownerId, assigneeId);
        _sut.CanDelete(assigneeId, task).Should().BeFalse();
    }

    [Fact]
    public void CanAddSubtasks_Owner_ReturnsTrue()
    {
        var ownerId = Guid.NewGuid();
        var task = MakeTask(ownerId);
        _sut.CanAddSubtasks(ownerId, task).Should().BeTrue();
    }

    [Fact]
    public void CanAddSubtasks_Assignee_ReturnsTrue()
    {
        var ownerId = Guid.NewGuid();
        var assigneeId = Guid.NewGuid();
        var task = MakeTask(ownerId, assigneeId);
        _sut.CanAddSubtasks(assigneeId, task).Should().BeTrue();
    }

    [Fact]
    public void CanAddSubtasks_RandomUser_ReturnsFalse()
    {
        var task = MakeTask(Guid.NewGuid(), Guid.NewGuid());
        _sut.CanAddSubtasks(Guid.NewGuid(), task).Should().BeFalse();
    }
}
