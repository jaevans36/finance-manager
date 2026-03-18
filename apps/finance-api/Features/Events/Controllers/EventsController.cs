using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinanceApi.Features.Events.DTOs;
using FinanceApi.Features.Events.Services;
using System.Security.Claims;

namespace FinanceApi.Features.Events.Controllers;

/// <summary>
/// Controller for managing events.
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/events")]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;
    private readonly IEventShareService _eventShareService;

    /// <summary>
    /// Initializes a new instance of the <see cref="EventsController"/> class.
    /// </summary>
    /// <param name="eventService">The event service.</param>
    /// <param name="eventShareService">The event share service.</param>
    public EventsController(IEventService eventService, IEventShareService eventShareService)
    {
        _eventService = eventService;
        _eventShareService = eventShareService;
    }

    /// <summary>
    /// Get all events for the authenticated user with optional filtering.
    /// </summary>
    /// <param name="startDate">Filter events that end on or after this date.</param>
    /// <param name="endDate">Filter events that start on or before this date.</param>
    /// <param name="groupId">Filter events by task group.</param>
    /// <returns>A list of events.</returns>
    [HttpGet]
    public async System.Threading.Tasks.Task<ActionResult<List<EventDto>>> GetEvents(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] Guid? groupId)
    {
        var userId = GetUserId();
        var events = await _eventService.GetEventsAsync(userId, startDate, endDate, groupId);
        return Ok(events);
    }

    /// <summary>
    /// Get a specific event by ID.
    /// </summary>
    /// <param name="id">The event ID.</param>
    /// <returns>The event details.</returns>
    [HttpGet("{id}")]
    public async System.Threading.Tasks.Task<ActionResult<EventDto>> GetEvent(Guid id)
    {
        var userId = GetUserId();
        var eventDto = await _eventService.GetEventByIdAsync(userId, id);

        if (eventDto == null)
        {
            return NotFound(new { error = new { message = "Event not found" } });
        }

        return Ok(eventDto);
    }

    /// <summary>
    /// Create a new event.
    /// </summary>
    /// <param name="request">The event creation request.</param>
    /// <returns>The created event.</returns>
    [HttpPost]
    public async System.Threading.Tasks.Task<ActionResult<EventDto>> CreateEvent([FromBody] CreateEventRequest request)
    {
        try
        {
            var userId = GetUserId();
            var eventDto = await _eventService.CreateEventAsync(userId, request);
            return CreatedAtAction(nameof(GetEvent), new { id = eventDto.Id }, eventDto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// Update an existing event.
    /// </summary>
    /// <param name="id">The event ID.</param>
    /// <param name="request">The event update request.</param>
    /// <returns>The updated event.</returns>
    [HttpPut("{id}")]
    public async System.Threading.Tasks.Task<ActionResult<EventDto>> UpdateEvent(Guid id, [FromBody] UpdateEventRequest request)
    {
        try
        {
            var userId = GetUserId();
            var eventDto = await _eventService.UpdateEventAsync(userId, id, request);
            return Ok(eventDto);
        }
        catch (UnauthorizedAccessException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// Delete an event.
    /// </summary>
    /// <param name="id">The event ID.</param>
    /// <returns>No content on success.</returns>
    [HttpDelete("{id}")]
    public async System.Threading.Tasks.Task<IActionResult> DeleteEvent(Guid id)
    {
        try
        {
            var userId = GetUserId();
            await _eventService.DeleteEventAsync(userId, id);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// Share an event with another user.
    /// Caller must be the event owner or have Manage permission.
    /// </summary>
    /// <param name="id">The event ID.</param>
    /// <param name="request">Share request containing the recipient's username or email and permission level.</param>
    /// <returns>The created share record.</returns>
    [HttpPost("{id}/shares")]
    public async System.Threading.Tasks.Task<ActionResult<EventShareDto>> ShareEvent(Guid id, [FromBody] CreateEventShareRequest request)
    {
        try
        {
            var userId = GetUserId();
            var share = await _eventShareService.CreateShareAsync(id, userId, request.UsernameOrEmail, request.Permission);
            return CreatedAtAction(nameof(GetEventShares), new { id }, share);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
        catch (UnauthorizedAccessException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// List all shares for an event.
    /// Caller must be the event owner or have Manage permission.
    /// </summary>
    /// <param name="id">The event ID.</param>
    /// <returns>All share records for the event.</returns>
    [HttpGet("{id}/shares")]
    public async System.Threading.Tasks.Task<ActionResult<List<EventShareDto>>> GetEventShares(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var shares = await _eventShareService.GetSharesAsync(id, userId);
            return Ok(shares);
        }
        catch (UnauthorizedAccessException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// Update the permission level on an existing share.
    /// Caller must be the event owner or have Manage permission.
    /// </summary>
    /// <param name="id">The event ID.</param>
    /// <param name="shareId">The share record ID.</param>
    /// <param name="request">The new permission level.</param>
    /// <returns>The updated share record.</returns>
    [HttpPut("{id}/shares/{shareId}")]
    public async System.Threading.Tasks.Task<ActionResult<EventShareDto>> UpdateEventShare(Guid id, Guid shareId, [FromBody] UpdateEventShareRequest request)
    {
        try
        {
            var userId = GetUserId();
            var share = await _eventShareService.UpdateSharePermissionAsync(id, shareId, userId, request.Permission);
            return Ok(share);
        }
        catch (UnauthorizedAccessException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// Revoke (delete) a share. Owner can revoke any share; Manage users can only revoke shares they created.
    /// </summary>
    /// <param name="id">The event ID.</param>
    /// <param name="shareId">The share record ID.</param>
    /// <returns>No content on success.</returns>
    [HttpDelete("{id}/shares/{shareId}")]
    public async System.Threading.Tasks.Task<IActionResult> DeleteEventShare(Guid id, Guid shareId)
    {
        try
        {
            var userId = GetUserId();
            await _eventShareService.DeleteShareAsync(id, shareId, userId);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
        catch (UnauthorizedAccessException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(userIdClaim!);
    }
}
