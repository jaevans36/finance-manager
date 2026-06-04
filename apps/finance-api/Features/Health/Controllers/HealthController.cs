using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Health.Controllers;

/// <summary>Health check endpoint for container orchestration and monitoring.</summary>
[ApiController]
[Route("api/v1/finance/health")]
public class HealthController : ControllerBase
{
    /// <summary>Returns service health status.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            service = "finance-api",
            timestamp = DateTime.UtcNow
        });
    }
}
