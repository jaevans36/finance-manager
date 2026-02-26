using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Auth.Models;
using FinanceApi.Features.Admin.DTOs;
using FinanceApi.Features.Common.ActivityLogs.Services;

namespace FinanceApi.Features.Admin.Services;

public class UserManagementService : IUserManagementService
{
    private readonly FinanceDbContext _context;
    private readonly IActivityLogService _activityLogService;
    private readonly ILogger<UserManagementService> _logger;

    public UserManagementService(
        FinanceDbContext context,
        IActivityLogService activityLogService,
        ILogger<UserManagementService> logger)
    {
        _context = context;
        _activityLogService = activityLogService;
        _logger = logger;
    }

    public async Task<(List<UserListItemDto> Users, int TotalCount)> GetUsersAsync(UserSearchQuery query)
    {
        var usersQuery = _context.Users.AsQueryable();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            var searchLower = query.SearchTerm.ToLower();
            usersQuery = usersQuery.Where(u =>
                u.Email.ToLower().Contains(searchLower) ||
                u.Username.ToLower().Contains(searchLower));
        }

        // Apply admin filter
        if (query.IsAdmin.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.IsAdmin == query.IsAdmin.Value);
        }

        // Apply email verification filter
        if (query.EmailVerified.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.EmailVerified == query.EmailVerified.Value);
        }

        // Get total count before pagination
        var totalCount = await usersQuery.CountAsync();

        // Apply sorting
        usersQuery = query.SortBy?.ToLower() switch
        {
            "email" => query.SortDirection?.ToLower() == "asc"
                ? usersQuery.OrderBy(u => u.Email)
                : usersQuery.OrderByDescending(u => u.Email),
            "username" => query.SortDirection?.ToLower() == "asc"
                ? usersQuery.OrderBy(u => u.Username)
                : usersQuery.OrderByDescending(u => u.Username),
            "lastloginat" => query.SortDirection?.ToLower() == "asc"
                ? usersQuery.OrderBy(u => u.LastLoginAt)
                : usersQuery.OrderByDescending(u => u.LastLoginAt),
            _ => query.SortDirection?.ToLower() == "asc"
                ? usersQuery.OrderBy(u => u.CreatedAt)
                : usersQuery.OrderByDescending(u => u.CreatedAt)
        };

        // Apply pagination
        var users = await usersQuery
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Include(u => u.Tasks)
            .Include(u => u.TaskGroups)
            .ToListAsync();

        // Map to DTOs
        var userDtos = users.Select(u => new UserListItemDto
        {
            Id = u.Id,
            Email = u.Email,
            Username = u.Username,
            IsAdmin = u.IsAdmin,
            EmailVerified = u.EmailVerified,
            CreatedAt = u.CreatedAt,
            LastLoginAt = u.LastLoginAt,
            TaskCount = u.Tasks.Count,
            EventCount = 0 // TODO: Add events count when Events feature is fully integrated
        }).ToList();

        return (userDtos, totalCount);
    }

    public async Task<UserStatsDto> GetUserStatsAsync()
    {
        var totalUsers = await _context.Users.CountAsync();
        var adminUsers = await _context.Users.CountAsync(u => u.IsAdmin);
        var verifiedUsers = await _context.Users.CountAsync(u => u.EmailVerified);
        var unverifiedUsers = totalUsers - verifiedUsers;

        return new UserStatsDto
        {
            TotalUsers = totalUsers,
            AdminUsers = adminUsers,
            VerifiedUsers = verifiedUsers,
            UnverifiedUsers = unverifiedUsers
        };
    }

    public async Task<UserListItemDto> CreateUserAsync(CreateUserRequest request)
    {
        // Check if email already exists
        var existingEmail = await _context.Users.AnyAsync(u => u.Email == request.Email);
        if (existingEmail)
        {
            throw new InvalidOperationException("A user with this email already exists");
        }

        // Check if username already exists
        var existingUsername = await _context.Users.AnyAsync(u => u.Username == request.Username);
        if (existingUsername)
        {
            throw new InvalidOperationException("A user with this username already exists");
        }

        // Hash the password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = new User
        {
            Email = request.Email,
            Username = request.Username,
            PasswordHash = passwordHash,
            IsAdmin = request.IsAdmin,
            EmailVerified = request.EmailVerified,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {Username} created by admin", user.Username);

        return new UserListItemDto
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            IsAdmin = user.IsAdmin,
            EmailVerified = user.EmailVerified,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            TaskCount = 0,
            EventCount = 0
        };
    }

    public async Task<UserListItemDto> UpdateUserAsync(Guid userId, UpdateUserRequest request)
    {
        var user = await _context.Users
            .Include(u => u.Tasks)
            .Include(u => u.TaskGroups)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        var changes = new List<string>();

        // Update email if provided
        if (!string.IsNullOrWhiteSpace(request.Email) && request.Email != user.Email)
        {
            var existingEmail = await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != userId);
            if (existingEmail)
            {
                throw new InvalidOperationException("A user with this email already exists");
            }
            user.Email = request.Email;
            changes.Add($"email changed to {request.Email}");
        }

        // Update username if provided
        if (!string.IsNullOrWhiteSpace(request.Username) && request.Username != user.Username)
        {
            var existingUsername = await _context.Users.AnyAsync(u => u.Username == request.Username && u.Id != userId);
            if (existingUsername)
            {
                throw new InvalidOperationException("A user with this username already exists");
            }
            user.Username = request.Username;
            changes.Add($"username changed to {request.Username}");
        }

        // Update admin status if provided
        if (request.IsAdmin.HasValue && request.IsAdmin.Value != user.IsAdmin)
        {
            user.IsAdmin = request.IsAdmin.Value;
            changes.Add(request.IsAdmin.Value ? "promoted to admin" : "removed as admin");
        }

        // Update email verification if provided
        if (request.EmailVerified.HasValue && request.EmailVerified.Value != user.EmailVerified)
        {
            user.EmailVerified = request.EmailVerified.Value;
            changes.Add(request.EmailVerified.Value ? "email verified" : "email unverified");
        }

        if (changes.Any())
        {
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            _logger.LogInformation("User {Username} updated by admin: {Changes}", user.Username, string.Join(", ", changes));
        }

        return new UserListItemDto
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            IsAdmin = user.IsAdmin,
            EmailVerified = user.EmailVerified,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            TaskCount = user.Tasks.Count,
            EventCount = 0
        };
    }

    public async Task DeleteUserAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        _logger.LogWarning("User {Username} (ID: {UserId}) deleted by admin", user.Username, userId);

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
    }

    public async Task ResetUserPasswordAsync(Guid userId, string newPassword)
    {
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        user.FailedLoginAttempts = 0;
        user.AccountLockedUntil = null;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Password reset for user {Username} by admin", user.Username);
    }
}
