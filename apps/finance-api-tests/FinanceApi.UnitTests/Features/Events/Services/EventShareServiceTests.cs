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
