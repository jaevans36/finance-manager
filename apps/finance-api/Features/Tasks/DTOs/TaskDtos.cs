using System.ComponentModel.DataAnnotations;

namespace FinanceApi.Features.Tasks.DTOs;

public class CreateTaskRequest
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [RegularExpression("^(Low|Medium|High|Critical)$", ErrorMessage = "Priority must be Low, Medium, High, or Critical")]
    public string? Priority { get; set; }

    public DateTime? DueDate { get; set; }

    public Guid? GroupId { get; set; }
}

public class UpdateTaskRequest
{
    [StringLength(200, MinimumLength = 1)]
    public string? Title { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [RegularExpression("^(Low|Medium|High|Critical)$", ErrorMessage = "Priority must be Low, Medium, High, or Critical")]
    public string? Priority { get; set; }

    public DateTime? DueDate { get; set; }

    public bool? Completed { get; set; }

    public Guid? GroupId { get; set; }
}

public class TaskDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Priority { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public bool Completed { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Guid? GroupId { get; set; }
    public string? GroupName { get; set; }
    public string? GroupColour { get; set; }
    public Guid? ParentTaskId { get; set; }
    public bool HasSubtasks { get; set; }
    public int SubtaskCount { get; set; }
    public int CompletedSubtaskCount { get; set; }
    public decimal ProgressPercentage { get; set; }
    public List<TaskDto>? Subtasks { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
