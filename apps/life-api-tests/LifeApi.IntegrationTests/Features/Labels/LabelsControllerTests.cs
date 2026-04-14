using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;
using LifeApi.Features.Auth.DTOs;
using LifeApi.Features.Labels.DTOs;
using LifeApi.IntegrationTests.Helpers;

namespace LifeApi.IntegrationTests.Features.Labels;

public class LabelsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public LabelsControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> GetAuthTokenAsync()
    {
        // Username is [Required] with [MinLength(3)] — include it
        var id = Guid.NewGuid().ToString("N")[..8];
        var registerRequest = new RegisterRequest
        {
            Email = $"labeltest{id}@example.com",
            Username = $"lbl{id}",
            Password = "Password123!"
        };
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>();
        return authResponse!.Token;
    }

    private void Authenticate(string token) =>
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

    [Fact]
    public async Task CreateLabel_WithValidData_ShouldReturn201()
    {
        Authenticate(await GetAuthTokenAsync());
        var request = new CreateLabelRequest { Name = "Work", ColourHex = "#21B8A4" };
        var response = await _client.PostAsJsonAsync("/api/v1/labels", request);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var label = await response.Content.ReadFromJsonAsync<LabelDto>();
        label!.Name.Should().Be("Work");
        label.ColourHex.Should().Be("#21B8A4");
    }

    [Fact]
    public async Task GetLabels_ShouldReturnOnlyOwnLabels()
    {
        // User A creates a label
        var tokenA = await GetAuthTokenAsync();
        Authenticate(tokenA);
        await _client.PostAsJsonAsync("/api/v1/labels", new CreateLabelRequest { Name = "A-Label", ColourHex = "#FF0000" });

        // User B should not see it
        var tokenB = await GetAuthTokenAsync();
        Authenticate(tokenB);
        var response = await _client.GetAsync("/api/v1/labels");
        var labels = await response.Content.ReadFromJsonAsync<List<LabelDto>>();
        labels.Should().NotContain(l => l.Name == "A-Label");
    }

    [Fact]
    public async Task DeleteLabel_ShouldReturn204_AndRemoveLabel()
    {
        Authenticate(await GetAuthTokenAsync());
        var created = await (await _client.PostAsJsonAsync("/api/v1/labels",
            new CreateLabelRequest { Name = "ToDelete", ColourHex = "#000000" }))
            .Content.ReadFromJsonAsync<LabelDto>();

        var deleteResponse = await _client.DeleteAsync($"/api/v1/labels/{created!.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var labels = await (await _client.GetAsync("/api/v1/labels")).Content.ReadFromJsonAsync<List<LabelDto>>();
        labels.Should().NotContain(l => l.Id == created.Id);
    }

    [Fact]
    public async Task CreateLabel_WithInvalidColour_ShouldReturn400()
    {
        Authenticate(await GetAuthTokenAsync());
        var response = await _client.PostAsJsonAsync("/api/v1/labels",
            new CreateLabelRequest { Name = "Bad", ColourHex = "notacolour" });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteLabel_OtherUsersLabel_ShouldReturn404()
    {
        var tokenA = await GetAuthTokenAsync();
        Authenticate(tokenA);
        var label = await (await _client.PostAsJsonAsync("/api/v1/labels",
            new CreateLabelRequest { Name = "Private", ColourHex = "#123456" }))
            .Content.ReadFromJsonAsync<LabelDto>();

        var tokenB = await GetAuthTokenAsync();
        Authenticate(tokenB);
        var response = await _client.DeleteAsync($"/api/v1/labels/{label!.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
