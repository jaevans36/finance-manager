using Microsoft.AspNetCore.Mvc;
using FinanceApi.Features.Common.PasswordReset.DTOs;
using FinanceApi.Features.Common.PasswordReset.Services;

namespace FinanceApi.Features.Common.PasswordReset.Controllers;

[ApiController]
[Route("api/v1/auth/password-reset")]
public class PasswordResetController : ControllerBase
{
    private readonly IPasswordResetService _passwordResetService;

    public PasswordResetController(IPasswordResetService passwordResetService)
    {
        _passwordResetService = passwordResetService;
    }

    [HttpPost("request")]
    public async System.Threading.Tasks.Task<IActionResult> RequestPasswordReset([FromBody] RequestPasswordResetRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
        
        await _passwordResetService.RequestPasswordResetAsync(request.Email, ipAddress, userAgent);
        return Ok(new { message = "If an account exists with this email, a password reset link has been sent." });
    }

    [HttpGet("verify/{token}")]
    public async System.Threading.Tasks.Task<ActionResult<VerifyResetTokenResponse>> VerifyResetToken(string token)
    {
        var response = await _passwordResetService.VerifyResetTokenAsync(token);
        return Ok(response);
    }

    [HttpPost("reset")]
    public async System.Threading.Tasks.Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
            
            await _passwordResetService.ResetPasswordAsync(request.Token, request.NewPassword, ipAddress, userAgent);
            return Ok(new { message = "Password reset successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
    }
}
