using Microsoft.AspNetCore.Mvc;

namespace LifeApi.Features.Finance.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            service = "Finance API",
            version = "1.0.0",
            timestamp = DateTime.UtcNow
        });
    }
}
