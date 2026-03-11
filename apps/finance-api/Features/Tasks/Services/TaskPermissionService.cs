using TaskModel = FinanceApi.Features.Tasks.Models.Task;

namespace FinanceApi.Features.Tasks.Services;

public interface ITaskPermissionService
{
    /// <summary>Returns true if the user can edit the task's fields and status.</summary>
    bool CanEdit(Guid userId, TaskModel task);

    /// <summary>Returns true if the user can assign or reassign the task. Owner only.</summary>
    bool CanAssign(Guid userId, TaskModel task);

    /// <summary>Returns true if the user can delete the task. Owner only.</summary>
    bool CanDelete(Guid userId, TaskModel task);

    /// <summary>Returns true if the user can add subtasks to this task.</summary>
    bool CanAddSubtasks(Guid userId, TaskModel task);
}

public class TaskPermissionService : ITaskPermissionService
{
    public bool CanEdit(Guid userId, TaskModel task) =>
        task.UserId == userId || task.AssignedToUserId == userId;

    public bool CanAssign(Guid userId, TaskModel task) =>
        task.UserId == userId;

    public bool CanDelete(Guid userId, TaskModel task) =>
        task.UserId == userId;

    public bool CanAddSubtasks(Guid userId, TaskModel task) =>
        task.UserId == userId || task.AssignedToUserId == userId;
}
