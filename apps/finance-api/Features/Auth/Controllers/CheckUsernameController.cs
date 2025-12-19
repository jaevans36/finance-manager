using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;

namespace FinanceApi.Features.Auth.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class CheckUsernameController : ControllerBase
{
    private readonly FinanceDbContext _context;
    private static readonly HashSet<string> ReservedUsernames = new(StringComparer.OrdinalIgnoreCase)
    {
        "admin", "administrator", "support", "system", "root", "moderator",
        "help", "service", "official", "staff", "team", "bot", "null", "undefined"
    };

    public CheckUsernameController(FinanceDbContext context)
    {
        _context = context;
    }

    [HttpPost("check-username")]
    public async Task<IActionResult> CheckUsername([FromBody] CheckUsernameRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username))
        {
            return BadRequest(new { available = false, message = "Username is required." });
        }

        // Validate length
        if (request.Username.Length < 3 || request.Username.Length > 20)
        {
            return BadRequest(new { available = false, message = "Username must be between 3 and 20 characters." });
        }

        // Validate format (alphanumeric, underscore, hyphen only)
        if (!System.Text.RegularExpressions.Regex.IsMatch(request.Username, @"^[a-zA-Z0-9_-]+$"))
        {
            return BadRequest(new { available = false, message = "Username can only contain letters, numbers, underscores, and hyphens." });
        }

        // Check reserved usernames
        if (ReservedUsernames.Contains(request.Username))
        {
            return Ok(new { available = false, message = "This username is reserved and cannot be used." });
        }

        // Check if username exists (case-insensitive)
        var usernameLower = request.Username.ToLower();
        var exists = await _context.Users
            .AnyAsync(u => u.Username.ToLower() == usernameLower);

        if (exists)
        {
            return Ok(new { available = false, message = "This username is already taken." });
        }

        return Ok(new { available = true, message = "Username is available." });
    }
}

public record CheckUsernameRequest(string Username);
