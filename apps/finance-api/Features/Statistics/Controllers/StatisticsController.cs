using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinanceApi.Features.Statistics.Services;
using System.Security.Claims;

namespace FinanceApi.Features.Statistics.Controllers;

/// <summary>
/// Statistics and analytics endpoints for weekly/daily progress tracking.
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/statistics")]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;

    public StatisticsController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    /// <summary>
    /// Get weekly statistics for the specified week.
    /// </summary>
    /// <param name="weekStart">Start date of the week (defaults to current week)</param>
    [HttpGet("weekly")]
    public async Task<IActionResult> GetWeeklyStatistics([FromQuery] DateTime? weekStart)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var start = weekStart ?? GetWeekStart(DateTime.UtcNow);

        var statistics = await _statisticsService.GetWeeklyStatisticsAsync(userId, start);
        return Ok(statistics);
    }

    /// <summary>
    /// Get daily statistics for the specified date.
    /// </summary>
    /// <param name="date">Date to get statistics for (defaults to today)</param>
    [HttpGet("daily")]
    public async Task<IActionResult> GetDailyStatistics([FromQuery] DateTime? date)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var targetDate = date ?? DateTime.UtcNow;

        var statistics = await _statisticsService.GetDailyStatisticsAsync(userId, targetDate);
        return Ok(statistics);
    }

    /// <summary>
    /// Get urgent tasks for the current or specified week.
    /// </summary>
    /// <param name="weekStart">Start date of the week (defaults to current week)</param>
    [HttpGet("urgent")]
    public async Task<IActionResult> GetUrgentTasks([FromQuery] DateTime? weekStart)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var start = weekStart ?? GetWeekStart(DateTime.UtcNow);

        var urgentTasks = await _statisticsService.GetUrgentTasksAsync(userId, start);
        return Ok(urgentTasks);
    }

    /// <summary>
    /// Get historical completion rate statistics for the past N weeks.
    /// </summary>
    /// <param name="weeks">Number of weeks to retrieve (1-52, defaults to 8)</param>
    [HttpGet("history")]
    public async Task<IActionResult> GetHistoricalStatistics([FromQuery] int weeks = 8)
    {
        // Validate weeks parameter
        if (weeks < 1 || weeks > 52)
        {
            return BadRequest(new { error = "Weeks parameter must be between 1 and 52" });
        }

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var historicalStats = await _statisticsService.GetHistoricalStatisticsAsync(userId, weeks);
        
        return Ok(historicalStats);
    }

    private static DateTime GetWeekStart(DateTime date)
    {
        var dayOfWeek = (int)date.DayOfWeek;
        var daysToSubtract = dayOfWeek == 0 ? 6 : dayOfWeek - 1; // Monday as start
        return date.Date.AddDays(-daysToSubtract);
    }
}
