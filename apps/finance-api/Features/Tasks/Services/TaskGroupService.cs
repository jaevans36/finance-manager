using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Tasks.DTOs;
using FinanceApi.Features.Common.ActivityLogs.Services;

namespace FinanceApi.Features.Tasks.Services;

public class TaskGroupService
{
    private readonly FinanceDbContext _context;
    private readonly IActivityLogService _activityLogService;

    public TaskGroupService(FinanceDbContext context, IActivityLogService activityLogService)
    {
        _context = context;
        _activityLogService = activityLogService;
    }

    public async Task<TaskGroup> GetOrCreateDefaultGroupAsync(Guid userId)
    {
        var defaultGroup = await _context.TaskGroups
            .FirstOrDefaultAsync(tg => tg.UserId == userId && tg.IsDefault);

        if (defaultGroup != null)
        {
            return defaultGroup;
        }

        // Create default "Uncategorised" group
        defaultGroup = new TaskGroup
        {
            UserId = userId,
            Name = "Uncategorised",
            Description = "Default group for tasks without a specific category",
            Colour = "#6B7280",
            IsDefault = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TaskGroups.Add(defaultGroup);
        await _context.SaveChangesAsync();

        // TODO: Add TaskGroupCreated to ActivityType enum
        // await _activityLogService.LogAsync(userId, ActivityType.TaskGroupCreated, $"Default task group created: {defaultGroup.Name}", null, null);

        return defaultGroup;
    }

    public async Task<List<TaskGroupResponse>> GetUserGroupsAsync(Guid userId)
    {
        var groups = await _context.TaskGroups
            .Where(tg => tg.UserId == userId)
            .Include(tg => tg.Tasks)
            .OrderBy(tg => tg.IsDefault ? 0 : 1)
            .ThenBy(tg => tg.Name)
            .ToListAsync();

        return groups.Select(tg => new TaskGroupResponse
        {
            Id = tg.Id,
            Name = tg.Name,
            Description = tg.Description,
            Colour = tg.Colour,
            Icon = tg.Icon,
            IsDefault = tg.IsDefault,
            WipLimit = tg.WipLimit,
            TaskCount = tg.Tasks.Count,
            CreatedAt = tg.CreatedAt,
            UpdatedAt = tg.UpdatedAt
        }).ToList();
    }

    public async Task<TaskGroupResponse?> GetGroupByIdAsync(Guid userId, Guid groupId)
    {
        var group = await _context.TaskGroups
            .Include(tg => tg.Tasks)
            .FirstOrDefaultAsync(tg => tg.Id == groupId && tg.UserId == userId);

        if (group == null)
        {
            return null;
        }

        return new TaskGroupResponse
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description,
            Colour = group.Colour,
            Icon = group.Icon,
            IsDefault = group.IsDefault,
            WipLimit = group.WipLimit,
            TaskCount = group.Tasks.Count,
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt
        };
    }

    public async Task<TaskGroupResponse> CreateGroupAsync(Guid userId, CreateTaskGroupRequest request)
    {
        // Check for duplicate name
        var existingGroup = await _context.TaskGroups
            .FirstOrDefaultAsync(tg => tg.UserId == userId && tg.Name == request.Name);

        if (existingGroup != null)
        {
            throw new InvalidOperationException($"A group named '{request.Name}' already exists");
        }

        var group = new TaskGroup
        {
            UserId = userId,
            Name = request.Name,
            Description = request.Description,
            Colour = request.Colour ?? "#3B82F6",
            Icon = request.Icon,
            WipLimit = request.WipLimit,
            IsDefault = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TaskGroups.Add(group);
        await _context.SaveChangesAsync();

        // TODO: Add TaskGroupCreated to ActivityType enum
        // await _activityLogService.LogAsync(userId, ActivityType.TaskGroupCreated, $"Task group created: {group.Name}", null, null);

        return new TaskGroupResponse
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description,
            Colour = group.Colour,
            Icon = group.Icon,
            IsDefault = group.IsDefault,
            WipLimit = group.WipLimit,
            TaskCount = 0,
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt
        };
    }

    public async Task<TaskGroupResponse?> UpdateGroupAsync(Guid userId, Guid groupId, UpdateTaskGroupRequest request)
    {
        var group = await _context.TaskGroups
            .Include(tg => tg.Tasks)
            .FirstOrDefaultAsync(tg => tg.Id == groupId && tg.UserId == userId);

        if (group == null)
        {
            return null;
        }

        if (group.IsDefault)
        {
            throw new InvalidOperationException("Cannot modify the default group");
        }

        // Check for duplicate name if name is being changed
        if (request.Name != null && request.Name != group.Name)
        {
            var existingGroup = await _context.TaskGroups
                .FirstOrDefaultAsync(tg => tg.UserId == userId && tg.Name == request.Name);

            if (existingGroup != null)
            {
                throw new InvalidOperationException($"A group named '{request.Name}' already exists");
            }

            group.Name = request.Name;
        }

        if (request.Description != null)
        {
            group.Description = request.Description;
        }

        if (request.Colour != null)
        {
            group.Colour = request.Colour;
        }

        if (request.Icon != null)
        {
            group.Icon = request.Icon;
        }

        if (request.WipLimit.HasValue)
        {
            group.WipLimit = request.WipLimit;
        }

        group.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // TODO: Add TaskGroupUpdated to ActivityType enum
        // await _activityLogService.LogAsync(userId, ActivityType.TaskGroupUpdated, $"Task group updated: {group.Name}", null, null);

        return new TaskGroupResponse
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description,
            Colour = group.Colour,
            Icon = group.Icon,
            IsDefault = group.IsDefault,
            WipLimit = group.WipLimit,
            TaskCount = group.Tasks.Count,
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt
        };
    }

    public async Task<bool> DeleteGroupAsync(Guid userId, Guid groupId)
    {
        var group = await _context.TaskGroups
            .Include(tg => tg.Tasks)
            .FirstOrDefaultAsync(tg => tg.Id == groupId && tg.UserId == userId);

        if (group == null)
        {
            return false;
        }

        if (group.IsDefault)
        {
            throw new InvalidOperationException("Cannot delete the default group");
        }

        // Move all tasks to the default group
        var defaultGroup = await GetOrCreateDefaultGroupAsync(userId);

        foreach (var task in group.Tasks)
        {
            task.GroupId = defaultGroup.Id;
            task.UpdatedAt = DateTime.UtcNow;
        }

        _context.TaskGroups.Remove(group);
        await _context.SaveChangesAsync();

        // TODO: Add TaskGroupDeleted to ActivityType enum
        // await _activityLogService.LogAsync(userId, ActivityType.TaskGroupDeleted, $"Task group deleted: {group.Name}", null, null);

        return true;
    }
}
