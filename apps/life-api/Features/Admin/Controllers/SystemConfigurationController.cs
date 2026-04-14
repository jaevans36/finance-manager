using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LifeApi.Features.Admin.DTOs;

namespace LifeApi.Features.Admin.Controllers;

/// <summary>
/// System configuration and settings management.
/// </summary>
[Authorize]
[ApiController]
[Route("api/admin/configuration")]
public class SystemConfigurationController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<SystemConfigurationController> _logger;

    public SystemConfigurationController(
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger<SystemConfigurationController> logger)
    {
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    private bool IsAdmin()
    {
        var isAdminClaim = User.FindFirst("IsAdmin")?.Value;
        return isAdminClaim == "True";
    }

    /// <summary>
    /// Get current system configuration.
    /// </summary>
    [HttpGet]
    public IActionResult GetConfiguration()
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        try
        {
            var config = new SystemConfigurationResponse
            {
                Environment = _environment.EnvironmentName,
                RateLimit = new RateLimitConfiguration
                {
                    Enabled = _configuration.GetValue<bool>("RateLimit:Enabled", true),
                    MaxRequestsPerMinute = _configuration.GetValue<int>("RateLimit:MaxRequestsPerMinute", 60),
                    MaxRequestsPerHour = _configuration.GetValue<int>("RateLimit:MaxRequestsPerHour", 1000)
                }
            };

            return Ok(config);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting system configuration");
            return StatusCode(500, new { message = "An error occurred while retrieving configuration" });
        }
    }
}
