using LifeApi.Data;
using LifeApi.Features.Settings.DTOs;
using Microsoft.EntityFrameworkCore;

using TaskStatus = LifeApi.Features.Tasks.Models.TaskStatus;

namespace LifeApi.Features.Settings.Services;

public interface IWipService
{
    System.Threading.Tasks.Task<WipSummaryDto> GetWipSummaryAsync(Guid userId);
    System.Threading.Tasks.Task<bool> CanStartTaskAsync(Guid userId, Guid? groupId);
}

public class WipService : IWipService
{
    private readonly FinanceDbContext _context;
    private readonly IUserSettingsService _settingsService;

    public WipService(FinanceDbContext context, IUserSettingsService settingsService)
    {
        _context = context;
        _settingsService = settingsService;
    }

    public async System.Threading.Tasks.Task<WipSummaryDto> GetWipSummaryAsync(Guid userId)
    {
        var settings = await _settingsService.GetSettingsAsync(userId);

        var inProgressTasks = await _context.Tasks
            .Where(t => t.UserId == userId && t.Status == TaskStatus.InProgress)
            .Select(t => new { t.Id, t.GroupId })
            .ToListAsync();

        var totalInProgress = inProgressTasks.Count;

        // Get group-level WIP info
        var groups = await _context.TaskGroups
            .Where(g => g.UserId == userId)
            .Select(g => new { g.Id, g.Name, g.Colour, g.WipLimit })
            .ToListAsync();

        var groupSummaries = groups.Select(g =>
        {
            var groupInProgress = inProgressTasks.Count(t => t.GroupId == g.Id);
            return new GroupWipSummaryDto
            {
                GroupId = g.Id,
                GroupName = g.Name,
                GroupColour = g.Colour,
                InProgressCount = groupInProgress,
                WipLimit = g.WipLimit,
                IsOverLimit = g.WipLimit.HasValue && groupInProgress >= g.WipLimit.Value,
            };
        }).ToList();

        return new WipSummaryDto
        {
            InProgressCount = totalInProgress,
            GlobalWipLimit = settings.GlobalWipLimit,
            IsOverLimit = settings.GlobalWipLimit.HasValue && totalInProgress >= settings.GlobalWipLimit.Value,
            Groups = groupSummaries,
        };
    }

    public async System.Threading.Tasks.Task<bool> CanStartTaskAsync(Guid userId, Guid? groupId)
    {
        var settings = await _settingsService.GetSettingsAsync(userId);

        // Check global WIP limit
        if (settings.GlobalWipLimit.HasValue)
        {
            var globalInProgress = await _context.Tasks
                .CountAsync(t => t.UserId == userId && t.Status == TaskStatus.InProgress);

            if (globalInProgress >= settings.GlobalWipLimit.Value)
            {
                return false;
            }
        }

        // Check group-level WIP limit
        if (groupId.HasValue)
        {
            var group = await _context.TaskGroups
                .FirstOrDefaultAsync(g => g.Id == groupId.Value && g.UserId == userId);

            if (group?.WipLimit.HasValue == true)
            {
                var groupInProgress = await _context.Tasks
                    .CountAsync(t => t.UserId == userId && t.GroupId == groupId.Value && t.Status == TaskStatus.InProgress);

                if (groupInProgress >= group.WipLimit.Value)
                {
                    return false;
                }
            }
        }

        return true;
    }
}
