using Microsoft.AspNetCore.Mvc;
using FinanceApi.DTOs.EmailVerification;
using FinanceApi.Services;

namespace FinanceApi.Controllers;

[ApiController]
[Route("api/v1/auth/email-verification")]
public class EmailVerificationController : ControllerBase
{
    private readonly IEmailVerificationService _emailVerificationService;

    public EmailVerificationController(IEmailVerificationService emailVerificationService)
    {
        _emailVerificationService = emailVerificationService;
    }

    [HttpPost("verify")]
    public async System.Threading.Tasks.Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
            
            await _emailVerificationService.VerifyEmailAsync(request.Token, ipAddress, userAgent);
            return Ok(new { message = "Email verified successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
    }

    [HttpPost("resend")]
    public async System.Threading.Tasks.Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
    {
        await _emailVerificationService.ResendVerificationEmailAsync(request.Email);
        return Ok(new { message = "If an account exists with this email and is not verified, a verification email has been sent." });
    }
}
