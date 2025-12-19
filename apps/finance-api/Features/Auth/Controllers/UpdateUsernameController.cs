using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using System.Security.Claims;

namespace FinanceApi.Features.Auth.Controllers;

[ApiController]
[Route("api/v1/auth")]
[Authorize]
public class UpdateUsernameController : ControllerBase
{
    private readonly FinanceDbContext _context;
    private static readonly HashSet<string> ReservedUsernames = new(StringComparer.OrdinalIgnoreCase)
    {
        "admin", "administrator", "support", "system", "root", "moderator",
        "help", "service", "official", "staff", "team", "bot", "null", "undefined"
    };

    public UpdateUsernameController(FinanceDbContext context)
    {
        _context = context;
    }

    [HttpPatch("me/username")]
    public async Task<IActionResult> UpdateUsername([FromBody] UpdateUsernameRequest request)
    {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
        {
            return NotFound(new { error = new { message = "User not found." } });
        }

        if (string.IsNullOrWhiteSpace(request.Username))
        {
            return BadRequest(new { error = new { message = "Username is required." } });
        }

        // Validate length
        if (request.Username.Length < 3 || request.Username.Length > 20)
        {
            return BadRequest(new { error = new { message = "Username must be between 3 and 20 characters." } });
        }

        // Validate format
        if (!System.Text.RegularExpressions.Regex.IsMatch(request.Username, @"^[a-zA-Z0-9_-]+$"))
        {
            return BadRequest(new { error = new { message = "Username can only contain letters, numbers, underscores, and hyphens." } });
        }

        // Check reserved usernames
        if (ReservedUsernames.Contains(request.Username))
        {
            return BadRequest(new { error = new { message = "This username is reserved and cannot be used." } });
        }

        // Check if username exists (case-insensitive) and it's not the current user
        var usernameLower = request.Username.ToLower();
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

public record UpdateUsernameRequest(string Username);
