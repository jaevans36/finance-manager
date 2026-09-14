using FinanceApi.Data;
using FinanceApi.Features.Common.ActivityLogs.DTOs;
using FinanceApi.Features.Common.ActivityLogs.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Common.ActivityLogs.Services;

public interface IActivityLogService
{
    Task LogAsync(Guid userId, FinanceActivityType action, string? description, string? ipAddress, string? userAgent);
    Task<ActivityLogResponse> GetLogsAsync(Guid userId, ActivityLogQueryParams queryParams);
}

public class ActivityLogService : IActivityLogService
{
    private readonly FinanceDbContext _db;

    public ActivityLogService(FinanceDbContext db) => _db = db;

    public async Task LogAsync(Guid userId, FinanceActivityType action, string? description, string? ipAddress, string? userAgent)
    {
        _db.ActivityLogs.Add(new ActivityLog
        {
            UserId = userId,
            Action = action,
            Description = description,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }

    public async Task<ActivityLogResponse> GetLogsAsync(Guid userId, ActivityLogQueryParams queryParams)
    {
        var query = _db.ActivityLogs
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
