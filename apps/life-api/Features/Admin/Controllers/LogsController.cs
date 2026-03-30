using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeApi.Features.Admin.Services;

namespace LifeApi.Features.Admin.Controllers;

/// <summary>
/// Admin-only endpoint for viewing recent application log entries.
/// </summary>
[Authorize]
[ApiController]
[Route("api/admin/logs")]
public class LogsController : ControllerBase
{
    private readonly LogReaderService _logReader;

    public LogsController(LogReaderService logReader)
    {
        _logReader = logReader;
    }

    private bool IsAdmin() => User.FindFirst("IsAdmin")?.Value == "True";

    /// <summary>
    /// Returns recent log entries from today's log file.
    /// </summary>
    /// <param name="lines">Maximum number of entries to return (default 200, max 1000).</param>
    /// <param name="level">Filter by level: all, INF, WRN, ERR (default all).</param>
    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] int lines = 200, [FromQuery] string level = "all")
    {
        if (!IsAdmin()) return Forbid();

        lines = Math.Clamp(lines, 1, 1000);
        var entries = await _logReader.ReadLogsAsync(lines, level);
        return Ok(entries);
    }
}
