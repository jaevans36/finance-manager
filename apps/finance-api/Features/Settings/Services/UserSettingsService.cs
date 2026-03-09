using FinanceApi.Data;
using FinanceApi.Features.Settings.DTOs;
using FinanceApi.Features.Settings.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Settings.Services;

public interface IUserSettingsService
{
    System.Threading.Tasks.Task<UserSettingsDto> GetSettingsAsync(Guid userId);
    System.Threading.Tasks.Task<UserSettingsDto> UpdateSettingsAsync(Guid userId, UpdateUserSettingsRequest request);
}

public class UserSettingsService : IUserSettingsService
{
    private readonly FinanceDbContext _context;

    public UserSettingsService(FinanceDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task<UserSettingsDto> GetSettingsAsync(Guid userId)
    {
        var settings = await GetOrCreateSettingsAsync(userId);
        return MapToDto(settings);
    }

    public async System.Threading.Tasks.Task<UserSettingsDto> UpdateSettingsAsync(Guid userId, UpdateUserSettingsRequest request)
    {
        var settings = await GetOrCreateSettingsAsync(userId);

        if (request.GlobalWipLimit.HasValue)
        {
            settings.GlobalWipLimit = request.GlobalWipLimit.Value;
        }

        if (request.DefaultTaskStatus != null)
        {
            settings.DefaultTaskStatus = request.DefaultTaskStatus;
        }

        if (request.EnableWipWarnings.HasValue)
        {
            settings.EnableWipWarnings = request.EnableWipWarnings.Value;
        }

        settings.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapToDto(settings);
    }

    private async System.Threading.Tasks.Task<UserSettings> GetOrCreateSettingsAsync(Guid userId)
    {
        var settings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            settings = new UserSettings
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            _context.UserSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        return settings;
    }

    private static UserSettingsDto MapToDto(UserSettings settings)
    {
        return new UserSettingsDto
        {
            Id = settings.Id,
            GlobalWipLimit = settings.GlobalWipLimit,
            DefaultTaskStatus = settings.DefaultTaskStatus,
            EnableWipWarnings = settings.EnableWipWarnings,
            CreatedAt = settings.CreatedAt,
            UpdatedAt = settings.UpdatedAt,
        };
    }
}
