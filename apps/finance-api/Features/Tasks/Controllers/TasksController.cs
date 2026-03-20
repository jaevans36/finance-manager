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
    private readonly IClassificationSuggestionService _classificationSuggestionService;
    private readonly ITaskPermissionService _taskPermissionService;

    public TasksController(ITaskService taskService, IClassificationSuggestionService classificationSuggestionService, ITaskPermissionService taskPermissionService)
    {
        _taskService = taskService;
        _classificationSuggestionService = classificationSuggestionService;
        _taskPermissionService = taskPermissionService;
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
        [FromQuery] bool? rootOnly,
        [FromQuery] string? status,
        [FromQuery] string? view,
        [FromQuery] Guid? labelId = null)
    {
        var userId = GetUserId();
        var tasks = await _taskService.GetTasksAsync(userId, startDate, endDate, priority, groupId, completed, rootOnly, status, view, labelId);
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
        if (request.ReminderAt.HasValue && !request.DueDate.HasValue)
            return BadRequest("ReminderAt requires a DueDate to be set.");

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

            if (request.ReminderAt.HasValue)
            {
                var existingTask = await _taskService.GetTaskByIdAsync(userId, id);
                var effectiveDueDate = request.DueDate ?? existingTask?.DueDate;
                if (!effectiveDueDate.HasValue)
                    return BadRequest("ReminderAt requires a DueDate to be set.");
            }

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

    /// <summary>
    /// Updates the status of a task (NotStarted, InProgress, Blocked, Completed).
    /// </summary>
    [HttpPatch("{id}/status")]
    public async System.Threading.Tasks.Task<ActionResult<TaskDto>> UpdateTaskStatus(
        Guid id,
        [FromBody] UpdateTaskStatusRequest request)
    {
        try
        {
            var userId = GetUserId();
            var task = await _taskService.UpdateTaskStatusAsync(userId, id, request);
            return Ok(task);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Task not found" } });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// Classify a task with urgency and importance levels for the Eisenhower Matrix.
    /// </summary>
    [HttpPatch("{id}/classify")]
    public async System.Threading.Tasks.Task<ActionResult<TaskDto>> ClassifyTask(
        Guid id,
        [FromBody] ClassifyTaskRequest request)
    {
        try
        {
            var userId = GetUserId();
            var task = await _taskService.ClassifyTaskAsync(userId, id, request);
            return Ok(task);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Task not found" } });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// Bulk classify multiple tasks with urgency and importance levels.
    /// </summary>
    [HttpPost("bulk-classify")]
    public async System.Threading.Tasks.Task<ActionResult<List<TaskDto>>> BulkClassifyTasks(
        [FromBody] BulkClassifyRequest request)
    {
        try
        {
            var userId = GetUserId();
            var tasks = await _taskService.BulkClassifyAsync(userId, request);
            return Ok(tasks);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// Get tasks grouped by Eisenhower Matrix quadrant.
    /// </summary>
    [HttpGet("matrix")]
    public async System.Threading.Tasks.Task<ActionResult<MatrixResponse>> GetMatrix(
        [FromQuery] Guid? groupId,
        [FromQuery] string? priority,
        [FromQuery] bool includeCompleted = false)
    {
        var userId = GetUserId();
        var matrix = await _taskService.GetMatrixAsync(userId, groupId, priority, includeCompleted);
        return Ok(matrix);
    }

    /// <summary>
    /// Get auto-classification suggestion for a single task based on priority and due date.
    /// </summary>
    [HttpGet("{id}/suggest-classification")]
    public async System.Threading.Tasks.Task<ActionResult<ClassificationSuggestionDto>> SuggestClassification(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var suggestion = await _classificationSuggestionService.SuggestClassificationAsync(userId, id);
            return Ok(suggestion);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Task not found" } });
        }
    }

    /// <summary>
    /// Preview auto-classification suggestions for all unclassified tasks.
    /// </summary>
    [HttpPost("auto-classify")]
    public async System.Threading.Tasks.Task<ActionResult<List<ClassificationSuggestionDto>>> PreviewAutoClassify()
    {
        var userId = GetUserId();
        var suggestions = await _classificationSuggestionService.PreviewAutoClassifyAsync(userId);
        return Ok(suggestions);
    }

    /// <summary>
    /// Set the energy level for a task (Low, Medium, High).
    /// </summary>
    [HttpPatch("{id}/energy")]
    public async System.Threading.Tasks.Task<ActionResult<TaskDto>> SetEnergy(
        Guid id,
        [FromBody] SetEnergyRequest request)
    {
        try
        {
            var userId = GetUserId();
            var task = await _taskService.SetEnergyAsync(userId, id, request);
            return Ok(task);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Task not found" } });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// Set the estimated duration for a task in minutes.
    /// </summary>
    [HttpPatch("{id}/estimate")]
    public async System.Threading.Tasks.Task<ActionResult<TaskDto>> SetEstimate(
        Guid id,
        [FromBody] SetEstimateRequest request)
    {
        try
        {
            var userId = GetUserId();
            var task = await _taskService.SetEstimateAsync(userId, id, request);
            return Ok(task);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Task not found" } });
        }
    }

    /// <summary>
    /// Bulk set energy level for multiple tasks.
    /// </summary>
    [HttpPost("bulk-energy")]
    public async System.Threading.Tasks.Task<ActionResult<List<TaskDto>>> BulkSetEnergy(
        [FromBody] BulkEnergyRequest request)
    {
        try
        {
            var userId = GetUserId();
            var tasks = await _taskService.BulkSetEnergyAsync(userId, request);
            return Ok(tasks);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// Get task suggestions filtered by energy level and available time.
    /// Returns up to 10 non-completed tasks matching the criteria, sorted by urgency, due date, and priority.
    /// </summary>
    [HttpGet("suggestions")]
    public async System.Threading.Tasks.Task<ActionResult<List<TaskDto>>> GetSuggestions(
        [FromQuery] string? energy,
        [FromQuery] int? maxMinutes)
    {
        var userId = GetUserId();
        var suggestions = await _taskService.GetSuggestionsAsync(userId, energy, maxMinutes);
        return Ok(suggestions);
    }

    /// <summary>
    /// Get energy level distribution statistics across all root tasks.
    /// </summary>
    [HttpGet("energy-distribution")]
    public async System.Threading.Tasks.Task<ActionResult<EnergyDistributionDto>> GetEnergyDistribution()
    {
        var userId = GetUserId();
        var distribution = await _taskService.GetEnergyDistributionAsync(userId);
        return Ok(distribution);
    }

    [HttpPatch("{id}/assign")]
    public async System.Threading.Tasks.Task<ActionResult<TaskDto>> AssignTask(Guid id, [FromBody] AssignTaskRequest request)
    {
        try
        {
            var userId = GetUserId();
            var task = await _taskService.AssignTaskAsync(userId, id, request.UsernameOrEmail);
            return Ok(task);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Task not found or you are not the owner." } });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
    }

    [HttpPatch("{id}/unassign")]
    public async System.Threading.Tasks.Task<ActionResult<TaskDto>> UnassignTask(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var task = await _taskService.UnassignTaskAsync(userId, id);
            return Ok(task);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = new { message = "Task not found or you are not the owner." } });
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(userIdClaim!);
    }
}
