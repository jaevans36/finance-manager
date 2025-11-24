namespace FinanceApi.DTOs.PasswordReset;

public class RequestPasswordResetRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class VerifyResetTokenResponse
{
    public bool Valid { get; set; }
    public string? Email { get; set; }
}
