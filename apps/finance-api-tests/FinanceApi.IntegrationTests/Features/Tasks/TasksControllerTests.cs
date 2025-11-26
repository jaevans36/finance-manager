using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;
using FinanceApi.Features.Auth.DTOs;
using FinanceApi.Features.Tasks.DTOs;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.Tasks;

/// <summary>
/// Integration tests for Tasks API endpoints
/// 
/// Learning Topics:
/// - Testing authenticated endpoints
/// - Testing CRUD operations through HTTP
/// - Managing authentication state across requests
/// </summary>
public class TasksControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public TasksControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAuthTokenAsync()
    {
        var registerRequest = new RegisterRequest
        {
            Email = $"tasktest{Guid.NewGuid()}@example.com",
            Password = "Password123!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>();
        return authResponse!.Token;
    }

    #region CreateTask Tests

    [Fact]
    public async Task CreateTask_WithValidData_ShouldReturnCreatedTask()
    {
        // Arrange - Get auth token
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new CreateTaskRequest
        {
            Title = "Test Task",
            Description = "Test Description",
            Priority = "Medium",
            DueDate = DateTime.UtcNow.AddDays(7)
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/tasks", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var result = await response.Content.ReadFromJsonAsync<TaskDto>();
        result.Should().NotBeNull();
        result!.Title.Should().Be(request.Title);
        result.Description.Should().Be(request.Description);
        result.Priority.Should().Be("Medium");
        result.Completed.Should().BeFalse();
    }

    [Fact]
    public async Task CreateTask_WithoutAuth_ShouldReturnUnauthorized()
    {
        // Arrange - No authorization header
        var request = new CreateTaskRequest
        {
            Title = "Test Task",
            Priority = "Low"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/tasks", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateTask_WithInvalidPriority_ShouldReturnBadRequest()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new CreateTaskRequest
        {
            Title = "Test Task",
            Priority = "InvalidPriority"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/tasks", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region GetTasks Tests

    [Fact]
    public async Task GetTasks_WithAuth_ShouldReturnUserTasks()
    {
        // Arrange - Create some tasks
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        await _client.PostAsJsonAsync("/api/v1/tasks", new CreateTaskRequest { Title = "Task 1", Priority = "High" });
        await _client.PostAsJsonAsync("/api/v1/tasks", new CreateTaskRequest { Title = "Task 2", Priority = "Low" });

        // Act
        var response = await _client.GetAsync("/api/v1/tasks");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<List<TaskDto>>();
        result.Should().NotBeNull();
        result!.Should().HaveCountGreaterThanOrEqualTo(2);
        result.Should().Contain(t => t.Title == "Task 1");
        result.Should().Contain(t => t.Title == "Task 2");
    }

    [Fact]
    public async Task GetTasks_WithoutAuth_ShouldReturnUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/tasks");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region UpdateTask Tests

    [Fact]
    public async Task UpdateTask_WithValidData_ShouldUpdateTask()
    {
        // Arrange - Create a task first
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var createRequest = new CreateTaskRequest { Title = "Original Title", Priority = "Low" };
        var createResponse = await _client.PostAsJsonAsync("/api/v1/tasks", createRequest);
        var createdTask = await createResponse.Content.ReadFromJsonAsync<TaskDto>();

        var updateRequest = new UpdateTaskRequest
        {
            Title = "Updated Title",
            Priority = "High",
            Completed = true
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/tasks/{createdTask!.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<TaskDto>();
        result.Should().NotBeNull();
        result!.Title.Should().Be("Updated Title");
        result.Priority.Should().Be("High");
        result.Completed.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateTask_WithNonExistentTask_ShouldReturnNotFound()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var nonExistentId = Guid.NewGuid();
        var updateRequest = new UpdateTaskRequest { Title = "New Title" };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/tasks/{nonExistentId}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region DeleteTask Tests

    [Fact]
    public async Task DeleteTask_WithExistingTask_ShouldReturnNoContent()
    {
        // Arrange - Create a task first
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var createRequest = new CreateTaskRequest { Title = "Task to Delete", Priority = "Medium" };
        var createResponse = await _client.PostAsJsonAsync("/api/v1/tasks", createRequest);
        var createdTask = await createResponse.Content.ReadFromJsonAsync<TaskDto>();

        // Act
        var response = await _client.DeleteAsync($"/api/v1/tasks/{createdTask!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify task is deleted
        var getResponse = await _client.GetAsync($"/api/v1/tasks/{createdTask.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteTask_WithNonExistentTask_ShouldReturnNotFound()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.DeleteAsync($"/api/v1/tasks/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region GetTaskById Tests

    [Fact]
    public async Task GetTaskById_WithExistingTask_ShouldReturnTask()
    {
        // Arrange - Create a task
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var createRequest = new CreateTaskRequest { Title = "Test Task", Priority = "High" };
        var createResponse = await _client.PostAsJsonAsync("/api/v1/tasks", createRequest);
        var createdTask = await createResponse.Content.ReadFromJsonAsync<TaskDto>();

        // Act
        var response = await _client.GetAsync($"/api/v1/tasks/{createdTask!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<TaskDto>();
        result.Should().NotBeNull();
        result!.Id.Should().Be(createdTask.Id);
        result.Title.Should().Be("Test Task");
    }

    [Fact]
    public async Task GetTaskById_WithNonExistentTask_ShouldReturnNotFound()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/v1/tasks/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion
}
