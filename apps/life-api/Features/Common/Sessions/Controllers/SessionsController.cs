using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeApi.Features.Common.Sessions.DTOs;
using LifeApi.Features.Common.Sessions.Services;
using System.Security.Claims;

namespace LifeApi.Features.Common.Sessions.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/sessions")]
public class SessionsController : ControllerBase
{
    private readonly ISessionService _sessionService;

    public SessionsController(ISessionService sessionService)
    {
        _sessionService = sessionService;
    }

    [HttpGet]
    public async System.Threading.Tasks.Task<ActionResult<List<SessionDto>>> GetSessions()
    {
        var userId = GetUserId();
        var token = HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        var sessions = await _sessionService.GetSessionsAsync(userId, token);
        return Ok(sessions);
    }

    [HttpDelete("{id}")]
    public async System.Threading.Tasks.Task<IActionResult> RevokeSession(Guid id)
    {
        try
        {
            var userId = GetUserId();
            await _sessionService.RevokeSessionAsync(userId, id);
            return Ok(new { message = "Session revoked successfully" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Session not found" } });
        }
    }

    [HttpDelete]
    public async System.Threading.Tasks.Task<IActionResult> RevokeAllSessions()
    {
        var userId = GetUserId();
        var token = HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        await _sessionService.RevokeAllSessionsAsync(userId, token);
        return Ok(new { message = "All other sessions revoked successfully" });
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(userIdClaim!);
    }
}
