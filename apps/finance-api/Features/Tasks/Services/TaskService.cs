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
    System.Threading.Tasks.Task<TaskDto?> GetTaskByIdAsync(Guid userId, Guid taskId);
    System.Threading.Tasks.Task<List<TaskDto>> GetTasksAsync(Guid userId);
}

public class TaskService : ITaskService
{
    private readonly FinanceDbContext _context;
    private readonly IActivityLogService _activityLogService;

    public TaskService(FinanceDbContext context, IActivityLogService activityLogService)
    {
        _context = context;
        _activityLogService = activityLogService;
    }

    public async System.Threading.Tasks.Task<TaskDto> CreateTaskAsync(Guid userId, CreateTaskRequest request)
    {
        var priority = Enum.TryParse<Models.Priority>(request.Priority, true, out var parsedPriority) 
            ? parsedPriority 
            : Models.Priority.Medium;

        var task = new Models.Task
        {
            UserId = userId,
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

        return MapToTaskDto(task);
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

        return MapToTaskDto(task);
    }

    public async System.Threading.Tasks.Task DeleteTaskAsync(Guid userId, Guid taskId)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);

        if (task == null)
        {
            throw new KeyNotFoundException("Task not found");
        }

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(userId, ActivityType.TaskDeleted, $"Deleted task: {task.Title}", null, null);
    }

    public async System.Threading.Tasks.Task<TaskDto?> GetTaskByIdAsync(Guid userId, Guid taskId)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);

        return task == null ? null : MapToTaskDto(task);
    }

    public async System.Threading.Tasks.Task<List<TaskDto>> GetTasksAsync(Guid userId)
    {
        var tasks = await _context.Tasks
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return tasks.Select(MapToTaskDto).ToList();
    }

    private static TaskDto MapToTaskDto(Models.Task task)
    {
        return new TaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            Priority = task.Priority.ToString(),
            DueDate = task.DueDate,
            Completed = task.Completed,
            CompletedAt = task.CompletedAt,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        };
    }
}
