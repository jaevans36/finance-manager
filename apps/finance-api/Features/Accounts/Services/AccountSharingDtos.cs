using FinanceApi.Features.Accounts.Models;

namespace FinanceApi.Features.Accounts.Services;

public record ShareAccountRequest(string UsernameOrEmail);

public record AccountShareDto(
    Guid Id,
    Guid AccountId,
    string AccountName,
    Guid SharedByUserId,
    string? SharedByUsername,
    Guid SharedWithUserId,
    string? SharedWithUsername,
    AccountShareStatus Status,
    DateTime CreatedAt,
    DateTime? RespondedAt
);

public record AccountShareInvitationDto(
    Guid ShareId,
    Guid AccountId,
    string AccountName,
    string AccountType,
    Guid SharedByUserId,
    string? SharedByUsername,
    DateTime CreatedAt
);
