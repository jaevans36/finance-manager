using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Auth.DTOs;
using FinanceApi.Features.Auth.Services;
using System.Security.Claims;

namespace FinanceApi.Features.Auth.Controllers;

/// <summary>
/// Authentication controller for user registration, login, and account management.
/// </summary>
[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly FinanceDbContext _context;
    private static readonly HashSet<string> ReservedUsernames = new(StringComparer.OrdinalIgnoreCase)
    {
        "admin", "administrator", "support", "system", "root", "moderator",
        "help", "service", "official", "staff", "team", "bot", "null", "undefined"
    };

    public AuthController(IAuthService authService, FinanceDbContext context)
    {
        _authService = authService;
        _context = context;
    }

    /// <summary>
    /// Registers a new user account.
    /// </summary>
    /// <param name="request">Registration details including email, username, and password.</param>
    /// <returns>Authentication response with JWT token and user details.</returns>
    /// <response code="200">Successfully registered and logged in.</response>
    /// <response code="400">Invalid registration data or email/username already exists.</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
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
            Username = user.Username,
            EmailVerified = user.EmailVerified,
            CreatedAt = user.CreatedAt
        });
    }

    [HttpPost("check-username")]
    public async Task<IActionResult> CheckUsername([FromBody] CheckUsernameRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.username))
        {
            return BadRequest(new { available = false, message = "Username is required." });
        }

        // Validate length
        if (request.username.Length < 3 || request.username.Length > 20)
        {
            return BadRequest(new { available = false, message = "Username must be between 3 and 20 characters." });
        }

        // Validate format (alphanumeric, underscore, hyphen only)
        if (!System.Text.RegularExpressions.Regex.IsMatch(request.username, @"^[a-zA-Z0-9_-]+$"))
        {
            return BadRequest(new { available = false, message = "Username can only contain letters, numbers, underscores, and hyphens." });
        }

        // Check reserved usernames
        if (ReservedUsernames.Contains(request.username))
        {
            return Ok(new { available = false, message = "This username is reserved and cannot be used." });
        }

        // Check if username exists (case-insensitive)
        var usernameLower = request.username.ToLower();
        var exists = await _context.Users
            .AnyAsync(u => u.Username.ToLower() == usernameLower);

        if (exists)
        {
            return Ok(new { available = false, message = "This username is already taken." });
        }

        return Ok(new { available = true, message = "Username is available." });
    }

    [Authorize]
    [HttpPatch("me/username")]
    public async Task<IActionResult> UpdateUsername([FromBody] UpdateUsernameRequest request)
    {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
        {
            return NotFound(new { error = new { message = "User not found." } });
        }

        if (string.IsNullOrWhiteSpace(request.username))
        {
            return BadRequest(new { error = new { message = "Username is required." } });
        }

        // Validate length
        if (request.username.Length < 3 || request.username.Length > 20)
        {
            return BadRequest(new { error = new { message = "Username must be between 3 and 20 characters." } });
        }

        // Validate format
        if (!System.Text.RegularExpressions.Regex.IsMatch(request.username, @"^[a-zA-Z0-9_-]+$"))
        {
            return BadRequest(new { error = new { message = "Username can only contain letters, numbers, underscores, and hyphens." } });
        }

        // Check reserved usernames
        if (ReservedUsernames.Contains(request.username))
        {
            return BadRequest(new { error = new { message = "This username is reserved and cannot be used." } });
        }

        // Check if username exists (case-insensitive) and it's not the current user
        var usernameLower = request.username.ToLower();
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == usernameLower && u.Id != userId);

        if (existingUser != null)
        {
            return BadRequest(new { error = new { message = "This username is already taken." } });
        }

        // Update username
        user.Username = usernameLower;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { username = user.Username, message = "Username updated successfully." });
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(userIdClaim!);
    }
}

public record CheckUsernameRequest(string username);
public record UpdateUsernameRequest(string username);
