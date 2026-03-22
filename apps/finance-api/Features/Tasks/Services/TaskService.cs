using FinanceApi.Data;
using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Tasks.DTOs;
using FinanceApi.Features.Labels.DTOs;
using FinanceApi.Features.Labels.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Notifications.Models;
using FinanceApi.Features.Notifications.Services;
using FinanceApi.Features.Settings.Services;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Tasks.Services;

public interface ITaskService
{
    System.Threading.Tasks.Task<TaskDto> CreateTaskAsync(Guid userId, CreateTaskRequest request);
    System.Threading.Tasks.Task<TaskDto> UpdateTaskAsync(Guid userId, Guid taskId, UpdateTaskRequest request);
    System.Threading.Tasks.Task<TaskDto> UpdateTaskStatusAsync(Guid userId, Guid taskId, UpdateTaskStatusRequest request);
    System.Threading.Tasks.Task<TaskDto> ClassifyTaskAsync(Guid userId, Guid taskId, ClassifyTaskRequest request);
    System.Threading.Tasks.Task<List<TaskDto>> BulkClassifyAsync(Guid userId, BulkClassifyRequest request);
    System.Threading.Tasks.Task<MatrixResponse> GetMatrixAsync(Guid userId, Guid? groupId = null, string? priority = null, bool includeCompleted = false);
    System.Threading.Tasks.Task<TaskDto> SetEnergyAsync(Guid userId, Guid taskId, SetEnergyRequest request);
    System.Threading.Tasks.Task<TaskDto> SetEstimateAsync(Guid userId, Guid taskId, SetEstimateRequest request);
    System.Threading.Tasks.Task<List<TaskDto>> BulkSetEnergyAsync(Guid userId, BulkEnergyRequest request);
    System.Threading.Tasks.Task<List<TaskDto>> GetSuggestionsAsync(Guid userId, string? energy = null, int? maxMinutes = null);
    System.Threading.Tasks.Task<EnergyDistributionDto> GetEnergyDistributionAsync(Guid userId);
    System.Threading.Tasks.Task DeleteTaskAsync(Guid userId, Guid taskId);
    System.Threading.Tasks.Task<TaskDto?> GetTaskByIdAsync(Guid userId, Guid taskId, bool includeSubtasks = false);
    System.Threading.Tasks.Task<List<TaskDto>> GetTasksAsync(
        Guid userId,
        DateTime? startDate = null,
        DateTime? endDate = null,
        string? priority = null,
        Guid? groupId = null,
        bool? completed = null,
        bool? rootOnly = null,
        string? status = null,
        string? view = null,
        Guid? labelId = null);
    System.Threading.Tasks.Task<List<TaskDto>> GetTasksByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate);
    System.Threading.Tasks.Task<TaskDto> AssignTaskAsync(Guid requestingUserId, Guid taskId, string usernameOrEmail);
    System.Threading.Tasks.Task<TaskDto> UnassignTaskAsync(Guid requestingUserId, Guid taskId);
}

public class TaskService : ITaskService
{
    private readonly FinanceDbContext _context;
    private readonly IActivityLogService _activityLogService;
    private readonly TaskGroupService _taskGroupService;
    private readonly IWipService _wipService;
    private readonly INotificationService _notificationService;

    public TaskService(FinanceDbContext context, IActivityLogService activityLogService, TaskGroupService taskGroupService, IWipService wipService, INotificationService notificationService)
    {
        _context = context;
        _activityLogService = activityLogService;
        _taskGroupService = taskGroupService;
        _wipService = wipService;
        _notificationService = notificationService;
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
            EnergyLevel = Enum.TryParse<Models.EnergyLevel>(request.EnergyLevel, true, out var energy) ? energy : null,
            EstimatedMinutes = request.EstimatedMinutes,
            ReminderAt = request.ReminderAt.HasValue ? DateTime.SpecifyKind(request.ReminderAt.Value, DateTimeKind.Utc) : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        if (request.LabelIds != null && request.LabelIds.Count > 0)
        {
            var validLabels = await _context.Labels
                .Where(l => l.UserId == userId && request.LabelIds.Contains(l.Id))
                .Select(l => l.Id)
                .ToListAsync();

            foreach (var labelId in validLabels)
            {
                _context.TaskLabels.Add(new TaskLabel { TaskId = task.Id, LabelId = labelId });
            }

            await _context.SaveChangesAsync();
        }

        await _activityLogService.LogAsync(userId, ActivityType.TaskCreated, $"Created task: {task.Title}", null, null);

        return await MapToTaskDtoAsync(task);
    }

    public async System.Threading.Tasks.Task<TaskDto> UpdateTaskAsync(Guid userId, Guid taskId, UpdateTaskRequest request)
    {
        var task = await _context.Tasks
            .Include(t => t.AssignedTo)
            .Include(t => t.Labels)
            .FirstOrDefaultAsync(t => t.Id == taskId &&
                (t.UserId == userId || t.AssignedToUserId == userId));

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

        if (request.EnergyLevel != null && Enum.TryParse<Models.EnergyLevel>(request.EnergyLevel, true, out var energyLevel))
        {
            task.EnergyLevel = energyLevel;
        }

        if (request.EstimatedMinutes.HasValue) task.EstimatedMinutes = request.EstimatedMinutes;

        if (request.ClearReminderAt)
        {
            task.ReminderAt = null;
        }
        else if (request.ReminderAt.HasValue)
        {
            task.ReminderAt = DateTime.SpecifyKind(request.ReminderAt.Value, DateTimeKind.Utc);
        }

        if (request.Completed.HasValue)
        {
            task.Completed = request.Completed.Value;
            if (request.Completed.Value && !task.CompletedAt.HasValue)
            {
                task.CompletedAt = DateTime.UtcNow;
                task.Status = Models.TaskStatus.Completed;
                await _activityLogService.LogAsync(userId, ActivityType.TaskCompleted, $"Completed task: {task.Title}", null, null);
            }
            else if (!request.Completed.Value)
            {
                task.CompletedAt = null;
                task.Status = Models.TaskStatus.NotStarted;
            }
        }

        if (request.LabelIds != null)
        {
            // Remove existing labels
            var existingLabels = task.Labels.ToList();
            _context.TaskLabels.RemoveRange(existingLabels);

            // Add new valid labels owned by user
            var validLabels = await _context.Labels
                .Where(l => l.UserId == userId && request.LabelIds.Contains(l.Id))
                .Select(l => l.Id)
                .ToListAsync();

            foreach (var labelId in validLabels)
            {
                _context.TaskLabels.Add(new TaskLabel { TaskId = task.Id, LabelId = labelId });
            }
        }

        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(userId, ActivityType.TaskUpdated, $"Updated task: {task.Title}", null, null);

        return await MapToTaskDtoAsync(task);
    }

    public async System.Threading.Tasks.Task<TaskDto> UpdateTaskStatusAsync(Guid userId, Guid taskId, UpdateTaskStatusRequest request)
    {
        var task = await _context.Tasks
            .Include(t => t.AssignedTo)
            .Include(t => t.Labels).ThenInclude(tl => tl.Label)
            .FirstOrDefaultAsync(t => t.Id == taskId &&
                (t.UserId == userId || t.AssignedToUserId == userId));

        if (task == null)
        {
            throw new KeyNotFoundException("Task not found");
        }

        if (!Enum.TryParse<Models.TaskStatus>(request.Status, true, out var newStatus))
        {
            throw new ArgumentException($"Invalid status: {request.Status}");
        }

        var oldStatus = task.Status;

        // Validate state transitions
        ValidateStatusTransition(oldStatus, newStatus);

        // Check WIP limits when transitioning to InProgress
        if (newStatus == Models.TaskStatus.InProgress && oldStatus != Models.TaskStatus.InProgress)
        {
            var canStart = await _wipService.CanStartTaskAsync(userId, task.GroupId);
            if (!canStart)
            {
                throw new InvalidOperationException("WIP limit reached. Complete or remove an in-progress task before starting a new one.");
            }
        }

        // Require BlockedReason when transitioning to Blocked
        if (newStatus == Models.TaskStatus.Blocked && string.IsNullOrWhiteSpace(request.BlockedReason))
        {
            throw new ArgumentException("A blocked reason is required when setting status to Blocked");
        }

        task.Status = newStatus;
        task.BlockedReason = newStatus == Models.TaskStatus.Blocked ? request.BlockedReason : null;

        // Sync timestamps
        if (newStatus == Models.TaskStatus.InProgress && !task.StartedAt.HasValue)
        {
            task.StartedAt = DateTime.UtcNow;
        }

        // Sync Completed boolean for backward compatibility
        if (newStatus == Models.TaskStatus.Completed)
        {
            task.Completed = true;
            task.CompletedAt ??= DateTime.UtcNow;
        }
        else if (oldStatus == Models.TaskStatus.Completed)
        {
            task.Completed = false;
            task.CompletedAt = null;
        }

        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var action = newStatus == Models.TaskStatus.Completed
            ? ActivityType.TaskCompleted
            : ActivityType.TaskUpdated;
        await _activityLogService.LogAsync(userId, action, $"Changed task status to {newStatus}: {task.Title}", null, null);

        // Notify owner if assignee completed the task
        if (task.Status == FinanceApi.Features.Tasks.Models.TaskStatus.Completed
            && task.AssignedToUserId == userId
            && task.UserId != userId)
        {
            await _notificationService.CreateAsync(
                task.UserId,
                NotificationType.TaskCompleted,
                NotificationEntityType.Task,
                task.Id,
                task.Title,
                userId);
        }

        return await MapToTaskDtoAsync(task);
    }

    private static void ValidateStatusTransition(Models.TaskStatus from, Models.TaskStatus to)
    {
        // All transitions are allowed, but log could be added for audit
        // The key constraint is that Blocked requires a reason (handled by caller)
        // Future: add strict transition rules if needed
    }

    public async System.Threading.Tasks.Task<TaskDto> ClassifyTaskAsync(Guid userId, Guid taskId, ClassifyTaskRequest request)
    {
        var task = await _context.Tasks
            .Include(t => t.Group)
            .Include(t => t.AssignedTo)
            .Include(t => t.Labels).ThenInclude(tl => tl.Label)
            .FirstOrDefaultAsync(t => t.Id == taskId &&
                (t.UserId == userId || t.AssignedToUserId == userId));

        if (task == null)
        {
            throw new KeyNotFoundException("Task not found");
        }

        if (request.Urgency != null)
        {
            if (!Enum.TryParse<Models.UrgencyLevel>(request.Urgency, true, out var urgency))
            {
                throw new ArgumentException($"Invalid urgency level: {request.Urgency}");
            }

            task.Urgency = urgency;
        }

        if (request.Importance != null)
        {
            if (!Enum.TryParse<Models.ImportanceLevel>(request.Importance, true, out var importance))
            {
                throw new ArgumentException($"Invalid importance level: {request.Importance}");
            }

            task.Importance = importance;
        }

        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(userId, ActivityType.TaskUpdated,
            $"Classified task: {task.Title} (Urgency={task.Urgency}, Importance={task.Importance})", null, null);

        return await MapToTaskDtoAsync(task);
    }

    public async System.Threading.Tasks.Task<List<TaskDto>> BulkClassifyAsync(Guid userId, BulkClassifyRequest request)
    {
        if (request.Items == null || request.Items.Count == 0)
        {
            throw new ArgumentException("At least one task must be specified for bulk classification");
        }

        var taskIds = request.Items.Select(i => i.TaskId).ToList();
        var tasks = await _context.Tasks
            .Include(t => t.Group)
            .Include(t => t.Labels).ThenInclude(tl => tl.Label)
            .Where(t => taskIds.Contains(t.Id) && t.UserId == userId)
            .ToListAsync();

        if (tasks.Count != taskIds.Count)
        {
            var foundIds = tasks.Select(t => t.Id).ToHashSet();
            var missing = taskIds.Where(id => !foundIds.Contains(id)).ToList();
            throw new KeyNotFoundException($"Tasks not found: {string.Join(", ", missing)}");
        }

        var taskLookup = tasks.ToDictionary(t => t.Id);

        foreach (var item in request.Items)
        {
            var task = taskLookup[item.TaskId];

            if (item.Urgency != null && Enum.TryParse<Models.UrgencyLevel>(item.Urgency, true, out var urgency))
            {
                task.Urgency = urgency;
            }

            if (item.Importance != null && Enum.TryParse<Models.ImportanceLevel>(item.Importance, true, out var importance))
            {
                task.Importance = importance;
            }

            task.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(userId, ActivityType.TaskUpdated,
            $"Bulk classified {request.Items.Count} tasks", null, null);

        var result = new List<TaskDto>();
        foreach (var task in tasks)
        {
            result.Add(await MapToTaskDtoAsync(task));
        }

        return result;
    }

    public async System.Threading.Tasks.Task<MatrixResponse> GetMatrixAsync(
        Guid userId, Guid? groupId = null, string? priority = null, bool includeCompleted = false)
    {
        var query = _context.Tasks
            .Include(t => t.Group)
            .Where(t => t.UserId == userId && t.ParentTaskId == null);

        if (!includeCompleted)
        {
            query = query.Where(t => !t.Completed);
        }

        if (groupId.HasValue)
        {
            query = query.Where(t => t.GroupId == groupId.Value);
        }

        if (!string.IsNullOrEmpty(priority) && Enum.TryParse<Models.Priority>(priority, true, out var parsedPriority))
        {
            query = query.Where(t => t.Priority == parsedPriority);
        }

        var tasks = await query.OrderByDescending(t => t.Priority).ThenBy(t => t.DueDate).ToListAsync();

        var response = new MatrixResponse();

        foreach (var task in tasks)
        {
            var dto = await MapToTaskDtoAsync(task);
            var quadrant = ComputeQuadrant(task.Urgency, task.Importance);

            switch (quadrant)
            {
                case "Q1": response.Q1DoFirst.Add(dto); break;
                case "Q2": response.Q2Schedule.Add(dto); break;
                case "Q3": response.Q3Delegate.Add(dto); break;
                case "Q4": response.Q4Eliminate.Add(dto); break;
                default: response.Unclassified.Add(dto); break;
            }
        }

        return response;
    }

    internal static string? ComputeQuadrant(Models.UrgencyLevel? urgency, Models.ImportanceLevel? importance)
    {
        if (!urgency.HasValue || !importance.HasValue)
        {
            return null;
        }

        var isUrgent = urgency.Value >= Models.UrgencyLevel.Medium;
        var isImportant = importance.Value >= Models.ImportanceLevel.Medium;

        return (isUrgent, isImportant) switch
        {
            (true, true) => "Q1",
            (false, true) => "Q2",
            (true, false) => "Q3",
            (false, false) => "Q4",
        };
    }

    public async System.Threading.Tasks.Task<TaskDto> SetEnergyAsync(Guid userId, Guid taskId, SetEnergyRequest request)
    {
        var task = await _context.Tasks
            .Include(t => t.Group)
            .Include(t => t.AssignedTo)
            .Include(t => t.Labels).ThenInclude(tl => tl.Label)
            .FirstOrDefaultAsync(t => t.Id == taskId &&
                (t.UserId == userId || t.AssignedToUserId == userId));

        if (task == null)
        {
            throw new KeyNotFoundException("Task not found");
        }

        if (!Enum.TryParse<Models.EnergyLevel>(request.EnergyLevel, true, out var energyLevel))
        {
            throw new ArgumentException($"Invalid energy level: {request.EnergyLevel}");
        }

        task.EnergyLevel = energyLevel;
        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await MapToTaskDtoAsync(task);
    }

    public async System.Threading.Tasks.Task<TaskDto> SetEstimateAsync(Guid userId, Guid taskId, SetEstimateRequest request)
    {
        var task = await _context.Tasks
            .Include(t => t.Group)
            .Include(t => t.AssignedTo)
            .Include(t => t.Labels).ThenInclude(tl => tl.Label)
            .FirstOrDefaultAsync(t => t.Id == taskId &&
                (t.UserId == userId || t.AssignedToUserId == userId));

        if (task == null)
        {
            throw new KeyNotFoundException("Task not found");
        }

        task.EstimatedMinutes = request.EstimatedMinutes;
        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await MapToTaskDtoAsync(task);
    }

    public async System.Threading.Tasks.Task<List<TaskDto>> BulkSetEnergyAsync(Guid userId, BulkEnergyRequest request)
    {
        var taskIds = request.Items.Select(i => i.TaskId).ToList();
        var tasks = await _context.Tasks
            .Include(t => t.Group)
            .Include(t => t.Labels).ThenInclude(tl => tl.Label)
            .Where(t => t.UserId == userId && taskIds.Contains(t.Id))
            .ToListAsync();

        var foundIds = tasks.Select(t => t.Id).ToHashSet();
        var missingIds = taskIds.Where(id => !foundIds.Contains(id)).ToList();
        if (missingIds.Count > 0)
        {
            throw new KeyNotFoundException($"Tasks not found: {string.Join(", ", missingIds)}");
        }

        foreach (var item in request.Items)
        {
            if (!Enum.TryParse<Models.EnergyLevel>(item.EnergyLevel, true, out var energyLevel))
            {
                throw new ArgumentException($"Invalid energy level: {item.EnergyLevel}");
            }

            var task = tasks.First(t => t.Id == item.TaskId);
            task.EnergyLevel = energyLevel;
            task.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        var result = new List<TaskDto>();
        foreach (var task in tasks)
        {
            result.Add(await MapToTaskDtoAsync(task));
        }

        return result;
    }

    public async System.Threading.Tasks.Task<List<TaskDto>> GetSuggestionsAsync(Guid userId, string? energy = null, int? maxMinutes = null)
    {
        var query = _context.Tasks
            .Include(t => t.Group)
            .Where(t => t.UserId == userId && t.Status != Models.TaskStatus.Completed && !t.Completed);

        // Filter by energy level: include tasks at or below the selected energy level, plus untagged tasks
        if (!string.IsNullOrEmpty(energy) && Enum.TryParse<Models.EnergyLevel>(energy, true, out var selectedEnergy))
        {
            query = query.Where(t => t.EnergyLevel == null || t.EnergyLevel <= selectedEnergy);
        }

        // Filter by max minutes: include tasks within duration limit, plus unestimated tasks
        if (maxMinutes.HasValue)
        {
            query = query.Where(t => t.EstimatedMinutes == null || t.EstimatedMinutes <= maxMinutes.Value);
        }

        // Sort: Urgency (Q1 first via urgency+importance desc) → DueDate asc (nulls last) → Priority desc
        var tasks = await query
            .OrderByDescending(t => t.Urgency)
            .ThenByDescending(t => t.Importance)
            .ThenBy(t => t.DueDate.HasValue ? 0 : 1)
            .ThenBy(t => t.DueDate)
            .ThenByDescending(t => t.Priority)
            .Take(10)
            .ToListAsync();

        var result = new List<TaskDto>();
        foreach (var task in tasks)
        {
            result.Add(await MapToTaskDtoAsync(task));
        }

        return result;
    }

    public async System.Threading.Tasks.Task<EnergyDistributionDto> GetEnergyDistributionAsync(Guid userId)
    {
        var tasks = await _context.Tasks
            .Where(t => t.UserId == userId && t.ParentTaskId == null)
            .Select(t => new { t.EnergyLevel, t.Completed })
            .ToListAsync();

        var highTasks = tasks.Where(t => t.EnergyLevel == Models.EnergyLevel.High).ToList();
        var mediumTasks = tasks.Where(t => t.EnergyLevel == Models.EnergyLevel.Medium).ToList();
        var lowTasks = tasks.Where(t => t.EnergyLevel == Models.EnergyLevel.Low).ToList();
        var untagged = tasks.Where(t => t.EnergyLevel == null).ToList();

        return new EnergyDistributionDto
        {
            HighEnergyCount = highTasks.Count,
            MediumEnergyCount = mediumTasks.Count,
            LowEnergyCount = lowTasks.Count,
            UntaggedCount = untagged.Count,
            HighEnergyCompletionRate = highTasks.Count > 0
                ? Math.Round((decimal)highTasks.Count(t => t.Completed) / highTasks.Count * 100, 1)
                : 0,
            MediumEnergyCompletionRate = mediumTasks.Count > 0
                ? Math.Round((decimal)mediumTasks.Count(t => t.Completed) / mediumTasks.Count * 100, 1)
                : 0,
            LowEnergyCompletionRate = lowTasks.Count > 0
                ? Math.Round((decimal)lowTasks.Count(t => t.Completed) / lowTasks.Count * 100, 1)
                : 0,
        };
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
            .Include(t => t.Labels).ThenInclude(tl => tl.Label)
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
        bool? rootOnly = null,
        string? status = null,
        string? view = null,
        Guid? labelId = null)
    {
        var viewFilter = view?.ToLower();

        IQueryable<FinanceApi.Features.Tasks.Models.Task> query;
        if (viewFilter == "mine")
        {
            query = _context.Tasks.Include(t => t.Group).Include(t => t.AssignedTo)
                .Include(t => t.Labels).ThenInclude(tl => tl.Label)
                .Where(t => t.UserId == userId);
        }
        else if (viewFilter == "assigned-to-me")
        {
            query = _context.Tasks.Include(t => t.Group).Include(t => t.AssignedTo)
                .Include(t => t.Labels).ThenInclude(tl => tl.Label)
                .Include(t => t.User)
                .Where(t => t.AssignedToUserId == userId);
        }
        else if (viewFilter == "assigned-by-me")
        {
            query = _context.Tasks.Include(t => t.Group).Include(t => t.AssignedTo)
                .Include(t => t.Labels).ThenInclude(tl => tl.Label)
                .Where(t => t.UserId == userId && t.AssignedToUserId != null);
        }
        else
        {
            // Default "all": own tasks + group-shared tasks + assigned to me
            query = _context.Tasks.Include(t => t.Group).Include(t => t.AssignedTo)
                .Include(t => t.Labels).ThenInclude(tl => tl.Label)
                .Include(t => t.User)
                .Where(t => t.UserId == userId
                    || t.AssignedToUserId == userId
                    || (t.GroupId != null && _context.TaskGroupShares.Any(s =>
                        s.TaskGroupId == t.GroupId && s.SharedWithUserId == userId)));
        }

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

        // Apply status filter
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<Models.TaskStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(t => t.Status == parsedStatus);
        }

        // Apply label filter
        if (labelId.HasValue)
        {
            query = query.Where(t => t.Labels.Any(tl => tl.LabelId == labelId.Value));
        }

        var tasks = await query
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var taskDtos = new List<TaskDto>();
        foreach (var task in tasks)
        {
            taskDtos.Add(await MapToTaskDtoAsync(task, userId));
        }
        return taskDtos;
    }

    public async System.Threading.Tasks.Task<List<TaskDto>> GetTasksByDateRangeAsync(Guid userId, DateTime startDate, DateTime endDate)
    {
        var tasks = await _context.Tasks
            .Include(t => t.Group)
            .Include(t => t.Labels).ThenInclude(tl => tl.Label)
            .Where(t => (t.UserId == userId
                || (t.GroupId != null && _context.TaskGroupShares.Any(s =>
                    s.TaskGroupId == t.GroupId && s.SharedWithUserId == userId)))
                        && t.DueDate != null
                        && t.DueDate >= startDate
                        && t.DueDate <= endDate)
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

    public async System.Threading.Tasks.Task<TaskDto> AssignTaskAsync(Guid requestingUserId, Guid taskId, string usernameOrEmail)
    {
        var task = await _context.Tasks
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == requestingUserId);

        if (task == null)
            throw new KeyNotFoundException("Task not found or you are not the owner.");

        var assignee = await _context.Users.FirstOrDefaultAsync(u =>
            u.Email == usernameOrEmail || u.Username == usernameOrEmail);

        if (assignee == null)
            throw new ArgumentException("User not found.");

        if (assignee.Id == requestingUserId)
            throw new InvalidOperationException("You cannot assign a task to yourself.");

        task.AssignedToUserId = assignee.Id;
        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _notificationService.CreateAsync(
            assignee.Id,
            NotificationType.TaskAssigned,
            NotificationEntityType.Task,
            task.Id,
            task.Title,
            requestingUserId);

        return await MapToTaskDtoAsync(task, requestingUserId);
    }

    public async System.Threading.Tasks.Task<TaskDto> UnassignTaskAsync(Guid requestingUserId, Guid taskId)
    {
        var task = await _context.Tasks
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == requestingUserId);

        if (task == null)
            throw new KeyNotFoundException("Task not found or you are not the owner.");

        var previousAssigneeId = task.AssignedToUserId;
        task.AssignedToUserId = null;
        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        if (previousAssigneeId.HasValue)
        {
            await _notificationService.CreateAsync(
                previousAssigneeId.Value,
                NotificationType.TaskUnassigned,
                NotificationEntityType.Task,
                task.Id,
                task.Title,
                requestingUserId);
        }

        return await MapToTaskDtoAsync(task, requestingUserId);
    }

    private async System.Threading.Tasks.Task<TaskDto> MapToTaskDtoAsync(Models.Task task, Guid requestingUserId = default)
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
            Status = task.Status.ToString(),
            StartedAt = task.StartedAt,
            BlockedReason = task.BlockedReason,
            Urgency = task.Urgency?.ToString(),
            Importance = task.Importance?.ToString(),
            Quadrant = ComputeQuadrant(task.Urgency, task.Importance),
            EnergyLevel = task.EnergyLevel?.ToString(),
            EstimatedMinutes = task.EstimatedMinutes,
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
            UpdatedAt = task.UpdatedAt,
            IsOwner = requestingUserId == default || task.UserId == requestingUserId,
            AssignedTo = task.AssignedTo != null
                ? new AssignmentUserDto(task.AssignedTo.Id, task.AssignedTo.Username)
                : null,
            AssignedBy = (requestingUserId != default && task.AssignedToUserId == requestingUserId && task.User != null)
                ? new AssignmentUserDto(task.User.Id, task.User.Username)
                : null,
            ReminderAt = task.ReminderAt,
            Labels = task.Labels?.Select(tl => new LabelDto { Id = tl.Label.Id, Name = tl.Label.Name, ColourHex = tl.Label.ColourHex }).ToList() ?? new List<LabelDto>(),
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
            .Include(t => t.Labels).ThenInclude(tl => tl.Label)
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
