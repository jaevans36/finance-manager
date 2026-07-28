using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using LifeApi.Data;
using LifeApi.Features.Auth.Services;
using LifeApi.Features.Dev.Models;

namespace LifeApi.Features.Dev.Controllers;

[ApiController]
[Route("api/v1/dev")]
public class DevController : ControllerBase
{
    private readonly IHostEnvironment _env;
    private readonly IConfiguration _config;
    private readonly FinanceDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<DevController> _logger;

    public DevController(
        IHostEnvironment env,
        IConfiguration config,
        FinanceDbContext context,
        IPasswordHasher passwordHasher,
        ILogger<DevController> logger)
    {
        _env = env;
        _config = config;
        _context = context;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    [HttpPost("reset-password")]
    public async System.Threading.Tasks.Task<IActionResult> ResetPassword(
        [FromBody] DevPasswordResetRequest request)
    {
        if (!_env.IsDevelopment() ||
            !_config.GetValue<bool>("DevFeatures:AllowDirectPasswordReset"))
        {
            return NotFound();
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
            return NotFound();

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.FailedLoginAttempts = 0;
        user.AccountLockedUntil = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogWarning("[DEV] Direct password reset used for {Email}", request.Email);

        return Ok(new { message = "Password reset successfully." });
    }
}
