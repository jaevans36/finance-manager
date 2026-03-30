using System.ComponentModel.DataAnnotations;

namespace LifeApi.Features.Admin.DTOs;

public record UserListItemDto
{
    public required Guid Id { get; init; }
    public required string Email { get; init; }
    public required string Username { get; init; }
    public required bool IsAdmin { get; init; }
    public required bool EmailVerified { get; init; }
    public required DateTime CreatedAt { get; init; }
    public DateTime? LastLoginAt { get; init; }
    public required int TaskCount { get; init; }
    public required int EventCount { get; init; }
}

public record UserStatsDto
{
    public required int TotalUsers { get; init; }
    public required int AdminUsers { get; init; }
    public required int VerifiedUsers { get; init; }
    public required int UnverifiedUsers { get; init; }
}

public record CreateUserRequest
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(255)]
    public required string Email { get; init; }

    [Required(ErrorMessage = "Username is required")]
    [MinLength(3, ErrorMessage = "Username must be at least 3 characters")]
    [MaxLength(20, ErrorMessage = "Username must not exceed 20 characters")]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username can only contain letters, numbers and underscores")]
    public required string Username { get; init; }

    [Required(ErrorMessage = "Password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    public required string Password { get; init; }

    public bool IsAdmin { get; init; } = false;
    public bool EmailVerified { get; init; } = false;
}

public record UpdateUserRequest
{
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(255)]
    public string? Email { get; init; }

    [MinLength(3, ErrorMessage = "Username must be at least 3 characters")]
    [MaxLength(20, ErrorMessage = "Username must not exceed 20 characters")]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username can only contain letters, numbers and underscores")]
    public string? Username { get; init; }

    public bool? IsAdmin { get; init; }
    public bool? EmailVerified { get; init; }
}

public record ResetPasswordRequest
{
    [Required(ErrorMessage = "New password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    public required string NewPassword { get; init; }
}

public record UserSearchQuery
{
    public string? SearchTerm { get; init; }
    public bool? IsAdmin { get; init; }
    public bool? EmailVerified { get; init; }
    public string? SortBy { get; init; } = "CreatedAt";
    public string? SortDirection { get; init; } = "desc";
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 50;
}
