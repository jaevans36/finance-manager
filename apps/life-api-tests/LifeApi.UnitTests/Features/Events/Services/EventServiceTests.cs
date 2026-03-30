using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using LifeApi.Data;
using LifeApi.Features.Events.Services;
using LifeApi.Features.Events.DTOs;
using LifeApi.Features.Events.Models;
using LifeApi.Features.Auth.Models;
using LifeApi.Features.Common.ActivityLogs.Services;

namespace LifeApi.UnitTests.Features.Events.Services;

/// <summary>
/// Unit tests for EventService
/// 
/// Testing Coverage:
/// - CRUD operations (Create, Read, Update, Delete)
/// - Date validation (end >= start)
/// - User authorization (events belong to user)
/// - Group validation (group exists and belongs to user)
/// - Date filtering and queries
/// </summary>
public class EventServiceTests : IDisposable
{
    private readonly FinanceDbContext _context;
    private readonly Mock<IActivityLogService> _mockActivityLogService;
    private readonly EventService _eventService;
    private readonly User _testUser;

    public EventServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new FinanceDbContext(options);
        _mockActivityLogService = new Mock<IActivityLogService>();

        _eventService = new EventService(_context, _mockActivityLogService.Object);

        // Create a test user
        _testUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "testuser@example.com",
            PasswordHash = "hash",
            EmailVerified = true
        };
        _context.Users.Add(_testUser);
        _context.SaveChanges();
    }

    #region CreateEvent Tests

    [Fact]
    public async System.Threading.Tasks.Task CreateEventAsync_WithValidData_ShouldCreateEvent()
    {
        // Arrange
        var startDate = DateTime.UtcNow.AddDays(1);
        var endDate = startDate.AddHours(2);
        
        var request = new CreateEventRequest
        {
            Title = "Team Meeting",
            Description = "Weekly sync-up",
            StartDate = startDate,
            EndDate = endDate,
            IsAllDay = false,
            Location = "Conference Room A",
            ReminderMinutes = 15
        };

        // Act
        var result = await _eventService.CreateEventAsync(_testUser.Id, request);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be(request.Title);
        result.Description.Should().Be(request.Description);
        result.StartDate.Should().BeCloseTo(startDate, TimeSpan.FromSeconds(1));
        result.EndDate.Should().BeCloseTo(endDate, TimeSpan.FromSeconds(1));
        result.IsAllDay.Should().BeFalse();
        result.Location.Should().Be("Conference Room A");
        result.ReminderMinutes.Should().Be(15);

        // Verify event was saved to database
        var savedEvent = await _context.Events.FirstOrDefaultAsync(e => e.Id == result.Id);
        savedEvent.Should().NotBeNull();
        savedEvent!.UserId.Should().Be(_testUser.Id);
    }

    [Fact]
    public async System.Threading.Tasks.Task CreateEventAsync_WithAllDayEvent_ShouldCreateSuccessfully()
    {
        // Arrange
        var startDate = DateTime.UtcNow.Date;
        var endDate = startDate.AddDays(1);
        
        var request = new CreateEventRequest
        {
            Title = "Holiday",
            StartDate = startDate,
            EndDate = endDate,
            IsAllDay = true
        };

        // Act
        var result = await _eventService.CreateEventAsync(_testUser.Id, request);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Holiday");
        result.IsAllDay.Should().BeTrue();
        result.Location.Should().BeNull();
        result.ReminderMinutes.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task CreateEventAsync_WithEndBeforeStart_ShouldThrowException()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Title = "Invalid Event",
            StartDate = DateTime.UtcNow.AddDays(2),
            EndDate = DateTime.UtcNow.AddDays(1) // End before start
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _eventService.CreateEventAsync(_testUser.Id, request));
        
        exception.Message.Should().ContainEquivalentOf("end date must be after start date");
    }

    [Fact]
    public async System.Threading.Tasks.Task CreateEventAsync_WithEmptyTitle_ShouldThrowException()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Title = "",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(1)
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _eventService.CreateEventAsync(_testUser.Id, request));
        
        exception.Message.Should().Contain("Title is required");
    }

    [Fact]
    public async System.Threading.Tasks.Task CreateEventAsync_WithInvalidGroupId_ShouldThrowException()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Title = "Event with Invalid Group",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(1),
            GroupId = Guid.NewGuid() // Non-existent group
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _eventService.CreateEventAsync(_testUser.Id, request));
        
        exception.Message.Should().Contain("Task group not found");
    }

    #endregion

    #region GetEvent Tests

    [Fact]
    public async System.Threading.Tasks.Task GetEventByIdAsync_WithValidId_ShouldReturnEvent()
    {
        // Arrange
        var eventEntity = new Event
        {
            Id = Guid.NewGuid(),
            UserId = _testUser.Id,
            Title = "Test Event",
            Description = "Test Description",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(2),
            IsAllDay = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act
        var result = await _eventService.GetEventByIdAsync(_testUser.Id, eventEntity.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(eventEntity.Id);
        result.Title.Should().Be("Test Event");
        result.Description.Should().Be("Test Description");
    }

    [Fact]
    public async System.Threading.Tasks.Task GetEventByIdAsync_WithWrongUser_ShouldReturnNull()
    {
        // Arrange
        var otherUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "other@example.com",
            PasswordHash = "hash",
            EmailVerified = true
        };
        _context.Users.Add(otherUser);

        var eventEntity = new Event
        {
            Id = Guid.NewGuid(),
            UserId = otherUser.Id,
            Title = "Other User Event",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act
        var result = await _eventService.GetEventByIdAsync(_testUser.Id, eventEntity.Id);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task GetEventsAsync_WithNoFilters_ShouldReturnAllUserEvents()
    {
        // Arrange
        var events = new[]
        {
            new Event
            {
                Id = Guid.NewGuid(),
                UserId = _testUser.Id,
                Title = "Event 1",
                StartDate = DateTime.UtcNow.AddDays(1),
                EndDate = DateTime.UtcNow.AddDays(1).AddHours(1),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Event
            {
                Id = Guid.NewGuid(),
                UserId = _testUser.Id,
                Title = "Event 2",
                StartDate = DateTime.UtcNow.AddDays(2),
                EndDate = DateTime.UtcNow.AddDays(2).AddHours(1),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };
        _context.Events.AddRange(events);
        await _context.SaveChangesAsync();

        // Act
        var result = await _eventService.GetEventsAsync(_testUser.Id);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(e => e.Title == "Event 1");
        result.Should().Contain(e => e.Title == "Event 2");
    }

    [Fact]
    public async System.Threading.Tasks.Task GetEventsAsync_WithDateFilter_ShouldReturnFilteredEvents()
    {
        // Arrange
        var baseDate = DateTime.UtcNow.Date;
        var events = new[]
        {
            new Event
            {
                Id = Guid.NewGuid(),
                UserId = _testUser.Id,
                Title = "Event on Day 1",
                StartDate = baseDate.AddDays(1),
                EndDate = baseDate.AddDays(1).AddHours(2),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Event
            {
                Id = Guid.NewGuid(),
                UserId = _testUser.Id,
                Title = "Event on Day 5",
                StartDate = baseDate.AddDays(5),
                EndDate = baseDate.AddDays(5).AddHours(2),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Event
            {
                Id = Guid.NewGuid(),
                UserId = _testUser.Id,
                Title = "Event on Day 10",
                StartDate = baseDate.AddDays(10),
                EndDate = baseDate.AddDays(10).AddHours(2),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };
        _context.Events.AddRange(events);
        await _context.SaveChangesAsync();

        // Act - Get events between day 3 and day 7
        var result = await _eventService.GetEventsAsync(
            _testUser.Id,
            startDate: baseDate.AddDays(3),
            endDate: baseDate.AddDays(7));

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(e => e.Title == "Event on Day 5");
    }

    #endregion

    #region UpdateEvent Tests

    [Fact]
    public async System.Threading.Tasks.Task UpdateEventAsync_WithValidData_ShouldUpdateEvent()
    {
        // Arrange
        var eventEntity = new Event
        {
            Id = Guid.NewGuid(),
            UserId = _testUser.Id,
            Title = "Original Title",
            Description = "Original Description",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(2),
            IsAllDay = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateEventRequest
        {
            Title = "Updated Title",
            Description = "Updated Description",
            Location = "New Location"
        };

        // Act
        var result = await _eventService.UpdateEventAsync(_testUser.Id, eventEntity.Id, updateRequest);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Updated Title");
        result.Description.Should().Be("Updated Description");
        result.Location.Should().Be("New Location");
    }

    [Fact]
    public async System.Threading.Tasks.Task UpdateEventAsync_WithWrongUser_ShouldThrowException()
    {
        // Arrange
        var otherUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "other@example.com",
            PasswordHash = "hash",
            EmailVerified = true
        };
        _context.Users.Add(otherUser);

        var eventEntity = new Event
        {
            Id = Guid.NewGuid(),
            UserId = otherUser.Id,
            Title = "Other User Event",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateEventRequest
        {
            Title = "Hacked Title"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _eventService.UpdateEventAsync(_testUser.Id, eventEntity.Id, updateRequest));
        
        exception.Message.Should().Contain("does not belong to user");
    }

    #endregion

    #region DeleteEvent Tests

    [Fact]
    public async System.Threading.Tasks.Task DeleteEventAsync_WithValidId_ShouldDeleteEvent()
    {
        // Arrange
        var eventEntity = new Event
        {
            Id = Guid.NewGuid(),
            UserId = _testUser.Id,
            Title = "Event to Delete",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act
        await _eventService.DeleteEventAsync(_testUser.Id, eventEntity.Id);

        // Assert
        var deletedEvent = await _context.Events.FirstOrDefaultAsync(e => e.Id == eventEntity.Id);
        deletedEvent.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task DeleteEventAsync_WithWrongUser_ShouldThrowException()
    {
        // Arrange
        var otherUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "other@example.com",
            PasswordHash = "hash",
            EmailVerified = true
        };
        _context.Users.Add(otherUser);

        var eventEntity = new Event
        {
            Id = Guid.NewGuid(),
            UserId = otherUser.Id,
            Title = "Other User Event",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _eventService.DeleteEventAsync(_testUser.Id, eventEntity.Id));
        
        exception.Message.Should().Contain("does not belong to user");
    }

    #endregion

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
