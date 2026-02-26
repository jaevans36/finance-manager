using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinanceApi.Features.Tasks.DTOs;
using FinanceApi.Features.Tasks.Services;
using System.Security.Claims;

namespace FinanceApi.Features.Tasks.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/tasks")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    /// <summary>
    /// Lists tasks. By default returns only root-level tasks (no parents). Pass rootOnly=false to include subtasks.
    /// </summary>
    [HttpGet]
    public async System.Threading.Tasks.Task<ActionResult<List<TaskDto>>> GetTasks(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? priority,
        [FromQuery] Guid? groupId,
        [FromQuery] bool? completed,
        [FromQuery] bool? rootOnly)
    {
        var userId = GetUserId();
        var tasks = await _taskService.GetTasksAsync(userId, startDate, endDate, priority, groupId, completed, rootOnly);
        return Ok(tasks);
    }

    /// <summary>
    /// Gets a single task by ID. Use ?includeSubtasks=true to include the full subtask tree.
    /// </summary>
    [HttpGet("{id}")]
    public async System.Threading.Tasks.Task<ActionResult<TaskDto>> GetTask(
        Guid id,
        [FromQuery] bool includeSubtasks = false)
    {
        var userId = GetUserId();
        var task = await _taskService.GetTaskByIdAsync(userId, id, includeSubtasks);

        if (task == null)
        {
            return NotFound(new { error = new { message = "Task not found" } });
        }

        return Ok(task);
    }

    [HttpPost]
    public async System.Threading.Tasks.Task<ActionResult<TaskDto>> CreateTask([FromBody] CreateTaskRequest request)
    {
        var userId = GetUserId();
        var task = await _taskService.CreateTaskAsync(userId, request);
        return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
    }

    [HttpPut("{id}")]
    public async System.Threading.Tasks.Task<ActionResult<TaskDto>> UpdateTask(Guid id, [FromBody] UpdateTaskRequest request)
    {
        try
        {
            var userId = GetUserId();
            var task = await _taskService.UpdateTaskAsync(userId, id, request);
            return Ok(task);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Task not found" } });
        }
    }

    [HttpDelete("{id}")]
    public async System.Threading.Tasks.Task<IActionResult> DeleteTask(Guid id)
    {
        try
        {
            var userId = GetUserId();
            await _taskService.DeleteTaskAsync(userId, id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Task not found" } });
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(userIdClaim!);
    }
}
