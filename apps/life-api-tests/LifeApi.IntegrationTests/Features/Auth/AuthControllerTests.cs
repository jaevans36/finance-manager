using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;
using LifeApi.Features.Auth.DTOs;
using LifeApi.IntegrationTests.Helpers;

namespace LifeApi.IntegrationTests.Features.Auth;

/// <summary>
/// Integration tests for Auth API endpoints
/// 
/// Learning Topics:
/// - Testing complete HTTP request/response cycle
/// - Testing API endpoints end-to-end
/// - Using HttpClient to make requests
/// - Testing authentication flows
/// - JSON serialization/deserialization
/// - IClassFixture for sharing test context
/// </summary>
public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    #region Registration Tests

    [Fact]
    public async Task Register_WithValidData_ShouldReturnCreatedAndToken()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = $"test{Guid.NewGuid()}@example.com", // Unique email
            Username = $"u{Guid.NewGuid():N}"[..16],
            Password = "Password123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<AuthResponse>();
        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrEmpty();
        result.User.Should().NotBeNull();
        result.User.Email.Should().Be(request.Email);
    }

    [Fact]
    public async Task Register_WithExistingEmail_ShouldReturnBadRequest()
    {
        // Arrange - Register user first
        var email = $"duplicate{Guid.NewGuid()}@example.com";
        var firstRequest = new RegisterRequest
        {
            Email = email,
            Username = $"u{Guid.NewGuid():N}"[..16],
            Password = "Password123!"
        };
        await _client.PostAsJsonAsync("/api/v1/auth/register", firstRequest);

        // Try to register again with same email
        var secondRequest = new RegisterRequest
        {
            Email = email,
            Username = $"u{Guid.NewGuid():N}"[..16],
            Password = "DifferentPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", secondRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithInvalidEmail_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "not-an-email",
            Username = $"u{Guid.NewGuid():N}"[..16],
            Password = "Password123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Login Tests

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnToken()
    {
        // Arrange - Register user first
        var email = $"logintest{Guid.NewGuid()}@example.com";
        var password = "Password123!";

        var registerRequest = new RegisterRequest
        {
            Email = email,
            Username = $"u{Guid.NewGuid():N}"[..16],
            Password = password
        };
        await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);

        // Wait a moment for registration to complete
        await Task.Delay(100);

        var loginRequest = new LoginRequest
        {
            EmailOrUsername = email,
            Password = password
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<AuthResponse>();
        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrEmpty();
        result.User.Email.Should().Be(email);
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ShouldReturnUnauthorized()
    {
        // Arrange - Register user first
        var email = $"wrongpass{Guid.NewGuid()}@example.com";
        var registerRequest = new RegisterRequest
        {
            Email = email,
            Username = $"u{Guid.NewGuid():N}"[..16],
            Password = "CorrectPassword123!"
        };
        await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            EmailOrUsername = email,
            Password = "WrongPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithNonExistentUser_ShouldReturnUnauthorized()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            EmailOrUsername = "nonexistent@example.com",
            Password = "Password123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Logout Tests

    [Fact]
    public async Task Logout_WithValidToken_ShouldReturnOk()
    {
        // Arrange - Register and login to get token
        var email = $"logouttest{Guid.NewGuid()}@example.com";
        var registerRequest = new RegisterRequest
        {
            Email = email,
            Username = $"u{Guid.NewGuid():N}"[..16],
            Password = "Password123!"
        };
        var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        var authResponse = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>();

        // Add authorization header
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        // Act
        var response = await _client.PostAsync("/api/v1/auth/logout", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Logout_WithoutToken_ShouldReturnUnauthorized()
    {
        // Act - Try to logout without authorization
        var response = await _client.PostAsync("/api/v1/auth/logout", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region GetMe Tests

    [Fact]
    public async Task GetMe_WithValidToken_ShouldReturnUserInfo()
    {
        // Arrange - Register to get token
        var email = $"getme{Guid.NewGuid()}@example.com";
        var registerRequest = new RegisterRequest
        {
            Email = email,
            Username = $"u{Guid.NewGuid():N}"[..16],
            Password = "Password123!"
        };
        var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        var authResponse = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>();

        // Add authorization header
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        // Act
        var response = await _client.GetAsync("/api/v1/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<UserDto>();
        result.Should().NotBeNull();
        result!.Email.Should().Be(email);
    }

    [Fact]
    public async Task GetMe_WithoutToken_ShouldReturnUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region ChangePassword Tests

    [Fact]
    public async Task ChangePassword_WithCorrectCurrentPassword_ShouldReturnOkAndAllowLoginWithNewPassword()
    {
        // Arrange - Register to get token
        var email = $"changepw{Guid.NewGuid()}@example.com";
        var currentPassword = "OldPassword123!";
        var registerRequest = new RegisterRequest
        {
            Email = email,
            Username = $"u{Guid.NewGuid():N}"[..16],
            Password = currentPassword
        };
        var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        var authResponse = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>();

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        var changeRequest = new ChangePasswordRequest
        {
            CurrentPassword = currentPassword,
            NewPassword = "NewPassword456!"
        };

        // Act
        var response = await _client.PatchAsJsonAsync("/api/v1/auth/me/password", changeRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        // New password now works
        var newLoginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
        {
            EmailOrUsername = email,
            Password = "NewPassword456!"
        });
        newLoginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Old password no longer works
        var oldLoginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
        {
            EmailOrUsername = email,
            Password = currentPassword
        });
        oldLoginResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ChangePassword_WithIncorrectCurrentPassword_ShouldReturnBadRequest()
    {
        // Arrange - Register to get token
        var email = $"changepwwrong{Guid.NewGuid()}@example.com";
        var registerRequest = new RegisterRequest
        {
            Email = email,
            Username = $"u{Guid.NewGuid():N}"[..16],
            Password = "CorrectPassword123!"
        };
        var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        var authResponse = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>();

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        var changeRequest = new ChangePasswordRequest
        {
            CurrentPassword = "WrongPassword123!",
            NewPassword = "NewPassword456!"
        };

        // Act
        var response = await _client.PatchAsJsonAsync("/api/v1/auth/me/password", changeRequest);

        // Assert - not a 401, so the frontend's global 401 handler doesn't log the caller out for a typo
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ChangePassword_WithoutToken_ShouldReturnUnauthorized()
    {
        // Act
        var response = await _client.PatchAsJsonAsync("/api/v1/auth/me/password", new ChangePasswordRequest
        {
            CurrentPassword = "Whatever123!",
            NewPassword = "NewPassword456!"
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion
}
