using FinanceApi.Data;
using FinanceApi.DTOs.PasswordReset;
using FinanceApi.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Services;

public interface IPasswordResetService
{
    System.Threading.Tasks.Task RequestPasswordResetAsync(string email, string? ipAddress, string? userAgent);
    System.Threading.Tasks.Task<VerifyResetTokenResponse> VerifyResetTokenAsync(string token);
    System.Threading.Tasks.Task ResetPasswordAsync(string token, string newPassword, string? ipAddress, string? userAgent);
}

public class PasswordResetService : IPasswordResetService
{
    private readonly FinanceDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IActivityLogService _activityLogService;

    public PasswordResetService(
        FinanceDbContext context,
        IPasswordHasher passwordHasher,
        IActivityLogService activityLogService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _activityLogService = activityLogService;
    }

    public async System.Threading.Tasks.Task RequestPasswordResetAsync(string email, string? ipAddress, string? userAgent)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user != null)
        {
            // Invalidate any existing password reset tokens
            var existingTokens = await _context.EmailTokens
                .Where(t => t.UserId == user.Id && t.Type == TokenType.PasswordReset)
                .ToListAsync();

            foreach (var existingToken in existingTokens)
            {
                existingToken.UsedAt = DateTime.UtcNow;
            }

            // Create new reset token
            var resetToken = new EmailToken
            {
                UserId = user.Id,
                Token = Guid.NewGuid().ToString(),
                Type = TokenType.PasswordReset,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                CreatedAt = DateTime.UtcNow
            };

            _context.EmailTokens.Add(resetToken);
            await _context.SaveChangesAsync();

            await _activityLogService.LogAsync(user.Id, ActivityType.PasswordResetRequest, "Password reset requested", ipAddress, userAgent);

            // TODO: Send email with reset token
        }
    }

    public async System.Threading.Tasks.Task<VerifyResetTokenResponse> VerifyResetTokenAsync(string token)
    {
        var emailToken = await _context.EmailTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token && t.Type == TokenType.PasswordReset);

        if (emailToken == null || emailToken.UsedAt.HasValue || emailToken.ExpiresAt < DateTime.UtcNow)
        {
            return new VerifyResetTokenResponse { Valid = false };
        }

        return new VerifyResetTokenResponse
        {
            Valid = true,
            Email = emailToken.User.Email
        };
    }

    public async System.Threading.Tasks.Task ResetPasswordAsync(string token, string newPassword, string? ipAddress, string? userAgent)
    {
        var emailToken = await _context.EmailTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token && t.Type == TokenType.PasswordReset);

        if (emailToken == null || emailToken.UsedAt.HasValue || emailToken.ExpiresAt < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Invalid or expired reset token");
        }

        // Update password
        emailToken.User.PasswordHash = _passwordHasher.HashPassword(newPassword);
        emailToken.User.UpdatedAt = DateTime.UtcNow;

        // Mark token as used
        emailToken.UsedAt = DateTime.UtcNow;

        // Invalidate all sessions
        var sessions = await _context.Sessions
            .Where(s => s.UserId == emailToken.UserId)
            .ToListAsync();
        _context.Sessions.RemoveRange(sessions);

        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(emailToken.UserId, ActivityType.PasswordResetComplete, "Password reset completed", ipAddress, userAgent);
    }
}
