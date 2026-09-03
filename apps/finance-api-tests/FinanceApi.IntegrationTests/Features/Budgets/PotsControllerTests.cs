using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using FinanceApi.Features.Budgets.Models;
using FinanceApi.Features.Budgets.Services;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.Budgets;

[Collection("Finance Integration")]
public class PotsControllerTests
{
    private readonly HttpClient _client;
    private readonly FinanceWebApplicationFactory _factory;
    private readonly Guid _userId = Guid.NewGuid();
    private static readonly Guid GroceriesCategoryId = Guid.Parse("10000000-0000-0000-0000-000000000101");

    public PotsControllerTests(FinanceWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    [Fact]
    public async Task GetPots_WhenAuthenticated_ReturnsEmptyListForNewUser()
    {
        var response = await _client.GetAsync("/api/v1/finance/pots");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var pots = await response.Content.ReadFromJsonAsync<List<SpendingPotWithProgress>>();
        pots.Should().NotBeNull();
        pots!.Should().BeEmpty();
    }

    [Fact]
    public async Task CreatePot_WhenValidRequest_Returns201WithPotData()
    {
        var request = new CreateSpendingPotRequest(
            "Groceries Pot", PotType.Groceries, 250m, false,
            "shopping-cart", "#22C55E", new[] { GroceriesCategoryId });

        var response = await _client.PostAsJsonAsync("/api/v1/finance/pots", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var pot = await response.Content.ReadFromJsonAsync<SpendingPotWithProgress>();
        pot.Should().NotBeNull();
        pot!.Name.Should().Be("Groceries Pot");
        pot.BudgetAmount.Should().Be(250m);
    }

    [Fact]
    public async Task CreatePot_WhenNameIsEmpty_Returns400()
    {
        var request = new CreateSpendingPotRequest(
            "", PotType.Custom, 100m, false, null, null, Array.Empty<Guid>());

        var response = await _client.PostAsJsonAsync("/api/v1/finance/pots", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdatePot_WhenValidRequest_ReturnsUpdatedFields()
    {
        var createResp = await _client.PostAsJsonAsync("/api/v1/finance/pots",
            new CreateSpendingPotRequest("Original", PotType.Custom, 100m, false, null, null, Array.Empty<Guid>()));
        var created = await createResp.Content.ReadFromJsonAsync<SpendingPotWithProgress>();

        var updateResp = await _client.PutAsJsonAsync($"/api/v1/finance/pots/{created!.Id}",
            new UpdateSpendingPotRequest("Renamed", 200m, null, null, null, null));

        updateResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await updateResp.Content.ReadFromJsonAsync<SpendingPotWithProgress>();
        updated!.Name.Should().Be("Renamed");
        updated.BudgetAmount.Should().Be(200m);
    }

    [Fact]
    public async Task DeletePot_WhenExists_Returns204()
    {
        var createResp = await _client.PostAsJsonAsync("/api/v1/finance/pots",
            new CreateSpendingPotRequest("To Delete", PotType.Custom, 80m, false, null, null, Array.Empty<Guid>()));
        var created = await createResp.Content.ReadFromJsonAsync<SpendingPotWithProgress>();

        var deleteResp = await _client.DeleteAsync($"/api/v1/finance/pots/{created!.Id}");

        deleteResp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task AssignTransaction_WhenTransactionIdIsEmpty_Returns400()
    {
        var createResp = await _client.PostAsJsonAsync("/api/v1/finance/pots",
            new CreateSpendingPotRequest("Pot", PotType.Custom, 100m, false, null, null, Array.Empty<Guid>()));
        var pot = await createResp.Content.ReadFromJsonAsync<SpendingPotWithProgress>();

        var response = await _client.PostAsync(
            $"/api/v1/finance/pots/{pot!.Id}/assign-transaction?transactionId={Guid.Empty}", null);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetPots_WhenUnauthenticated_Returns401()
    {
        var unauthClient = _factory.CreateClient();

        var response = await unauthClient.GetAsync("/api/v1/finance/pots");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── Sinking funds ────────────────────────────────────────────────────────

    [Fact]
    public async Task CreatePot_SinkingFundWithAnnualAmount_Returns201WithDerivedMonthlyAllocation()
    {
        var request = new CreateSpendingPotRequest(
            "Car insurance", PotType.SinkingFund, 0m, false, null, null,
            Array.Empty<Guid>(), AnnualAmount: 600m, NextPaymentDate: new DateOnly(2027, 3, 1));

        var response = await _client.PostAsJsonAsync("/api/v1/finance/pots", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var pot = await response.Content.ReadFromJsonAsync<SpendingPotWithProgress>();
        pot!.MonthlyAllocation.Should().Be(50m);
        pot.AnnualAmount.Should().Be(600m);
    }

    [Fact]
    public async Task CreatePot_SinkingFundWithoutAnnualAmount_Returns400()
    {
        var request = new CreateSpendingPotRequest(
            "Car insurance", PotType.SinkingFund, 0m, false, null, null, Array.Empty<Guid>());

        var response = await _client.PostAsJsonAsync("/api/v1/finance/pots", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Contribute_WhenSinkingFundExists_IncrementsAccumulatedAmount()
    {
        var createResp = await _client.PostAsJsonAsync("/api/v1/finance/pots",
            new CreateSpendingPotRequest("Car insurance", PotType.SinkingFund, 0m, false, null, null,
                Array.Empty<Guid>(), AnnualAmount: 600m));
        var pot = await createResp.Content.ReadFromJsonAsync<SpendingPotWithProgress>();

        var response = await _client.PostAsync($"/api/v1/finance/pots/{pot!.Id}/contribute", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await response.Content.ReadFromJsonAsync<SpendingPotWithProgress>();
        updated!.AccumulatedAmount.Should().Be(50m);
    }

    [Fact]
    public async Task Contribute_WhenPotIsNotSinkingFund_Returns404()
    {
        var createResp = await _client.PostAsJsonAsync("/api/v1/finance/pots",
            new CreateSpendingPotRequest("Groceries", PotType.Groceries, 100m, false, null, null, Array.Empty<Guid>()));
        var pot = await createResp.Content.ReadFromJsonAsync<SpendingPotWithProgress>();

        var response = await _client.PostAsync($"/api/v1/finance/pots/{pot!.Id}/contribute", null);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Contribute_WhenPotDoesNotExist_Returns404()
    {
        var response = await _client.PostAsync($"/api/v1/finance/pots/{Guid.NewGuid()}/contribute", null);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
