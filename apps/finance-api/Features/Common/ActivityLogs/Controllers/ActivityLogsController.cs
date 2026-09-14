using System.Security.Claims;
using FinanceApi.Features.Common.ActivityLogs.DTOs;
using FinanceApi.Features.Common.ActivityLogs.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Common.ActivityLogs.Controllers;

/// <summary>Read-only access to the finance activity log — who changed what, and when.</summary>
[ApiController]
[Route("api/v1/finance/activity-logs")]
[Authorize]
[Produces("application/json")]
public class ActivityLogsController : ControllerBase
{
    private readonly IActivityLogService _activityLogs;

    public ActivityLogsController(IActivityLogService activityLogs)
    {
        _activityLogs = activityLogs;
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("User ID not found in token");
        return Guid.Parse(sub);
    }

    /// <summary>Get the authenticated user's own activity log, newest first.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<ActivityLogResponse>> GetActivityLogs([FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        var logs = await _activityLogs.GetLogsAsync(GetUserId(), new ActivityLogQueryParams { Page = page, Limit = limit });
        return Ok(logs);
    }
}
