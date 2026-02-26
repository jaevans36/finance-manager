using FinanceApi.Data;
using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Tasks.DTOs;
using FinanceApi.Features.Common.ActivityLogs.Services;
using FinanceApi.Features.Common.ActivityLogs.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Tasks.Services;

/// <summary>
/// Defines operations for managing hierarchical subtasks.
/// </summary>
public interface ISubtaskService
{
    /// <summary>Creates a subtask under the specified parent task.</summary>
    System.Threading.Tasks.Task<TaskDto> CreateSubtaskAsync(Guid userId, Guid parentId, CreateSubtaskRequest request);

    /// <summary>Returns subtasks of the specified parent, optionally including nested descendants.</summary>
    System.Threading.Tasks.Task<List<TaskDto>> GetSubtasksAsync(Guid userId, Guid parentId, bool includeNested = false);

    /// <summary>Moves a subtask to a new parent, or promotes it to a root task if newParentId is null.</summary>
    System.Threading.Tasks.Task<TaskDto> MoveSubtaskAsync(Guid userId, Guid subtaskId, Guid? newParentId);

    /// <summary>Reorders the direct subtasks of a parent task.</summary>
    System.Threading.Tasks.Task ReorderSubtasksAsync(Guid userId, Guid parentId, List<Guid> orderedIds);

    /// <summary>Creates multiple subtasks at once from a list of titles.</summary>
    System.Threading.Tasks.Task<List<TaskDto>> BulkCreateSubtasksAsync(Guid userId, Guid parentId, List<string> titles);

    /// <summary>Marks all subtasks of a parent task as completed.</summary>
    System.Threading.Tasks.Task BulkCompleteSubtasksAsync(Guid userId, Guid parentId);

    /// <summary>Returns completion progress statistics for a task's subtasks.</summary>
    System.Threading.Tasks.Task<SubtaskProgressDto> GetProgressAsync(Guid userId, Guid taskId);

    /// <summary>Deletes a subtask. When cascade is true, deletes all descendants; otherwise promotes children.</summary>
    System.Threading.Tasks.Task DeleteSubtaskAsync(Guid userId, Guid subtaskId, bool cascade = true);
}

/// <summary>
/// Service implementation for hierarchical subtask management.
/// </summary>
public class SubtaskService : ISubtaskService
{
    private const int MaxDepth = 5;
    private readonly FinanceDbContext _context;
    private readonly IActivityLogService _activityLogService;

    public SubtaskService(FinanceDbContext context, IActivityLogService activityLogService)
    {
        _context = context;
        _activityLogService = activityLogService;
    }

    /// <inheritdoc />
    public async System.Threading.Tasks.Task<TaskDto> CreateSubtaskAsync(Guid userId, Guid parentId, CreateSubtaskRequest request)
    {
        var parentTask = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == parentId && t.UserId == userId)
            ?? throw new KeyNotFoundException("Parent task not found.");

        if (parentTask.Depth >= MaxDepth)
        {
            throw new InvalidOperationException($"Maximum subtask depth of {MaxDepth} exceeded.");
        }

        var priority = Enum.TryParse<Priority>(request.Priority, true, out var parsedPriority)
            ? parsedPriority
            : parentTask.Priority;

        // Determine next sort order among siblings
        var maxSortOrder = await _context.Tasks
            .Where(t => t.ParentTaskId == parentId)
            .MaxAsync(t => (int?)t.SortOrder) ?? -1;

        var subtask = new Models.Task
        {
            UserId = userId,
            GroupId = parentTask.GroupId,
            ParentTaskId = parentId,
            Depth = parentTask.Depth + 1,
            SortOrder = maxSortOrder + 1,
            Title = request.Title,
            Description = request.Description,
            Priority = priority,
            DueDate = request.DueDate.HasValue
                ? DateTime.SpecifyKind(request.DueDate.Value, DateTimeKind.Utc)
                : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(subtask);
        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(
            userId, ActivityType.TaskCreated,
            $"Created subtask: {subtask.Title} (under {parentTask.Title})", null, null);

        return MapToDto(subtask);
    }

    /// <inheritdoc />
    public async System.Threading.Tasks.Task<List<TaskDto>> GetSubtasksAsync(Guid userId, Guid parentId, bool includeNested = false)
    {
        // Verify the parent exists and belongs to the user
        var parentExists = await _context.Tasks
            .AnyAsync(t => t.Id == parentId && t.UserId == userId);

        if (!parentExists)
        {
            throw new KeyNotFoundException("Parent task not found.");
        }

        if (!includeNested)
        {
            var directChildren = await _context.Tasks
                .Include(t => t.Group)
                .Where(t => t.ParentTaskId == parentId && t.UserId == userId)
                .OrderBy(t => t.SortOrder)
                .ToListAsync();

            return await MapToDtoListWithSubtaskCountsAsync(directChildren);
        }

        // Build full subtree recursively
        return await BuildSubtreeAsync(userId, parentId);
    }

    /// <inheritdoc />
    public async System.Threading.Tasks.Task<TaskDto> MoveSubtaskAsync(Guid userId, Guid subtaskId, Guid? newParentId)
    {
        var subtask = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == subtaskId && t.UserId == userId)
            ?? throw new KeyNotFoundException("Subtask not found.");

        if (newParentId.HasValue)
        {
            // Prevent moving a task to itself
            if (newParentId.Value == subtaskId)
            {
                throw new InvalidOperationException("A task cannot be its own parent.");
            }

            var newParent = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == newParentId.Value && t.UserId == userId)
                ?? throw new KeyNotFoundException("New parent task not found.");

            // Validate no circular dependency: newParent must not be a descendant of subtask
            if (await IsDescendantAsync(subtaskId, newParentId.Value))
            {
                throw new InvalidOperationException("Cannot move a task under one of its own descendants (circular dependency).");
            }

            if (newParent.Depth >= MaxDepth)
            {
                throw new InvalidOperationException($"Maximum subtask depth of {MaxDepth} exceeded.");
            }

            // Check that the subtask's subtree depth won't exceed the limit
            var subtreeMaxRelativeDepth = await GetMaxRelativeDepthAsync(subtaskId);
            if (newParent.Depth + 1 + subtreeMaxRelativeDepth > MaxDepth)
            {
                throw new InvalidOperationException($"Moving this task would exceed the maximum depth of {MaxDepth}.");
            }

            subtask.ParentTaskId = newParentId.Value;
            subtask.Depth = newParent.Depth + 1;
            subtask.GroupId = newParent.GroupId;

            // Recalculate sort order among new siblings
            var maxSortOrder = await _context.Tasks
                .Where(t => t.ParentTaskId == newParentId.Value && t.Id != subtaskId)
                .MaxAsync(t => (int?)t.SortOrder) ?? -1;
            subtask.SortOrder = maxSortOrder + 1;

            // Update depths for all descendants
            await UpdateDescendantDepthsAsync(subtask);
        }
        else
        {
            // Promote to root task
            subtask.ParentTaskId = null;
            subtask.Depth = 0;
            subtask.SortOrder = 0;

            // Update depths for all descendants
            await UpdateDescendantDepthsAsync(subtask);
        }

        subtask.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(
            userId, ActivityType.TaskUpdated,
            $"Moved subtask: {subtask.Title}", null, null);

        return MapToDto(subtask);
    }

    /// <inheritdoc />
    public async System.Threading.Tasks.Task ReorderSubtasksAsync(Guid userId, Guid parentId, List<Guid> orderedIds)
    {
        var parentExists = await _context.Tasks
            .AnyAsync(t => t.Id == parentId && t.UserId == userId);

        if (!parentExists)
        {
            throw new KeyNotFoundException("Parent task not found.");
        }

        var subtasks = await _context.Tasks
            .Where(t => t.ParentTaskId == parentId && t.UserId == userId)
            .ToListAsync();

        var subtaskDict = subtasks.ToDictionary(t => t.Id);

        for (var i = 0; i < orderedIds.Count; i++)
        {
            if (subtaskDict.TryGetValue(orderedIds[i], out var subtask))
            {
                subtask.SortOrder = i;
                subtask.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
    }

    /// <inheritdoc />
    public async System.Threading.Tasks.Task<List<TaskDto>> BulkCreateSubtasksAsync(Guid userId, Guid parentId, List<string> titles)
    {
        var parentTask = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == parentId && t.UserId == userId)
            ?? throw new KeyNotFoundException("Parent task not found.");

        if (parentTask.Depth >= MaxDepth)
        {
            throw new InvalidOperationException($"Maximum subtask depth of {MaxDepth} exceeded.");
        }

        var maxSortOrder = await _context.Tasks
            .Where(t => t.ParentTaskId == parentId)
            .MaxAsync(t => (int?)t.SortOrder) ?? -1;

        var subtasks = new List<Models.Task>();
        for (var i = 0; i < titles.Count; i++)
        {
            var subtask = new Models.Task
            {
                UserId = userId,
                GroupId = parentTask.GroupId,
                ParentTaskId = parentId,
                Depth = parentTask.Depth + 1,
                SortOrder = maxSortOrder + 1 + i,
                Title = titles[i],
                Priority = parentTask.Priority,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            subtasks.Add(subtask);
        }

        _context.Tasks.AddRange(subtasks);
        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(
            userId, ActivityType.TaskCreated,
            $"Bulk created {subtasks.Count} subtask(s) under: {parentTask.Title}", null, null);

        return subtasks.Select(MapToDto).ToList();
    }

    /// <inheritdoc />
    public async System.Threading.Tasks.Task BulkCompleteSubtasksAsync(Guid userId, Guid parentId)
    {
        var parentExists = await _context.Tasks
            .AnyAsync(t => t.Id == parentId && t.UserId == userId);

        if (!parentExists)
        {
            throw new KeyNotFoundException("Parent task not found.");
        }

        var now = DateTime.UtcNow;
        var subtasks = await _context.Tasks
            .Where(t => t.ParentTaskId == parentId && t.UserId == userId && !t.Completed)
            .ToListAsync();

        foreach (var subtask in subtasks)
        {
            subtask.Completed = true;
            subtask.CompletedAt = now;
            subtask.UpdatedAt = now;
        }

        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(
            userId, ActivityType.TaskCompleted,
            $"Bulk completed {subtasks.Count} subtask(s)", null, null);
    }

    /// <inheritdoc />
    public async System.Threading.Tasks.Task<SubtaskProgressDto> GetProgressAsync(Guid userId, Guid taskId)
    {
        var taskExists = await _context.Tasks
            .AnyAsync(t => t.Id == taskId && t.UserId == userId);

        if (!taskExists)
        {
            throw new KeyNotFoundException("Task not found.");
        }

        // Count all descendants, not just direct children
        var allDescendants = await GetAllDescendantIdsAsync(taskId);

        if (allDescendants.Count == 0)
        {
            return new SubtaskProgressDto { Total = 0, Completed = 0, Percentage = 0 };
        }

        var completed = await _context.Tasks
            .CountAsync(t => allDescendants.Contains(t.Id) && t.Completed);

        var total = allDescendants.Count;
        var percentage = total > 0 ? Math.Round((decimal)completed / total * 100, 1) : 0;

        return new SubtaskProgressDto
        {
            Total = total,
            Completed = completed,
            Percentage = percentage
        };
    }

    /// <inheritdoc />
    public async System.Threading.Tasks.Task DeleteSubtaskAsync(Guid userId, Guid subtaskId, bool cascade = true)
    {
        var subtask = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == subtaskId && t.UserId == userId)
            ?? throw new KeyNotFoundException("Subtask not found.");

        if (cascade)
        {
            // Delete all descendants recursively, deepest first
            var descendantIds = await GetAllDescendantIdsAsync(subtaskId);
            if (descendantIds.Count > 0)
            {
                var descendants = await _context.Tasks
                    .Where(t => descendantIds.Contains(t.Id))
                    .OrderByDescending(t => t.Depth)
                    .ToListAsync();

                _context.Tasks.RemoveRange(descendants);
            }
        }
        else
        {
            // Orphan mode: promote direct children to the subtask's parent
            var children = await _context.Tasks
                .Where(t => t.ParentTaskId == subtaskId)
                .ToListAsync();

            foreach (var child in children)
            {
                child.ParentTaskId = subtask.ParentTaskId;
                child.Depth = subtask.Depth;
                child.UpdatedAt = DateTime.UtcNow;
            }

            // Re-calculate depths for promoted children's subtrees
            foreach (var child in children)
            {
                await UpdateDescendantDepthsAsync(child);
            }
        }

        _context.Tasks.Remove(subtask);
        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(
            userId, ActivityType.TaskDeleted,
            $"Deleted subtask: {subtask.Title} (cascade: {cascade})", null, null);
    }

    /// <summary>
    /// Maps a single Task entity to a TaskDto without subtask counts (basic mapping).
    /// </summary>
    private static TaskDto MapToDto(Models.Task task)
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
            GroupId = task.GroupId,
            GroupName = task.Group?.Name,
            GroupColour = task.Group?.Colour,
            ParentTaskId = task.ParentTaskId,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        };
    }

    /// <summary>
    /// Checks whether <paramref name="potentialDescendantId"/> is a descendant of <paramref name="ancestorId"/>.
    /// </summary>
    private async System.Threading.Tasks.Task<bool> IsDescendantAsync(Guid ancestorId, Guid potentialDescendantId)
    {
        var visited = new HashSet<Guid>();
        var queue = new Queue<Guid>();
        queue.Enqueue(ancestorId);

        while (queue.Count > 0)
        {
            var currentId = queue.Dequeue();
            if (!visited.Add(currentId)) continue;

            var childIds = await _context.Tasks
                .Where(t => t.ParentTaskId == currentId)
                .Select(t => t.Id)
                .ToListAsync();

            foreach (var childId in childIds)
            {
                if (childId == potentialDescendantId) return true;
                queue.Enqueue(childId);
            }
        }

        return false;
    }

    /// <summary>
    /// Returns the maximum relative depth from a task to its deepest descendant.
    /// </summary>
    private async System.Threading.Tasks.Task<int> GetMaxRelativeDepthAsync(Guid taskId)
    {
        var task = await _context.Tasks.FindAsync(taskId);
        if (task == null) return 0;

        var descendants = await GetAllDescendantsAsync(taskId);
        if (descendants.Count == 0) return 0;

        return descendants.Max(d => d.Depth) - task.Depth;
    }

    /// <summary>
    /// Returns all descendant task IDs for a given task.
    /// </summary>
    private async System.Threading.Tasks.Task<List<Guid>> GetAllDescendantIdsAsync(Guid taskId)
    {
        var result = new List<Guid>();
        var queue = new Queue<Guid>();
        queue.Enqueue(taskId);

        while (queue.Count > 0)
        {
            var currentId = queue.Dequeue();

            var childIds = await _context.Tasks
                .Where(t => t.ParentTaskId == currentId)
                .Select(t => t.Id)
                .ToListAsync();

            foreach (var childId in childIds)
            {
                result.Add(childId);
                queue.Enqueue(childId);
            }
        }

        return result;
    }

    /// <summary>
    /// Returns all descendant tasks for a given task.
    /// </summary>
    private async System.Threading.Tasks.Task<List<Models.Task>> GetAllDescendantsAsync(Guid taskId)
    {
        var result = new List<Models.Task>();
        var queue = new Queue<Guid>();
        queue.Enqueue(taskId);

        while (queue.Count > 0)
        {
            var currentId = queue.Dequeue();

            var children = await _context.Tasks
                .Where(t => t.ParentTaskId == currentId)
                .ToListAsync();

            foreach (var child in children)
            {
                result.Add(child);
                queue.Enqueue(child.Id);
            }
        }

        return result;
    }

    /// <summary>
    /// Recursively updates depth values for all descendants of the given task.
    /// </summary>
    private async System.Threading.Tasks.Task UpdateDescendantDepthsAsync(Models.Task parent)
    {
        var children = await _context.Tasks
            .Where(t => t.ParentTaskId == parent.Id)
            .ToListAsync();

        foreach (var child in children)
        {
            child.Depth = parent.Depth + 1;
            child.UpdatedAt = DateTime.UtcNow;
            await UpdateDescendantDepthsAsync(child);
        }
    }

    /// <summary>
    /// Builds a full nested subtree for a parent task with subtask counts.
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
            var dto = MapToDto(child);

            // Get subtask counts
            var subtaskCount = await _context.Tasks.CountAsync(t => t.ParentTaskId == child.Id);
            var completedSubtaskCount = await _context.Tasks.CountAsync(t => t.ParentTaskId == child.Id && t.Completed);
            dto.HasSubtasks = subtaskCount > 0;
            dto.SubtaskCount = subtaskCount;
            dto.CompletedSubtaskCount = completedSubtaskCount;
            dto.ProgressPercentage = subtaskCount > 0
                ? Math.Round((decimal)completedSubtaskCount / subtaskCount * 100, 1)
                : 0;

            // Recurse into children
            var nestedSubtasks = await BuildSubtreeAsync(userId, child.Id);
            dto.Subtasks = nestedSubtasks.Count > 0 ? nestedSubtasks : null;

            result.Add(dto);
        }

        return result;
    }

    /// <summary>
    /// Maps a list of tasks to DTOs with subtask count metadata.
    /// </summary>
    private async System.Threading.Tasks.Task<List<TaskDto>> MapToDtoListWithSubtaskCountsAsync(List<Models.Task> tasks)
    {
        var result = new List<TaskDto>();
        foreach (var task in tasks)
        {
            var dto = MapToDto(task);

            var subtaskCount = await _context.Tasks.CountAsync(t => t.ParentTaskId == task.Id);
            var completedSubtaskCount = await _context.Tasks.CountAsync(t => t.ParentTaskId == task.Id && t.Completed);
            dto.HasSubtasks = subtaskCount > 0;
            dto.SubtaskCount = subtaskCount;
            dto.CompletedSubtaskCount = completedSubtaskCount;
            dto.ProgressPercentage = subtaskCount > 0
                ? Math.Round((decimal)completedSubtaskCount / subtaskCount * 100, 1)
                : 0;

            result.Add(dto);
        }

        return result;
    }
}