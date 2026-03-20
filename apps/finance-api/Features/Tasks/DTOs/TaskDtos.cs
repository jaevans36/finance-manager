using System.ComponentModel.DataAnnotations;
using FinanceApi.Features.Labels.DTOs;

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

    [RegularExpression("^(Low|Medium|High)$", ErrorMessage = "EnergyLevel must be Low, Medium, or High")]
    public string? EnergyLevel { get; set; }

    [Range(1, 480, ErrorMessage = "EstimatedMinutes must be between 1 and 480")]
    public int? EstimatedMinutes { get; set; }

    public DateTime? ReminderAt { get; set; }
    public List<Guid>? LabelIds { get; set; }
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

    [RegularExpression("^(Low|Medium|High)$", ErrorMessage = "EnergyLevel must be Low, Medium, or High")]
    public string? EnergyLevel { get; set; }

    [Range(1, 480, ErrorMessage = "EstimatedMinutes must be between 1 and 480")]
    public int? EstimatedMinutes { get; set; }

    public DateTime? ReminderAt { get; set; }
    public bool ClearReminderAt { get; set; } = false;
    public List<Guid>? LabelIds { get; set; }
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
    public string Status { get; set; } = "NotStarted";
    public DateTime? StartedAt { get; set; }
    public string? BlockedReason { get; set; }
    public string? Urgency { get; set; }
    public string? Importance { get; set; }
    public string? Quadrant { get; set; }
    public string? EnergyLevel { get; set; }
    public int? EstimatedMinutes { get; set; }
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
    public bool IsOwner { get; init; }
    public AssignmentUserDto? AssignedTo { get; init; }
    public AssignmentUserDto? AssignedBy { get; init; }
    public DateTime? ReminderAt { get; set; }
    public List<LabelDto> Labels { get; set; } = new();
}

public record AssignmentUserDto(Guid Id, string Username);

public class UpdateTaskStatusRequest
{
    [Required]
    [RegularExpression("^(NotStarted|InProgress|Blocked|Completed)$",
        ErrorMessage = "Status must be NotStarted, InProgress, Blocked, or Completed")]
    public string Status { get; set; } = string.Empty;

    [StringLength(500)]
    public string? BlockedReason { get; set; }
}

public class ClassifyTaskRequest
{
    [RegularExpression("^(Low|Medium|High)$", ErrorMessage = "Urgency must be Low, Medium, or High")]
    public string? Urgency { get; set; }

    [RegularExpression("^(Low|Medium|High)$", ErrorMessage = "Importance must be Low, Medium, or High")]
    public string? Importance { get; set; }
}

public class BulkClassifyRequest
{
    [Required]
    public List<BulkClassifyItem> Items { get; set; } = new();
}

public class BulkClassifyItem
{
    [Required]
    public Guid TaskId { get; set; }

    [RegularExpression("^(Low|Medium|High)$", ErrorMessage = "Urgency must be Low, Medium, or High")]
    public string? Urgency { get; set; }

    [RegularExpression("^(Low|Medium|High)$", ErrorMessage = "Importance must be Low, Medium, or High")]
    public string? Importance { get; set; }
}

public class MatrixResponse
{
    public List<TaskDto> Q1DoFirst { get; set; } = new();
    public List<TaskDto> Q2Schedule { get; set; } = new();
    public List<TaskDto> Q3Delegate { get; set; } = new();
    public List<TaskDto> Q4Eliminate { get; set; } = new();
    public List<TaskDto> Unclassified { get; set; } = new();
}

public class ClassificationSuggestionDto
{
    public Guid TaskId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? SuggestedUrgency { get; set; }
    public string? SuggestedImportance { get; set; }
    public string? SuggestedQuadrant { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? CurrentUrgency { get; set; }
    public string? CurrentImportance { get; set; }
}

public class SetEnergyRequest
{
    [Required]
    [RegularExpression("^(Low|Medium|High)$", ErrorMessage = "EnergyLevel must be Low, Medium, or High")]
    public string EnergyLevel { get; set; } = string.Empty;
}

public class SetEstimateRequest
{
    [Required]
    [Range(1, 480, ErrorMessage = "EstimatedMinutes must be between 1 and 480")]
    public int EstimatedMinutes { get; set; }
}

public class BulkEnergyRequest
{
    [Required]
    public List<BulkEnergyItem> Items { get; set; } = new();
}

public class BulkEnergyItem
{
    [Required]
    public Guid TaskId { get; set; }

    [Required]
    [RegularExpression("^(Low|Medium|High)$", ErrorMessage = "EnergyLevel must be Low, Medium, or High")]
    public string EnergyLevel { get; set; } = string.Empty;
}

public class SuggestionQueryParams
{
    [RegularExpression("^(Low|Medium|High)$", ErrorMessage = "Energy must be Low, Medium, or High")]
    public string? Energy { get; set; }

    [Range(1, 480)]
    public int? MaxMinutes { get; set; }
}

public class EnergyDistributionDto
{
    public int HighEnergyCount { get; set; }
    public int MediumEnergyCount { get; set; }
    public int LowEnergyCount { get; set; }
    public int UntaggedCount { get; set; }
    public decimal HighEnergyCompletionRate { get; set; }
    public decimal MediumEnergyCompletionRate { get; set; }
    public decimal LowEnergyCompletionRate { get; set; }
}

public record AssignTaskRequest(string UsernameOrEmail);
