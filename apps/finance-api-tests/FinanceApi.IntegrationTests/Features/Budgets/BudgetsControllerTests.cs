using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using FinanceApi.Features.Budgets.Services;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.Budgets;

[Collection("Finance Integration")]
public class BudgetsControllerTests
{
    private readonly HttpClient _client;
    private readonly FinanceWebApplicationFactory _factory;
    private readonly Guid _userId = Guid.NewGuid();

    // Seeded system category GUIDs (from FinanceDbContext.SeedCategories — requires EnsureCreated)
    private static readonly Guid GroceriesCategoryId = Guid.Parse("10000000-0000-0000-0000-000000000101");

    public BudgetsControllerTests(FinanceWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    [Fact]
    public async Task GetCurrentBudgets_WhenAuthenticated_ReturnsEmptyListForNewUser()
    {
        var response = await _client.GetAsync("/api/v1/finance/budgets/current");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var budgets = await response.Content.ReadFromJsonAsync<List<BudgetWithProgress>>();
        budgets.Should().NotBeNull();
        budgets!.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateBudget_WhenValidRequest_Returns201WithBudgetData()
    {
        var request = new CreateBudgetRequest(GroceriesCategoryId, DateTime.UtcNow.Month, DateTime.UtcNow.Year, 200m);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/budgets", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var budget = await response.Content.ReadFromJsonAsync<BudgetWithProgress>();
        budget.Should().NotBeNull();
        budget!.Amount.Should().Be(200m);
        budget.CategoryId.Should().Be(GroceriesCategoryId);
        budget.Spent.Should().Be(0m);
    }

    [Fact]
    public async Task CreateBudget_WhenAmountIsZero_Returns400()
    {
        var request = new CreateBudgetRequest(GroceriesCategoryId, 1, 2025, 0m);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/budgets", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateBudget_WhenCategoryIdIsEmpty_Returns400()
    {
        var request = new CreateBudgetRequest(Guid.Empty, 1, 2025, 100m);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/budgets", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateBudget_WhenValidRequest_ReturnsUpdatedAmount()
    {
        var createResp = await _client.PostAsJsonAsync("/api/v1/finance/budgets",
            new CreateBudgetRequest(GroceriesCategoryId, 3, 2025, 100m));
        var created = await createResp.Content.ReadFromJsonAsync<BudgetWithProgress>();

        var updateResp = await _client.PutAsJsonAsync(
            $"/api/v1/finance/budgets/{created!.Id}", new UpdateBudgetRequest(300m));

        updateResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await updateResp.Content.ReadFromJsonAsync<BudgetWithProgress>();
        updated!.Amount.Should().Be(300m);
    }

    [Fact]
    public async Task UpdateBudget_WhenNotFound_Returns404()
    {
        var response = await _client.PutAsJsonAsync(
            $"/api/v1/finance/budgets/{Guid.NewGuid()}", new UpdateBudgetRequest(100m));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteBudget_WhenExists_Returns204()
    {
        var createResp = await _client.PostAsJsonAsync("/api/v1/finance/budgets",
            new CreateBudgetRequest(GroceriesCategoryId, 4, 2025, 150m));
        var created = await createResp.Content.ReadFromJsonAsync<BudgetWithProgress>();

        var deleteResp = await _client.DeleteAsync($"/api/v1/finance/budgets/{created!.Id}");

        deleteResp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task GetTrends_Returns200WithValidMonthsRange()
    {
        var response = await _client.GetAsync("/api/v1/finance/budgets/trends?months=3");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetTrends_WhenMonthsExceedsMax_Returns400()
    {
        var response = await _client.GetAsync("/api/v1/finance/budgets/trends?months=99");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetBudgets_WhenUnauthenticated_Returns401()
    {
        var unauthClient = _factory.CreateClient(); // no Authorization header — returns 401

        var response = await unauthClient.GetAsync("/api/v1/finance/budgets/current");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
