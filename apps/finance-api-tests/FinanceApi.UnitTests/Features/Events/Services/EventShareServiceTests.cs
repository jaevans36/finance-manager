using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Auth.Models;
using FinanceApi.Features.Events.Models;
using FinanceApi.Features.Events.Services;
using FinanceApi.Features.Events.DTOs;
using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Notifications.Services;
using FinanceApi.Features.Notifications.Models;

namespace FinanceApi.UnitTests.Features.Events.Services;

public class EventShareServiceTests : IDisposable
{
    private readonly FinanceDbContext _context;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly EventShareService _service;
    private readonly User _owner;
    private readonly User _recipient;
    private readonly User _thirdUser;
    private readonly Event _event;

    public EventShareServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new FinanceDbContext(options);
        _mockNotificationService = new Mock<INotificationService>();

        _service = new EventShareService(_context, _mockNotificationService.Object);

        _owner = new User { Id = Guid.NewGuid(), Email = "owner@test.com", Username = "owner", PasswordHash = "h", EmailVerified = true };
        _recipient = new User { Id = Guid.NewGuid(), Email = "recipient@test.com", Username = "recipient", PasswordHash = "h", EmailVerified = true };
        _thirdUser = new User { Id = Guid.NewGuid(), Email = "third@test.com", Username = "third", PasswordHash = "h", EmailVerified = true };
        _context.Users.AddRange(_owner, _recipient, _thirdUser);

        _event = new Event
        {
            Id = Guid.NewGuid(),
            UserId = _owner.Id,
            Title = "Test Event",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(_event);
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async System.Threading.Tasks.Task EventShare_CanBePersisted_AndRetrieved()
    {
        // This test verifies the entity and DbSet exist before any service logic is implemented
        var share = new EventShare
        {
            Id = Guid.NewGuid(),
            EventId = _event.Id,
            SharedByUserId = _owner.Id,
            SharedWithUserId = _recipient.Id,
            Permission = SharePermission.View,
            Status = ShareStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.EventShares.Add(share);
        await _context.SaveChangesAsync();

        var retrieved = await _context.EventShares.FindAsync(share.Id);
        retrieved.Should().NotBeNull();
        retrieved!.EventId.Should().Be(_event.Id);
        retrieved.Permission.Should().Be(SharePermission.View);
        retrieved.Status.Should().Be(ShareStatus.Pending);
    }

    // ── CreateShare tests ──────────────────────────────────────────────────

    [Fact]
    public async System.Threading.Tasks.Task CreateShareAsync_ByOwner_WithEmail_CreatesPendingShare()
    {
        var result = await _service.CreateShareAsync(_event.Id, _owner.Id, _recipient.Email, SharePermission.View);

        result.Should().NotBeNull();
        result.Status.Should().Be(ShareStatus.Pending);
        result.Permission.Should().Be(SharePermission.View);
        result.SharedWith.Id.Should().Be(_recipient.Id);
    }

    [Fact]
    public async System.Threading.Tasks.Task CreateShareAsync_ByOwner_WithUsername_CreatesPendingShare()
    {
        var result = await _service.CreateShareAsync(_event.Id, _owner.Id, _recipient.Username, SharePermission.Edit);

        result.Status.Should().Be(ShareStatus.Pending);
        result.Permission.Should().Be(SharePermission.Edit);
    }

    [Fact]
    public async System.Threading.Tasks.Task CreateShareAsync_WithSelf_ThrowsInvalidOperationException()
    {
        var act = async () => await _service.CreateShareAsync(_event.Id, _owner.Id, _owner.Email, SharePermission.View);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*yourself*");
    }

    [Fact]
    public async System.Threading.Tasks.Task CreateShareAsync_DuplicateShare_ThrowsInvalidOperationException()
    {
        // First share succeeds
        await _service.CreateShareAsync(_event.Id, _owner.Id, _recipient.Email, SharePermission.View);

        // Second share for same recipient must fail
        var act = async () => await _service.CreateShareAsync(_event.Id, _owner.Id, _recipient.Email, SharePermission.View);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already shared*");
    }

    [Fact]
    public async System.Threading.Tasks.Task CreateShareAsync_ByNonOwnerWithoutManagePermission_ThrowsUnauthorizedAccessException()
    {
        // _recipient has View permission — cannot share further
        _context.EventShares.Add(new EventShare
        {
            Id = Guid.NewGuid(),
            EventId = _event.Id,
            SharedByUserId = _owner.Id,
            SharedWithUserId = _recipient.Id,
            Permission = SharePermission.View,
            Status = ShareStatus.Accepted
        });
        await _context.SaveChangesAsync();

        var act = async () => await _service.CreateShareAsync(_event.Id, _recipient.Id, _thirdUser.Email, SharePermission.View);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async System.Threading.Tasks.Task CreateShareAsync_ByManageUser_Succeeds()
    {
        // _recipient has Manage permission — can share further
        _context.EventShares.Add(new EventShare
        {
            Id = Guid.NewGuid(),
            EventId = _event.Id,
            SharedByUserId = _owner.Id,
            SharedWithUserId = _recipient.Id,
            Permission = SharePermission.Manage,
            Status = ShareStatus.Accepted
        });
        await _context.SaveChangesAsync();

        var result = await _service.CreateShareAsync(_event.Id, _recipient.Id, _thirdUser.Email, SharePermission.View);

        result.Should().NotBeNull();
        result.SharedWith.Id.Should().Be(_thirdUser.Id);
    }

    [Fact]
    public async System.Threading.Tasks.Task CreateShareAsync_DispatchesShareInvitationNotification()
    {
        await _service.CreateShareAsync(_event.Id, _owner.Id, _recipient.Email, SharePermission.View);

        _mockNotificationService.Verify(
            n => n.CreateAsync(
                _recipient.Id,
                NotificationType.ShareInvitation,
                It.IsAny<NotificationEntityType>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>()),
            Times.Once);
    }

    // ── GetSharesAsync tests ───────────────────────────────────────────────

    [Fact]
    public async System.Threading.Tasks.Task GetSharesAsync_ByOwner_ReturnsAllShares()
    {
        _context.EventShares.Add(new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.View, Status = ShareStatus.Pending });
        _context.EventShares.Add(new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _thirdUser.Id, Permission = SharePermission.Edit, Status = ShareStatus.Accepted });
        await _context.SaveChangesAsync();

        var result = await _service.GetSharesAsync(_event.Id, _owner.Id);

        result.Should().HaveCount(2);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetSharesAsync_ByViewUser_ThrowsUnauthorizedAccessException()
    {
        _context.EventShares.Add(new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.View, Status = ShareStatus.Accepted });
        await _context.SaveChangesAsync();

        var act = async () => await _service.GetSharesAsync(_event.Id, _recipient.Id);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async System.Threading.Tasks.Task GetSharesAsync_ByEditUser_ThrowsUnauthorizedAccessException()
    {
        _context.EventShares.Add(new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.Edit, Status = ShareStatus.Accepted });
        await _context.SaveChangesAsync();

        var act = async () => await _service.GetSharesAsync(_event.Id, _recipient.Id);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async System.Threading.Tasks.Task GetSharesAsync_ByManageUser_ReturnsAllShares()
    {
        _context.EventShares.Add(new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.Manage, Status = ShareStatus.Accepted });
        _context.EventShares.Add(new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _recipient.Id, SharedWithUserId = _thirdUser.Id, Permission = SharePermission.View, Status = ShareStatus.Pending });
        await _context.SaveChangesAsync();

        var result = await _service.GetSharesAsync(_event.Id, _recipient.Id);

        result.Should().HaveCount(2);
    }

    // ── DeleteShareAsync (Revoke) tests ────────────────────────────────────

    [Fact]
    public async System.Threading.Tasks.Task DeleteShareAsync_ByOwner_RemovesAnyShare()
    {
        var share = new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.View, Status = ShareStatus.Accepted };
        _context.EventShares.Add(share);
        await _context.SaveChangesAsync();

        await _service.DeleteShareAsync(_event.Id, share.Id, _owner.Id);

        var remaining = await _context.EventShares.FindAsync(share.Id);
        remaining.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task DeleteShareAsync_ByManageUser_CanRevokeOwnShare()
    {
        // _recipient (Manage) created a share for _thirdUser
        var recipientShare = new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.Manage, Status = ShareStatus.Accepted };
        var thirdShare = new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _recipient.Id, SharedWithUserId = _thirdUser.Id, Permission = SharePermission.View, Status = ShareStatus.Accepted };
        _context.EventShares.AddRange(recipientShare, thirdShare);
        await _context.SaveChangesAsync();

        // _recipient can revoke the share they created (_thirdUser's share)
        await _service.DeleteShareAsync(_event.Id, thirdShare.Id, _recipient.Id);

        var remaining = await _context.EventShares.FindAsync(thirdShare.Id);
        remaining.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task DeleteShareAsync_ByManageUser_CannotRevokeShareTheyDidNotCreate()
    {
        // _owner created a share for _thirdUser; _recipient has Manage but did not create it
        var recipientShare = new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.Manage, Status = ShareStatus.Accepted };
        var ownerCreatedShare = new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _thirdUser.Id, Permission = SharePermission.View, Status = ShareStatus.Accepted };
        _context.EventShares.AddRange(recipientShare, ownerCreatedShare);
        await _context.SaveChangesAsync();

        var act = async () => await _service.DeleteShareAsync(_event.Id, ownerCreatedShare.Id, _recipient.Id);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*only revoke shares*created*");
    }

    [Fact]
    public async System.Threading.Tasks.Task DeleteShareAsync_DispatchesShareRevokedNotification()
    {
        var share = new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.View, Status = ShareStatus.Accepted };
        _context.EventShares.Add(share);
        await _context.SaveChangesAsync();

        await _service.DeleteShareAsync(_event.Id, share.Id, _owner.Id);

        _mockNotificationService.Verify(
            n => n.CreateAsync(
                _recipient.Id,
                NotificationType.ShareRevoked,
                It.IsAny<NotificationEntityType>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>()),
            Times.Once);
    }

    // ── Invitation lifecycle tests ─────────────────────────────────────────

    [Fact]
    public async System.Threading.Tasks.Task GetPendingInvitationsAsync_ReturnsOnlyPendingSharesForUser()
    {
        _context.EventShares.Add(new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.View, Status = ShareStatus.Pending });
        _context.EventShares.Add(new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _thirdUser.Id, Permission = SharePermission.Edit, Status = ShareStatus.Accepted }); // different user
        await _context.SaveChangesAsync();

        var result = await _service.GetPendingInvitationsAsync(_recipient.Id);

        result.Should().HaveCount(1);
        result[0].SharedBy.Id.Should().Be(_owner.Id);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetPendingInvitationsAsync_DoesNotReturnAcceptedOrDeclinedShares()
    {
        _context.EventShares.Add(new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.View, Status = ShareStatus.Accepted });
        _context.EventShares.Add(new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _thirdUser.Id, Permission = SharePermission.Edit, Status = ShareStatus.Declined });
        await _context.SaveChangesAsync();

        var resultForRecipient = await _service.GetPendingInvitationsAsync(_recipient.Id);
        var resultForThird = await _service.GetPendingInvitationsAsync(_thirdUser.Id);

        resultForRecipient.Should().BeEmpty();
        resultForThird.Should().BeEmpty();
    }

    [Fact]
    public async System.Threading.Tasks.Task AcceptInvitationAsync_SetStatusToAccepted()
    {
        var share = new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.View, Status = ShareStatus.Pending };
        _context.EventShares.Add(share);
        await _context.SaveChangesAsync();

        await _service.AcceptInvitationAsync(share.Id, _recipient.Id);

        var updated = await _context.EventShares.FindAsync(share.Id);
        updated!.Status.Should().Be(ShareStatus.Accepted);
    }

    [Fact]
    public async System.Threading.Tasks.Task AcceptInvitationAsync_DispatchesShareAcceptedNotificationToSharer()
    {
        var share = new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.View, Status = ShareStatus.Pending };
        _context.EventShares.Add(share);
        await _context.SaveChangesAsync();

        await _service.AcceptInvitationAsync(share.Id, _recipient.Id);

        _mockNotificationService.Verify(
            n => n.CreateAsync(
                _owner.Id,
                NotificationType.ShareAccepted,
                It.IsAny<NotificationEntityType>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>()),
            Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task DeclineInvitationAsync_SetStatusToDeclined()
    {
        var share = new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.View, Status = ShareStatus.Pending };
        _context.EventShares.Add(share);
        await _context.SaveChangesAsync();

        await _service.DeclineInvitationAsync(share.Id, _recipient.Id);

        var updated = await _context.EventShares.FindAsync(share.Id);
        updated!.Status.Should().Be(ShareStatus.Declined);
    }

    [Fact]
    public async System.Threading.Tasks.Task DeclineInvitationAsync_DispatchesShareDeclinedNotificationToSharer()
    {
        var share = new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.View, Status = ShareStatus.Pending };
        _context.EventShares.Add(share);
        await _context.SaveChangesAsync();

        await _service.DeclineInvitationAsync(share.Id, _recipient.Id);

        _mockNotificationService.Verify(
            n => n.CreateAsync(
                _owner.Id,
                NotificationType.ShareDeclined,
                It.IsAny<NotificationEntityType>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid>()),
            Times.Once);
    }

    // ── GetUserPermissionAsync tests ───────────────────────────────────────

    [Fact]
    public async System.Threading.Tasks.Task GetUserPermissionAsync_WhenNoShare_ReturnsNull()
    {
        var result = await _service.GetUserPermissionAsync(_event.Id, _recipient.Id);
        result.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserPermissionAsync_WhenAcceptedShareExists_ReturnsPermission()
    {
        _context.EventShares.Add(new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.Edit, Status = ShareStatus.Accepted });
        await _context.SaveChangesAsync();

        var result = await _service.GetUserPermissionAsync(_event.Id, _recipient.Id);

        result.Should().Be(SharePermission.Edit);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetUserPermissionAsync_WhenShareIsPending_ReturnsNull()
    {
        // Pending invitation — user hasn't accepted yet, so no effective permission
        _context.EventShares.Add(new EventShare { Id = Guid.NewGuid(), EventId = _event.Id, SharedByUserId = _owner.Id, SharedWithUserId = _recipient.Id, Permission = SharePermission.View, Status = ShareStatus.Pending });
        await _context.SaveChangesAsync();

        var result = await _service.GetUserPermissionAsync(_event.Id, _recipient.Id);

        result.Should().BeNull();
    }
}
