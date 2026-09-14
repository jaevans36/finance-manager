namespace FinanceApi.Features.Accounts.Services;

/// <summary>
/// Manages account sharing: invite, accept, decline, revoke, and the visibility set every other
/// finance-api read/write path should use instead of a raw `UserId == callerId` filter.
/// </summary>
public interface IAccountSharingService
{
    /// <summary>Invite another Life Manager user to share an account. Caller must own the account.</summary>
    Task<AccountShareDto> ShareAccountAsync(Guid accountId, Guid ownerId, string usernameOrEmail, string? ipAddress = null, string? userAgent = null);

    /// <summary>All shares (any status) for one account. Caller must own the account.</summary>
    Task<List<AccountShareDto>> GetSharesForAccountAsync(Guid accountId, Guid ownerId);

    /// <summary>All shares (any status) the caller has created, across every account they own.</summary>
    Task<List<AccountShareDto>> GetSharedByMeAsync(Guid ownerId);

    /// <summary>Accounts shared with the caller that they've accepted.</summary>
    Task<List<AccountShareDto>> GetSharedWithMeAsync(Guid userId);

    /// <summary>Pending invitations addressed to the caller.</summary>
    Task<List<AccountShareInvitationDto>> GetPendingInvitationsAsync(Guid userId);

    /// <summary>Accept a pending invitation. Only the invited recipient may call this.</summary>
    Task AcceptInvitationAsync(Guid shareId, Guid userId, string? ipAddress = null, string? userAgent = null);

    /// <summary>Decline a pending invitation. Only the invited recipient may call this.</summary>
    Task DeclineInvitationAsync(Guid shareId, Guid userId, string? ipAddress = null, string? userAgent = null);

    /// <summary>Revoke a share. Only the account owner may call this (no delegation).</summary>
    Task RevokeShareAsync(Guid accountId, Guid shareId, Guid ownerId, string? ipAddress = null, string? userAgent = null);

    /// <summary>Every account id the given user can read/write: their own, plus any they've accepted a share for.</summary>
    Task<HashSet<Guid>> GetVisibleAccountIdsAsync(Guid userId);
}
