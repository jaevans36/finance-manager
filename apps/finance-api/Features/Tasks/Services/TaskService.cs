using FinanceApi.Data;
using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Tasks.DTOs;
using FinanceApi.Features.Common.ActivityLogs.Services;
using FinanceApi.Features.Common.ActivityLogs.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Tasks.Services;

public interface ITaskService
{
    System.Threading.Tasks.Task<TaskDto> CreateTaskAsync(Guid userId, CreateTaskRequest request);
    System.Threading.Tasks.Task<TaskDto> UpdateTaskAsync(Guid userId, Guid taskId, UpdateTaskRequest request);
    System.Threading.Tasks.Task DeleteTaskAsync(Guid userId, Guid taskId);
    System.Threading.Tasks.Task<TaskDto?> GetTaskByIdAsync(Guid userId, Guid taskId, bool includeSubtasks = false);
    System.Threading.Tasks.Task<List<TaskDto>> GetTasksAsync(
        Guid userId, 
        DateTime? startDate = null, 
        DateTime? endDate = null,
        string? priority = null,
        Guid? groupId = null,
        bool? completed = null,
        bool? rootOnly = null);
    System.Threading.Tasks.Task<List<TaskDto>> GetTasksByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate);
}

public class TaskService : ITaskService
{
    private readonly FinanceDbContext _context;
    private readonly IActivityLogService _activityLogService;
    private readonly TaskGroupService _taskGroupService;

    public TaskService(FinanceDbContext context, IActivityLogService activityLogService, TaskGroupService taskGroupService)
    {
        _context = context;
        _activityLogService = activityLogService;
        _taskGroupService = taskGroupService;
    }

    public async System.Threading.Tasks.Task<TaskDto> CreateTaskAsync(Guid userId, CreateTaskRequest request)
    {
        var priority = Enum.TryParse<Models.Priority>(request.Priority, true, out var parsedPriority) 
            ? parsedPriority 
            : Models.Priority.Medium;

        // If no group specified, use default group
        Guid? groupId = request.GroupId;
        if (!groupId.HasValue)
        {
            var defaultGroup = await _taskGroupService.GetOrCreateDefaultGroupAsync(userId);
            groupId = defaultGroup.Id;
        }

        var task = new Models.Task
        {
            UserId = userId,
            GroupId = groupId,
            Title = request.Title,
            Description = request.Description,
            Priority = priority,
            DueDate = request.DueDate.HasValue ? DateTime.SpecifyKind(request.DueDate.Value, DateTimeKind.Utc) : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(userId, ActivityType.TaskCreated, $"Created task: {task.Title}", null, null);

        return await MapToTaskDtoAsync(task);
    }

    public async System.Threading.Tasks.Task<TaskDto> UpdateTaskAsync(Guid userId, Guid taskId, UpdateTaskRequest request)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);

        if (task == null)
        {
            throw new KeyNotFoundException("Task not found");
        }

        if (request.Title != null) task.Title = request.Title;
        if (request.Description != null) task.Description = request.Description;
        if (request.Priority != null && Enum.TryParse<Models.Priority>(request.Priority, true, out var priority))
        {
            task.Priority = priority;
        }
        if (request.DueDate.HasValue) task.DueDate = DateTime.SpecifyKind(request.DueDate.Value, DateTimeKind.Utc);

        if (request.GroupId.HasValue) task.GroupId = request.GroupId;

        if (request.Completed.HasValue)
        {
            task.Completed = request.Completed.Value;
            if (request.Completed.Value && !task.CompletedAt.HasValue)
            {
                task.CompletedAt = DateTime.UtcNow;
                await _activityLogService.LogAsync(userId, ActivityType.TaskCompleted, $"Completed task: {task.Title}", null, null);
            }
            else if (!request.Completed.Value)
            {
                task.CompletedAt = null;
            }
        }

        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(userId, ActivityType.TaskUpdated, $"Updated task: {task.Title}", null, null);

        return await MapToTaskDtoAsync(task);
    }

    public async System.Threading.Tasks.Task DeleteTaskAsync(Guid userId, Guid taskId)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);

        if (task == null)
        {
            throw new KeyNotFoundException("Task not found");
        }

        // Cascade delete all descendant subtasks (deepest first to respect FK constraints)
        await DeleteDescendantsAsync(taskId);

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(userId, ActivityType.TaskDeleted, $"Deleted task: {task.Title}", null, null);
    }

    public async System.Threading.Tasks.Task<TaskDto?> GetTaskByIdAsync(Guid userId, Guid taskId, bool includeSubtasks = false)
    {
        var task = await _context.Tasks
            .Include(t => t.Group)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);

        if (task == null) return null;

        var dto = await MapToTaskDtoAsync(task);

        if (includeSubtasks && dto.HasSubtasks)
        {
            dto.Subtasks = await BuildSubtreeAsync(userId, taskId);
        }

        return dto;
    }

    public async System.Threading.Tasks.Task<List<TaskDto>> GetTasksAsync(
        Guid userId,
        DateTime? startDate = null,
        DateTime? endDate = null,
        string? priority = null,
        Guid? groupId = null,
        bool? completed = null,
        bool? rootOnly = null)
    {
        var query = _context.Tasks
            .Include(t => t.Group)
            .Where(t => t.UserId == userId);

        // By default, filter to root-level tasks only (no parent)
        if (rootOnly != false)
        {
            query = query.Where(t => t.ParentTaskId == null);
        }

        // Apply date range filter
        if (startDate.HasValue && endDate.HasValue)
        {
            query = query.Where(t => t.DueDate != null && 
                                  t.DueDate >= startDate.Value && 
                                  t.DueDate <= endDate.Value);
        }
        else if (startDate.HasValue)
        {
            query = query.Where(t => t.DueDate != null && t.DueDate >= startDate.Value);
        }
        else if (endDate.HasValue)
        {
            query = query.Where(t => t.DueDate != null && t.DueDate <= endDate.Value);
        }

        // Apply priority filter
        if (!string.IsNullOrEmpty(priority) && Enum.TryParse<Models.Priority>(priority, true, out var parsedPriority))
        {
            query = query.Where(t => t.Priority == parsedPriority);
        }

        // Apply group filter
        if (groupId.HasValue)
        {
            query = query.Where(t => t.GroupId == groupId.Value);
        }

        // Apply completed filter
        if (completed.HasValue)
        {
            query = query.Where(t => t.Completed == completed.Value);
        }

        var tasks = await query
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var taskDtos = new List<TaskDto>();
        foreach (var task in tasks)
        {
            taskDtos.Add(await MapToTaskDtoAsync(task));
        }
        return taskDtos;
    }

    public async System.Threading.Tasks.Task<List<TaskDto>> GetTasksByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate)
    {
        var tasks = await _context.Tasks
            .Include(t => t.Group)
            .Where(t => t.UserId == userId &&
                        t.DueDate != null &&
                        t.DueDate >= startDate &&
                        t.DueDate <= endDate)
            .OrderByDescending(t => t.Priority)
            .ThenBy(t => t.DueDate)
            .ToListAsync();

        var taskDtos = new List<TaskDto>();
        foreach (var task in tasks)
        {
            taskDtos.Add(await MapToTaskDtoAsync(task));
        }
        return taskDtos;
    }

    private async System.Threading.Tasks.Task<TaskDto> MapToTaskDtoAsync(Models.Task task)
    {
        // Count direct subtasks
        var subtaskCount = await _context.Tasks.CountAsync(t => t.ParentTaskId == task.Id);
        var completedSubtaskCount = await _context.Tasks.CountAsync(t => t.ParentTaskId == task.Id && t.Completed);

        return new TaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            Priority = task.Priority.ToString(),
            DueDate = task.DueDate,
            Completed = task.Completed,
            CompletedAt = task.CompletedAt,
            GroupId = task.GroupId,
            GroupName = task.Group?.Name,
            GroupColour = task.Group?.Colour,
            ParentTaskId = task.ParentTaskId,
            HasSubtasks = subtaskCount > 0,
            SubtaskCount = subtaskCount,
            CompletedSubtaskCount = completedSubtaskCount,
            ProgressPercentage = subtaskCount > 0
                ? Math.Round((decimal)completedSubtaskCount / subtaskCount * 100, 1)
                : 0,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        };
    }

    /// <summary>
    /// Recursively deletes all descendants of a task (deepest first).
    /// </summary>
    private async System.Threading.Tasks.Task DeleteDescendantsAsync(Guid taskId)
    {
        var children = await _context.Tasks
            .Where(t => t.ParentTaskId == taskId)
            .ToListAsync();

        foreach (var child in children)
        {
            await DeleteDescendantsAsync(child.Id);
            _context.Tasks.Remove(child);
        }
    }

    /// <summary>
    /// Builds a full nested subtree for a parent task.
    /// </summary>
    private async System.Threading.Tasks.Task<List<TaskDto>> BuildSubtreeAsync(Guid userId, Guid parentId)
    {
        var directChildren = await _context.Tasks
            .Include(t => t.Group)
            .Where(t => t.ParentTaskId == parentId && t.UserId == userId)
            .OrderBy(t => t.SortOrder)
            .ToListAsync();

        var result = new List<TaskDto>();
        foreach (var child in directChildren)
        {
            var dto = await MapToTaskDtoAsync(child);

            var nestedSubtasks = await BuildSubtreeAsync(userId, child.Id);
            dto.Subtasks = nestedSubtasks.Count > 0 ? nestedSubtasks : null;

            result.Add(dto);
        }

        return result;
    }
}
