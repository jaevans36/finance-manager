using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using FinanceApi.Features.SavingsGoals.Models;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.SavingsGoals;

[Collection("Finance Integration")]
public class GoalsControllerTests
{
    private readonly HttpClient _client;
    private readonly FinanceWebApplicationFactory _factory;
    private readonly Guid _userId = Guid.NewGuid();

    public GoalsControllerTests(FinanceWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    [Fact]
    public async Task GetGoals_WhenAuthenticated_ReturnsEmptyListForNewUser()
    {
        var response = await _client.GetAsync("/api/v1/finance/goals");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var goals = await response.Content.ReadFromJsonAsync<List<SavingsGoalWithProjection>>();
        goals.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public async Task GetGoals_WhenUnauthenticated_Returns401()
    {
        var unauthClient = _factory.CreateClient();
        var response = await unauthClient.GetAsync("/api/v1/finance/goals");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateGoal_WhenValidRequest_Returns201WithGoalData()
    {
        var request = new CreateSavingsGoalRequest(
            "Holiday Fund", 2000m, DateTime.UtcNow.AddYears(1), 150m);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/goals", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var goal = await response.Content.ReadFromJsonAsync<SavingsGoalWithProjection>();
        goal.Should().NotBeNull();
        goal!.Goal.Name.Should().Be("Holiday Fund");
        goal.Goal.TargetAmount.Should().Be(2000m);
        goal.Goal.CurrentAmount.Should().Be(0m);
        goal.PercentageComplete.Should().Be(0m);
    }

    [Fact]
    public async Task CreateGoal_WhenTargetAmountIsZero_Returns400()
    {
        var request = new CreateSavingsGoalRequest("Bad Goal", 0m, null, 100m);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/goals", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Contribute_WhenGoalExists_Returns200WithUpdatedAmount()
    {
        var created = await _client.PostAsJsonAsync("/api/v1/finance/goals",
            new CreateSavingsGoalRequest("Car Fund", 5000m, null, 200m));
        var goal = await created.Content.ReadFromJsonAsync<SavingsGoalWithProjection>();

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/finance/goals/{goal!.Goal.Id}/contribute",
            new ContributeRequest(500m));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await response.Content.ReadFromJsonAsync<SavingsGoalWithProjection>();
        updated!.Goal.CurrentAmount.Should().Be(500m);
        updated.PercentageComplete.Should().Be(10m);
    }

    [Fact]
    public async Task Contribute_WhenAmountCompletesGoal_ReturnsAchievedStatus()
    {
        var created = await _client.PostAsJsonAsync("/api/v1/finance/goals",
            new CreateSavingsGoalRequest("Small Goal", 100m, null, 100m));
        var goal = await created.Content.ReadFromJsonAsync<SavingsGoalWithProjection>();

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/finance/goals/{goal!.Goal.Id}/contribute",
            new ContributeRequest(100m));

        var updated = await response.Content.ReadFromJsonAsync<SavingsGoalWithProjection>();
        updated!.Goal.Status.Should().Be(SavingsGoalStatus.Achieved);
    }

    [Fact]
    public async Task DeleteGoal_WhenGoalExists_Returns204()
    {
        var created = await _client.PostAsJsonAsync("/api/v1/finance/goals",
            new CreateSavingsGoalRequest("To Delete", 500m, null, 50m));
        var goal = await created.Content.ReadFromJsonAsync<SavingsGoalWithProjection>();

        var response = await _client.DeleteAsync($"/api/v1/finance/goals/{goal!.Goal.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
