using FinanceApi.Data;
using FinanceApi.Features.Events.Models;
using FinanceApi.Features.Events.DTOs;
using FinanceApi.Features.Events.Validators;
using FinanceApi.Features.Common.ActivityLogs.Services;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Tasks.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Events.Services;

public interface IEventService
{
    System.Threading.Tasks.Task<EventDto> CreateEventAsync(Guid userId, CreateEventRequest request);
    System.Threading.Tasks.Task<EventDto> UpdateEventAsync(Guid userId, Guid eventId, UpdateEventRequest request);
    System.Threading.Tasks.Task DeleteEventAsync(Guid userId, Guid eventId);
    System.Threading.Tasks.Task<EventDto?> GetEventByIdAsync(Guid userId, Guid eventId);
    System.Threading.Tasks.Task<List<EventDto>> GetEventsAsync(
        Guid userId, 
        DateTime? startDate = null, 
        DateTime? endDate = null,
        Guid? groupId = null);
}

public class EventService : IEventService
{
    private readonly FinanceDbContext _context;
    private readonly IActivityLogService _activityLogService;

    public EventService(FinanceDbContext context, IActivityLogService activityLogService)
    {
        _context = context;
        _activityLogService = activityLogService;
    }

    public async System.Threading.Tasks.Task<EventDto> CreateEventAsync(Guid userId, CreateEventRequest request)
    {
        // Validate the request
        if (!EventValidator.ValidateCreateEventRequest(request, out var errors))
        {
            throw new InvalidOperationException($"Validation failed: {string.Join(", ", errors)}");
        }

        // Validate group ownership if group is specified
        if (request.GroupId.HasValue)
        {
            var group = await _context.TaskGroups
                .FirstOrDefaultAsync(g => g.Id == request.GroupId.Value && g.UserId == userId);

            if (group == null)
            {
                throw new UnauthorizedAccessException("Task group not found or does not belong to user.");
            }
        }

        var eventEntity = new Event
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            GroupId = request.GroupId,
            Title = request.Title,
            Description = request.Description,
            StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc),
            IsAllDay = request.IsAllDay,
            Location = request.Location,
            ReminderMinutes = request.ReminderMinutes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Log activity
        await _activityLogService.LogAsync(
            userId,
            ActivityType.EventCreated,
            $"Created event '{eventEntity.Title}'",
            null,
            null);

        return await MapToEventDtoAsync(eventEntity);
    }

    public async System.Threading.Tasks.Task<EventDto> UpdateEventAsync(Guid userId, Guid eventId, UpdateEventRequest request)
    {
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId && e.UserId == userId);

        if (eventEntity == null)
        {
            throw new UnauthorizedAccessException("Event not found or does not belong to user.");
        }

        // Validate the request with existing values
        if (!EventValidator.ValidateUpdateEventRequest(request, eventEntity.StartDate, eventEntity.EndDate, out var errors))
        {
            throw new InvalidOperationException($"Validation failed: {string.Join(", ", errors)}");
        }

        // Validate group ownership if group is being changed
        if (request.GroupId.HasValue && request.GroupId.Value != eventEntity.GroupId)
        {
            var group = await _context.TaskGroups
                .FirstOrDefaultAsync(g => g.Id == request.GroupId.Value && g.UserId == userId);

            if (group == null)
            {
                throw new UnauthorizedAccessException("Task group not found or does not belong to user.");
            }
        }

        // Update only provided fields
        if (request.Title != null)
        {
            eventEntity.Title = request.Title;
        }

        if (request.Description != null)
        {
            eventEntity.Description = request.Description;
        }

        if (request.StartDate.HasValue)
        {
            eventEntity.StartDate = DateTime.SpecifyKind(request.StartDate.Value, DateTimeKind.Utc);
        }

        if (request.EndDate.HasValue)
        {
            eventEntity.EndDate = DateTime.SpecifyKind(request.EndDate.Value, DateTimeKind.Utc);
        }

        if (request.IsAllDay.HasValue)
        {
            eventEntity.IsAllDay = request.IsAllDay.Value;
        }

        if (request.Location != null)
        {
            eventEntity.Location = request.Location;
        }

        if (request.ReminderMinutes.HasValue)
        {
            eventEntity.ReminderMinutes = request.ReminderMinutes.Value;
        }

        if (request.GroupId.HasValue)
        {
            eventEntity.GroupId = request.GroupId.Value;
        }

        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Log activity
        await _activityLogService.LogAsync(
            userId,
            ActivityType.EventUpdated,
            $"Updated event '{eventEntity.Title}'",
            null,
            null);

        return await MapToEventDtoAsync(eventEntity);
    }

    public async System.Threading.Tasks.Task DeleteEventAsync(Guid userId, Guid eventId)
    {
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId && e.UserId == userId);

        if (eventEntity == null)
        {
            throw new UnauthorizedAccessException("Event not found or does not belong to user.");
        }

        var eventTitle = eventEntity.Title;

        _context.Events.Remove(eventEntity);
        await _context.SaveChangesAsync();

        // Log activity
        await _activityLogService.LogAsync(
            userId,
            ActivityType.EventDeleted,
            $"Deleted event '{eventTitle}'",
            null,
            null);
    }

    public async System.Threading.Tasks.Task<EventDto?> GetEventByIdAsync(Guid userId, Guid eventId)
    {
        // Try as owner first
        var eventEntity = await _context.Events
            .Include(e => e.Group)
            .FirstOrDefaultAsync(e => e.Id == eventId && e.UserId == userId);

        if (eventEntity != null)
        {
            var dto = await MapToEventDtoAsync(eventEntity);
            dto.IsOwner = true;
            return dto;
        }

        // Try as accepted share recipient
        var share = await _context.EventShares
            .Include(s => s.Event)
                .ThenInclude(e => e.Group)
            .FirstOrDefaultAsync(s => s.EventId == eventId
                && s.SharedWithUserId == userId
                && s.Status == ShareStatus.Accepted);

        if (share == null)
            return null;

        var sharedDto = await MapToEventDtoAsync(share.Event);
        sharedDto.IsOwner = false;
        sharedDto.MyPermission = share.Permission;
        var sharer = await _context.Users.FindAsync(share.SharedByUserId);
        sharedDto.SharedBy = sharer == null ? null : new UserSummaryDto { Id = sharer.Id, Username = sharer.Username };
        return sharedDto;
    }

    public async System.Threading.Tasks.Task<List<EventDto>> GetEventsAsync(
        Guid userId,
        DateTime? startDate = null,
        DateTime? endDate = null,
        Guid? groupId = null)
    {
        // ── Owned events ──────────────────────────────────────────────────
        var ownedQuery = _context.Events
            .Include(e => e.Group)
            .Where(e => e.UserId == userId);

        if (startDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc);
            ownedQuery = ownedQuery.Where(e => e.EndDate >= startUtc);
        }

        if (endDate.HasValue)
        {
            var endUtc = DateTime.SpecifyKind(endDate.Value, DateTimeKind.Utc);
            ownedQuery = ownedQuery.Where(e => e.StartDate <= endUtc);
        }

        if (groupId.HasValue)
        {
            ownedQuery = ownedQuery.Where(e => e.GroupId == groupId.Value);
        }

        var ownedEvents = await ownedQuery.OrderBy(e => e.StartDate).ToListAsync();

        // ── Accepted shared events ────────────────────────────────────────
        var acceptedShares = await _context.EventShares
            .Include(s => s.Event)
                .ThenInclude(e => e.Group)
            .Where(s => s.SharedWithUserId == userId && s.Status == ShareStatus.Accepted)
            .ToListAsync();

        // Apply same date/group filters to shared events
        var filteredShares = acceptedShares
            .Where(s =>
                (!startDate.HasValue || s.Event.EndDate >= DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc)) &&
                (!endDate.HasValue   || s.Event.StartDate <= DateTime.SpecifyKind(endDate.Value, DateTimeKind.Utc)) &&
                (!groupId.HasValue   || s.Event.GroupId == groupId.Value))
            .OrderBy(s => s.Event.StartDate)
            .ToList();

        // ── Build result ─────────────────────────────────────────────────
        var eventDtos = new List<EventDto>();

        foreach (var eventEntity in ownedEvents)
        {
            var dto = await MapToEventDtoAsync(eventEntity);
            dto.IsOwner = true;
            eventDtos.Add(dto);
        }

        foreach (var share in filteredShares)
        {
            var dto = await MapToEventDtoAsync(share.Event);
            dto.IsOwner = false;
            dto.MyPermission = share.Permission;

            var sharer = await _context.Users.FindAsync(share.SharedByUserId);
            dto.SharedBy = sharer == null ? null : new UserSummaryDto { Id = sharer.Id, Username = sharer.Username };

            eventDtos.Add(dto);
        }

        return eventDtos.OrderBy(e => e.StartDate).ToList();
    }

    private async System.Threading.Tasks.Task<EventDto> MapToEventDtoAsync(Event eventEntity)
    {
        // Load group if not already loaded
        if (eventEntity.GroupId.HasValue && eventEntity.Group == null)
        {
            await _context.Entry(eventEntity).Reference(e => e.Group).LoadAsync();
        }

        return new EventDto
        {
            Id = eventEntity.Id,
            UserId = eventEntity.UserId,
            Title = eventEntity.Title,
            Description = eventEntity.Description,
            StartDate = eventEntity.StartDate,
            EndDate = eventEntity.EndDate,
            IsAllDay = eventEntity.IsAllDay,
            Location = eventEntity.Location,
            ReminderMinutes = eventEntity.ReminderMinutes,
            GroupId = eventEntity.GroupId,
            GroupName = eventEntity.Group?.Name,
            GroupColour = eventEntity.Group?.Colour,
            CreatedAt = eventEntity.CreatedAt,
            UpdatedAt = eventEntity.UpdatedAt
        };
    }
}
