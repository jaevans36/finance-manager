using FinanceApi.Features.Notifications.Models;

namespace FinanceApi.Features.Notifications.DTOs;

public record NotificationDto(
    Guid Id,
    NotificationType Type,
    NotificationEntityType EntityType,
    Guid EntityId,
    string EntityTitle,
    UserSummaryDto FromUser,
    bool IsRead,
    DateTime CreatedAt
);

public record UserSummaryDto(Guid Id, string Username);
