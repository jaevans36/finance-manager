using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinanceApi.DTOs.ActivityLogs;
using FinanceApi.Services;
using System.Security.Claims;

namespace FinanceApi.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/activity-logs")]
public class ActivityLogsController : ControllerBase
{
    private readonly IActivityLogService _activityLogService;

    public ActivityLogsController(IActivityLogService activityLogService)
    {
        _activityLogService = activityLogService;
    }

    [HttpGet]
    public async System.Threading.Tasks.Task<ActionResult<ActivityLogResponse>> GetActivityLogs([FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        var userId = GetUserId();
        var queryParams = new ActivityLogQueryParams { Page = page, Limit = limit };
        var logs = await _activityLogService.GetLogsAsync(userId, queryParams);
        return Ok(logs);
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(userIdClaim!);
    }
}
