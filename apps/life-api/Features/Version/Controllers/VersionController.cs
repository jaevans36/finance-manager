using LifeApi.Features.Version.Services;
using Microsoft.AspNetCore.Mvc;

namespace LifeApi.Features.Version.Controllers;

/// <summary>
/// API endpoints for version information
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class VersionController : ControllerBase
{
    private readonly IVersionService _versionService;
    private readonly ILogger<VersionController> _logger;

    public VersionController(IVersionService versionService, ILogger<VersionController> logger)
    {
        _versionService = versionService;
        _logger = logger;
    }

    /// <summary>
    /// Get current version information from VERSION.json
    /// </summary>
    /// <returns>Current version details</returns>
    [HttpGet("current")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCurrentVersion()
    {
        _logger.LogInformation("Getting current version");
        var version = await _versionService.GetCurrentVersionAsync();
        
        if (version == null)
        {
            return NotFound(new { error = "VERSION.json not found" });
        }

        return Ok(version);
    }

    /// <summary>
    /// Get all version history from CHANGELOG.md
    /// </summary>
    /// <returns>List of all versions with changelog entries</returns>
    [HttpGet("history")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVersionHistory()
    {
        _logger.LogInformation("Getting version history");
        var history = await _versionService.GetVersionHistoryAsync();
        return Ok(history);
    }

    /// <summary>
    /// Get specific version by number
    /// </summary>
    /// <param name="versionNumber">Version number (e.g., 0.14.0)</param>
    /// <returns>Version details</returns>
    [HttpGet("history/{versionNumber}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetVersion(string versionNumber)
    {
        _logger.LogInformation("Getting version {Version}", versionNumber);
        var version = await _versionService.GetVersionByNumberAsync(versionNumber);
        
        if (version == null)
        {
            return NotFound(new { error = "Version not found", requestedVersion = versionNumber });
        }

        return Ok(version);
    }
}
