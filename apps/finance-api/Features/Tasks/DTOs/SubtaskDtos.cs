using System.ComponentModel.DataAnnotations;

namespace FinanceApi.Features.Tasks.DTOs;

/// <summary>
/// Request to create a single subtask under a parent task.
/// </summary>
public class CreateSubtaskRequest
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [RegularExpression("^(Low|Medium|High|Critical)$", ErrorMessage = "Priority must be Low, Medium, High, or Critical")]
    public string? Priority { get; set; }

    public DateTime? DueDate { get; set; }
}

/// <summary>
/// Request to create multiple subtasks at once from a list of titles.
/// </summary>
public class BulkCreateSubtasksRequest
{
    [Required]
    [MinLength(1)]
    public List<string> Titles { get; set; } = new();
}

/// <summary>
/// Request to reorder subtasks under a parent task.
/// </summary>
public class ReorderSubtasksRequest
{
    [Required]
    [MinLength(1)]
    public List<Guid> OrderedIds { get; set; } = new();
}

/// <summary>
/// Request to move a subtask to a new parent. Set NewParentId to null to promote to root.
/// </summary>
public class MoveSubtaskRequest
{
    public Guid? NewParentId { get; set; }
}

/// <summary>
/// Progress statistics for subtasks of a given task.
/// </summary>
public class SubtaskProgressDto
{
    public int Total { get; set; }
    public int Completed { get; set; }
    public decimal Percentage { get; set; }
}
