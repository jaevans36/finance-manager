using System.ComponentModel.DataAnnotations;

namespace FinanceApi.Features.Tasks.DTOs;

public record CreateTaskGroupRequest
{
    [Required(ErrorMessage = "Name is required")]
    [MaxLength(100, ErrorMessage = "Name must not exceed 100 characters")]
    public string Name { get; init; } = string.Empty;

    [MaxLength(500, ErrorMessage = "Description must not exceed 500 characters")]
    public string? Description { get; init; }

    [RegularExpression("^#[0-9A-Fa-f]{6}$", ErrorMessage = "Colour must be a valid hex colour code (e.g., #3B82F6)")]
    public string? Colour { get; init; }

    [MaxLength(50, ErrorMessage = "Icon must not exceed 50 characters")]
    public string? Icon { get; init; }
}

public record UpdateTaskGroupRequest
{
    [MaxLength(100, ErrorMessage = "Name must not exceed 100 characters")]
    public string? Name { get; init; }

    [MaxLength(500, ErrorMessage = "Description must not exceed 500 characters")]
    public string? Description { get; init; }

    [RegularExpression("^#[0-9A-Fa-f]{6}$", ErrorMessage = "Colour must be a valid hex colour code (e.g., #3B82F6)")]
    public string? Colour { get; init; }

    [MaxLength(50, ErrorMessage = "Icon must not exceed 50 characters")]
    public string? Icon { get; init; }
}

public record TaskGroupResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string Colour { get; init; } = "#3B82F6";
    public string? Icon { get; init; }
    public bool IsDefault { get; init; }
    public int TaskCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
