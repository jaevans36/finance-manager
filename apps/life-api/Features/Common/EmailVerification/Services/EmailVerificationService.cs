using LifeApi.Data;
using LifeApi.Features.Auth.Models;
using LifeApi.Features.Common.EmailVerification.Models;
using LifeApi.Features.Common.EmailVerification.DTOs;
using LifeApi.Features.Common.ActivityLogs.Services;
using LifeApi.Features.Common.ActivityLogs.Models;
using Microsoft.EntityFrameworkCore;

namespace LifeApi.Features.Common.EmailVerification.Services;

public interface IEmailVerificationService
{
    System.Threading.Tasks.Task VerifyEmailAsync(string token, string? ipAddress, string? userAgent);
    System.Threading.Tasks.Task ResendVerificationEmailAsync(string email);
}

public class EmailVerificationService : IEmailVerificationService
{
    private readonly FinanceDbContext _context;
    private readonly IActivityLogService _activityLogService;

    public EmailVerificationService(FinanceDbContext context, IActivityLogService activityLogService)
    {
        _context = context;
        _activityLogService = activityLogService;
    }

    public async System.Threading.Tasks.Task VerifyEmailAsync(string token, string? ipAddress, string? userAgent)
    {
        var emailToken = await _context.EmailTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token && t.Type == TokenType.EmailVerification);

        if (emailToken == null || emailToken.UsedAt.HasValue || emailToken.ExpiresAt < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Invalid or expired verification token");
        }

        // Mark email as verified
        emailToken.User.EmailVerified = true;
        emailToken.User.UpdatedAt = DateTime.UtcNow;

        // Mark token as used
        emailToken.UsedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(emailToken.UserId, ActivityType.EmailVerified, "Email verified", ipAddress, userAgent);
    }

    public async System.Threading.Tasks.Task ResendVerificationEmailAsync(string email)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user != null && !user.EmailVerified)
        {
            // Invalidate existing verification tokens
            var existingTokens = await _context.EmailTokens
                .Where(t => t.UserId == user.Id && t.Type == TokenType.EmailVerification)
                .ToListAsync();

            foreach (var existingToken in existingTokens)
            {
                existingToken.UsedAt = DateTime.UtcNow;
            }

            // Create new verification token
            var verificationToken = new EmailToken
            {
                UserId = user.Id,
                Token = Guid.NewGuid().ToString(),
                Type = TokenType.EmailVerification,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            };

            _context.EmailTokens.Add(verificationToken);
            await _context.SaveChangesAsync();

            // TODO: Send email with verification token
        }
    }
}
