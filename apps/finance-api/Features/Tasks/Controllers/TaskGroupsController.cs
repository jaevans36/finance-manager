using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinanceApi.Features.Tasks.Services;
using FinanceApi.Features.Tasks.DTOs;
using System.Security.Claims;

namespace FinanceApi.Features.Tasks.Controllers;

[ApiController]
[Route("api/v1/task-groups")]
[Authorize]
public class TaskGroupsController : ControllerBase
{
    private readonly TaskGroupService _taskGroupService;

    public TaskGroupsController(TaskGroupService taskGroupService)
    {
        _taskGroupService = taskGroupService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TaskGroupResponse>>> GetGroups()
    {
        try
        {
            var userId = GetUserId();
            var groups = await _taskGroupService.GetUserGroupsAsync(userId);
            return Ok(groups);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Unauthorized" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Server error. Please try again later.", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TaskGroupResponse>> GetGroup(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var group = await _taskGroupService.GetGroupByIdAsync(userId, id);

            if (group == null)
            {
                return NotFound(new { message = "Task group not found" });
            }

            return Ok(group);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Unauthorized" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Server error. Please try again later.", error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<TaskGroupResponse>> CreateGroup([FromBody] CreateTaskGroupRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var group = await _taskGroupService.CreateGroupAsync(userId, request);
            return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, group);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Unauthorized" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Server error. Please try again later.", error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TaskGroupResponse>> UpdateGroup(Guid id, [FromBody] UpdateTaskGroupRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var group = await _taskGroupService.UpdateGroupAsync(userId, id, request);

            if (group == null)
            {
                return NotFound(new { message = "Task group not found" });
            }

            return Ok(group);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Unauthorized" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Server error. Please try again later.", error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteGroup(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var deleted = await _taskGroupService.DeleteGroupAsync(userId, id);

            if (!deleted)
            {
                return NotFound(new { message = "Task group not found" });
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Unauthorized" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Server error. Please try again later.", error = ex.Message });
        }
    }

    // --- Sharing endpoints ---

    [HttpGet("{id}/shares")]
    public async Task<ActionResult<List<GroupShareResponse>>> GetShares(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var shares = await _taskGroupService.GetSharesAsync(id, userId);
            return Ok(shares);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Server error.", error = ex.Message });
        }
    }

    [HttpPost("{id}/shares")]
    public async Task<ActionResult<GroupShareResponse>> ShareGroup(Guid id, [FromBody] ShareGroupRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var userId = GetUserId();
            var share = await _taskGroupService.ShareGroupAsync(id, userId, request);
            return Ok(share);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Server error.", error = ex.Message });
        }
    }

    [HttpDelete("{id}/shares/{sharedUserId}")]
    public async Task<ActionResult> UnshareGroup(Guid id, Guid sharedUserId)
    {
        try
        {
            var userId = GetUserId();
            var removed = await _taskGroupService.UnshareGroupAsync(id, userId, sharedUserId);
            if (!removed) return NotFound(new { message = "Share not found" });
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Server error.", error = ex.Message });
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }
}
