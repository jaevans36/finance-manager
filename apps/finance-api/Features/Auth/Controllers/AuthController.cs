using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinanceApi.Features.Auth.DTOs;
using FinanceApi.Features.Auth.Services;
using System.Security.Claims;

namespace FinanceApi.Features.Auth.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async System.Threading.Tasks.Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
            
            var response = await _authService.RegisterAsync(request, ipAddress, userAgent);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
    }

    [HttpPost("login")]
    public async System.Threading.Tasks.Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
            
            var response = await _authService.LoginAsync(request, ipAddress, userAgent);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = new { message = ex.Message } });
        }
    }

    [Authorize]
    [HttpPost("logout")]
    public async System.Threading.Tasks.Task<IActionResult> Logout()
    {
        var userId = GetUserId();
        var token = HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        
        await _authService.LogoutAsync(userId, token);
        return Ok(new { message = "Logged out successfully" });
    }

    [Authorize]
    [HttpGet("me")]
    public async System.Threading.Tasks.Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = GetUserId();
        var user = await _authService.GetUserByIdAsync(userId);

        if (user == null)
        {
            return NotFound();
        }

        return Ok(new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            EmailVerified = user.EmailVerified,
            CreatedAt = user.CreatedAt
        });
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(userIdClaim!);
    }
}
