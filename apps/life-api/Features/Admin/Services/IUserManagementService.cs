using LifeApi.Features.Admin.DTOs;

namespace LifeApi.Features.Admin.Services;

public interface IUserManagementService
{
    Task<(List<UserListItemDto> Users, int TotalCount)> GetUsersAsync(UserSearchQuery query);
    Task<UserStatsDto> GetUserStatsAsync();
    Task<UserListItemDto> CreateUserAsync(CreateUserRequest request);
    Task<UserListItemDto> UpdateUserAsync(Guid userId, UpdateUserRequest request);
    Task DeleteUserAsync(Guid userId);
    Task ResetUserPasswordAsync(Guid userId, string newPassword);
}
