using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinanceApi.Features.Tasks.DTOs;
using FinanceApi.Features.Tasks.Services;
using System.Security.Claims;

namespace FinanceApi.Features.Tasks.Controllers;

/// <summary>
/// Manages hierarchical subtasks nested under a parent task.
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/tasks/{taskId}/subtasks")]
public class SubtasksController : ControllerBase
{
    private readonly ISubtaskService _subtaskService;

    public SubtasksController(ISubtaskService subtaskService)
    {
        _subtaskService = subtaskService;
    }

    /// <summary>
    /// Creates a subtask under the specified parent task.
    /// </summary>
    [HttpPost]
    public async System.Threading.Tasks.Task<ActionResult<TaskDto>> CreateSubtask(
        Guid taskId,
        [FromBody] CreateSubtaskRequest request)
    {
        try
        {
            var userId = GetUserId();
            var subtask = await _subtaskService.CreateSubtaskAsync(userId, taskId, request);
            return CreatedAtAction(nameof(GetSubtasks), new { taskId }, subtask);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Parent task not found" } });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// Lists subtasks of the specified parent task. Use ?includeNested=true for the full tree.
    /// </summary>
    [HttpGet]
    public async System.Threading.Tasks.Task<ActionResult<List<TaskDto>>> GetSubtasks(
        Guid taskId,
        [FromQuery] bool includeNested = false)
    {
        try
        {
            var userId = GetUserId();
            var subtasks = await _subtaskService.GetSubtasksAsync(userId, taskId, includeNested);
            return Ok(subtasks);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Parent task not found" } });
        }
    }

    /// <summary>
    /// Creates multiple subtasks at once from a list of titles.
    /// </summary>
    [HttpPost("bulk")]
    public async System.Threading.Tasks.Task<ActionResult<List<TaskDto>>> BulkCreateSubtasks(
        Guid taskId,
        [FromBody] BulkCreateSubtasksRequest request)
    {
        try
        {
            var userId = GetUserId();
            var subtasks = await _subtaskService.BulkCreateSubtasksAsync(userId, taskId, request.Titles);
            return CreatedAtAction(nameof(GetSubtasks), new { taskId }, subtasks);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Parent task not found" } });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// Reorders the direct subtasks of a parent task.
    /// </summary>
    [HttpPut("reorder")]
    public async System.Threading.Tasks.Task<IActionResult> ReorderSubtasks(
        Guid taskId,
        [FromBody] ReorderSubtasksRequest request)
    {
        try
        {
            var userId = GetUserId();
            await _subtaskService.ReorderSubtasksAsync(userId, taskId, request.OrderedIds);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Parent task not found" } });
        }
    }

    /// <summary>
    /// Moves a subtask to a new parent. Set newParentId to null to promote to a root task.
    /// </summary>
    [HttpPut("{subtaskId}/move")]
    public async System.Threading.Tasks.Task<ActionResult<TaskDto>> MoveSubtask(
        Guid taskId,
        Guid subtaskId,
        [FromBody] MoveSubtaskRequest request)
    {
        try
        {
            var userId = GetUserId();
            var moved = await _subtaskService.MoveSubtaskAsync(userId, subtaskId, request.NewParentId);
            return Ok(moved);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// Marks all direct subtasks of the parent task as completed.
    /// </summary>
    [HttpPut("bulk-complete")]
    public async System.Threading.Tasks.Task<IActionResult> BulkCompleteSubtasks(Guid taskId)
    {
        try
        {
            var userId = GetUserId();
            await _subtaskService.BulkCompleteSubtasksAsync(userId, taskId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Parent task not found" } });
        }
    }

    /// <summary>
    /// Returns completion progress statistics for the subtasks of a task.
    /// </summary>
    [HttpGet("progress")]
    public async System.Threading.Tasks.Task<ActionResult<SubtaskProgressDto>> GetProgress(Guid taskId)
    {
        try
        {
            var userId = GetUserId();
            var progress = await _subtaskService.GetProgressAsync(userId, taskId);
            return Ok(progress);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Task not found" } });
        }
    }

    /// <summary>
    /// Deletes a subtask. Use ?cascade=false to promote children instead of deleting them.
    /// </summary>
    [HttpDelete("{subtaskId}")]
    public async System.Threading.Tasks.Task<IActionResult> DeleteSubtask(
        Guid taskId,
        Guid subtaskId,
        [FromQuery] bool cascade = true)
    {
        try
        {
            var userId = GetUserId();
            await _subtaskService.DeleteSubtaskAsync(userId, subtaskId, cascade);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Subtask not found" } });
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(userIdClaim!);
    }
}
