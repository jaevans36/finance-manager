using LifeApi.Data;
using LifeApi.Features.Common.Sessions.Models;
using LifeApi.Features.Common.Sessions.DTOs;
using LifeApi.Features.Common.ActivityLogs.Services;
using LifeApi.Features.Common.ActivityLogs.Models;
using Microsoft.EntityFrameworkCore;

namespace LifeApi.Features.Common.Sessions.Services;

public interface ISessionService
{
    System.Threading.Tasks.Task<List<SessionDto>> GetSessionsAsync(Guid userId, string currentToken);
    System.Threading.Tasks.Task RevokeSessionAsync(Guid userId, Guid sessionId);
    System.Threading.Tasks.Task RevokeAllSessionsAsync(Guid userId, string currentToken);
}

public class SessionService : ISessionService
{
    private readonly FinanceDbContext _context;
    private readonly IActivityLogService _activityLogService;

    public SessionService(FinanceDbContext context, IActivityLogService activityLogService)
    {
        _context = context;
        _activityLogService = activityLogService;
    }

    public async System.Threading.Tasks.Task<List<SessionDto>> GetSessionsAsync(Guid userId, string currentToken)
    {
        var sessions = await _context.Sessions
            .Where(s => s.UserId == userId && s.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(s => s.LastActiveAt)
            .ToListAsync();

        return sessions.Select(s => new SessionDto
        {
            Id = s.Id,
            IpAddress = s.IpAddress,
            UserAgent = s.UserAgent,
            Location = s.Location,
            LastActiveAt = s.LastActiveAt,
            ExpiresAt = s.ExpiresAt,
            CreatedAt = s.CreatedAt,
            IsCurrent = s.Token == currentToken
        }).ToList();
    }

    public async System.Threading.Tasks.Task RevokeSessionAsync(Guid userId, Guid sessionId)
    {
        var session = await _context.Sessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

        if (session == null)
        {
            throw new KeyNotFoundException("Session not found");
        }

        _context.Sessions.Remove(session);
        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(userId, ActivityType.SessionTerminated, "Session terminated", session.IpAddress, session.UserAgent);
    }

    public async System.Threading.Tasks.Task RevokeAllSessionsAsync(Guid userId, string currentToken)
    {
        var sessions = await _context.Sessions
            .Where(s => s.UserId == userId && s.Token != currentToken)
            .ToListAsync();

        _context.Sessions.RemoveRange(sessions);
        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(userId, ActivityType.SessionTerminated, $"Revoked {sessions.Count} sessions", null, null);
    }
}
