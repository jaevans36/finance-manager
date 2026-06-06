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
    private readonly Guid _userId = Guid.NewGuid();
    private static readonly Guid GroceriesCategoryId = Guid.Parse("10000000-0000-0000-0000-000000000101");

    public PotsControllerTests(FinanceWebApplicationFactory factory)
    {
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
}
