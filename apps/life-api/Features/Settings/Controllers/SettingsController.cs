using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeApi.Features.Settings.DTOs;
using LifeApi.Features.Settings.Services;
using System.Security.Claims;

namespace LifeApi.Features.Settings.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/settings")]
public class SettingsController : ControllerBase
{
    private readonly IUserSettingsService _settingsService;
    private readonly IWipService _wipService;

    public SettingsController(IUserSettingsService settingsService, IWipService wipService)
    {
        _settingsService = settingsService;
        _wipService = wipService;
    }

    /// <summary>
    /// Gets the current user's settings. Creates defaults if none exist.
    /// </summary>
    [HttpGet]
    public async System.Threading.Tasks.Task<ActionResult<UserSettingsDto>> GetSettings()
    {
        var userId = GetUserId();
        var settings = await _settingsService.GetSettingsAsync(userId);
        return Ok(settings);
    }

    /// <summary>
    /// Updates the current user's settings.
    /// </summary>
    [HttpPut]
    public async System.Threading.Tasks.Task<ActionResult<UserSettingsDto>> UpdateSettings(
        [FromBody] UpdateUserSettingsRequest request)
    {
        var userId = GetUserId();
        var settings = await _settingsService.UpdateSettingsAsync(userId, request);
        return Ok(settings);
    }

    /// <summary>
    /// Gets the WIP (Work In Progress) summary for the current user.
    /// </summary>
    [HttpGet("wip-summary")]
    public async System.Threading.Tasks.Task<ActionResult<WipSummaryDto>> GetWipSummary()
    {
        var userId = GetUserId();
        var summary = await _wipService.GetWipSummaryAsync(userId);
        return Ok(summary);
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(userIdClaim!);
    }
}
