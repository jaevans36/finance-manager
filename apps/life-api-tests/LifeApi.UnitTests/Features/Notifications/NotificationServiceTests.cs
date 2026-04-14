using Xunit;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using LifeApi.Data;
using LifeApi.Features.Auth.Models;
using LifeApi.Features.Notifications.Models;
using LifeApi.Features.Notifications.Services;

namespace LifeApi.UnitTests.Features.Notifications;

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
