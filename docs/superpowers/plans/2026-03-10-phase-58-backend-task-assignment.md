# Phase 58 Backend: Task Assignment & Notifications — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add task assignment (one assignee per task) and an in-app notification system to the backend API, with dual-perspective reporting in statistics.

**Architecture:** A new nullable `AssignedToUserId` FK is added to the `Task` entity. A new `Notification` entity stores user-facing events (task assigned, unassigned, completed by assignee). `TaskService` is extended to include assigned tasks in queries; `StatisticsService` gains delegated/assigned-to-me fields. Two new controllers are added: assign/unassign actions on `TasksController` and a new `NotificationsController`.

**Tech Stack:** .NET 8 / C# 12, EF Core 8, PostgreSQL 15, xUnit, Moq, FluentAssertions, InMemoryDatabase for unit tests.

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `apps/finance-api/Features/Notifications/Models/Notification.cs` | Notification entity + enums (NotificationType, NotificationEntityType) |
| `apps/finance-api/Features/Notifications/Services/NotificationService.cs` | Create/query/mark-read notifications |
| `apps/finance-api/Features/Notifications/Controllers/NotificationsController.cs` | GET list, PATCH read, PATCH read-all, GET unread-count |
| `apps/finance-api/Features/Notifications/DTOs/NotificationDto.cs` | API response shape |
| `apps/finance-api/Features/Tasks/Services/TaskPermissionService.cs` | CanEdit / CanAssign / CanDelete permission checks |
| `apps/finance-api-tests/FinanceApi.UnitTests/Features/Notifications/NotificationServiceTests.cs` | Unit tests for notification service |
| `apps/finance-api-tests/FinanceApi.UnitTests/Features/Tasks/TaskPermissionServiceTests.cs` | Unit tests for permission helper |
| `apps/finance-api-tests/FinanceApi.IntegrationTests/Features/Tasks/TaskAssignmentTests.cs` | Integration tests for assign/unassign flow |

### Modified files
| File | Change |
|------|--------|
| `apps/finance-api/Features/Tasks/Models/Task.cs` | Add `AssignedToUserId`, `AssignedTo` navigation property |
| `apps/finance-api/Features/Tasks/Models/TaskGroupShare.cs` | Add `Manage` to `SharePermission` enum; add `ShareStatus` enum |
| `apps/finance-api/Data/FinanceDbContext.cs` | Add `DbSet<Notification>`, configure Task.AssignedToUserId FK + index |
| `apps/finance-api/Features/Tasks/Services/TaskService.cs` | Include assigned tasks in `GetTasksAsync`; add view filter; dispatch notifications on completion |
| `apps/finance-api/Features/Tasks/Controllers/TasksController.cs` | Add `PATCH /{id}/assign` and `PATCH /{id}/unassign`; update write endpoints to check assignee |
| `apps/finance-api/Features/Tasks/DTOs/TaskDtos.cs` | Add `IsOwner`, `AssignedTo`, `AssignedBy` fields |
| `apps/finance-api/Features/Statistics/Services/StatisticsService.cs` | Add `Delegated` and `AssignedToMe` to weekly stats response |
| `apps/finance-api/Features/Statistics/DTOs/WeeklyStatsDto.cs` | Add new stat fields |
| `apps/finance-api/Program.cs` | Register `INotificationService`, `ITaskPermissionService` |

---

## Chunk 1: Database Entities & Migrations

### Task 1: Add ShareStatus enum and Manage permission

**Files:**
- Modify: `apps/finance-api/Features/Tasks/Models/TaskGroupShare.cs`

- [ ] **Step 1: Update the SharePermission enum and add ShareStatus**

Open `apps/finance-api/Features/Tasks/Models/TaskGroupShare.cs` and make these changes:

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FinanceApi.Features.Auth.Models;

namespace FinanceApi.Features.Tasks.Models;

public enum SharePermission
{
    View,
    Edit,
    Manage   // NEW: can share with others and revoke shares
}

public enum ShareStatus
{
    Pending,
    Accepted,
    Declined
}

[Table("task_group_shares")]
public class TaskGroupShare
{
    // ... rest of class unchanged
}
```

- [ ] **Step 2: Verify the project still builds**

```bash
cd "C:\Projects\Finance Manager\apps\finance-api"
dotnet build --no-restore 2>&1 | tail -5
```
Expected: `Build succeeded. 0 Warning(s) 0 Error(s)`

- [ ] **Step 3: Commit**

```bash
cd "C:\Projects\Finance Manager"
git add apps/finance-api/Features/Tasks/Models/TaskGroupShare.cs
git commit -m "feat: add Manage to SharePermission and add ShareStatus enum (T1504)"
```

---

### Task 2: Add AssignedToUserId to Task entity

**Files:**
- Modify: `apps/finance-api/Features/Tasks/Models/Task.cs`

- [ ] **Step 1: Add the new field and navigation property**

In `apps/finance-api/Features/Tasks/Models/Task.cs`, add after the `UpdatedAt` property (before navigation properties):

```csharp
    [Column("assigned_to_user_id")]
    public Guid? AssignedToUserId { get; set; }
```

And add after the existing `User` navigation property:

```csharp
    [ForeignKey(nameof(AssignedToUserId))]
    public User? AssignedTo { get; set; }
```

- [ ] **Step 2: Verify build**

```bash
cd "C:\Projects\Finance Manager\apps\finance-api"
dotnet build --no-restore 2>&1 | tail -5
```
Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
cd "C:\Projects\Finance Manager"
git add apps/finance-api/Features/Tasks/Models/Task.cs
git commit -m "feat: add AssignedToUserId field to Task entity (T1505)"
```

---

### Task 3: Create Notification entity

**Files:**
- Create: `apps/finance-api/Features/Notifications/Models/Notification.cs`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p "C:\Projects\Finance Manager\apps\finance-api\Features\Notifications\Models"
```

Create `apps/finance-api/Features/Notifications/Models/Notification.cs`:

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FinanceApi.Features.Auth.Models;

namespace FinanceApi.Features.Notifications.Models;

public enum NotificationType
{
    TaskAssigned,
    TaskUnassigned,
    TaskCompleted,    // Assignee completed owner's task
    ShareInvitation,  // Event share invite sent
    ShareAccepted,
    ShareDeclined,
    ShareRevoked
}

public enum NotificationEntityType
{
    Task,
    Event
}

[Table("notifications")]
public class Notification
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Required]
    [Column("type")]
    public NotificationType Type { get; set; }

    [Required]
    [Column("entity_type")]
    public NotificationEntityType EntityType { get; set; }

    [Required]
    [Column("entity_id")]
    public Guid EntityId { get; set; }

    /// <summary>
    /// Snapshot of the entity title at the time the notification was created.
    /// Displayed even if the entity is later renamed or deleted.
    /// </summary>
    [Required]
    [Column("entity_title")]
    [MaxLength(500)]
    public string EntityTitle { get; set; } = string.Empty;

    [Required]
    [Column("from_user_id")]
    public Guid FromUserId { get; set; }

    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [ForeignKey(nameof(FromUserId))]
    public User FromUser { get; set; } = null!;
}
```

- [ ] **Step 2: Verify build**

```bash
cd "C:\Projects\Finance Manager\apps\finance-api"
dotnet build --no-restore 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd "C:\Projects\Finance Manager"
git add apps/finance-api/Features/Notifications/
git commit -m "feat: add Notification entity with NotificationType and NotificationEntityType enums (T1506)"
```

---

### Task 4: Update FinanceDbContext

**Files:**
- Modify: `apps/finance-api/Data/FinanceDbContext.cs`

- [ ] **Step 1: Add Notification using statement**

At the top of `FinanceDbContext.cs`, add:
```csharp
using FinanceApi.Features.Notifications.Models;
```

- [ ] **Step 2: Add the DbSet**

In the `// Todo/Auth domain` section, add after the existing DbSets:
```csharp
    public DbSet<Notification> Notifications { get; set; }
```

- [ ] **Step 3: Configure Task.AssignedToUserId in OnModelCreating**

Find the Task configuration block in `OnModelCreating`. Add these lines inside the `modelBuilder.Entity<FinanceApi.Features.Tasks.Models.Task>(entity =>` block (after existing index configurations):

```csharp
            // Assignment FK - SET NULL when assignee user is deleted (task is preserved)
            entity.HasOne(t => t.AssignedTo)
                .WithMany()
                .HasForeignKey(t => t.AssignedToUserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(t => t.AssignedToUserId)
                .HasDatabaseName("IX_tasks_assigned_to_user_id");
```

- [ ] **Step 4: Configure Notification entity in OnModelCreating**

Add a new configuration block (before the closing brace of `OnModelCreating`):

```csharp
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("notifications");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.Type).HasColumnName("type").IsRequired();
            entity.Property(e => e.EntityType).HasColumnName("entity_type").IsRequired();
            entity.Property(e => e.EntityId).HasColumnName("entity_id").IsRequired();
            entity.Property(e => e.EntityTitle).HasColumnName("entity_title").HasMaxLength(500).IsRequired();
            entity.Property(e => e.FromUserId).HasColumnName("from_user_id").IsRequired();
            entity.Property(e => e.IsRead).HasColumnName("is_read");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(n => n.FromUser)
                .WithMany()
                .HasForeignKey(n => n.FromUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Optimise for "get my unread notifications" query
            entity.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt })
                .HasDatabaseName("IX_notifications_user_read_created");
        });
```

- [ ] **Step 5: Verify build**

```bash
cd "C:\Projects\Finance Manager\apps\finance-api"
dotnet build --no-restore 2>&1 | tail -5
```
Expected: `Build succeeded.`

- [ ] **Step 6: Commit**

```bash
cd "C:\Projects\Finance Manager"
git add apps/finance-api/Data/FinanceDbContext.cs
git commit -m "feat: configure Notification and Task.AssignedToUserId in DbContext (T1507)"
```

---

### Task 5: Create and apply EF Core migrations

**Files:**
- Create: `apps/finance-api/Migrations/` (auto-generated)

- [ ] **Step 1: Add a single combined migration for all Phase 58A changes**

> **Important:** Both entity changes (Task.AssignedToUserId and Notification table) are already in the DbContext model, so EF Core will capture both in one migration. Do NOT run two separate migrations — the second would be empty.

```bash
cd "C:\Projects\Finance Manager\apps\finance-api"
dotnet ef migrations add AddTaskAssignmentAndNotifications
```
Expected: One migration file created in `Migrations/` capturing both changes.

- [ ] **Step 2: Apply migration to dev database**

```bash
dotnet ef database update
```
Expected: `Done.` — migration applied.

- [ ] **Step 3: Verify database tables exist**

```bash
docker exec life-manager-db psql -U postgres -d finance_manager_dev -c "\dt" | grep -E "notifications|tasks"
```
Expected: `notifications` and `tasks` appear in the list.

- [ ] **Step 5: Commit**

```bash
cd "C:\Projects\Finance Manager"
git add apps/finance-api/Migrations/
git commit -m "feat: add EF Core migration for task assignment and notifications (T1508)"
```

---

## Chunk 2: Services

### Task 6: Create TaskPermissionService

**Files:**
- Create: `apps/finance-api/Features/Tasks/Services/TaskPermissionService.cs`
- Create: `apps/finance-api-tests/FinanceApi.UnitTests/Features/Tasks/TaskPermissionServiceTests.cs`

- [ ] **Step 1: Write the failing tests first**

Create `apps/finance-api-tests/FinanceApi.UnitTests/Features/Tasks/TaskPermissionServiceTests.cs`:

```csharp
using Xunit;
using FluentAssertions;
using FinanceApi.Features.Tasks.Services;
using TaskModel = FinanceApi.Features.Tasks.Models.Task;

namespace FinanceApi.UnitTests.Features.Tasks;

public class TaskPermissionServiceTests
{
    private readonly ITaskPermissionService _sut = new TaskPermissionService();

    private static TaskModel MakeTask(Guid ownerId, Guid? assigneeId = null) =>
        new TaskModel { Id = Guid.NewGuid(), UserId = ownerId, AssignedToUserId = assigneeId };

    [Fact]
    public void CanEdit_Owner_ReturnsTrue()
    {
        var ownerId = Guid.NewGuid();
        var task = MakeTask(ownerId);
        _sut.CanEdit(ownerId, task).Should().BeTrue();
    }

    [Fact]
    public void CanEdit_Assignee_ReturnsTrue()
    {
        var ownerId = Guid.NewGuid();
        var assigneeId = Guid.NewGuid();
        var task = MakeTask(ownerId, assigneeId);
        _sut.CanEdit(assigneeId, task).Should().BeTrue();
    }

    [Fact]
    public void CanEdit_RandomUser_ReturnsFalse()
    {
        var task = MakeTask(Guid.NewGuid(), Guid.NewGuid());
        _sut.CanEdit(Guid.NewGuid(), task).Should().BeFalse();
    }

    [Fact]
    public void CanAssign_Owner_ReturnsTrue()
    {
        var ownerId = Guid.NewGuid();
        var task = MakeTask(ownerId);
        _sut.CanAssign(ownerId, task).Should().BeTrue();
    }

    [Fact]
    public void CanAssign_Assignee_ReturnsFalse()
    {
        var ownerId = Guid.NewGuid();
        var assigneeId = Guid.NewGuid();
        var task = MakeTask(ownerId, assigneeId);
        _sut.CanAssign(assigneeId, task).Should().BeFalse();
    }

    [Fact]
    public void CanDelete_Owner_ReturnsTrue()
    {
        var ownerId = Guid.NewGuid();
        var task = MakeTask(ownerId);
        _sut.CanDelete(ownerId, task).Should().BeTrue();
    }

    [Fact]
    public void CanDelete_Assignee_ReturnsFalse()
    {
        var ownerId = Guid.NewGuid();
        var assigneeId = Guid.NewGuid();
        var task = MakeTask(ownerId, assigneeId);
        _sut.CanDelete(assigneeId, task).Should().BeFalse();
    }

    [Fact]
    public void CanAddSubtasks_Owner_ReturnsTrue()
    {
        var ownerId = Guid.NewGuid();
        var task = MakeTask(ownerId);
        _sut.CanAddSubtasks(ownerId, task).Should().BeTrue();
    }

    [Fact]
    public void CanAddSubtasks_Assignee_ReturnsTrue()
    {
        var ownerId = Guid.NewGuid();
        var assigneeId = Guid.NewGuid();
        var task = MakeTask(ownerId, assigneeId);
        _sut.CanAddSubtasks(assigneeId, task).Should().BeTrue();
    }

    [Fact]
    public void CanAddSubtasks_RandomUser_ReturnsFalse()
    {
        var task = MakeTask(Guid.NewGuid(), Guid.NewGuid());
        _sut.CanAddSubtasks(Guid.NewGuid(), task).Should().BeFalse();
    }
}
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd "C:\Projects\Finance Manager"
dotnet test apps/finance-api-tests/FinanceApi.UnitTests/ --filter "TaskPermissionServiceTests" 2>&1 | tail -10
```
Expected: FAIL — `ITaskPermissionService` not found.

- [ ] **Step 3: Create the implementation**

Create `apps/finance-api/Features/Tasks/Services/TaskPermissionService.cs`:

```csharp
using TaskModel = FinanceApi.Features.Tasks.Models.Task;

namespace FinanceApi.Features.Tasks.Services;

public interface ITaskPermissionService
{
    /// <summary>Returns true if the user can edit the task's fields and status.</summary>
    bool CanEdit(Guid userId, TaskModel task);

    /// <summary>Returns true if the user can assign or reassign the task. Owner only.</summary>
    bool CanAssign(Guid userId, TaskModel task);

    /// <summary>Returns true if the user can delete the task. Owner only.</summary>
    bool CanDelete(Guid userId, TaskModel task);

    /// <summary>Returns true if the user can add subtasks to this task.</summary>
    bool CanAddSubtasks(Guid userId, TaskModel task);
}

public class TaskPermissionService : ITaskPermissionService
{
    public bool CanEdit(Guid userId, TaskModel task) =>
        task.UserId == userId || task.AssignedToUserId == userId;

    public bool CanAssign(Guid userId, TaskModel task) =>
        task.UserId == userId;

    public bool CanDelete(Guid userId, TaskModel task) =>
        task.UserId == userId;

    public bool CanAddSubtasks(Guid userId, TaskModel task) =>
        task.UserId == userId || task.AssignedToUserId == userId;
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd "C:\Projects\Finance Manager"
dotnet test apps/finance-api-tests/FinanceApi.UnitTests/ --filter "TaskPermissionServiceTests" 2>&1 | tail -10
```
Expected: `Passed! - Failed: 0, Passed: 10`

- [ ] **Step 5: Commit**

```bash
git add apps/finance-api/Features/Tasks/Services/TaskPermissionService.cs \
        apps/finance-api-tests/FinanceApi.UnitTests/Features/Tasks/TaskPermissionServiceTests.cs
git commit -m "feat: add TaskPermissionService with CanEdit/CanAssign/CanDelete (T1509)"
```

---

### Task 7: Create NotificationService

**Files:**
- Create: `apps/finance-api/Features/Notifications/DTOs/NotificationDto.cs`
- Create: `apps/finance-api/Features/Notifications/Services/NotificationService.cs`
- Create: `apps/finance-api-tests/FinanceApi.UnitTests/Features/Notifications/NotificationServiceTests.cs`

- [ ] **Step 1: Create directories**

```bash
mkdir -p "C:\Projects\Finance Manager\apps\finance-api\Features\Notifications\DTOs"
mkdir -p "C:\Projects\Finance Manager\apps\finance-api\Features\Notifications\Services"
mkdir -p "C:\Projects\Finance Manager\apps\finance-api-tests\FinanceApi.UnitTests\Features\Notifications"
```

- [ ] **Step 2: Create the DTO**

Create `apps/finance-api/Features/Notifications/DTOs/NotificationDto.cs`:

```csharp
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
```

- [ ] **Step 3: Write the failing tests**

Create `apps/finance-api-tests/FinanceApi.UnitTests/Features/Notifications/NotificationServiceTests.cs`:

```csharp
using Xunit;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Auth.Models;
using FinanceApi.Features.Notifications.Models;
using FinanceApi.Features.Notifications.Services;

namespace FinanceApi.UnitTests.Features.Notifications;

public class NotificationServiceTests : IDisposable
{
    private readonly FinanceDbContext _context;
    private readonly INotificationService _sut;
    private readonly User _recipient;
    private readonly User _sender;

    public NotificationServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new FinanceDbContext(options);
        _sut = new NotificationService(_context);

        _recipient = new User { Id = Guid.NewGuid(), Email = "recipient@test.com", PasswordHash = "x", EmailVerified = true };
        _sender = new User { Id = Guid.NewGuid(), Email = "sender@test.com", PasswordHash = "x", EmailVerified = true };
        _context.Users.AddRange(_recipient, _sender);
        _context.SaveChanges();
    }

    [Fact]
    public async Task CreateNotification_Persists_ToDatabase()
    {
        await _sut.CreateAsync(_recipient.Id, NotificationType.TaskAssigned,
            NotificationEntityType.Task, Guid.NewGuid(), "My Task", _sender.Id);

        var saved = await _context.Notifications.FirstOrDefaultAsync();
        saved.Should().NotBeNull();
        saved!.UserId.Should().Be(_recipient.Id);
        saved.Type.Should().Be(NotificationType.TaskAssigned);
        saved.EntityTitle.Should().Be("My Task");
        saved.IsRead.Should().BeFalse();
    }

    [Fact]
    public async Task GetNotificationsAsync_ReturnsOnlyRecipientNotifications()
    {
        var otherUser = new User { Id = Guid.NewGuid(), Email = "other@test.com", PasswordHash = "x", EmailVerified = true };
        _context.Users.Add(otherUser);
        await _context.SaveChangesAsync();

        await _sut.CreateAsync(_recipient.Id, NotificationType.TaskAssigned, NotificationEntityType.Task, Guid.NewGuid(), "Task 1", _sender.Id);
        await _sut.CreateAsync(otherUser.Id, NotificationType.TaskAssigned, NotificationEntityType.Task, Guid.NewGuid(), "Task 2", _sender.Id);

        var results = await _sut.GetNotificationsAsync(_recipient.Id);
        results.Should().HaveCount(1);
        results[0].EntityTitle.Should().Be("Task 1");
    }

    [Fact]
    public async Task MarkReadAsync_SetsIsReadTrue()
    {
        await _sut.CreateAsync(_recipient.Id, NotificationType.TaskAssigned, NotificationEntityType.Task, Guid.NewGuid(), "T", _sender.Id);
        var notifications = await _sut.GetNotificationsAsync(_recipient.Id);
        var id = notifications[0].Id;

        await _sut.MarkReadAsync(_recipient.Id, id);

        var updated = await _context.Notifications.FindAsync(id);
        updated!.IsRead.Should().BeTrue();
    }

    [Fact]
    public async Task GetUnreadCountAsync_ReturnsCorrectCount()
    {
        await _sut.CreateAsync(_recipient.Id, NotificationType.TaskAssigned, NotificationEntityType.Task, Guid.NewGuid(), "T1", _sender.Id);
        await _sut.CreateAsync(_recipient.Id, NotificationType.TaskUnassigned, NotificationEntityType.Task, Guid.NewGuid(), "T2", _sender.Id);

        var count = await _sut.GetUnreadCountAsync(_recipient.Id);
        count.Should().Be(2);
    }

    [Fact]
    public async Task MarkAllReadAsync_MarksAllNotificationsRead()
    {
        await _sut.CreateAsync(_recipient.Id, NotificationType.TaskAssigned, NotificationEntityType.Task, Guid.NewGuid(), "T1", _sender.Id);
        await _sut.CreateAsync(_recipient.Id, NotificationType.TaskAssigned, NotificationEntityType.Task, Guid.NewGuid(), "T2", _sender.Id);

        await _sut.MarkAllReadAsync(_recipient.Id);

        var count = await _sut.GetUnreadCountAsync(_recipient.Id);
        count.Should().Be(0);
    }

    public void Dispose() => _context.Dispose();
}
```

- [ ] **Step 4: Run tests — confirm they fail**

```bash
cd "C:\Projects\Finance Manager"
dotnet test apps/finance-api-tests/FinanceApi.UnitTests/ --filter "NotificationServiceTests" 2>&1 | tail -5
```
Expected: FAIL — `INotificationService` not found.

- [ ] **Step 5: Implement NotificationService**

Create `apps/finance-api/Features/Notifications/Services/NotificationService.cs`:

```csharp
using FinanceApi.Data;
using FinanceApi.Features.Notifications.DTOs;
using FinanceApi.Features.Notifications.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Notifications.Services;

public interface INotificationService
{
    Task CreateAsync(Guid recipientUserId, NotificationType type, NotificationEntityType entityType,
        Guid entityId, string entityTitle, Guid fromUserId);

    Task<List<NotificationDto>> GetNotificationsAsync(Guid userId, bool unreadOnly = false,
        int page = 1, int pageSize = 20);

    Task MarkReadAsync(Guid userId, Guid notificationId);
    Task MarkAllReadAsync(Guid userId);
    Task<int> GetUnreadCountAsync(Guid userId);
}

public class NotificationService : INotificationService
{
    private readonly FinanceDbContext _context;

    public NotificationService(FinanceDbContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(Guid recipientUserId, NotificationType type,
        NotificationEntityType entityType, Guid entityId, string entityTitle, Guid fromUserId)
    {
        var notification = new Notification
        {
            UserId = recipientUserId,
            Type = type,
            EntityType = entityType,
            EntityId = entityId,
            EntityTitle = entityTitle,
            FromUserId = fromUserId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    public async Task<List<NotificationDto>> GetNotificationsAsync(Guid userId,
        bool unreadOnly = false, int page = 1, int pageSize = 20)
    {
        var query = _context.Notifications
            .Include(n => n.FromUser)
            .Where(n => n.UserId == userId);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto(
                n.Id,
                n.Type,
                n.EntityType,
                n.EntityId,
                n.EntityTitle,
                new UserSummaryDto(n.FromUser.Id, n.FromUser.Username),
                n.IsRead,
                n.CreatedAt))
            .ToListAsync();
    }

    public async Task MarkReadAsync(Guid userId, Guid notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification != null)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllReadAsync(Guid userId)
    {
        // NOTE: ExecuteUpdateAsync is NOT used here because the InMemory EF Core provider
        // (used in unit tests) does not support bulk-update APIs. Use load-and-update instead.
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();
        foreach (var n in notifications)
            n.IsRead = true;
        await _context.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId) =>
        await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
}
```

- [ ] **Step 6: Run tests — confirm they pass**

```bash
cd "C:\Projects\Finance Manager"
dotnet test apps/finance-api-tests/FinanceApi.UnitTests/ --filter "NotificationServiceTests" 2>&1 | tail -5
```
Expected: `Passed! - Failed: 0, Passed: 5`

- [ ] **Step 7: Commit**

```bash
git add apps/finance-api/Features/Notifications/ \
        apps/finance-api-tests/FinanceApi.UnitTests/Features/Notifications/
git commit -m "feat: add NotificationService with create, query, mark-read (T1510)"
```

---

### Task 8: Update TaskService to include assigned tasks

**Files:**
- Modify: `apps/finance-api/Features/Tasks/Services/TaskService.cs`
- Modify: `apps/finance-api/Features/Tasks/DTOs/TaskDtos.cs`

- [ ] **Step 1: Update ITaskService interface first**

> Interface before implementation — the build won't compile if they drift.

In `TaskService.cs`, find the `ITaskService` interface and update `GetTasksAsync`:
```csharp
Task<List<TaskDto>> GetTasksAsync(
    Guid userId,
    DateTime? startDate = null,
    DateTime? endDate = null,
    string? priority = null,
    Guid? groupId = null,
    bool? completed = null,
    bool? rootOnly = null,
    string? status = null,
    string? view = null);   // NEW
```

- [ ] **Step 2: Update TaskDtos.cs to include assignment fields**

In `apps/finance-api/Features/Tasks/DTOs/TaskDtos.cs`, find `TaskDto` and add these fields, matching the existing `init` property style:

```csharp
// Add to TaskDto:
public bool IsOwner { get; init; }
public AssignmentUserDto? AssignedTo { get; init; }
public AssignmentUserDto? AssignedBy { get; init; }

// Add alongside TaskDto in the same file:
public record AssignmentUserDto(Guid Id, string Username);
```

- [ ] **Step 3: Update GetTasksAsync method signature and WHERE clause**

In `TaskService.cs`, find `GetTasksAsync`. The **actual** existing WHERE clause handles group shares — **do not remove it**. Add `AssignedToUserId` support alongside the existing predicates:

```csharp
// Add string? view = null to the method signature.
// Then replace the existing query initialisation block with:

var viewFilter = view?.ToLower();

IQueryable<FinanceApi.Features.Tasks.Models.Task> query;
if (viewFilter == "mine")
{
    query = _context.Tasks.Include(t => t.Group).Include(t => t.AssignedTo)
        .Where(t => t.UserId == userId);
}
else if (viewFilter == "assigned-to-me")
{
    query = _context.Tasks.Include(t => t.Group).Include(t => t.AssignedTo)
        .Include(t => t.User)
        .Where(t => t.AssignedToUserId == userId);
}
else if (viewFilter == "assigned-by-me")
{
    query = _context.Tasks.Include(t => t.Group).Include(t => t.AssignedTo)
        .Where(t => t.UserId == userId && t.AssignedToUserId != null);
}
else
{
    // Default "all": own tasks + group-shared tasks + assigned to me
    // The TaskGroupShares branch is the existing group-share logic — preserve it.
    query = _context.Tasks.Include(t => t.Group).Include(t => t.AssignedTo)
        .Include(t => t.User)
        .Where(t => t.UserId == userId
            || t.AssignedToUserId == userId
            || (t.GroupId != null && _context.TaskGroupShares.Any(s =>
                s.TaskGroupId == t.GroupId && s.SharedWithUserId == userId)));
}
```

All remaining filter branches (startDate, endDate, priority, etc.) apply to `query` after this block — they are unchanged.

- [ ] **Step 4: Update MapToTaskDtoAsync to populate assignment fields**

`MapToTaskDtoAsync` is a private helper called from ~8 methods. Add an optional `requestingUserId` parameter with a default of `Guid.Empty` so all existing callers continue to compile:

```csharp
private async Task<TaskDto> MapToTaskDtoAsync(
    FinanceApi.Features.Tasks.Models.Task task,
    Guid requestingUserId = default)   // NEW optional param
{
    // ...existing mapping...
    // Add these new fields to the DTO initialiser:
    IsOwner = requestingUserId == default ? task.UserId == task.UserId : task.UserId == requestingUserId,
    AssignedTo = task.AssignedTo != null
        ? new AssignmentUserDto(task.AssignedTo.Id, task.AssignedTo.Username)
        : null,
    AssignedBy = (requestingUserId != default && task.AssignedToUserId == requestingUserId && task.User != null)
        ? new AssignmentUserDto(task.User.Id, task.User.Username)
        : null,
}
```

In `GetTasksAsync`, where the mapping loop calls `MapToTaskDtoAsync`, pass `userId` as the second argument:
```csharp
// Change from:
await MapToTaskDtoAsync(task)
// To:
await MapToTaskDtoAsync(task, userId)
```

All other callers (`CreateTaskAsync`, `UpdateTaskAsync`, `ClassifyTaskAsync`, etc.) need no changes — they already guard on owner identity before calling, so the default value is safe.

- [ ] **Step 5: Verify build**

```bash
cd "C:\Projects\Finance Manager\apps\finance-api"
dotnet build --no-restore 2>&1 | tail -5
```
Expected: `Build succeeded.`

- [ ] **Step 6: Commit**

```bash
cd "C:\Projects\Finance Manager"
git add apps/finance-api/Features/Tasks/Services/TaskService.cs \
        apps/finance-api/Features/Tasks/DTOs/
git commit -m "feat: extend TaskService GetTasksAsync to include assigned tasks with view filter (T1511)"
```

---

### Task 9: Add assignment notification dispatch to TaskService

**Files:**
- Modify: `apps/finance-api/Features/Tasks/Services/TaskService.cs`

- [ ] **Step 1: Add required using statements to TaskService.cs**

At the top of `apps/finance-api/Features/Tasks/Services/TaskService.cs`, add:
```csharp
using FinanceApi.Features.Notifications.Models;
using FinanceApi.Features.Notifications.Services;
```

- [ ] **Step 2: Update ITaskService interface with new method signatures**

In the `ITaskService` interface (top of the same file), add before the closing brace:
```csharp
Task<TaskDto> AssignTaskAsync(Guid requestingUserId, Guid taskId, string usernameOrEmail);
Task<TaskDto> UnassignTaskAsync(Guid requestingUserId, Guid taskId);
```

- [ ] **Step 4: Inject INotificationService into TaskService**

Add to the `TaskService` constructor:
```csharp
private readonly INotificationService _notificationService;

public TaskService(FinanceDbContext context, IActivityLogService activityLogService,
    TaskGroupService taskGroupService, IWipService wipService,
    INotificationService notificationService)   // NEW
{
    _context = context;
    _activityLogService = activityLogService;
    _taskGroupService = taskGroupService;
    _wipService = wipService;
    _notificationService = notificationService;  // NEW
}
```

- [ ] **Step 2: Add AssignTaskAsync and UnassignTaskAsync methods**

Add to `TaskService` class:

```csharp
public async Task<TaskDto> AssignTaskAsync(Guid requestingUserId, Guid taskId, string usernameOrEmail)
{
    var task = await _context.Tasks
        .Include(t => t.AssignedTo)
        .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == requestingUserId);

    if (task == null)
        throw new KeyNotFoundException("Task not found or you are not the owner.");

    // Resolve assignee
    var assignee = await _context.Users.FirstOrDefaultAsync(u =>
        u.Email == usernameOrEmail || u.Username == usernameOrEmail);

    if (assignee == null)
        throw new ArgumentException("User not found.");

    if (assignee.Id == requestingUserId)
        throw new InvalidOperationException("You cannot assign a task to yourself.");

    task.AssignedToUserId = assignee.Id;
    task.UpdatedAt = DateTime.UtcNow;
    await _context.SaveChangesAsync();

    // Notify assignee
    await _notificationService.CreateAsync(
        assignee.Id,
        NotificationType.TaskAssigned,
        NotificationEntityType.Task,
        task.Id,
        task.Title,
        requestingUserId);

    return await MapToTaskDtoAsync(task, requestingUserId);
}

public async Task<TaskDto> UnassignTaskAsync(Guid requestingUserId, Guid taskId)
{
    var task = await _context.Tasks
        .Include(t => t.AssignedTo)
        .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == requestingUserId);

    if (task == null)
        throw new KeyNotFoundException("Task not found or you are not the owner.");

    var previousAssigneeId = task.AssignedToUserId;
    task.AssignedToUserId = null;
    task.UpdatedAt = DateTime.UtcNow;
    await _context.SaveChangesAsync();

    // Notify previous assignee if there was one
    if (previousAssigneeId.HasValue)
    {
        await _notificationService.CreateAsync(
            previousAssigneeId.Value,
            NotificationType.TaskUnassigned,
            NotificationEntityType.Task,
            task.Id,
            task.Title,
            requestingUserId);
    }

    return await MapToTaskDtoAsync(task, requestingUserId);
}
```

- [ ] **Step 5: Hook completion notification into UpdateTaskStatusAsync**

In `UpdateTaskStatusAsync`, after the status is set to `Completed`, add:

```csharp
// Notify owner if assignee completed the task
if (newStatus == TaskStatus.Completed && task.AssignedToUserId == userId && task.UserId != userId)
{
    await _notificationService.CreateAsync(
        task.UserId,
        NotificationType.TaskCompleted,
        NotificationEntityType.Task,
        task.Id,
        task.Title,
        userId);
}
```

- [ ] **Step 7: Verify build**

```bash
cd "C:\Projects\Finance Manager\apps\finance-api"
dotnet build --no-restore 2>&1 | tail -5
```

- [ ] **Step 8: Commit**

```bash
cd "C:\Projects\Finance Manager"
git add apps/finance-api/Features/Tasks/Services/TaskService.cs
git commit -m "feat: add AssignTaskAsync and UnassignTaskAsync with notification dispatch (T1512)"
```

---

## Chunk 3: API Endpoints

### Task 10: Register new services in Program.cs

**Files:**
- Modify: `apps/finance-api/Program.cs`

- [ ] **Step 1: Add using statements**

Add at the top of `Program.cs`:
```csharp
using FinanceApi.Features.Notifications.Services;
using FinanceApi.Features.Tasks.Services;
```

- [ ] **Step 2: Register services**

In the service registration section (near other `builder.Services.AddScoped` calls):
```csharp
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ITaskPermissionService, TaskPermissionService>();
```

- [ ] **Step 3: Verify build and startup**

```bash
cd "C:\Projects\Finance Manager\apps\finance-api"
dotnet build --no-restore 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
cd "C:\Projects\Finance Manager"
git add apps/finance-api/Program.cs
git commit -m "feat: register INotificationService and ITaskPermissionService in DI container (T1513)"
```

---

### Task 11: Add assign/unassign endpoints to TasksController

**Files:**
- Modify: `apps/finance-api/Features/Tasks/Controllers/TasksController.cs`

- [ ] **Step 1: Inject ITaskPermissionService**

Update the controller constructor to inject `ITaskPermissionService`:

```csharp
private readonly ITaskPermissionService _taskPermissionService;

public TasksController(ITaskService taskService,
    IClassificationSuggestionService classificationSuggestionService,
    ITaskPermissionService taskPermissionService)   // NEW
{
    _taskService = taskService;
    _classificationSuggestionService = classificationSuggestionService;
    _taskPermissionService = taskPermissionService;  // NEW
}
```

- [ ] **Step 2: Add the view query parameter to GetTasks**

Update the `GetTasks` action signature:
```csharp
public async Task<ActionResult<List<TaskDto>>> GetTasks(
    [FromQuery] DateTime? startDate,
    [FromQuery] DateTime? endDate,
    [FromQuery] string? priority,
    [FromQuery] Guid? groupId,
    [FromQuery] bool? completed,
    [FromQuery] bool? rootOnly,
    [FromQuery] string? status,
    [FromQuery] string? view)   // NEW: "all" | "mine" | "assigned-to-me" | "assigned-by-me"
```

And pass it through:
```csharp
var tasks = await _taskService.GetTasksAsync(userId, startDate, endDate, priority, groupId, completed, rootOnly, status, view);
```

- [ ] **Step 3: Add PATCH /{id}/assign endpoint**

```csharp
/// <summary>
/// Assigns the task to another user. Only the task owner can assign.
/// Body: { "usernameOrEmail": "string" }
/// </summary>
[HttpPatch("{id}/assign")]
public async Task<ActionResult<TaskDto>> AssignTask(Guid id, [FromBody] AssignTaskRequest request)
{
    try
    {
        var userId = GetUserId();
        var task = await _taskService.AssignTaskAsync(userId, id, request.UsernameOrEmail);
        return Ok(task);
    }
    catch (KeyNotFoundException)
    {
        return NotFound(new { error = new { message = "Task not found or you are not the owner." } });
    }
    catch (ArgumentException ex)
    {
        return BadRequest(new { error = new { message = ex.Message } });
    }
    catch (InvalidOperationException ex)
    {
        return BadRequest(new { error = new { message = ex.Message } });
    }
}
```

- [ ] **Step 4: Add PATCH /{id}/unassign endpoint**

```csharp
/// <summary>
/// Removes the assignee from the task. Only the task owner can unassign.
/// </summary>
[HttpPatch("{id}/unassign")]
public async Task<ActionResult<TaskDto>> UnassignTask(Guid id)
{
    try
    {
        var userId = GetUserId();
        var task = await _taskService.UnassignTaskAsync(userId, id);
        return Ok(task);
    }
    catch (KeyNotFoundException)
    {
        return NotFound(new { error = new { message = "Task not found or you are not the owner." } });
    }
}
```

- [ ] **Step 5: Add the request DTO**

Add to the DTOs folder (`apps/finance-api/Features/Tasks/DTOs/`), or inline in the controller file:

```csharp
public record AssignTaskRequest(string UsernameOrEmail);
```

- [ ] **Step 6: Update TaskService write methods to allow assignee access**

> **Important:** `TasksController` delegates all DB access to `TaskService` — it has no `_context` field. The ownership guards live in `TaskService`, not the controller.

In `apps/finance-api/Features/Tasks/Services/TaskService.cs`, update the following methods to broaden the task lookup from owner-only to owner-or-assignee. For each method listed, change:
```csharp
// Before (owner-only):
var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);
if (task == null) throw new KeyNotFoundException("Task not found");
```
To:
```csharp
// After (owner or assignee can edit):
var task = await _context.Tasks
    .Include(t => t.AssignedTo)
    .FirstOrDefaultAsync(t => t.Id == taskId &&
        (t.UserId == userId || t.AssignedToUserId == userId));
if (task == null) throw new KeyNotFoundException("Task not found");
```

Apply this change to: `UpdateTaskAsync`, `UpdateTaskStatusAsync`, `ClassifyTaskAsync`, `SetEnergyAsync`, `SetEstimateAsync`.

> **Do NOT change** `DeleteTaskAsync` — delete remains owner-only (`t.UserId == userId`).

- [ ] **Step 7: Verify build**

```bash
cd "C:\Projects\Finance Manager\apps\finance-api"
dotnet build --no-restore 2>&1 | tail -5
```
Expected: `Build succeeded.`

- [ ] **Step 8: Verify endpoints appear in Swagger**

Start the API:
```bash
cd "C:\Projects\Finance Manager\apps\finance-api"
dotnet run &
Start-Sleep -Seconds 3
```
Open `http://localhost:5000/swagger` and verify `PATCH /api/v1/tasks/{id}/assign` and `PATCH /api/v1/tasks/{id}/unassign` appear.

- [ ] **Step 9: Commit**

```bash
cd "C:\Projects\Finance Manager"
git add apps/finance-api/Features/Tasks/Controllers/TasksController.cs \
        apps/finance-api/Features/Tasks/DTOs/
git commit -m "feat: add assign/unassign endpoints and permission-aware task write access (T1514)"
```

---

### Task 12: Create NotificationsController

**Files:**
- Create: `apps/finance-api/Features/Notifications/Controllers/NotificationsController.cs`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "C:\Projects\Finance Manager\apps\finance-api\Features\Notifications\Controllers"
```

- [ ] **Step 2: Create the controller**

Create `apps/finance-api/Features/Notifications/Controllers/NotificationsController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinanceApi.Features.Notifications.DTOs;
using FinanceApi.Features.Notifications.Services;
using System.Security.Claims;

namespace FinanceApi.Features.Notifications.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    /// <summary>
    /// Returns paginated notifications for the current user, newest first.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> GetNotifications(
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetUserId();
        var notifications = await _notificationService.GetNotificationsAsync(userId, unreadOnly, page, pageSize);
        return Ok(notifications);
    }

    /// <summary>
    /// Returns the count of unread notifications. Lightweight endpoint for header badge polling.
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<object>> GetUnreadCount()
    {
        var userId = GetUserId();
        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(new { unreadCount = count });
    }

    /// <summary>
    /// Marks a single notification as read.
    /// </summary>
    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var userId = GetUserId();
        await _notificationService.MarkReadAsync(userId, id);
        return NoContent();
    }

    /// <summary>
    /// Marks all of the current user's notifications as read.
    /// </summary>
    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = GetUserId();
        await _notificationService.MarkAllReadAsync(userId);
        return NoContent();
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? throw new UnauthorizedAccessException());
}
```

- [ ] **Step 3: Verify build**

```bash
cd "C:\Projects\Finance Manager\apps\finance-api"
dotnet build --no-restore 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
cd "C:\Projects\Finance Manager"
git add apps/finance-api/Features/Notifications/Controllers/
git commit -m "feat: add NotificationsController with GET, unread-count, and mark-read endpoints (T1515)"
```

---

## Chunk 4: Statistics Update

### Task 13: Extend StatisticsService with delegated and assigned-to-me reporting

**Files:**
- Modify: `apps/finance-api/Features/Statistics/Services/StatisticsService.cs`
- Modify: `apps/finance-api/Features/Statistics/DTOs/WeeklyStatsDto.cs` (or equivalent)

- [ ] **Step 1: Add new DTO fields**

Find the weekly stats response DTO (e.g., `WeeklyStatsDto` or `WeeklyStatsResponse`). Add:

```csharp
public DelegatedStatsDto Delegated { get; init; } = new();
public AssignedToMeStatsDto AssignedToMe { get; init; } = new();

public record DelegatedStatsDto(int Total, int Completed, double CompletionRate);
public record AssignedToMeStatsDto(int Total, int Completed, double CompletionRate);
```

- [ ] **Step 2: Add stat calculation in StatisticsService**

In the weekly stats method (e.g., `GetWeeklyStatsAsync`), after the existing calculations add:

```csharp
// NOTE: Filter on DueDate (not CreatedAt) to match the existing statistics convention.
// All other stats in StatisticsService filter by DueDate — be consistent.

// Tasks I assigned to others (I am the owner, they have an assignee)
var delegatedTotal = await _context.Tasks
    .CountAsync(t => t.UserId == userId && t.AssignedToUserId != null
        && t.DueDate >= weekStart && t.DueDate < weekEnd);

var delegatedCompleted = await _context.Tasks
    .CountAsync(t => t.UserId == userId && t.AssignedToUserId != null
        && t.Completed
        && t.CompletedAt >= weekStart && t.CompletedAt < weekEnd);

// Tasks assigned to me (I am the assignee)
var assignedToMeTotal = await _context.Tasks
    .CountAsync(t => t.AssignedToUserId == userId
        && t.DueDate >= weekStart && t.DueDate < weekEnd);

var assignedToMeCompleted = await _context.Tasks
    .CountAsync(t => t.AssignedToUserId == userId
        && t.Completed
        && t.CompletedAt >= weekStart && t.CompletedAt < weekEnd);

var delegatedRate = delegatedTotal > 0 ? (double)delegatedCompleted / delegatedTotal : 0;
var assignedRate = assignedToMeTotal > 0 ? (double)assignedToMeCompleted / assignedToMeTotal : 0;
```

And populate the DTO:
```csharp
Delegated = new DelegatedStatsDto(delegatedTotal, delegatedCompleted, Math.Round(delegatedRate, 2)),
AssignedToMe = new AssignedToMeStatsDto(assignedToMeTotal, assignedToMeCompleted, Math.Round(assignedRate, 2)),
```

- [ ] **Step 3: Verify build**

```bash
cd "C:\Projects\Finance Manager\apps\finance-api"
dotnet build --no-restore 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
cd "C:\Projects\Finance Manager"
git add apps/finance-api/Features/Statistics/
git commit -m "feat: add delegated and assigned-to-me fields to weekly statistics response (T1516)"
```

---

## Chunk 5: Integration Tests

### Task 14: Integration tests for task assignment flow

**Files:**
- Create: `apps/finance-api-tests/FinanceApi.IntegrationTests/Features/Tasks/TaskAssignmentTests.cs`

- [ ] **Step 1: Write the integration tests**

Create `apps/finance-api-tests/FinanceApi.IntegrationTests/Features/Tasks/TaskAssignmentTests.cs`:

```csharp
using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Auth.Models;
using FinanceApi.Features.Tasks.Services;
using FinanceApi.Features.Tasks.DTOs;
using FinanceApi.Features.Notifications.Services;
using FinanceApi.Features.Common.ActivityLogs.Services;
using FinanceApi.Features.Settings.Services;
using FinanceApi.Features.Notifications.Models;
using TaskModel = FinanceApi.Features.Tasks.Models.Task;

namespace FinanceApi.IntegrationTests.Features.Tasks;

public class TaskAssignmentTests : IDisposable
{
    private readonly FinanceDbContext _context;
    private readonly ITaskService _taskService;
    private readonly INotificationService _notificationService;
    private readonly User _owner;
    private readonly User _assignee;

    public TaskAssignmentTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new FinanceDbContext(options);

        _notificationService = new NotificationService(_context);
        var mockActivityLog = new Mock<IActivityLogService>().Object;
        var taskGroupService = new TaskGroupService(_context, mockActivityLog);
        var mockWip = new Mock<IWipService>().Object;
        _taskService = new TaskService(_context, mockActivityLog, taskGroupService, mockWip, _notificationService);

        _owner = new User { Id = Guid.NewGuid(), Email = "owner@test.com", Username = "owner", PasswordHash = "x", EmailVerified = true };
        _assignee = new User { Id = Guid.NewGuid(), Email = "assignee@test.com", Username = "assignee", PasswordHash = "x", EmailVerified = true };
        _context.Users.AddRange(_owner, _assignee);
        _context.SaveChanges();
    }

    [Fact]
    public async Task AssignTask_ValidAssignee_TaskHasAssignedToUserId()
    {
        var task = await _taskService.CreateTaskAsync(_owner.Id, new CreateTaskRequest { Title = "Test Task" });

        var result = await _taskService.AssignTaskAsync(_owner.Id, task.Id, _assignee.Username);

        result.AssignedTo.Should().NotBeNull();
        result.AssignedTo!.Username.Should().Be("assignee");
        result.IsOwner.Should().BeTrue();
    }

    [Fact]
    public async Task AssignTask_CreatesNotificationForAssignee()
    {
        var task = await _taskService.CreateTaskAsync(_owner.Id, new CreateTaskRequest { Title = "Important Task" });
        await _taskService.AssignTaskAsync(_owner.Id, task.Id, _assignee.Username);

        var notifications = await _notificationService.GetNotificationsAsync(_assignee.Id);
        notifications.Should().HaveCount(1);
        notifications[0].Type.Should().Be(NotificationType.TaskAssigned);
        notifications[0].EntityTitle.Should().Be("Important Task");
    }

    [Fact]
    public async Task AssignTask_NonOwner_ThrowsKeyNotFoundException()
    {
        var task = await _taskService.CreateTaskAsync(_owner.Id, new CreateTaskRequest { Title = "Test" });

        await _taskService.Invoking(s => s.AssignTaskAsync(_assignee.Id, task.Id, _owner.Username))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task AssignTask_Self_ThrowsInvalidOperationException()
    {
        var task = await _taskService.CreateTaskAsync(_owner.Id, new CreateTaskRequest { Title = "Test" });

        await _taskService.Invoking(s => s.AssignTaskAsync(_owner.Id, task.Id, _owner.Username))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task GetTasksAsync_AssignedToMe_ReturnsOnlyAssignedTasks()
    {
        var ownTask = await _taskService.CreateTaskAsync(_owner.Id, new CreateTaskRequest { Title = "My task" });
        await _taskService.AssignTaskAsync(_owner.Id, ownTask.Id, _assignee.Username);
        await _taskService.CreateTaskAsync(_assignee.Id, new CreateTaskRequest { Title = "Assignee's own task" });

        // Assignee's "assigned-to-me" view should only show the assigned task
        var result = await _taskService.GetTasksAsync(_assignee.Id, view: "assigned-to-me");
        result.Should().HaveCount(1);
        result[0].Title.Should().Be("My task");
        result[0].IsOwner.Should().BeFalse();
    }

    [Fact]
    public async Task AssigneeCannotDeleteTask()
    {
        var task = await _taskService.CreateTaskAsync(_owner.Id, new CreateTaskRequest { Title = "Test" });
        await _taskService.AssignTaskAsync(_owner.Id, task.Id, _assignee.Username);

        await _taskService.Invoking(s => s.DeleteTaskAsync(_assignee.Id, task.Id))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task UnassignTask_CreatesNotificationForPreviousAssignee()
    {
        var task = await _taskService.CreateTaskAsync(_owner.Id, new CreateTaskRequest { Title = "Task" });
        await _taskService.AssignTaskAsync(_owner.Id, task.Id, _assignee.Username);

        await _taskService.UnassignTaskAsync(_owner.Id, task.Id);

        var notifications = await _notificationService.GetNotificationsAsync(_assignee.Id);
        notifications.Should().Contain(n => n.Type == NotificationType.TaskUnassigned);
    }

    public void Dispose() => _context.Dispose();
}
```

> **Note:** Before running the tests, verify Moq is referenced in the IntegrationTests project. Check `apps/finance-api-tests/FinanceApi.IntegrationTests/FinanceApi.IntegrationTests.csproj` — if `<PackageReference Include="Moq"` is absent, add it:
> ```bash
> cd "C:\Projects\Finance Manager\apps\finance-api-tests\FinanceApi.IntegrationTests"
> dotnet add package Moq
> ```

- [ ] **Step 2: Run the integration tests**

```bash
cd "C:\Projects\Finance Manager"
dotnet test apps/finance-api-tests/FinanceApi.IntegrationTests/ --filter "TaskAssignmentTests" 2>&1 | tail -10
```
Expected: All tests pass.

- [ ] **Step 3: Run the full test suite to confirm nothing broken**

```bash
.\run-tests.ps1
```
Expected: All 300+ existing tests still pass, plus the new tests.

- [ ] **Step 4: Commit**

```bash
cd "C:\Projects\Finance Manager"
git add apps/finance-api-tests/FinanceApi.IntegrationTests/Features/Tasks/TaskAssignmentTests.cs
git commit -m "test: add integration tests for task assignment flow (T1517)"
```

---

## Verification Checklist

After completing all chunks, verify end-to-end:

- [ ] `dotnet build` succeeds with 0 errors
- [ ] All 3 migrations apply cleanly: `dotnet ef database update`
- [ ] Swagger shows: `PATCH /api/v1/tasks/{id}/assign`, `PATCH /api/v1/tasks/{id}/unassign`, `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `PATCH /api/v1/notifications/{id}/read`, `PATCH /api/v1/notifications/read-all`
- [ ] `GET /api/v1/tasks?view=assigned-to-me` returns only assigned tasks
- [ ] `GET /api/v1/tasks?view=assigned-by-me` returns only tasks you assigned to others
- [ ] `GET /api/v1/statistics/weekly` response includes `delegated` and `assignedToMe` objects
- [ ] `.\run-tests.ps1` — all tests green

---

## Next Steps

**Plan 2** — `2026-03-10-phase-58-backend-event-sharing.md`
Covers: EventShare entity, EventShareController, SharingController (invitations), EventService query updates, notification dispatch for share events.

**Plan 3** — `2026-03-10-phase-58-frontend.md`
Covers: All frontend components (AssignTaskModal, ShareEventModal, NotificationBell, NotificationsPage), statistics dashboard updates, and the full frontend + backend test suite.
