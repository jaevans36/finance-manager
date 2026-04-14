using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;
using LifeApi.Features.Auth.DTOs;
using LifeApi.Features.Events.DTOs;
using LifeApi.IntegrationTests.Helpers;

namespace LifeApi.IntegrationTests.Features.Events;

/// <summary>
/// Integration tests for Events API endpoints
/// 
/// Testing Coverage:
/// - Authentication and authorization
/// - CRUD operations through HTTP
/// - Date filtering
/// - Validation (dates, titles, groups)
/// - Error responses
/// </summary>
public class EventsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public EventsControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAuthTokenAsync()
    {
        var registerRequest = new RegisterRequest
        {
            Email = $"eventtest{Guid.NewGuid()}@example.com",
            Username = $"u{Guid.NewGuid():N}"[..16],
            Password = "Password123!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>();
        return authResponse!.Token;
    }

    #region CreateEvent Tests

    [Fact]
    public async Task CreateEvent_WithValidData_ShouldReturnCreatedEvent()
    {
        // Arrange - Get auth token
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

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
        var response = await _client.PostAsJsonAsync("/api/v1/events", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var result = await response.Content.ReadFromJsonAsync<EventDto>();
        result.Should().NotBeNull();
        result!.Title.Should().Be("Team Meeting");
        result.Description.Should().Be("Weekly sync-up");
        result.IsAllDay.Should().BeFalse();
        result.Location.Should().Be("Conference Room A");
        result.ReminderMinutes.Should().Be(15);

        // Verify Location header
        response.Headers.Location.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateEvent_WithAllDayEvent_ShouldReturnCreatedEvent()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var startDate = DateTime.UtcNow.Date.AddDays(1);
        var endDate = startDate.AddDays(1);

        var request = new CreateEventRequest
        {
            Title = "Holiday",
            StartDate = startDate,
            EndDate = endDate,
            IsAllDay = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/events", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var result = await response.Content.ReadFromJsonAsync<EventDto>();
        result.Should().NotBeNull();
        result!.Title.Should().Be("Holiday");
        result.IsAllDay.Should().BeTrue();
        result.Location.Should().BeNull();
        result.ReminderMinutes.Should().BeNull();
    }

    [Fact]
    public async Task CreateEvent_WithoutAuth_ShouldReturnUnauthorized()
    {
        // Arrange
        var request = new CreateEventRequest
        {
            Title = "Unauthorized Event",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(1)
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/events", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateEvent_WithEmptyTitle_ShouldReturnBadRequest()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new CreateEventRequest
        {
            Title = "",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(1)
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/events", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateEvent_WithEndBeforeStart_ShouldReturnBadRequest()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new CreateEventRequest
        {
            Title = "Invalid Event",
            StartDate = DateTime.UtcNow.AddDays(2),
            EndDate = DateTime.UtcNow.AddDays(1) // End before start
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/events", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region GetEvents Tests

    [Fact]
    public async Task GetEvents_WithAuth_ShouldReturnUserEvents()
    {
        // Arrange - Create some events
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var startDate1 = DateTime.UtcNow.AddDays(1);
        var startDate2 = DateTime.UtcNow.AddDays(2);

        await _client.PostAsJsonAsync("/api/v1/events", new CreateEventRequest
        {
            Title = "Event 1",
            StartDate = startDate1,
            EndDate = startDate1.AddHours(1)
        });

        await _client.PostAsJsonAsync("/api/v1/events", new CreateEventRequest
        {
            Title = "Event 2",
            StartDate = startDate2,
            EndDate = startDate2.AddHours(1)
        });

        // Act
        var response = await _client.GetAsync("/api/v1/events");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<List<EventDto>>();
        result.Should().NotBeNull();
        result!.Should().HaveCountGreaterThanOrEqualTo(2);
        result.Should().Contain(e => e.Title == "Event 1");
        result.Should().Contain(e => e.Title == "Event 2");
    }

    [Fact]
    public async Task GetEvents_WithoutAuth_ShouldReturnUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/events");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetEvents_WithDateFilter_ShouldReturnFilteredEvents()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var baseDate = DateTime.UtcNow.Date;

        // Create events on different days
        await _client.PostAsJsonAsync("/api/v1/events", new CreateEventRequest
        {
            Title = "Event Day 1",
            StartDate = baseDate.AddDays(1),
            EndDate = baseDate.AddDays(1).AddHours(1)
        });

        await _client.PostAsJsonAsync("/api/v1/events", new CreateEventRequest
        {
            Title = "Event Day 5",
            StartDate = baseDate.AddDays(5),
            EndDate = baseDate.AddDays(5).AddHours(1)
        });

        await _client.PostAsJsonAsync("/api/v1/events", new CreateEventRequest
        {
            Title = "Event Day 10",
            StartDate = baseDate.AddDays(10),
            EndDate = baseDate.AddDays(10).AddHours(1)
        });

        // Act - Get events between day 3 and day 7
        var startFilter = baseDate.AddDays(3).ToString("O");
        var endFilter = baseDate.AddDays(7).ToString("O");
        var response = await _client.GetAsync($"/api/v1/events?startDate={startFilter}&endDate={endFilter}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<List<EventDto>>();
        result.Should().NotBeNull();
        result!.Should().HaveCount(1);
        result.Should().Contain(e => e.Title == "Event Day 5");
        result.Should().NotContain(e => e.Title == "Event Day 1");
        result.Should().NotContain(e => e.Title == "Event Day 10");
    }

    #endregion

    #region GetEventById Tests

    [Fact]
    public async Task GetEventById_WithValidId_ShouldReturnEvent()
    {
        // Arrange - Create an event
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var createRequest = new CreateEventRequest
        {
            Title = "Specific Event",
            Description = "Test Description",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(2)
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/events", createRequest);
        var createdEvent = await createResponse.Content.ReadFromJsonAsync<EventDto>();

        // Act
        var response = await _client.GetAsync($"/api/v1/events/{createdEvent!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<EventDto>();
        result.Should().NotBeNull();
        result!.Id.Should().Be(createdEvent.Id);
        result.Title.Should().Be("Specific Event");
        result.Description.Should().Be("Test Description");
    }

    [Fact]
    public async Task GetEventById_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/v1/events/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetEventById_WithoutAuth_ShouldReturnUnauthorized()
    {
        // Act
        var response = await _client.GetAsync($"/api/v1/events/{Guid.NewGuid()}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region UpdateEvent Tests

    [Fact]
    public async Task UpdateEvent_WithValidData_ShouldReturnUpdatedEvent()
    {
        // Arrange - Create an event
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var createRequest = new CreateEventRequest
        {
            Title = "Original Title",
            Description = "Original Description",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(2)
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/events", createRequest);
        var createdEvent = await createResponse.Content.ReadFromJsonAsync<EventDto>();

        var updateRequest = new UpdateEventRequest
        {
            Title = "Updated Title",
            Description = "Updated Description",
            Location = "New Location"
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/events/{createdEvent!.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<EventDto>();
        result.Should().NotBeNull();
        result!.Title.Should().Be("Updated Title");
        result.Description.Should().Be("Updated Description");
        result.Location.Should().Be("New Location");
    }

    [Fact]
    public async Task UpdateEvent_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var updateRequest = new UpdateEventRequest
        {
            Title = "Updated Title"
        };

        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/events/{nonExistentId}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateEvent_WithoutAuth_ShouldReturnUnauthorized()
    {
        // Arrange
        var updateRequest = new UpdateEventRequest
        {
            Title = "Unauthorized Update"
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/events/{Guid.NewGuid()}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region DeleteEvent Tests

    [Fact]
    public async Task DeleteEvent_WithValidId_ShouldReturnNoContent()
    {
        // Arrange - Create an event
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var createRequest = new CreateEventRequest
        {
            Title = "Event to Delete",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(1)
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/events", createRequest);
        var createdEvent = await createResponse.Content.ReadFromJsonAsync<EventDto>();

        // Act
        var response = await _client.DeleteAsync($"/api/v1/events/{createdEvent!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify event is deleted
        var getResponse = await _client.GetAsync($"/api/v1/events/{createdEvent.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteEvent_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.DeleteAsync($"/api/v1/events/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteEvent_WithoutAuth_ShouldReturnUnauthorized()
    {
        // Act
        var response = await _client.DeleteAsync($"/api/v1/events/{Guid.NewGuid()}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion
}
