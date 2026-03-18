using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinanceApi.Features.Events.Services;
using FinanceApi.Features.Events.DTOs;
using System.Security.Claims;

namespace FinanceApi.Features.Sharing.Controllers;

/// <summary>
/// Manages the invitation inbox — listing, accepting, and declining event share invitations.
/// Invitations are created via POST /api/v1/events/{id}/shares.
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/sharing")]
public class SharingController : ControllerBase
{
    private readonly IEventShareService _eventShareService;

    /// <summary>
    /// Initializes a new instance of the <see cref="SharingController"/> class.
    /// </summary>
    public SharingController(IEventShareService eventShareService)
    {
        _eventShareService = eventShareService;
    }

    /// <summary>
    /// Get all pending event invitations for the authenticated user.
    /// </summary>
    /// <returns>A list of pending invitations.</returns>
    [HttpGet("invitations")]
    public async Task<ActionResult<List<EventShareInvitationDto>>> GetInvitations()
    {
        var userId = GetUserId();
        var invitations = await _eventShareService.GetPendingInvitationsAsync(userId);
        return Ok(invitations);
    }

    /// <summary>
    /// Accept a pending event invitation.
    /// </summary>
    /// <param name="shareId">The share record ID.</param>
    /// <returns>No content on success.</returns>
    [HttpPost("invitations/{shareId}/accept")]
    public async Task<IActionResult> AcceptInvitation(Guid shareId)
    {
        try
        {
            var userId = GetUserId();
            await _eventShareService.AcceptInvitationAsync(shareId, userId);
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

    /// <summary>
    /// Decline a pending event invitation.
    /// </summary>
    /// <param name="shareId">The share record ID.</param>
    /// <returns>No content on success.</returns>
    [HttpPost("invitations/{shareId}/decline")]
    public async Task<IActionResult> DeclineInvitation(Guid shareId)
    {
        try
        {
            var userId = GetUserId();
            await _eventShareService.DeclineInvitationAsync(shareId, userId);
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

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value
                   ?? throw new UnauthorizedAccessException());
}
