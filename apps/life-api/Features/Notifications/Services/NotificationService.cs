using LifeApi.Data;
using LifeApi.Features.Notifications.DTOs;
using LifeApi.Features.Notifications.Models;
using Microsoft.EntityFrameworkCore;

namespace LifeApi.Features.Notifications.Services;

public interface INotificationService
{
    Task CreateAsync(Guid recipientUserId, NotificationType type, NotificationEntityType entityType,
        Guid entityId, string entityTitle, Guid fromUserId);

    Task<List<NotificationDto>> GetNotificationsAsync(Guid userId, bool unreadOnly = false,
        int page = 1, int pageSize = 20);

    Task MarkReadAsync(Guid userId, Guid notificationId);
    Task MarkAllReadAsync(Guid userId);
    Task<int> GetUnreadCountAsync(Guid userId);
}

public class NotificationService : INotificationService
{
    private readonly FinanceDbContext _context;

    public NotificationService(FinanceDbContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(Guid recipientUserId, NotificationType type,
        NotificationEntityType entityType, Guid entityId, string entityTitle, Guid fromUserId)
    {
        var notification = new Notification
        {
            UserId = recipientUserId,
            Type = type,
            EntityType = entityType,
            EntityId = entityId,
            EntityTitle = entityTitle,
            FromUserId = fromUserId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    public async Task<List<NotificationDto>> GetNotificationsAsync(Guid userId,
        bool unreadOnly = false, int page = 1, int pageSize = 20)
    {
        var query = _context.Notifications
            .Include(n => n.FromUser)
            .Where(n => n.UserId == userId);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto(
                n.Id,
                n.Type,
                n.EntityType,
                n.EntityId,
                n.EntityTitle,
                new UserSummaryDto(n.FromUser.Id, n.FromUser.Username),
                n.IsRead,
                n.CreatedAt))
            .ToListAsync();
    }

    public async Task MarkReadAsync(Guid userId, Guid notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification != null)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllReadAsync(Guid userId)
    {
        // NOTE: ExecuteUpdateAsync is NOT used here because the InMemory EF Core provider
        // (used in unit tests) does not support bulk-update APIs. Use load-and-update instead.
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();
        foreach (var n in notifications)
            n.IsRead = true;
        await _context.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId) =>
        await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
}
