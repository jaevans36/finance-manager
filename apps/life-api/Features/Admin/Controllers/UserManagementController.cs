using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using LifeApi.Features.Admin.Services;
using LifeApi.Features.Admin.DTOs;

namespace LifeApi.Features.Admin.Controllers;

[Authorize]
[ApiController]
[Route("api/admin/users")]
public class UserManagementController : ControllerBase
{
    private readonly IUserManagementService _userManagementService;
    private readonly ILogger<UserManagementController> _logger;

    public UserManagementController(
        IUserManagementService userManagementService,
        ILogger<UserManagementController> logger)
    {
        _userManagementService = userManagementService;
        _logger = logger;
    }

    private bool IsAdmin()
    {
        var isAdminClaim = User.FindFirst("IsAdmin")?.Value;
        return isAdminClaim == "True";
    }

    /// <summary>
    /// Get all users with optional filtering and pagination
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] UserSearchQuery query)
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        try
        {
            var (users, totalCount) = await _userManagementService.GetUsersAsync(query);

            return Ok(new
            {
                users,
                pagination = new
                {
                    page = query.Page,
                    pageSize = query.PageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)query.PageSize)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users");
            return StatusCode(500, new { message = "An error occurred while retrieving users" });
        }
    }

    /// <summary>
    /// Get user statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetUserStats()
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        try
        {
            var stats = await _userManagementService.GetUserStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user stats");
            return StatusCode(500, new { message = "An error occurred while retrieving user statistics" });
        }
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var user = await _userManagementService.CreateUserAsync(request);
            return CreatedAtAction(nameof(GetUsers), new { }, user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, new { message = "An error occurred while creating the user" });
        }
    }

    /// <summary>
    /// Update an existing user
    /// </summary>
    [HttpPut("{userId}")]
    public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] UpdateUserRequest request)
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Prevent admin from removing their own admin status
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (currentUserId == userId.ToString() && request.IsAdmin == false)
        {
            return BadRequest(new { message = "You cannot remove your own admin privileges" });
        }

        try
        {
            var user = await _userManagementService.UpdateUserAsync(userId, request);
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while updating the user" });
        }
    }

    /// <summary>
    /// Delete a user
    /// </summary>
    [HttpDelete("{userId}")]
    public async Task<IActionResult> DeleteUser(Guid userId)
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        // Prevent admin from deleting themselves
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (currentUserId == userId.ToString())
        {
            return BadRequest(new { message = "You cannot delete your own account" });
        }

        try
        {
            await _userManagementService.DeleteUserAsync(userId);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while deleting the user" });
        }
    }

    /// <summary>
    /// Reset a user's password
    /// </summary>
    [HttpPost("{userId}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid userId, [FromBody] ResetPasswordRequest request)
    {
        if (!IsAdmin())
        {
            return Forbid();
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _userManagementService.ResetUserPasswordAsync(userId, request.NewPassword);
            return Ok(new { message = "Password reset successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while resetting the password" });
        }
    }
}
