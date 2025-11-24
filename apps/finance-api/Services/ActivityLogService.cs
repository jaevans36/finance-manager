using FinanceApi.Data;
using FinanceApi.DTOs.ActivityLogs;
using FinanceApi.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Services;

public interface IActivityLogService
{
    System.Threading.Tasks.Task LogAsync(Guid userId, ActivityType action, string? description, string? ipAddress, string? userAgent);
    System.Threading.Tasks.Task<ActivityLogResponse> GetLogsAsync(Guid userId, ActivityLogQueryParams queryParams);
}

public class ActivityLogService : IActivityLogService
{
    private readonly FinanceDbContext _context;

    public ActivityLogService(FinanceDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task LogAsync(Guid userId, ActivityType action, string? description, string? ipAddress, string? userAgent)
    {
        var log = new ActivityLog
        {
            UserId = userId,
            Action = action,
            Description = description,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            CreatedAt = DateTime.UtcNow
        };

        _context.ActivityLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async System.Threading.Tasks.Task<ActivityLogResponse> GetLogsAsync(Guid userId, ActivityLogQueryParams queryParams)
    {
        var query = _context.ActivityLogs
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.CreatedAt);

        var total = await query.CountAsync();
        
        var logs = await query
            .Skip((queryParams.Page - 1) * queryParams.Limit)
            .Take(queryParams.Limit)
            .Select(l => new ActivityLogDto
            {
                Id = l.Id,
                Action = l.Action.ToString(),
                Description = l.Description,
                IpAddress = l.IpAddress,
                UserAgent = l.UserAgent,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync();

        return new ActivityLogResponse
        {
            Logs = logs,
            Total = total,
            Page = queryParams.Page,
            Limit = queryParams.Limit
        };
    }
}
