using FinanceApi.Data;
using FinanceApi.Features.Auth.Models;
using FinanceApi.Features.Auth.DTOs;
using FinanceApi.Features.Common.Sessions.Models;
using FinanceApi.Features.Common.EmailVerification.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;
using FinanceApi.Features.Common.ActivityLogs.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Auth.Services;

public interface IAuthService
{
    System.Threading.Tasks.Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress, string? userAgent);
    System.Threading.Tasks.Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, string? userAgent);
    System.Threading.Tasks.Task LogoutAsync(Guid userId, string token);
    System.Threading.Tasks.Task<User?> GetUserByIdAsync(Guid userId);
}

public class AuthService : IAuthService
{
    private readonly FinanceDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IActivityLogService _activityLogService;

    public AuthService(
        FinanceDbContext context,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        IActivityLogService activityLogService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _activityLogService = activityLogService;
    }

    public async System.Threading.Tasks.Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress, string? userAgent)
    {
        // Check if email already exists
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            throw new InvalidOperationException("Email already registered");
        }

        // Check if username already exists (case-insensitive)
        var usernameLower = request.Username.ToLower();
        if (await _context.Users.AnyAsync(u => u.Username.ToLower() == usernameLower))
        {
            throw new InvalidOperationException("Username already taken");
        }

        // Create user
        var user = new User
        {
            Email = request.Email,
            Username = usernameLower, // Store username in lowercase
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);

        // Create email verification token
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

        // Log activity
        await _activityLogService.LogAsync(user.Id, ActivityType.Login, "User registered", ipAddress, userAgent);

        // Generate JWT token
        var jwtToken = _tokenService.GenerateAccessToken(user.Id, user.Email, user.IsAdmin);

        // Create session
        var session = new Session
        {
            UserId = user.Id,
            Token = jwtToken,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow,
            LastActiveAt = DateTime.UtcNow
        };

        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        return new AuthResponse
        {
            Token = jwtToken,
            User = MapToUserDto(user)
        };
    }

    public async System.Threading.Tasks.Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, string? userAgent)
    {
        // Check if input is email or username
        var isEmail = request.EmailOrUsername.Contains('@');
        var usernameLower = request.EmailOrUsername.ToLower();
        
        var user = isEmail 
            ? await _context.Users.FirstOrDefaultAsync(u => u.Email == request.EmailOrUsername)
            : await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == usernameLower);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            // Log failed attempt if user exists
            if (user != null)
            {
                user.FailedLoginAttempts++;
                if (user.FailedLoginAttempts >= 5)
                {
                    user.AccountLockedUntil = DateTime.UtcNow.AddMinutes(30);
                    await _activityLogService.LogAsync(user.Id, ActivityType.AccountLocked, "Account locked due to multiple failed login attempts", ipAddress, userAgent);
                }
                await _context.SaveChangesAsync();
            }

            throw new UnauthorizedAccessException("Invalid credentials");
        }

        // Check if account is locked
        if (user.AccountLockedUntil.HasValue && user.AccountLockedUntil.Value > DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException($"Account is locked until {user.AccountLockedUntil.Value}");
        }

        // Reset failed attempts
        user.FailedLoginAttempts = 0;
        user.AccountLockedUntil = null;
        user.LastLoginAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        // Generate JWT token
        var jwtToken = _tokenService.GenerateAccessToken(user.Id, user.Email, user.IsAdmin);

        // Create session
        var session = new Session
        {
            UserId = user.Id,
            Token = jwtToken,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow,
            LastActiveAt = DateTime.UtcNow
        };

        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        // Log activity
        await _activityLogService.LogAsync(user.Id, ActivityType.Login, "User logged in", ipAddress, userAgent);

        return new AuthResponse
        {
            Token = jwtToken,
            User = MapToUserDto(user)
        };
    }

    public async System.Threading.Tasks.Task LogoutAsync(Guid userId, string token)
    {
        var session = await _context.Sessions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Token == token);

        if (session != null)
        {
            _context.Sessions.Remove(session);
            await _context.SaveChangesAsync();
        }

        await _activityLogService.LogAsync(userId, ActivityType.Logout, "User logged out", null, null);
    }

    public async System.Threading.Tasks.Task<User?> GetUserByIdAsync(Guid userId)
    {
        return await _context.Users.FindAsync(userId);
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            EmailVerified = user.EmailVerified,
            IsAdmin = user.IsAdmin,
            CreatedAt = user.CreatedAt
        };
    }
}
