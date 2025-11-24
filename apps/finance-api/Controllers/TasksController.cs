using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinanceApi.DTOs.Tasks;
using FinanceApi.Services;
using System.Security.Claims;

namespace FinanceApi.Controllers;

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

    [HttpGet]
    public async System.Threading.Tasks.Task<ActionResult<List<TaskDto>>> GetTasks()
    {
        var userId = GetUserId();
        var tasks = await _taskService.GetTasksAsync(userId);
        return Ok(tasks);
    }

    [HttpGet("{id}")]
    public async System.Threading.Tasks.Task<ActionResult<TaskDto>> GetTask(Guid id)
    {
        var userId = GetUserId();
        var task = await _taskService.GetTaskByIdAsync(userId, id);

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
