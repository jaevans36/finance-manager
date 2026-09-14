using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using FinanceApi.Features.Common.ActivityLogs.DTOs;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Accounts.Services;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.Common;

[Collection("Finance Integration")]
public class ActivityLogsControllerTests
{
    private readonly HttpClient _client;
    private readonly FinanceWebApplicationFactory _factory;
    private readonly Guid _userId = Guid.NewGuid();

    public ActivityLogsControllerTests(FinanceWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    [Fact]
    public async Task GetActivityLogs_WhenUnauthenticated_Returns401()
    {
        var unauthClient = _factory.CreateClient();

        var response = await unauthClient.GetAsync("/api/v1/finance/activity-logs");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetActivityLogs_WhenAuthenticated_ReturnsEmptyForNewUser()
    {
        var response = await _client.GetAsync("/api/v1/finance/activity-logs");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ActivityLogResponse>();
        body.Should().NotBeNull();
        body!.Total.Should().Be(0);
        body.Logs.Should().BeEmpty();
    }

    [Fact]
    public async Task GetActivityLogs_AfterCreatingAnAccount_ContainsAnAccountCreatedEntry()
    {
        var request = new CreateAccountRequest(
            "Integration Test Account", AccountType.Checking, "GBP",
            0m, null, null, null, null, false, null);
        await _client.PostAsJsonAsync("/api/v1/finance/accounts", request);

        var response = await _client.GetAsync("/api/v1/finance/activity-logs");

        var body = await response.Content.ReadFromJsonAsync<ActivityLogResponse>();
        body!.Logs.Should().Contain(l => l.Action == "AccountCreated");
    }
}
