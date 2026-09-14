using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Accounts.Services;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;
using FinanceApi.Features.Common.Users.Models;

namespace FinanceApi.UnitTests.Features.Accounts.Services;

public class AccountSharingServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly AccountSharingService _sut;
    private readonly Guid _ownerId = Guid.NewGuid();
    private readonly Guid _recipientId = Guid.NewGuid();

    public AccountSharingServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options, FinanceApi.UnitTests.TestHelpers.TestEncryption.Service);
        _sut = new AccountSharingService(_db, new ActivityLogService(_db));

        _db.LifeManagerUsers.Add(new LifeManagerUser { Id = _ownerId, Email = "jay@example.test", Username = "jay" });
        _db.LifeManagerUsers.Add(new LifeManagerUser { Id = _recipientId, Email = "jade@example.test", Username = "jade" });
        _db.SaveChanges();
    }

    public void Dispose() => _db.Dispose();

    private Account AddAccount(Guid ownerId, string name = "Joint Account")
    {
        var account = new Account { UserId = ownerId, Name = name, Type = AccountType.Checking, Currency = "GBP" };
        _db.Accounts.Add(account);
        _db.SaveChanges();
        return account;
    }

    // ── ShareAccountAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task ShareAccountAsync_ByUsername_CreatesAPendingShare()
    {
        var account = AddAccount(_ownerId);

        var share = await _sut.ShareAccountAsync(account.Id, _ownerId, "jade");

        share.Status.Should().Be(AccountShareStatus.Pending);
        share.SharedWithUserId.Should().Be(_recipientId);
        share.SharedWithUsername.Should().Be("jade");
    }

    [Fact]
    public async Task ShareAccountAsync_ByEmail_CaseInsensitive_ResolvesTheSameUser()
    {
        var account = AddAccount(_ownerId);

        var share = await _sut.ShareAccountAsync(account.Id, _ownerId, "JADE@EXAMPLE.TEST");

        share.SharedWithUserId.Should().Be(_recipientId);
    }

    [Fact]
    public async Task ShareAccountAsync_WhenCallerIsNotTheOwner_Throws()
    {
        var account = AddAccount(_ownerId);

        var act = () => _sut.ShareAccountAsync(account.Id, _recipientId, "jay");

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task ShareAccountAsync_WhenRecipientNotFound_Throws()
    {
        var account = AddAccount(_ownerId);

        var act = () => _sut.ShareAccountAsync(account.Id, _ownerId, "nobody@example.test");

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task ShareAccountAsync_WithSelf_Throws()
    {
        var account = AddAccount(_ownerId);

        var act = () => _sut.ShareAccountAsync(account.Id, _ownerId, "jay");

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task ShareAccountAsync_WhenAlreadySharedAndPending_Throws()
    {
        var account = AddAccount(_ownerId);
        await _sut.ShareAccountAsync(account.Id, _ownerId, "jade");

        var act = () => _sut.ShareAccountAsync(account.Id, _ownerId, "jade");

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task ShareAccountAsync_WritesAnAccountSharedLogEntry_WithoutTheFullIdentifier()
    {
        var account = AddAccount(_ownerId);

        await _sut.ShareAccountAsync(account.Id, _ownerId, "jade@example.test");

        var log = await _db.ActivityLogs.SingleAsync();
        log.Action.Should().Be(FinanceActivityType.AccountShared);
        log.Description.Should().NotContain("jade@example.test");
    }

    // ── Accept / Decline ─────────────────────────────────────────────────────

    [Fact]
    public async Task AcceptInvitationAsync_MarksTheShareAccepted()
    {
        var account = AddAccount(_ownerId);
        var share = await _sut.ShareAccountAsync(account.Id, _ownerId, "jade");

        await _sut.AcceptInvitationAsync(share.Id, _recipientId);

        var stored = await _db.AccountShares.SingleAsync();
        stored.Status.Should().Be(AccountShareStatus.Accepted);
        stored.RespondedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task AcceptInvitationAsync_WhenCallerIsNotTheRecipient_Throws()
    {
        var account = AddAccount(_ownerId);
        var share = await _sut.ShareAccountAsync(account.Id, _ownerId, "jade");

        var act = () => _sut.AcceptInvitationAsync(share.Id, _ownerId);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task DeclineInvitationAsync_MarksTheShareDeclined_AndDoesNotGrantVisibility()
    {
        var account = AddAccount(_ownerId);
        var share = await _sut.ShareAccountAsync(account.Id, _ownerId, "jade");

        await _sut.DeclineInvitationAsync(share.Id, _recipientId);

        var visible = await _sut.GetVisibleAccountIdsAsync(_recipientId);
        visible.Should().NotContain(account.Id);
    }

    [Fact]
    public async Task AcceptInvitationAsync_WhenAlreadyResponded_Throws()
    {
        var account = AddAccount(_ownerId);
        var share = await _sut.ShareAccountAsync(account.Id, _ownerId, "jade");
        await _sut.AcceptInvitationAsync(share.Id, _recipientId);

        var act = () => _sut.AcceptInvitationAsync(share.Id, _recipientId);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    // ── RevokeShareAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task RevokeShareAsync_RemovesTheShare()
    {
        var account = AddAccount(_ownerId);
        var share = await _sut.ShareAccountAsync(account.Id, _ownerId, "jade");
        await _sut.AcceptInvitationAsync(share.Id, _recipientId);

        await _sut.RevokeShareAsync(account.Id, share.Id, _ownerId);

        (await _db.AccountShares.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task RevokeShareAsync_WhenCallerIsNotTheOwner_Throws()
    {
        var account = AddAccount(_ownerId);
        var share = await _sut.ShareAccountAsync(account.Id, _ownerId, "jade");

        var act = () => _sut.RevokeShareAsync(account.Id, share.Id, _recipientId);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    // ── GetVisibleAccountIdsAsync ────────────────────────────────────────────

    [Fact]
    public async Task GetVisibleAccountIdsAsync_IncludesOwnedAccounts()
    {
        var account = AddAccount(_ownerId);

        var visible = await _sut.GetVisibleAccountIdsAsync(_ownerId);

        visible.Should().Contain(account.Id);
    }

    [Fact]
    public async Task GetVisibleAccountIdsAsync_ExcludesAccountsWithOnlyAPendingShare()
    {
        var account = AddAccount(_ownerId);
        await _sut.ShareAccountAsync(account.Id, _ownerId, "jade");

        var visible = await _sut.GetVisibleAccountIdsAsync(_recipientId);

        visible.Should().NotContain(account.Id);
    }

    [Fact]
    public async Task GetVisibleAccountIdsAsync_IncludesAccountsWithAnAcceptedShare()
    {
        var account = AddAccount(_ownerId);
        var share = await _sut.ShareAccountAsync(account.Id, _ownerId, "jade");
        await _sut.AcceptInvitationAsync(share.Id, _recipientId);

        var visible = await _sut.GetVisibleAccountIdsAsync(_recipientId);

        visible.Should().Contain(account.Id);
    }

    [Fact]
    public async Task GetVisibleAccountIdsAsync_DoesNotLeakOtherUsersUnsharedAccounts()
    {
        AddAccount(_ownerId, "Private");

        var visible = await _sut.GetVisibleAccountIdsAsync(_recipientId);

        visible.Should().BeEmpty();
    }
}
