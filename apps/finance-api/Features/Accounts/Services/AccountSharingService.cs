using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Accounts.Services;

public class AccountSharingService : IAccountSharingService
{
    private readonly FinanceDbContext _db;
    private readonly IActivityLogService _activityLog;

    public AccountSharingService(FinanceDbContext db, IActivityLogService activityLog)
    {
        _db = db;
        _activityLog = activityLog;
    }

    public async Task<AccountShareDto> ShareAccountAsync(Guid accountId, Guid ownerId, string usernameOrEmail, string? ipAddress = null, string? userAgent = null)
    {
        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == accountId)
            ?? throw new KeyNotFoundException("Account not found.");

        if (account.UserId != ownerId)
            throw new UnauthorizedAccessException("Only the account owner can share it.");

        var needle = usernameOrEmail.Trim().ToLowerInvariant();
        var recipient = await _db.LifeManagerUsers
            .FirstOrDefaultAsync(u => u.Email.ToLower() == needle || (u.Username != null && u.Username.ToLower() == needle))
            ?? throw new KeyNotFoundException("No Life Manager user found with that username or email.");

        if (recipient.Id == ownerId)
            throw new InvalidOperationException("You cannot share an account with yourself.");

        var existing = await _db.AccountShares.FirstOrDefaultAsync(s =>
            s.AccountId == accountId &&
            s.SharedWithUserId == recipient.Id &&
            (s.Status == AccountShareStatus.Pending || s.Status == AccountShareStatus.Accepted));

        if (existing is not null)
            throw new InvalidOperationException("This account is already shared with that user.");

        var share = new AccountShare
        {
            AccountId = accountId,
            SharedByUserId = ownerId,
            SharedWithUserId = recipient.Id,
            Status = AccountShareStatus.Pending
        };

        _db.AccountShares.Add(share);
        await _db.SaveChangesAsync();
        await _activityLog.LogAsync(ownerId, FinanceActivityType.AccountShared, $"Shared {account.Type} account with {MaskIdentifier(usernameOrEmail)}", ipAddress, userAgent);

        return await MapToDtoAsync(share, account);
    }

    public async Task<List<AccountShareDto>> GetSharesForAccountAsync(Guid accountId, Guid ownerId)
    {
        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == accountId)
            ?? throw new KeyNotFoundException("Account not found.");

        if (account.UserId != ownerId)
            throw new UnauthorizedAccessException("Only the account owner can view its shares.");

        var shares = await _db.AccountShares
            .Where(s => s.AccountId == accountId)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();

        var dtos = new List<AccountShareDto>();
        foreach (var share in shares) dtos.Add(await MapToDtoAsync(share, account));
        return dtos;
    }

    public async Task<List<AccountShareDto>> GetSharedByMeAsync(Guid ownerId)
    {
        var shares = await _db.AccountShares
            .Where(s => s.SharedByUserId == ownerId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var dtos = new List<AccountShareDto>();
        foreach (var share in shares)
        {
            var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == share.AccountId);
            if (account is not null) dtos.Add(await MapToDtoAsync(share, account));
        }
        return dtos;
    }

    public async Task<List<AccountShareDto>> GetSharedWithMeAsync(Guid userId)
    {
        var shares = await _db.AccountShares
            .Where(s => s.SharedWithUserId == userId && s.Status == AccountShareStatus.Accepted)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var dtos = new List<AccountShareDto>();
        foreach (var share in shares)
        {
            var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == share.AccountId);
            if (account is not null) dtos.Add(await MapToDtoAsync(share, account));
        }
        return dtos;
    }

    public async Task<List<AccountShareInvitationDto>> GetPendingInvitationsAsync(Guid userId)
    {
        var shares = await _db.AccountShares
            .Where(s => s.SharedWithUserId == userId && s.Status == AccountShareStatus.Pending)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var dtos = new List<AccountShareInvitationDto>();
        foreach (var share in shares)
        {
            var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == share.AccountId);
            if (account is null) continue;
            var sharer = await _db.LifeManagerUsers.FirstOrDefaultAsync(u => u.Id == share.SharedByUserId);
            dtos.Add(new AccountShareInvitationDto(
                share.Id, account.Id, account.Name, account.Type.ToString(),
                share.SharedByUserId, sharer?.Username ?? sharer?.Email, share.CreatedAt));
        }
        return dtos;
    }

    public async Task AcceptInvitationAsync(Guid shareId, Guid userId, string? ipAddress = null, string? userAgent = null)
    {
        var share = await _db.AccountShares.FirstOrDefaultAsync(s => s.Id == shareId && s.SharedWithUserId == userId)
            ?? throw new KeyNotFoundException("Invitation not found.");

        if (share.Status != AccountShareStatus.Pending)
            throw new InvalidOperationException("This invitation is no longer pending.");

        share.Status = AccountShareStatus.Accepted;
        share.RespondedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _activityLog.LogAsync(userId, FinanceActivityType.AccountShareAccepted, "Accepted an account share invitation", ipAddress, userAgent);
    }

    public async Task DeclineInvitationAsync(Guid shareId, Guid userId, string? ipAddress = null, string? userAgent = null)
    {
        var share = await _db.AccountShares.FirstOrDefaultAsync(s => s.Id == shareId && s.SharedWithUserId == userId)
            ?? throw new KeyNotFoundException("Invitation not found.");

        if (share.Status != AccountShareStatus.Pending)
            throw new InvalidOperationException("This invitation is no longer pending.");

        share.Status = AccountShareStatus.Declined;
        share.RespondedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _activityLog.LogAsync(userId, FinanceActivityType.AccountShareDeclined, "Declined an account share invitation", ipAddress, userAgent);
    }

    public async Task RevokeShareAsync(Guid accountId, Guid shareId, Guid ownerId, string? ipAddress = null, string? userAgent = null)
    {
        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == accountId)
            ?? throw new KeyNotFoundException("Account not found.");

        if (account.UserId != ownerId)
            throw new UnauthorizedAccessException("Only the account owner can revoke a share.");

        var share = await _db.AccountShares.FirstOrDefaultAsync(s => s.Id == shareId && s.AccountId == accountId)
            ?? throw new KeyNotFoundException("Share not found.");

        _db.AccountShares.Remove(share);
        await _db.SaveChangesAsync();
        await _activityLog.LogAsync(ownerId, FinanceActivityType.AccountShareRevoked, $"Revoked a share on the {account.Type} account", ipAddress, userAgent);
    }

    public async Task<HashSet<Guid>> GetVisibleAccountIdsAsync(Guid userId)
    {
        var owned = await _db.Accounts.Where(a => a.UserId == userId).Select(a => a.Id).ToListAsync();
        var shared = await _db.AccountShares
            .Where(s => s.SharedWithUserId == userId && s.Status == AccountShareStatus.Accepted)
            .Select(s => s.AccountId)
            .ToListAsync();

        return owned.Concat(shared).ToHashSet();
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private async Task<AccountShareDto> MapToDtoAsync(AccountShare share, Account account)
    {
        var sharedBy = await _db.LifeManagerUsers.FirstOrDefaultAsync(u => u.Id == share.SharedByUserId);
        var sharedWith = await _db.LifeManagerUsers.FirstOrDefaultAsync(u => u.Id == share.SharedWithUserId);

        return new AccountShareDto(
            share.Id, account.Id, account.Name,
            share.SharedByUserId, sharedBy?.Username ?? sharedBy?.Email,
            share.SharedWithUserId, sharedWith?.Username ?? sharedWith?.Email,
            share.Status, share.CreatedAt, share.RespondedAt);
    }

    /// <summary>Never log the full email/username a share was sent to — just enough to be useful
    /// in the activity log without turning it into a second address book. E.g. "j***@example.com".</summary>
    private static string MaskIdentifier(string identifier)
    {
        if (identifier.Length <= 2) return "***";
        return $"{identifier[0]}***{identifier[^1]}";
    }
}
