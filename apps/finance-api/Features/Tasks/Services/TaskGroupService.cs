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

        return defaultGroup;
    }

    public async Task<List<TaskGroupResponse>> GetUserGroupsAsync(Guid userId)
    {
        // Own groups
        var ownGroups = await _context.TaskGroups
            .Where(tg => tg.UserId == userId)
            .Include(tg => tg.Tasks)
            .OrderBy(tg => tg.IsDefault ? 0 : 1)
            .ThenBy(tg => tg.Name)
            .ToListAsync();

        var result = ownGroups.Select(tg => new TaskGroupResponse
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
            UpdatedAt = tg.UpdatedAt,
            SharedPermission = null,
            SharedByUsername = null
        }).ToList();

        // Groups shared with this user
        var sharedGroups = await _context.TaskGroupShares
            .Where(s => s.SharedWithUserId == userId)
            .Include(s => s.TaskGroup)
                .ThenInclude(tg => tg.Tasks)
            .Include(s => s.TaskGroup)
                .ThenInclude(tg => tg.User)
            .OrderBy(s => s.TaskGroup.Name)
            .ToListAsync();

        foreach (var share in sharedGroups)
        {
            result.Add(new TaskGroupResponse
            {
                Id = share.TaskGroup.Id,
                Name = share.TaskGroup.Name,
                Description = share.TaskGroup.Description,
                Colour = share.TaskGroup.Colour,
                Icon = share.TaskGroup.Icon,
                IsDefault = false,
                WipLimit = share.TaskGroup.WipLimit,
                TaskCount = share.TaskGroup.Tasks.Count,
                CreatedAt = share.TaskGroup.CreatedAt,
                UpdatedAt = share.TaskGroup.UpdatedAt,
                SharedPermission = share.Permission,
                SharedByUsername = share.TaskGroup.User.Username
            });
        }

        return result;
    }

    public async Task<TaskGroupResponse?> GetGroupByIdAsync(Guid userId, Guid groupId)
    {
        // Check own group first
        var group = await _context.TaskGroups
            .Include(tg => tg.Tasks)
            .FirstOrDefaultAsync(tg => tg.Id == groupId && tg.UserId == userId);

        if (group != null)
        {
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

        // Check shared group
        var share = await _context.TaskGroupShares
            .Where(s => s.TaskGroupId == groupId && s.SharedWithUserId == userId)
            .Include(s => s.TaskGroup)
                .ThenInclude(tg => tg.Tasks)
            .Include(s => s.TaskGroup)
                .ThenInclude(tg => tg.User)
            .FirstOrDefaultAsync();

        if (share == null) return null;

        return new TaskGroupResponse
        {
            Id = share.TaskGroup.Id,
            Name = share.TaskGroup.Name,
            Description = share.TaskGroup.Description,
            Colour = share.TaskGroup.Colour,
            Icon = share.TaskGroup.Icon,
            IsDefault = false,
            WipLimit = share.TaskGroup.WipLimit,
            TaskCount = share.TaskGroup.Tasks.Count,
            CreatedAt = share.TaskGroup.CreatedAt,
            UpdatedAt = share.TaskGroup.UpdatedAt,
            SharedPermission = share.Permission,
            SharedByUsername = share.TaskGroup.User.Username
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

        return true;
    }

    // --- Sharing ---

    /// <summary>Returns the caller's effective permission on a group: null = no access, Edit for owner.</summary>
    public async Task<SharePermission?> GetUserPermissionAsync(Guid groupId, Guid userId)
    {
        var group = await _context.TaskGroups
            .FirstOrDefaultAsync(tg => tg.Id == groupId);

        if (group == null) return null;
        if (group.UserId == userId) return SharePermission.Edit;

        var share = await _context.TaskGroupShares
            .FirstOrDefaultAsync(s => s.TaskGroupId == groupId && s.SharedWithUserId == userId);

        return share?.Permission;
    }

    public async Task<List<GroupShareResponse>> GetSharesAsync(Guid groupId, Guid requestingUserId)
    {
        // Only the group owner can list shares
        var group = await _context.TaskGroups
            .FirstOrDefaultAsync(tg => tg.Id == groupId && tg.UserId == requestingUserId);

        if (group == null)
            throw new UnauthorizedAccessException("Only the group owner can view shares");

        return await _context.TaskGroupShares
            .Where(s => s.TaskGroupId == groupId)
            .Include(s => s.SharedWithUser)
            .OrderBy(s => s.SharedWithUser.Username)
            .Select(s => new GroupShareResponse
            {
                SharedWithUserId = s.SharedWithUserId,
                Username = s.SharedWithUser.Username,
                Email = s.SharedWithUser.Email,
                Permission = s.Permission,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<GroupShareResponse> ShareGroupAsync(Guid groupId, Guid ownerId, ShareGroupRequest request)
    {
        // Verify ownership
        var group = await _context.TaskGroups
            .FirstOrDefaultAsync(tg => tg.Id == groupId && tg.UserId == ownerId);

        if (group == null)
            throw new UnauthorizedAccessException("Only the group owner can share this group");

        // Find target user by username or email (case-insensitive)
        var target = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.Username.ToLower() == request.UsernameOrEmail.ToLower() ||
                u.Email.ToLower() == request.UsernameOrEmail.ToLower());

        if (target == null)
            throw new KeyNotFoundException($"User '{request.UsernameOrEmail}' not found");

        if (target.Id == ownerId)
            throw new InvalidOperationException("You cannot share a group with yourself");

        // Upsert the share
        var existing = await _context.TaskGroupShares
            .FirstOrDefaultAsync(s => s.TaskGroupId == groupId && s.SharedWithUserId == target.Id);

        if (existing != null)
        {
            existing.Permission = request.Permission;
        }
        else
        {
            _context.TaskGroupShares.Add(new TaskGroupShare
            {
                TaskGroupId = groupId,
                SharedWithUserId = target.Id,
                Permission = request.Permission,
                SharedByUserId = ownerId,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        return new GroupShareResponse
        {
            SharedWithUserId = target.Id,
            Username = target.Username,
            Email = target.Email,
            Permission = request.Permission,
            CreatedAt = existing?.CreatedAt ?? DateTime.UtcNow
        };
    }

    public async Task<bool> UnshareGroupAsync(Guid groupId, Guid ownerId, Guid targetUserId)
    {
        // Verify ownership
        var group = await _context.TaskGroups
            .FirstOrDefaultAsync(tg => tg.Id == groupId && tg.UserId == ownerId);

        if (group == null)
            throw new UnauthorizedAccessException("Only the group owner can manage shares");

        var share = await _context.TaskGroupShares
            .FirstOrDefaultAsync(s => s.TaskGroupId == groupId && s.SharedWithUserId == targetUserId);

        if (share == null) return false;

        _context.TaskGroupShares.Remove(share);
        await _context.SaveChangesAsync();
        return true;
    }
}
