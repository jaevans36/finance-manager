using LifeApi.Data;
using LifeApi.Features.Events.Models;
using LifeApi.Features.Events.DTOs;
using LifeApi.Features.Tasks.Models;
using LifeApi.Features.Users.DTOs;
using LifeApi.Features.Notifications.Services;
using LifeApi.Features.Notifications.Models;
using Microsoft.EntityFrameworkCore;

namespace LifeApi.Features.Events.Services;

/// <summary>
/// Manages event sharing lifecycle: create, revoke, accept, decline invitations.
/// Permission model: owner can do everything; Manage users can share further and
/// revoke only shares they personally created; View/Edit users cannot manage shares.
/// </summary>
public interface IEventShareService
{
    /// <summary>Create a share invitation. Caller must be owner or have Manage permission.</summary>
    System.Threading.Tasks.Task<EventShareDto> CreateShareAsync(Guid eventId, Guid callerId, string usernameOrEmail, SharePermission permission);

    /// <summary>List all shares for an event. Caller must be owner or have Manage permission.</summary>
    System.Threading.Tasks.Task<List<EventShareDto>> GetSharesAsync(Guid eventId, Guid requestingUserId);

    /// <summary>Update the permission level on an existing share. Caller must be owner or have Manage permission.</summary>
    System.Threading.Tasks.Task<EventShareDto> UpdateSharePermissionAsync(Guid eventId, Guid shareId, Guid requestingUserId, SharePermission newPermission);

    /// <summary>Revoke (delete) a share. Owner can revoke any; Manage can only revoke shares they created.</summary>
    System.Threading.Tasks.Task DeleteShareAsync(Guid eventId, Guid shareId, Guid requestingUserId);

    /// <summary>Return all Pending invitations addressed to the given user.</summary>
    System.Threading.Tasks.Task<List<EventShareInvitationDto>> GetPendingInvitationsAsync(Guid userId);

    /// <summary>Accept a pending invitation. Only the share recipient may call this.</summary>
    System.Threading.Tasks.Task AcceptInvitationAsync(Guid shareId, Guid userId);

    /// <summary>Decline a pending invitation. Only the share recipient may call this.</summary>
    System.Threading.Tasks.Task DeclineInvitationAsync(Guid shareId, Guid userId);

    /// <summary>Returns the effective SharePermission for a user on an event, or null if no accepted share exists.</summary>
    System.Threading.Tasks.Task<SharePermission?> GetUserPermissionAsync(Guid eventId, Guid userId);
}

public class EventShareService : IEventShareService
{
    private readonly FinanceDbContext _context;
    private readonly INotificationService _notificationService;

    public EventShareService(FinanceDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task<EventShareDto> CreateShareAsync(Guid eventId, Guid callerId, string usernameOrEmail, SharePermission permission)
    {
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new UnauthorizedAccessException("Event not found.");

        await RequireSharePermissionAsync(eventEntity, callerId);

        // Resolve recipient by username or email (case-insensitive)
        var recipient = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.Email.ToLower() == usernameOrEmail.ToLower() ||
                u.Username.ToLower() == usernameOrEmail.ToLower())
            ?? throw new InvalidOperationException("User not found.");

        if (recipient.Id == callerId)
            throw new InvalidOperationException("You cannot share an event with yourself.");

        var existing = await _context.EventShares
            .FirstOrDefaultAsync(s => s.EventId == eventId && s.SharedWithUserId == recipient.Id);

        if (existing != null)
            throw new InvalidOperationException("This event is already shared with that user.");

        var share = new EventShare
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            SharedByUserId = callerId,
            SharedWithUserId = recipient.Id,
            Permission = permission,
            Status = ShareStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.EventShares.Add(share);
        await _context.SaveChangesAsync();

        await _notificationService.CreateAsync(
            recipient.Id,
            NotificationType.ShareInvitation,
            NotificationEntityType.Event,
            eventId,
            eventEntity.Title,
            callerId);

        return await MapToShareDtoAsync(share, eventEntity.Title);
    }

    public async System.Threading.Tasks.Task<List<EventShareDto>> GetSharesAsync(Guid eventId, Guid requestingUserId)
    {
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new UnauthorizedAccessException("Event not found.");

        await RequireSharePermissionAsync(eventEntity, requestingUserId);

        var shares = await _context.EventShares
            .Where(s => s.EventId == eventId)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();

        var dtos = new List<EventShareDto>();
        foreach (var share in shares)
            dtos.Add(await MapToShareDtoAsync(share, eventEntity.Title));

        return dtos;
    }

    public async System.Threading.Tasks.Task<EventShareDto> UpdateSharePermissionAsync(Guid eventId, Guid shareId, Guid requestingUserId, SharePermission newPermission)
    {
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new UnauthorizedAccessException("Event not found.");

        await RequireSharePermissionAsync(eventEntity, requestingUserId);

        var share = await _context.EventShares
            .FirstOrDefaultAsync(s => s.Id == shareId && s.EventId == eventId)
            ?? throw new UnauthorizedAccessException("Share not found.");

        // Load-and-mutate pattern (ExecuteUpdateAsync not supported by InMemory provider)
        share.Permission = newPermission;
        await _context.SaveChangesAsync();

        return await MapToShareDtoAsync(share, eventEntity.Title);
    }

    public async System.Threading.Tasks.Task DeleteShareAsync(Guid eventId, Guid shareId, Guid requestingUserId)
    {
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new UnauthorizedAccessException("Event not found.");

        var share = await _context.EventShares
            .FirstOrDefaultAsync(s => s.Id == shareId && s.EventId == eventId)
            ?? throw new UnauthorizedAccessException("Share not found.");

        var callerIsOwner = eventEntity.UserId == requestingUserId;

        if (!callerIsOwner)
        {
            var callerShare = await _context.EventShares
                .FirstOrDefaultAsync(s => s.EventId == eventId
                    && s.SharedWithUserId == requestingUserId
                    && s.Status == ShareStatus.Accepted
                    && s.Permission == SharePermission.Manage);

            if (callerShare == null)
                throw new UnauthorizedAccessException("You do not have permission to revoke shares.");

            // Manage users can only revoke shares they personally created
            if (share.SharedByUserId != requestingUserId)
                throw new UnauthorizedAccessException("You can only revoke shares that you created.");
        }

        var recipientId = share.SharedWithUserId;

        // Load-and-remove pattern (ExecuteDeleteAsync not supported by InMemory provider)
        _context.EventShares.Remove(share);
        await _context.SaveChangesAsync();

        await _notificationService.CreateAsync(
            recipientId,
            NotificationType.ShareRevoked,
            NotificationEntityType.Event,
            eventId,
            eventEntity.Title,
            requestingUserId);
    }

    public async System.Threading.Tasks.Task<List<EventShareInvitationDto>> GetPendingInvitationsAsync(Guid userId)
    {
        var shares = await _context.EventShares
            .Include(s => s.Event)
            .Where(s => s.SharedWithUserId == userId && s.Status == ShareStatus.Pending)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var dtos = new List<EventShareInvitationDto>();
        foreach (var share in shares)
        {
            var sharer = await _context.Users.FindAsync(share.SharedByUserId);
            dtos.Add(new EventShareInvitationDto
            {
                ShareId = share.Id,
                EventId = share.EventId,
                EventTitle = share.Event.Title,
                EventStartDate = share.Event.StartDate,
                EventEndDate = share.Event.EndDate,
                SharedBy = new UserSummaryDto
                {
                    Id = share.SharedByUserId,
                    Username = sharer?.Username ?? string.Empty
                },
                Permission = share.Permission,
                CreatedAt = share.CreatedAt
            });
        }

        return dtos;
    }

    public async System.Threading.Tasks.Task AcceptInvitationAsync(Guid shareId, Guid userId)
    {
        var share = await _context.EventShares
            .FirstOrDefaultAsync(s => s.Id == shareId && s.SharedWithUserId == userId)
            ?? throw new UnauthorizedAccessException("Invitation not found.");

        if (share.Status != ShareStatus.Pending)
            throw new InvalidOperationException("Invitation is no longer pending.");

        // Load-and-mutate
        share.Status = ShareStatus.Accepted;
        await _context.SaveChangesAsync();

        var eventEntity = await _context.Events.FindAsync(share.EventId);

        await _notificationService.CreateAsync(
            share.SharedByUserId,
            NotificationType.ShareAccepted,
            NotificationEntityType.Event,
            share.EventId,
            eventEntity?.Title ?? string.Empty,
            userId);
    }

    public async System.Threading.Tasks.Task DeclineInvitationAsync(Guid shareId, Guid userId)
    {
        var share = await _context.EventShares
            .FirstOrDefaultAsync(s => s.Id == shareId && s.SharedWithUserId == userId)
            ?? throw new UnauthorizedAccessException("Invitation not found.");

        if (share.Status != ShareStatus.Pending)
            throw new InvalidOperationException("Invitation is no longer pending.");

        // Load-and-mutate
        share.Status = ShareStatus.Declined;
        await _context.SaveChangesAsync();

        var eventEntity = await _context.Events.FindAsync(share.EventId);

        await _notificationService.CreateAsync(
            share.SharedByUserId,
            NotificationType.ShareDeclined,
            NotificationEntityType.Event,
            share.EventId,
            eventEntity?.Title ?? string.Empty,
            userId);
    }

    public async System.Threading.Tasks.Task<SharePermission?> GetUserPermissionAsync(Guid eventId, Guid userId)
    {
        var share = await _context.EventShares
            .FirstOrDefaultAsync(s => s.EventId == eventId
                && s.SharedWithUserId == userId
                && s.Status == ShareStatus.Accepted);

        return share?.Permission;
    }

    // ── Private helpers ────────────────────────────────────────────────

    /// <summary>
    /// Throws UnauthorizedAccessException if the caller is neither the event owner
    /// nor an accepted Manage-permission share recipient.
    /// </summary>
    private async System.Threading.Tasks.Task RequireSharePermissionAsync(Event eventEntity, Guid callerId)
    {
        if (eventEntity.UserId == callerId)
            return; // Owner — all operations permitted

        var callerShare = await _context.EventShares
            .FirstOrDefaultAsync(s => s.EventId == eventEntity.Id
                && s.SharedWithUserId == callerId
                && s.Status == ShareStatus.Accepted
                && s.Permission == SharePermission.Manage);

        if (callerShare == null)
            throw new UnauthorizedAccessException("Only the event owner or users with Manage permission can perform this action.");
    }

    private async System.Threading.Tasks.Task<EventShareDto> MapToShareDtoAsync(EventShare share, string eventTitle)
    {
        var sharedBy = await _context.Users.FindAsync(share.SharedByUserId);
        var sharedWith = await _context.Users.FindAsync(share.SharedWithUserId);

        return new EventShareDto
        {
            Id = share.Id,
            EventId = share.EventId,
            EventTitle = eventTitle,
            SharedBy = new UserSummaryDto { Id = share.SharedByUserId, Username = sharedBy?.Username ?? string.Empty },
            SharedWith = new UserSummaryDto { Id = share.SharedWithUserId, Username = sharedWith?.Username ?? string.Empty },
            Permission = share.Permission,
            Status = share.Status,
            CreatedAt = share.CreatedAt
        };
    }
}
