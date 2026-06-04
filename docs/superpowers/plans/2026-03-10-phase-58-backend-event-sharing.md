# Event Sharing Backend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement event sharing with View/Edit/Manage permissions, invite-and-accept flow, and notification dispatch.

**Architecture:** New EventShare entity + EventShareService + endpoints on EventsController + SharingController for invitations. EventService extended to return shared events. Notifications dispatched via INotificationService from Plan 1.

**Tech Stack:** .NET 8 / C# 12 / ASP.NET Core / EF Core 8 / PostgreSQL / xUnit + Moq + FluentAssertions

---

## Prerequisites

Plan 1 (`2026-03-10-phase-58-backend-task-assignment.md`) must be fully merged before beginning this plan. Specifically the following must exist:

- `INotificationService` and `NotificationService` in `apps/finance-api/Features/Notifications/Services/`
- `NotificationType` enum (must include `ShareInvitation`, `ShareAccepted`, `ShareDeclined`, `ShareRevoked`) in `apps/finance-api/Features/Notifications/Models/`
- `ShareStatus` enum (`Pending`, `Accepted`, `Declined`) added to `apps/finance-api/Features/Tasks/Models/TaskGroupShare.cs`
- `SharePermission.Manage` value added to the existing `SharePermission` enum in the same file

---

## File Map

### New files
| File | Responsibility |
|------|----------------|
| `apps/finance-api/Features/Events/Models/EventShare.cs` | `EventShare` entity — maps to `event_shares` table |
| `apps/finance-api/Features/Events/DTOs/EventShareDtos.cs` | Request/response DTOs for all sharing endpoints |
| `apps/finance-api/Features/Events/Services/EventShareService.cs` | `IEventShareService` interface + implementation |
| `apps/finance-api/Features/Sharing/Controllers/SharingController.cs` | Invitation inbox endpoints at `api/v1/sharing/invitations` |
| `apps/finance-api/Migrations/<timestamp>_AddEventShareTable.cs` | EF Core migration — generated, not hand-written |
| `apps/finance-api-tests/FinanceApi.UnitTests/Features/Events/Services/EventShareServiceTests.cs` | Unit tests for EventShareService |
| `apps/finance-api-tests/FinanceApi.UnitTests/Features/Events/Services/EventServiceShareIntegrationTests.cs` | Integration-style tests for EventService with shares |

### Modified files
| File | Change |
|------|--------|
| `apps/finance-api/Features/Tasks/Models/TaskGroupShare.cs` | Add `Manage` to `SharePermission`; add `ShareStatus` enum — **already done in Plan 1** |
| `apps/finance-api/Data/FinanceDbContext.cs` | Add `DbSet<EventShare>`, configure relationships, unique index |
| `apps/finance-api/Features/Events/Controllers/EventsController.cs` | Add share sub-resource actions on `{id}/shares`; inject `IEventShareService` |
| `apps/finance-api/Features/Events/DTOs/EventDtos.cs` | Add `IsOwner`, `SharedBy`, `MyPermission` fields to `EventDto` |
| `apps/finance-api/Features/Events/Services/EventService.cs` | Extend `GetEventsAsync` / `GetEventByIdAsync` to include accepted shares; update `MapToEventDtoAsync` |
| `apps/finance-api/Program.cs` | Register `IEventShareService` as scoped; add `using` for Sharing namespace if needed |

---

## Chunk 1: EventShare Entity, DTOs, and Migration

### Task 1: Add `ShareStatus` enum and `Manage` permission value

**Files:**
- Modify: `apps/finance-api/Features/Tasks/Models/TaskGroupShare.cs`

> Note: If Plan 1 has already applied these changes, verify and skip this task.

- [ ] Step 1: Open `apps/finance-api/Features/Tasks/Models/TaskGroupShare.cs` and confirm that `SharePermission` already contains `Manage`. If not, add it:

```csharp
public enum SharePermission
{
    View,
    Edit,
    Manage
}
```

- [ ] Step 2: Confirm that `ShareStatus` enum is present in the same file. If not, add it immediately after `SharePermission`:

```csharp
public enum ShareStatus
{
    Pending,
    Accepted,
    Declined
}
```

- [ ] Step 3: Run `dotnet build apps/finance-api/` — confirm zero errors before proceeding.

---

### Task 2: Write failing persistence test for EventShare

**Files:**
- Create: `apps/finance-api-tests/FinanceApi.UnitTests/Features/Events/Services/EventShareServiceTests.cs`

- [ ] Step 1: Create the test file with the class scaffold and a single persistence test that will fail to compile until the entity and DbContext are updated:

```csharp
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
}
```

- [ ] Step 2: Run `dotnet test apps/finance-api-tests/ --filter "FullyQualifiedName~EventShareServiceTests"` — confirm **build failure** (EventShare, EventShares DbSet, EventShareService do not exist yet).

---

### Task 3: Create the `EventShare` entity

**Files:**
- Create: `apps/finance-api/Features/Events/Models/EventShare.cs`

- [ ] Step 1: Create the file:

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FinanceApi.Features.Auth.Models;
using FinanceApi.Features.Tasks.Models;

namespace FinanceApi.Features.Events.Models;

/// <summary>
/// Represents a share invitation for an event from one user to another.
/// Unique constraint: (EventId, SharedWithUserId) — one share record per event/recipient pair.
/// </summary>
[Table("event_shares")]
public class EventShare
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("event_id")]
    public Guid EventId { get; set; }

    [Required]
    [Column("shared_by_user_id")]
    public Guid SharedByUserId { get; set; }

    [Required]
    [Column("shared_with_user_id")]
    public Guid SharedWithUserId { get; set; }

    [Required]
    [Column("permission")]
    public SharePermission Permission { get; set; } = SharePermission.View;

    [Required]
    [Column("status")]
    public ShareStatus Status { get; set; } = ShareStatus.Pending;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(EventId))]
    public Event Event { get; set; } = null!;

    [ForeignKey(nameof(SharedByUserId))]
    public User SharedBy { get; set; } = null!;

    [ForeignKey(nameof(SharedWithUserId))]
    public User SharedWith { get; set; } = null!;
}
```

---

### Task 4: Register `EventShare` in `FinanceDbContext` and configure relationships

**Files:**
- Modify: `apps/finance-api/Data/FinanceDbContext.cs`

- [ ] Step 1: Add the `DbSet<EventShare>` property after the `Events` DbSet (line ~30):

```csharp
public DbSet<EventShare> EventShares { get; set; }
```

- [ ] Step 2: Add entity configuration inside `OnModelCreating`, after the existing `Event` configuration block (after line ~312):

```csharp
// EventShare configuration
modelBuilder.Entity<EventShare>(entity =>
{
    entity.ToTable("event_shares");
    entity.HasKey(e => e.Id);

    entity.HasOne(es => es.Event)
          .WithMany()
          .HasForeignKey(es => es.EventId)
          .OnDelete(DeleteBehavior.Cascade);

    entity.HasOne(es => es.SharedBy)
          .WithMany()
          .HasForeignKey(es => es.SharedByUserId)
          .OnDelete(DeleteBehavior.Restrict);

    entity.HasOne(es => es.SharedWith)
          .WithMany()
          .HasForeignKey(es => es.SharedWithUserId)
          .OnDelete(DeleteBehavior.Cascade);

    entity.Property(e => e.Permission)
          .HasConversion<string>();

    entity.Property(e => e.Status)
          .HasConversion<string>();

    // One share record per event/recipient pair
    entity.HasIndex(e => new { e.EventId, e.SharedWithUserId }).IsUnique();
    // Query indexes
    entity.HasIndex(e => e.SharedWithUserId);
    entity.HasIndex(e => e.SharedByUserId);
    entity.HasIndex(e => e.Status);
});
```

- [ ] Step 3: Run `dotnet build apps/finance-api/` — confirm zero errors.

- [ ] Step 4: Run the persistence test — `dotnet test apps/finance-api-tests/ --filter "EventShare_CanBePersisted_AndRetrieved"` — confirm **green**.

---

### Task 5: Generate EF Core migration

**Files:**
- Create: `apps/finance-api/Migrations/<timestamp>_AddEventShareTable.cs` (generated)

- [ ] Step 1: From `apps/finance-api/`, run:
  ```bash
  dotnet ef migrations add AddEventShareTable
  ```
- [ ] Step 2: Open the generated migration file and verify:
  - `event_shares` table created with correct columns: `id`, `event_id`, `shared_by_user_id`, `shared_with_user_id`, `permission`, `status`, `created_at`
  - FK to `events(id)` with cascade delete
  - FK to `users(id)` for `shared_by_user_id` with restrict delete
  - FK to `users(id)` for `shared_with_user_id` with cascade delete
  - Unique index on `(event_id, shared_with_user_id)`
  - Indexes on `shared_with_user_id`, `shared_by_user_id`, `status`
- [ ] Step 3: Run `dotnet build apps/finance-api/` — confirm zero errors.

**Commit checkpoint:**
```
feat: add EventShare entity, DbContext registration, and AddEventShareTable migration (Phase58C)
```

---

## Chunk 2: EventShare DTOs and Service Interface Tests

### Task 6: Create sharing DTOs

**Files:**
- Create: `apps/finance-api/Features/Events/DTOs/EventShareDtos.cs`

- [ ] Step 1: Create the file. Note: `EventShareDto` uses `UserSummaryDto` as nested DTO matching the design spec:

```csharp
using System.ComponentModel.DataAnnotations;
using FinanceApi.Features.Tasks.Models;

namespace FinanceApi.Features.Events.DTOs;

/// <summary>
/// Request body for sharing an event with another user.
/// </summary>
public class CreateEventShareRequest
{
    [Required]
    [MaxLength(255)]
    public string UsernameOrEmail { get; set; } = string.Empty;

    [Required]
    public SharePermission Permission { get; set; } = SharePermission.View;
}

/// <summary>
/// Request body for updating a share's permission level.
/// </summary>
public class UpdateEventShareRequest
{
    [Required]
    public SharePermission Permission { get; set; }
}

/// <summary>
/// Minimal user identity embedded in share responses.
/// </summary>
public class UserSummaryDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
}

/// <summary>
/// Full share record returned from share management endpoints.
/// </summary>
public class EventShareDto
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public UserSummaryDto SharedBy { get; set; } = null!;
    public UserSummaryDto SharedWith { get; set; } = null!;
    public SharePermission Permission { get; set; }
    public ShareStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Richer view of a pending invitation, including event details for the inbox UI.
/// </summary>
public class EventShareInvitationDto
{
    public Guid ShareId { get; set; }
    public Guid EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public DateTime EventStartDate { get; set; }
    public DateTime EventEndDate { get; set; }
    public UserSummaryDto SharedBy { get; set; } = null!;
    public SharePermission Permission { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

- [ ] Step 2: Run `dotnet build apps/finance-api/` — confirm zero errors.

---

### Task 7: Write all failing unit tests for `EventShareService`

**Files:**
- Modify: `apps/finance-api-tests/FinanceApi.UnitTests/Features/Events/Services/EventShareServiceTests.cs`

- [ ] Step 1: Add all service-level tests below the existing `EventShare_CanBePersisted_AndRetrieved` test. These will fail to compile because `EventShareService` does not yet exist:

```csharp
// ── CreateShare tests ──────────────────────────────────────────────────

[Fact]
public async System.Threading.Tasks.Task CreateShareAsync_ByOwner_WithEmail_CreatesPendingShare()
{
    var request = new CreateEventShareRequest { UsernameOrEmail = _recipient.Email, Permission = SharePermission.View };

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
        n => n.CreateAsync(It.Is<CreateNotificationRequest>(r =>
            r.UserId == _recipient.Id &&
            r.Type == NotificationType.ShareInvitation)),
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
        n => n.CreateAsync(It.Is<CreateNotificationRequest>(r =>
            r.UserId == _recipient.Id &&
            r.Type == NotificationType.ShareRevoked)),
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
        n => n.CreateAsync(It.Is<CreateNotificationRequest>(r =>
            r.UserId == _owner.Id &&
            r.Type == NotificationType.ShareAccepted)),
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
        n => n.CreateAsync(It.Is<CreateNotificationRequest>(r =>
            r.UserId == _owner.Id &&
            r.Type == NotificationType.ShareDeclined)),
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
```

- [ ] Step 2: Run `dotnet test apps/finance-api-tests/ --filter "FullyQualifiedName~EventShareServiceTests"` — confirm **build failure** (service class not created yet).

---

## Chunk 3: Implement `EventShareService`

### Task 8: Create `EventShareService.cs` with interface and implementation

**Files:**
- Create: `apps/finance-api/Features/Events/Services/EventShareService.cs`

- [ ] Step 1: Create the service file. Use load-and-mutate pattern throughout (no `ExecuteUpdateAsync` / `ExecuteDeleteAsync` — InMemory provider does not support them):

```csharp
using FinanceApi.Data;
using FinanceApi.Features.Events.Models;
using FinanceApi.Features.Events.DTOs;
using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Notifications.Services;
using FinanceApi.Features.Notifications.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Events.Services;

/// <summary>
/// Manages event sharing lifecycle: create, revoke, accept, decline invitations.
/// Permission model: owner can do everything; Manage users can share further and
/// revoke only shares they personally created; View/Edit users cannot manage shares.
/// </summary>
public interface IEventShareService
{
    /// <summary>Create a share invitation. Caller must be owner or have Manage permission.</summary>
    System.Threading.Tasks.Task<EventShareDto> CreateShareAsync(Guid eventId, Guid callerId, string usernameOrEmail, SharePermission permission);

    /// <summary>List all shares for an event. Caller must be owner or have Manage permission.</summary>
    System.Threading.Tasks.Task<List<EventShareDto>> GetSharesAsync(Guid eventId, Guid requestingUserId);

    /// <summary>Update the permission level on an existing share. Caller must be owner or have Manage permission.</summary>
    System.Threading.Tasks.Task<EventShareDto> UpdateSharePermissionAsync(Guid eventId, Guid shareId, Guid requestingUserId, SharePermission newPermission);

    /// <summary>Revoke (delete) a share. Owner can revoke any; Manage can only revoke shares they created.</summary>
    System.Threading.Tasks.Task DeleteShareAsync(Guid eventId, Guid shareId, Guid requestingUserId);

    /// <summary>Return all Pending invitations addressed to the given user.</summary>
    System.Threading.Tasks.Task<List<EventShareInvitationDto>> GetPendingInvitationsAsync(Guid userId);

    /// <summary>Accept a pending invitation. Only the share recipient may call this.</summary>
    System.Threading.Tasks.Task AcceptInvitationAsync(Guid shareId, Guid userId);

    /// <summary>Decline a pending invitation. Only the share recipient may call this.</summary>
    System.Threading.Tasks.Task DeclineInvitationAsync(Guid shareId, Guid userId);

    /// <summary>Returns the effective SharePermission for a user on an event, or null if no accepted share exists.</summary>
    System.Threading.Tasks.Task<SharePermission?> GetUserPermissionAsync(Guid eventId, Guid userId);
}

public class EventShareService : IEventShareService
{
    private readonly FinanceDbContext _context;
    private readonly INotificationService _notificationService;

    public EventShareService(FinanceDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task<EventShareDto> CreateShareAsync(Guid eventId, Guid callerId, string usernameOrEmail, SharePermission permission)
    {
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new UnauthorizedAccessException("Event not found.");

        await RequireSharePermissionAsync(eventEntity, callerId);

        // Resolve recipient by username or email (case-insensitive)
        var recipient = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.Email.ToLower() == usernameOrEmail.ToLower() ||
                u.Username.ToLower() == usernameOrEmail.ToLower())
            ?? throw new InvalidOperationException("User not found.");

        if (recipient.Id == callerId)
            throw new InvalidOperationException("You cannot share an event with yourself.");

        var existing = await _context.EventShares
            .FirstOrDefaultAsync(s => s.EventId == eventId && s.SharedWithUserId == recipient.Id);

        if (existing != null)
            throw new InvalidOperationException("This event is already shared with that user.");

        var share = new EventShare
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            SharedByUserId = callerId,
            SharedWithUserId = recipient.Id,
            Permission = permission,
            Status = ShareStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.EventShares.Add(share);
        await _context.SaveChangesAsync();

        await _notificationService.CreateAsync(new CreateNotificationRequest
        {
            UserId = recipient.Id,
            Type = NotificationType.ShareInvitation,
            EntityType = NotificationEntityType.Event,
            EntityId = eventId,
            Message = $"You have been invited to view the event '{eventEntity.Title}'."
        });

        return await MapToShareDtoAsync(share, eventEntity.Title);
    }

    public async System.Threading.Tasks.Task<List<EventShareDto>> GetSharesAsync(Guid eventId, Guid requestingUserId)
    {
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new UnauthorizedAccessException("Event not found.");

        await RequireSharePermissionAsync(eventEntity, requestingUserId);

        var shares = await _context.EventShares
            .Where(s => s.EventId == eventId)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();

        var dtos = new List<EventShareDto>();
        foreach (var share in shares)
            dtos.Add(await MapToShareDtoAsync(share, eventEntity.Title));

        return dtos;
    }

    public async System.Threading.Tasks.Task<EventShareDto> UpdateSharePermissionAsync(Guid eventId, Guid shareId, Guid requestingUserId, SharePermission newPermission)
    {
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new UnauthorizedAccessException("Event not found.");

        await RequireSharePermissionAsync(eventEntity, requestingUserId);

        var share = await _context.EventShares
            .FirstOrDefaultAsync(s => s.Id == shareId && s.EventId == eventId)
            ?? throw new UnauthorizedAccessException("Share not found.");

        // Load-and-mutate pattern (ExecuteUpdateAsync not supported by InMemory provider)
        share.Permission = newPermission;
        await _context.SaveChangesAsync();

        return await MapToShareDtoAsync(share, eventEntity.Title);
    }

    public async System.Threading.Tasks.Task DeleteShareAsync(Guid eventId, Guid shareId, Guid requestingUserId)
    {
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId)
            ?? throw new UnauthorizedAccessException("Event not found.");

        var share = await _context.EventShares
            .FirstOrDefaultAsync(s => s.Id == shareId && s.EventId == eventId)
            ?? throw new UnauthorizedAccessException("Share not found.");

        var callerIsOwner = eventEntity.UserId == requestingUserId;

        if (!callerIsOwner)
        {
            var callerShare = await _context.EventShares
                .FirstOrDefaultAsync(s => s.EventId == eventId
                    && s.SharedWithUserId == requestingUserId
                    && s.Status == ShareStatus.Accepted
                    && s.Permission == SharePermission.Manage);

            if (callerShare == null)
                throw new UnauthorizedAccessException("You do not have permission to revoke shares.");

            // Manage users can only revoke shares they personally created
            if (share.SharedByUserId != requestingUserId)
                throw new UnauthorizedAccessException("You can only revoke shares that you created.");
        }

        var recipientId = share.SharedWithUserId;

        // Load-and-remove pattern (ExecuteDeleteAsync not supported by InMemory provider)
        _context.EventShares.Remove(share);
        await _context.SaveChangesAsync();

        await _notificationService.CreateAsync(new CreateNotificationRequest
        {
            UserId = recipientId,
            Type = NotificationType.ShareRevoked,
            EntityType = NotificationEntityType.Event,
            EntityId = eventId,
            Message = $"Your access to the event '{eventEntity.Title}' has been revoked."
        });
    }

    public async System.Threading.Tasks.Task<List<EventShareInvitationDto>> GetPendingInvitationsAsync(Guid userId)
    {
        var shares = await _context.EventShares
            .Include(s => s.Event)
            .Where(s => s.SharedWithUserId == userId && s.Status == ShareStatus.Pending)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var dtos = new List<EventShareInvitationDto>();
        foreach (var share in shares)
        {
            var sharer = await _context.Users.FindAsync(share.SharedByUserId);
            dtos.Add(new EventShareInvitationDto
            {
                ShareId = share.Id,
                EventId = share.EventId,
                EventTitle = share.Event.Title,
                EventStartDate = share.Event.StartDate,
                EventEndDate = share.Event.EndDate,
                SharedBy = new UserSummaryDto
                {
                    Id = share.SharedByUserId,
                    Username = sharer?.Username ?? string.Empty
                },
                Permission = share.Permission,
                CreatedAt = share.CreatedAt
            });
        }

        return dtos;
    }

    public async System.Threading.Tasks.Task AcceptInvitationAsync(Guid shareId, Guid userId)
    {
        var share = await _context.EventShares
            .FirstOrDefaultAsync(s => s.Id == shareId && s.SharedWithUserId == userId)
            ?? throw new UnauthorizedAccessException("Invitation not found.");

        if (share.Status != ShareStatus.Pending)
            throw new InvalidOperationException("Invitation is no longer pending.");

        // Load-and-mutate
        share.Status = ShareStatus.Accepted;
        await _context.SaveChangesAsync();

        var eventEntity = await _context.Events.FindAsync(share.EventId);

        await _notificationService.CreateAsync(new CreateNotificationRequest
        {
            UserId = share.SharedByUserId,
            Type = NotificationType.ShareAccepted,
            EntityType = NotificationEntityType.Event,
            EntityId = share.EventId,
            Message = $"Your event invitation was accepted."
        });
    }

    public async System.Threading.Tasks.Task DeclineInvitationAsync(Guid shareId, Guid userId)
    {
        var share = await _context.EventShares
            .FirstOrDefaultAsync(s => s.Id == shareId && s.SharedWithUserId == userId)
            ?? throw new UnauthorizedAccessException("Invitation not found.");

        if (share.Status != ShareStatus.Pending)
            throw new InvalidOperationException("Invitation is no longer pending.");

        // Load-and-mutate
        share.Status = ShareStatus.Declined;
        await _context.SaveChangesAsync();

        await _notificationService.CreateAsync(new CreateNotificationRequest
        {
            UserId = share.SharedByUserId,
            Type = NotificationType.ShareDeclined,
            EntityType = NotificationEntityType.Event,
            EntityId = share.EventId,
            Message = "Your event invitation was declined."
        });
    }

    public async System.Threading.Tasks.Task<SharePermission?> GetUserPermissionAsync(Guid eventId, Guid userId)
    {
        var share = await _context.EventShares
            .FirstOrDefaultAsync(s => s.EventId == eventId
                && s.SharedWithUserId == userId
                && s.Status == ShareStatus.Accepted);

        return share?.Permission;
    }

    // ── Private helpers ────────────────────────────────────────────────

    /// <summary>
    /// Throws UnauthorizedAccessException if the caller is neither the event owner
    /// nor an accepted Manage-permission share recipient.
    /// </summary>
    private async System.Threading.Tasks.Task RequireSharePermissionAsync(Event eventEntity, Guid callerId)
    {
        if (eventEntity.UserId == callerId)
            return; // Owner — all operations permitted

        var callerShare = await _context.EventShares
            .FirstOrDefaultAsync(s => s.EventId == eventEntity.Id
                && s.SharedWithUserId == callerId
                && s.Status == ShareStatus.Accepted
                && s.Permission == SharePermission.Manage);

        if (callerShare == null)
            throw new UnauthorizedAccessException("Only the event owner or users with Manage permission can perform this action.");
    }

    private async System.Threading.Tasks.Task<EventShareDto> MapToShareDtoAsync(EventShare share, string eventTitle)
    {
        var sharedBy = await _context.Users.FindAsync(share.SharedByUserId);
        var sharedWith = await _context.Users.FindAsync(share.SharedWithUserId);

        return new EventShareDto
        {
            Id = share.Id,
            EventId = share.EventId,
            EventTitle = eventTitle,
            SharedBy = new UserSummaryDto { Id = share.SharedByUserId, Username = sharedBy?.Username ?? string.Empty },
            SharedWith = new UserSummaryDto { Id = share.SharedWithUserId, Username = sharedWith?.Username ?? string.Empty },
            Permission = share.Permission,
            Status = share.Status,
            CreatedAt = share.CreatedAt
        };
    }
}
```

- [ ] Step 2: Run `dotnet build apps/finance-api/` — confirm zero errors.

- [ ] Step 3: Run the unit tests:
  ```bash
  dotnet test apps/finance-api-tests/ --filter "FullyQualifiedName~EventShareServiceTests" --verbosity normal
  ```
  Expected: all tests green. If any fail, fix the implementation before proceeding.

**Commit checkpoint:**
```
feat: implement EventShareService with full permission and notification logic (Phase58C)
```

---

## Chunk 4: Extend EventService and EventDto

### Task 9: Write failing integration tests for EventService with shares

**Files:**
- Create: `apps/finance-api-tests/FinanceApi.UnitTests/Features/Events/Services/EventServiceShareIntegrationTests.cs`

- [ ] Step 1: Create the test file. These tests verify that `GetEventsAsync` correctly merges owned events with accepted shared events:

```csharp
using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Auth.Models;
using FinanceApi.Features.Events.Models;
using FinanceApi.Features.Events.Services;
using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;

namespace FinanceApi.UnitTests.Features.Events.Services;

/// <summary>
/// Tests that verify EventService.GetEventsAsync merges owned and shared (Accepted) events correctly.
/// These are integration-style tests using InMemoryDatabase.
/// </summary>
public class EventServiceShareIntegrationTests : IDisposable
{
    private readonly FinanceDbContext _context;
    private readonly Mock<IActivityLogService> _mockActivityLogService;
    private readonly EventService _eventService;
    private readonly User _owner;
    private readonly User _shareRecipient;

    public EventServiceShareIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new FinanceDbContext(options);
        _mockActivityLogService = new Mock<IActivityLogService>();
        _eventService = new EventService(_context, _mockActivityLogService.Object);

        _owner = new User { Id = Guid.NewGuid(), Email = "owner@test.com", Username = "owner", PasswordHash = "h", EmailVerified = true };
        _shareRecipient = new User { Id = Guid.NewGuid(), Email = "recipient@test.com", Username = "recipient", PasswordHash = "h", EmailVerified = true };
        _context.Users.AddRange(_owner, _shareRecipient);
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    private Event CreateEvent(Guid userId, string title) => new Event
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Title = title,
        StartDate = DateTime.UtcNow.AddDays(1),
        EndDate = DateTime.UtcNow.AddDays(1).AddHours(2),
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    [Fact]
    public async System.Threading.Tasks.Task GetEventsAsync_IncludesAcceptedSharedEvents()
    {
        var ownedEvent = CreateEvent(_shareRecipient.Id, "My Own Event");
        var sharedEvent = CreateEvent(_owner.Id, "Shared With Me");
        _context.Events.AddRange(ownedEvent, sharedEvent);

        _context.EventShares.Add(new EventShare
        {
            Id = Guid.NewGuid(),
            EventId = sharedEvent.Id,
            SharedByUserId = _owner.Id,
            SharedWithUserId = _shareRecipient.Id,
            Permission = SharePermission.View,
            Status = ShareStatus.Accepted
        });
        await _context.SaveChangesAsync();

        var result = await _eventService.GetEventsAsync(_shareRecipient.Id);

        result.Should().HaveCount(2);
        result.Should().Contain(e => e.Title == "My Own Event");
        result.Should().Contain(e => e.Title == "Shared With Me");
    }

    [Fact]
    public async System.Threading.Tasks.Task GetEventsAsync_DoesNotIncludePendingSharedEvents()
    {
        var sharedEvent = CreateEvent(_owner.Id, "Pending Shared Event");
        _context.Events.Add(sharedEvent);

        _context.EventShares.Add(new EventShare
        {
            Id = Guid.NewGuid(),
            EventId = sharedEvent.Id,
            SharedByUserId = _owner.Id,
            SharedWithUserId = _shareRecipient.Id,
            Permission = SharePermission.View,
            Status = ShareStatus.Pending
        });
        await _context.SaveChangesAsync();

        var result = await _eventService.GetEventsAsync(_shareRecipient.Id);

        result.Should().BeEmpty();
    }

    [Fact]
    public async System.Threading.Tasks.Task GetEventsAsync_DoesNotIncludeDeclinedSharedEvents()
    {
        var sharedEvent = CreateEvent(_owner.Id, "Declined Shared Event");
        _context.Events.Add(sharedEvent);

        _context.EventShares.Add(new EventShare
        {
            Id = Guid.NewGuid(),
            EventId = sharedEvent.Id,
            SharedByUserId = _owner.Id,
            SharedWithUserId = _shareRecipient.Id,
            Permission = SharePermission.View,
            Status = ShareStatus.Declined
        });
        await _context.SaveChangesAsync();

        var result = await _eventService.GetEventsAsync(_shareRecipient.Id);

        result.Should().BeEmpty();
    }

    [Fact]
    public async System.Threading.Tasks.Task GetEventsAsync_IsOwner_TrueForOwnedEvents()
    {
        var ownedEvent = CreateEvent(_owner.Id, "Owned Event");
        _context.Events.Add(ownedEvent);
        await _context.SaveChangesAsync();

        var result = await _eventService.GetEventsAsync(_owner.Id);

        result.Should().HaveCount(1);
        result[0].IsOwner.Should().BeTrue();
    }

    [Fact]
    public async System.Threading.Tasks.Task GetEventsAsync_IsOwner_FalseForSharedEvents()
    {
        var sharedEvent = CreateEvent(_owner.Id, "Shared Event");
        _context.Events.Add(sharedEvent);

        _context.EventShares.Add(new EventShare
        {
            Id = Guid.NewGuid(),
            EventId = sharedEvent.Id,
            SharedByUserId = _owner.Id,
            SharedWithUserId = _shareRecipient.Id,
            Permission = SharePermission.Edit,
            Status = ShareStatus.Accepted
        });
        await _context.SaveChangesAsync();

        var result = await _eventService.GetEventsAsync(_shareRecipient.Id);

        result.Should().HaveCount(1);
        result[0].IsOwner.Should().BeFalse();
    }

    [Fact]
    public async System.Threading.Tasks.Task GetEventsAsync_MyPermission_ReflectsSharePermission()
    {
        var sharedEvent = CreateEvent(_owner.Id, "Shared Event");
        _context.Events.Add(sharedEvent);

        _context.EventShares.Add(new EventShare
        {
            Id = Guid.NewGuid(),
            EventId = sharedEvent.Id,
            SharedByUserId = _owner.Id,
            SharedWithUserId = _shareRecipient.Id,
            Permission = SharePermission.Manage,
            Status = ShareStatus.Accepted
        });
        await _context.SaveChangesAsync();

        var result = await _eventService.GetEventsAsync(_shareRecipient.Id);

        result[0].MyPermission.Should().Be(SharePermission.Manage);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetEventsAsync_MyPermission_IsNullForOwnedEvents()
    {
        var ownedEvent = CreateEvent(_owner.Id, "Owned Event");
        _context.Events.Add(ownedEvent);
        await _context.SaveChangesAsync();

        var result = await _eventService.GetEventsAsync(_owner.Id);

        result[0].MyPermission.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task GetEventsAsync_SharedBy_PopulatedForSharedEvents()
    {
        var sharedEvent = CreateEvent(_owner.Id, "Shared Event");
        _context.Events.Add(sharedEvent);

        _context.EventShares.Add(new EventShare
        {
            Id = Guid.NewGuid(),
            EventId = sharedEvent.Id,
            SharedByUserId = _owner.Id,
            SharedWithUserId = _shareRecipient.Id,
            Permission = SharePermission.View,
            Status = ShareStatus.Accepted
        });
        await _context.SaveChangesAsync();

        var result = await _eventService.GetEventsAsync(_shareRecipient.Id);

        result[0].SharedBy.Should().NotBeNull();
        result[0].SharedBy!.Id.Should().Be(_owner.Id);
    }
}
```

- [ ] Step 2: Run `dotnet test apps/finance-api-tests/ --filter "FullyQualifiedName~EventServiceShareIntegrationTests"` — confirm **build failure** (`IsOwner`, `SharedBy`, `MyPermission` not on `EventDto` yet).

---

### Task 10: Add sharing fields to `EventDto`

**Files:**
- Modify: `apps/finance-api/Features/Events/DTOs/EventDtos.cs`

- [ ] Step 1: Add three new optional fields to `EventDto`. Add a using directive for `SharePermission`:

```csharp
// Add at top of file:
using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Events.DTOs; // for UserSummaryDto (already in same namespace)
```

Add to the `EventDto` class body, after `UpdatedAt`:

```csharp
// Sharing metadata — populated when caller is not the event owner
public bool IsOwner { get; set; } = true;
public UserSummaryDto? SharedBy { get; set; }
public SharePermission? MyPermission { get; set; }
```

> Note: `UserSummaryDto` is in the same namespace (`FinanceApi.Features.Events.DTOs`) — no extra using required.

- [ ] Step 2: Run `dotnet build apps/finance-api/` — confirm zero errors.

---

### Task 11: Extend `EventService` to include accepted shared events

**Files:**
- Modify: `apps/finance-api/Features/Events/Services/EventService.cs`

- [ ] Step 1: In `GetEventsAsync`, after fetching owned events, also fetch events shared (Accepted) with the user and merge the two lists. Replace the existing method body with:

```csharp
public async System.Threading.Tasks.Task<List<EventDto>> GetEventsAsync(
    Guid userId,
    DateTime? startDate = null,
    DateTime? endDate = null,
    Guid? groupId = null)
{
    // ── Owned events ──────────────────────────────────────────────────
    var ownedQuery = _context.Events
        .Include(e => e.Group)
        .Where(e => e.UserId == userId);

    if (startDate.HasValue)
    {
        var startUtc = DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc);
        ownedQuery = ownedQuery.Where(e => e.EndDate >= startUtc);
    }
    if (endDate.HasValue)
    {
        var endUtc = DateTime.SpecifyKind(endDate.Value, DateTimeKind.Utc);
        ownedQuery = ownedQuery.Where(e => e.StartDate <= endUtc);
    }
    if (groupId.HasValue)
    {
        ownedQuery = ownedQuery.Where(e => e.GroupId == groupId.Value);
    }

    var ownedEvents = await ownedQuery.OrderBy(e => e.StartDate).ToListAsync();

    // ── Accepted shared events ────────────────────────────────────────
    var acceptedShares = await _context.EventShares
        .Include(s => s.Event)
            .ThenInclude(e => e.Group)
        .Where(s => s.SharedWithUserId == userId && s.Status == ShareStatus.Accepted)
        .ToListAsync();

    // Apply same date/group filters to shared events
    var filteredShares = acceptedShares
        .Where(s =>
            (!startDate.HasValue || s.Event.EndDate >= DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc)) &&
            (!endDate.HasValue   || s.Event.StartDate <= DateTime.SpecifyKind(endDate.Value, DateTimeKind.Utc)) &&
            (!groupId.HasValue   || s.Event.GroupId == groupId.Value))
        .OrderBy(s => s.Event.StartDate)
        .ToList();

    // ── Build result ─────────────────────────────────────────────────
    var eventDtos = new List<EventDto>();

    foreach (var eventEntity in ownedEvents)
    {
        var dto = await MapToEventDtoAsync(eventEntity);
        dto.IsOwner = true;
        eventDtos.Add(dto);
    }

    foreach (var share in filteredShares)
    {
        var dto = await MapToEventDtoAsync(share.Event);
        dto.IsOwner = false;
        dto.MyPermission = share.Permission;

        var sharer = await _context.Users.FindAsync(share.SharedByUserId);
        dto.SharedBy = sharer == null ? null : new UserSummaryDto { Id = sharer.Id, Username = sharer.Username };

        eventDtos.Add(dto);
    }

    return eventDtos.OrderBy(e => e.StartDate).ToList();
}
```

- [ ] Step 2: Add the required using statement at the top of `EventService.cs` if not already present:

```csharp
using FinanceApi.Features.Tasks.Models; // ShareStatus, SharePermission
using FinanceApi.Features.Events.DTOs;  // UserSummaryDto (already in same file's namespace usually)
```

- [ ] Step 3: Also update `GetEventByIdAsync` to support fetching a shared event by ID (so that `GET /api/v1/events/{id}` works for share recipients). Replace the method:

```csharp
public async System.Threading.Tasks.Task<EventDto?> GetEventByIdAsync(Guid userId, Guid eventId)
{
    // Try as owner first
    var eventEntity = await _context.Events
        .Include(e => e.Group)
        .FirstOrDefaultAsync(e => e.Id == eventId && e.UserId == userId);

    if (eventEntity != null)
    {
        var dto = await MapToEventDtoAsync(eventEntity);
        dto.IsOwner = true;
        return dto;
    }

    // Try as accepted share recipient
    var share = await _context.EventShares
        .Include(s => s.Event)
            .ThenInclude(e => e.Group)
        .FirstOrDefaultAsync(s => s.EventId == eventId
            && s.SharedWithUserId == userId
            && s.Status == ShareStatus.Accepted);

    if (share == null)
        return null;

    var sharedDto = await MapToEventDtoAsync(share.Event);
    sharedDto.IsOwner = false;
    sharedDto.MyPermission = share.Permission;
    var sharer = await _context.Users.FindAsync(share.SharedByUserId);
    sharedDto.SharedBy = sharer == null ? null : new UserSummaryDto { Id = sharer.Id, Username = sharer.Username };
    return sharedDto;
}
```

- [ ] Step 4: Run `dotnet build apps/finance-api/` — confirm zero errors.

- [ ] Step 5: Run all EventService share integration tests:
  ```bash
  dotnet test apps/finance-api-tests/ --filter "FullyQualifiedName~EventServiceShareIntegrationTests" --verbosity normal
  ```
  Expected: all 8 tests green.

- [ ] Step 6: Run the full existing event service test suite to confirm no regressions:
  ```bash
  dotnet test apps/finance-api-tests/ --filter "FullyQualifiedName~EventServiceTests" --verbosity normal
  ```
  Expected: all existing tests remain green.

**Commit checkpoint:**
```
feat: extend EventService.GetEventsAsync to include accepted shared events; add IsOwner/SharedBy/MyPermission to EventDto (Phase58C)
```

---

## Chunk 5: API Endpoints — EventsController Share Sub-Resources

### Task 12: Add share endpoints to `EventsController`

**Files:**
- Modify: `apps/finance-api/Features/Events/Controllers/EventsController.cs`

- [ ] Step 1: Add `IEventShareService` to the constructor and inject it:

```csharp
private readonly IEventService _eventService;
private readonly IEventShareService _eventShareService;

public EventsController(IEventService eventService, IEventShareService eventShareService)
{
    _eventService = eventService;
    _eventShareService = eventShareService;
}
```

- [ ] Step 2: Add the using directives at the top of the file:

```csharp
using FinanceApi.Features.Events.DTOs;
using FinanceApi.Features.Tasks.Models;
```

- [ ] Step 3: Append the four sharing actions to the controller class (before the closing `}`). Do not add a `[Route]` attribute — actions use the existing `[Route("api/v1/events")]` from the class:

```csharp
/// <summary>
/// Share an event with another user.
/// Caller must be the event owner or have Manage permission.
/// </summary>
/// <param name="id">The event ID.</param>
/// <param name="request">Share request containing the recipient's username or email and permission level.</param>
/// <returns>The created share record.</returns>
[HttpPost("{id}/shares")]
public async System.Threading.Tasks.Task<ActionResult<EventShareDto>> ShareEvent(Guid id, [FromBody] CreateEventShareRequest request)
{
    try
    {
        var userId = GetUserId();
        var share = await _eventShareService.CreateShareAsync(id, userId, request.UsernameOrEmail, request.Permission);
        return CreatedAtAction(nameof(GetEventShares), new { id }, share);
    }
    catch (InvalidOperationException ex)
    {
        return BadRequest(new { error = new { message = ex.Message } });
    }
    catch (UnauthorizedAccessException ex)
    {
        return NotFound(new { error = new { message = ex.Message } });
    }
}

/// <summary>
/// List all shares for an event.
/// Caller must be the event owner or have Manage permission.
/// </summary>
/// <param name="id">The event ID.</param>
/// <returns>All share records for the event.</returns>
[HttpGet("{id}/shares")]
public async System.Threading.Tasks.Task<ActionResult<List<EventShareDto>>> GetEventShares(Guid id)
{
    try
    {
        var userId = GetUserId();
        var shares = await _eventShareService.GetSharesAsync(id, userId);
        return Ok(shares);
    }
    catch (UnauthorizedAccessException ex)
    {
        return NotFound(new { error = new { message = ex.Message } });
    }
}

/// <summary>
/// Update the permission level on an existing share.
/// Caller must be the event owner or have Manage permission.
/// </summary>
/// <param name="id">The event ID.</param>
/// <param name="shareId">The share record ID.</param>
/// <param name="request">The new permission level.</param>
/// <returns>The updated share record.</returns>
[HttpPut("{id}/shares/{shareId}")]
public async System.Threading.Tasks.Task<ActionResult<EventShareDto>> UpdateEventShare(Guid id, Guid shareId, [FromBody] UpdateEventShareRequest request)
{
    try
    {
        var userId = GetUserId();
        var share = await _eventShareService.UpdateSharePermissionAsync(id, shareId, userId, request.Permission);
        return Ok(share);
    }
    catch (UnauthorizedAccessException ex)
    {
        return NotFound(new { error = new { message = ex.Message } });
    }
}

/// <summary>
/// Revoke (delete) a share. Owner can revoke any share; Manage users can only revoke shares they created.
/// </summary>
/// <param name="id">The event ID.</param>
/// <param name="shareId">The share record ID.</param>
/// <returns>No content on success.</returns>
[HttpDelete("{id}/shares/{shareId}")]
public async System.Threading.Tasks.Task<IActionResult> DeleteEventShare(Guid id, Guid shareId)
{
    try
    {
        var userId = GetUserId();
        await _eventShareService.DeleteShareAsync(id, shareId, userId);
        return NoContent();
    }
    catch (InvalidOperationException ex)
    {
        return BadRequest(new { error = new { message = ex.Message } });
    }
    catch (UnauthorizedAccessException ex)
    {
        return NotFound(new { error = new { message = ex.Message } });
    }
}
```

- [ ] Step 4: Run `dotnet build apps/finance-api/` — confirm zero errors.

---

## Chunk 6: SharingController for Invitation Inbox

### Task 13: Create `SharingController`

**Files:**
- Create: `apps/finance-api/Features/Sharing/Controllers/SharingController.cs`

- [ ] Step 1: Create the directory `apps/finance-api/Features/Sharing/Controllers/` if it does not already exist.

- [ ] Step 2: Create the controller file. This controller handles the invitation inbox — it does not repeat routes from `EventsController`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinanceApi.Features.Events.Services;
using FinanceApi.Features.Events.DTOs;
using System.Security.Claims;

namespace FinanceApi.Features.Sharing.Controllers;

/// <summary>
/// Manages the invitation inbox — listing, accepting, and declining event share invitations.
/// Invitations are created via POST /api/v1/events/{id}/shares.
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/sharing")]
public class SharingController : ControllerBase
{
    private readonly IEventShareService _eventShareService;

    /// <summary>
    /// Initializes a new instance of the <see cref="SharingController"/> class.
    /// </summary>
    public SharingController(IEventShareService eventShareService)
    {
        _eventShareService = eventShareService;
    }

    /// <summary>
    /// Get all pending event invitations for the authenticated user.
    /// </summary>
    /// <returns>A list of pending invitations.</returns>
    [HttpGet("invitations")]
    public async System.Threading.Tasks.Task<ActionResult<List<EventShareInvitationDto>>> GetInvitations()
    {
        var userId = GetUserId();
        var invitations = await _eventShareService.GetPendingInvitationsAsync(userId);
        return Ok(invitations);
    }

    /// <summary>
    /// Accept a pending event invitation.
    /// </summary>
    /// <param name="shareId">The share record ID.</param>
    /// <returns>No content on success.</returns>
    [HttpPost("invitations/{shareId}/accept")]
    public async System.Threading.Tasks.Task<IActionResult> AcceptInvitation(Guid shareId)
    {
        try
        {
            var userId = GetUserId();
            await _eventShareService.AcceptInvitationAsync(shareId, userId);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
        catch (UnauthorizedAccessException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
    }

    /// <summary>
    /// Decline a pending event invitation.
    /// </summary>
    /// <param name="shareId">The share record ID.</param>
    /// <returns>No content on success.</returns>
    [HttpPost("invitations/{shareId}/decline")]
    public async System.Threading.Tasks.Task<IActionResult> DeclineInvitation(Guid shareId)
    {
        try
        {
            var userId = GetUserId();
            await _eventShareService.DeclineInvitationAsync(shareId, userId);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
        catch (UnauthorizedAccessException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value
                   ?? throw new UnauthorizedAccessException());
}
```

- [ ] Step 3: Run `dotnet build apps/finance-api/` — confirm zero errors.

---

### Task 14: Register `IEventShareService` in DI

**Files:**
- Modify: `apps/finance-api/Program.cs`

- [ ] Step 1: Open `apps/finance-api/Program.cs` and locate the section where services are registered (where `IEventService` is registered).

- [ ] Step 2: Add the registration immediately after `IEventService`:

```csharp
builder.Services.AddScoped<IEventShareService, EventShareService>();
```

- [ ] Step 3: Run `dotnet build apps/finance-api/` — confirm zero errors.

- [ ] Step 4: Verify the full solution builds:
  ```bash
  dotnet build
  ```

**Commit checkpoint:**
```
feat: add SharingController invitation inbox endpoints and DI registration for IEventShareService (Phase58D)
```

---

## Chunk 7: Full Test Suite Verification and Final Commit

### Task 15: Run complete test suite and verify green

**Files:**
- No changes — verification only.

- [ ] Step 1: Run all backend unit tests:
  ```bash
  dotnet test apps/finance-api-tests/FinanceApi.UnitTests/ --verbosity normal
  ```
  Expected output pattern:
  ```
  Passed! - Failed: 0, Passed: <N>, Skipped: 0, Total: <N>
  ```

- [ ] Step 2: Run all backend integration tests:
  ```bash
  dotnet test apps/finance-api-tests/FinanceApi.IntegrationTests/ --verbosity normal
  ```
  Expected: zero failures.

- [ ] Step 3: Run the full test suite from the solution root to confirm nothing regressed:
  ```bash
  dotnet test --verbosity quiet
  ```
  Expected: all 300+ tests pass.

- [ ] Step 4: Confirm the API builds in Release mode:
  ```bash
  dotnet build apps/finance-api/ --configuration Release
  ```
  Expected: zero errors, zero warnings about missing references.

---

### Task 16: Apply EF Core migration to development database

- [ ] Step 1: Ensure Docker PostgreSQL container is running (via `.\start-dev.ps1` from project root if needed).
- [ ] Step 2: From `apps/finance-api/`, apply the migration:
  ```bash
  dotnet ef database update
  ```
- [ ] Step 3: Verify the `event_shares` table exists in the database with expected columns and constraints.

---

### Task 17: Swagger / OpenAPI manual smoke test

- [ ] Step 1: Start the API (`dotnet run` from `apps/finance-api/` or via `.\start-dev.ps1`).
- [ ] Step 2: Open `https://localhost:<port>/swagger`.
- [ ] Step 3: Confirm the following endpoints appear in the Events section:
  - `POST /api/v1/events/{id}/shares`
  - `GET /api/v1/events/{id}/shares`
  - `PUT /api/v1/events/{id}/shares/{shareId}`
  - `DELETE /api/v1/events/{id}/shares/{shareId}`
- [ ] Step 4: Confirm the following endpoints appear in the Sharing section:
  - `GET /api/v1/sharing/invitations`
  - `POST /api/v1/sharing/invitations/{shareId}/accept`
  - `POST /api/v1/sharing/invitations/{shareId}/decline`
- [ ] Step 5: Confirm `GET /api/v1/events` response schema includes `isOwner`, `sharedBy`, `myPermission` fields.

---

**Final commit:**
```
feat: complete Phase 58C+D event sharing backend — EventShare entity, EventShareService, SharingController, shared events in EventService (Phase58)
```

---

## Summary

### New files created
| File | Purpose |
|------|---------|
| `apps/finance-api/Features/Events/Models/EventShare.cs` | `EventShare` entity mapped to `event_shares` table |
| `apps/finance-api/Features/Events/DTOs/EventShareDtos.cs` | `CreateEventShareRequest`, `UpdateEventShareRequest`, `EventShareDto`, `EventShareInvitationDto`, `UserSummaryDto` |
| `apps/finance-api/Features/Events/Services/EventShareService.cs` | `IEventShareService` + `EventShareService` implementation |
| `apps/finance-api/Features/Sharing/Controllers/SharingController.cs` | Invitation inbox at `api/v1/sharing/invitations` |
| `apps/finance-api/Migrations/<ts>_AddEventShareTable.cs` | Migration creating `event_shares` table |
| `apps/finance-api-tests/FinanceApi.UnitTests/Features/Events/Services/EventShareServiceTests.cs` | 20+ unit tests for `EventShareService` |
| `apps/finance-api-tests/FinanceApi.UnitTests/Features/Events/Services/EventServiceShareIntegrationTests.cs` | 8 integration-style tests for shared event merging in `EventService` |

### Modified files
| File | Change |
|------|--------|
| `apps/finance-api/Data/FinanceDbContext.cs` | `DbSet<EventShare>`, entity configuration, unique index on `(event_id, shared_with_user_id)` |
| `apps/finance-api/Features/Events/Controllers/EventsController.cs` | 4 share sub-resource actions; `IEventShareService` injection |
| `apps/finance-api/Features/Events/DTOs/EventDtos.cs` | `IsOwner`, `SharedBy`, `MyPermission` added to `EventDto` |
| `apps/finance-api/Features/Events/Services/EventService.cs` | `GetEventsAsync` merges owned + accepted shared events; `GetEventByIdAsync` handles share recipients |
| `apps/finance-api/Program.cs` | `IEventShareService` scoped registration |

### Key design decisions
- **Load-and-mutate pattern** — `ExecuteUpdateAsync` and `ExecuteDeleteAsync` are NOT used anywhere, because the EF Core InMemory test provider does not support them. All mutations use fetch → mutate → `SaveChangesAsync`.
- **Single unique constraint** on `(EventId, SharedWithUserId)` prevents duplicate invitations at the database level; the service also checks before insert for a user-friendly 400 error.
- **Permission model** — Manage users can share further and revoke only shares they personally created. The owner has unconditional access to all share management operations.
- **Cascade delete** — deleting an `Event` cascades to all its `EventShare` records. Deleting a user (`SharedWith`) also cascades. Deleting the sharer (`SharedBy`) is Restrict — the event owner must be deleted via the Event cascade path.
- **Notification dispatch** — all four notification types (`ShareInvitation`, `ShareAccepted`, `ShareDeclined`, `ShareRevoked`) are dispatched via `INotificationService` from Plan 1 with `NotificationEntityType.Event`.
