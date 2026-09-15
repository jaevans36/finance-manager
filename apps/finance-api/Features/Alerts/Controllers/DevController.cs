using FinanceApi.Features.Alerts.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Alerts.Controllers;

/// <summary>
/// Development-only debug endpoints. finance-api's first — mirrors life-api's
/// <c>DevController</c> double-gate exactly (Development environment AND an explicit
/// config flag, so it stays dead even in Development unless opted into).
/// </summary>
[ApiController]
[Route("api/v1/dev")]
public class DevController : ControllerBase
{
    private readonly IHostEnvironment _env;
    private readonly IConfiguration _config;
    private readonly IFinanceAlertsService _alerts;
    private readonly ILogger<DevController> _logger;

    public DevController(
        IHostEnvironment env,
        IConfiguration config,
        IFinanceAlertsService alerts,
        ILogger<DevController> logger)
    {
        _env = env;
        _config = config;
        _alerts = alerts;
        _logger = logger;
    }

    /// <summary>
    /// Runs the daily finance alerts job immediately, bypassing the "already ran today"
    /// gate — for testing the bill digest / price-change alert end-to-end without
    /// waiting for the scheduled run. Still posts to Discord and writes real activity
    /// logs/baselines; it just never touches the NotificationRuns marker, so it can't
    /// block or falsely satisfy the real scheduled run later that day.
    /// </summary>
    [HttpPost("alerts/run-now")]
    public async Task<IActionResult> RunAlertsNow(CancellationToken ct)
    {
        if (!_env.IsDevelopment() || !_config.GetValue<bool>("DevFeatures:AllowManualAlertsTrigger"))
        {
            return NotFound();
        }

        _logger.LogWarning("[DEV] Manual finance alerts run triggered");
        var result = await _alerts.RunDailyAlertsAsync(bypassRunGate: true, ct);
        return Ok(result);
    }
}
