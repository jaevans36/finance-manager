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
