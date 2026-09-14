using System.Security.Claims;
using FinanceApi.Features.Accounts.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Accounts.Controllers;

/// <summary>Account sharing — invite, accept, decline, revoke.</summary>
[ApiController]
[Route("api/v1/finance/accounts")]
[Authorize]
[Produces("application/json")]
public class AccountSharingController : ControllerBase
{
    private readonly IAccountSharingService _sharing;

    public AccountSharingController(IAccountSharingService sharing)
    {
        _sharing = sharing;
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("User ID not found in token");
        return Guid.Parse(sub);
    }

    private string? GetIpAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();

    private string? GetUserAgent() => HttpContext.Request.Headers["User-Agent"].ToString();

    /// <summary>Invite another Life Manager user to share an account, by username or email.</summary>
    [HttpPost("{id:guid}/share")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ShareAccount(Guid id, [FromBody] ShareAccountRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UsernameOrEmail)) return BadRequest("A username or email is required");

        try
        {
            var share = await _sharing.ShareAccountAsync(id, GetUserId(), request.UsernameOrEmail, GetIpAddress(), GetUserAgent());
            return CreatedAtAction(nameof(GetSharesForAccount), new { id }, share);
        }
        catch (Exception ex) when (ex is KeyNotFoundException or UnauthorizedAccessException)
        {
            // Not-owner and not-found both come back as 404 here, deliberately — a caller with
            // no visibility into the account shouldn't be able to distinguish "doesn't exist"
            // from "exists but isn't yours" by response code.
            return NotFound(new { error = new { message = ex.Message } });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>List all shares (any status) for one account. Owner only.</summary>
    [HttpGet("{id:guid}/shares")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSharesForAccount(Guid id)
    {
        try
        {
            return Ok(await _sharing.GetSharesForAccountAsync(id, GetUserId()));
        }
        catch (Exception ex) when (ex is KeyNotFoundException or UnauthorizedAccessException)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>Revoke a share. Owner only.</summary>
    [HttpDelete("{id:guid}/shares/{shareId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeShare(Guid id, Guid shareId)
    {
        try
        {
            await _sharing.RevokeShareAsync(id, shareId, GetUserId(), GetIpAddress(), GetUserAgent());
            return NoContent();
        }
        catch (Exception ex) when (ex is KeyNotFoundException or UnauthorizedAccessException)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>Accounts the caller has shared with others.</summary>
    [HttpGet("shared-by-me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSharedByMe() => Ok(await _sharing.GetSharedByMeAsync(GetUserId()));

    /// <summary>Accounts shared with the caller that they've accepted.</summary>
    [HttpGet("shared-with-me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSharedWithMe() => Ok(await _sharing.GetSharedWithMeAsync(GetUserId()));

    /// <summary>Pending share invitations addressed to the caller.</summary>
    [HttpGet("share-invitations")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingInvitations() => Ok(await _sharing.GetPendingInvitationsAsync(GetUserId()));

    /// <summary>Accept a pending share invitation.</summary>
    [HttpPost("share-invitations/{shareId:guid}/accept")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AcceptInvitation(Guid shareId)
    {
        try
        {
            await _sharing.AcceptInvitationAsync(shareId, GetUserId(), GetIpAddress(), GetUserAgent());
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>Decline a pending share invitation.</summary>
    [HttpPost("share-invitations/{shareId:guid}/decline")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeclineInvitation(Guid shareId)
    {
        try
        {
            await _sharing.DeclineInvitationAsync(shareId, GetUserId(), GetIpAddress(), GetUserAgent());
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = new { message = ex.Message } });
        }
    }
}
