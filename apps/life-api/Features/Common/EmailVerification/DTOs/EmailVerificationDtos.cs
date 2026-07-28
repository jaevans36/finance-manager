using System.ComponentModel.DataAnnotations;

namespace LifeApi.Features.Common.EmailVerification.DTOs;

public class VerifyEmailRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;
}

public class ResendVerificationRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
