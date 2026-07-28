using System.ComponentModel.DataAnnotations;

namespace LifeApi.Features.Dev.Models;

public class DevPasswordResetRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
    [RegularExpression(
        @"^(?=.*[A-Z])(?=.*\d).+$",
        ErrorMessage = "Password must contain at least one uppercase letter and one digit.")]
    public string NewPassword { get; set; } = string.Empty;
}
