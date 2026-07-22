using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Accounts.Services;
using FinanceApi.Features.Insights.Models;
using FinanceApi.Features.Transactions.Models;
using FinanceApi.Features.Transactions.Services;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.Insights;

[Collection("Finance Integration")]
public class InsightsControllerTests
{
    private readonly HttpClient _client;
    private readonly FinanceWebApplicationFactory _factory;
    private readonly Guid _userId = Guid.NewGuid();

    public InsightsControllerTests(FinanceWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    [Fact]
    public async Task GetSummary_WhenAuthenticated_Returns200WithEmptyCardsForNewUser()
    {
        var response = await _client.GetAsync("/api/v1/finance/insights");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<InsightsSummaryResponse>();
        result.Should().NotBeNull();
        result!.Cards.Should().BeEmpty();
    }

    [Fact]
    public async Task GetSummary_WhenUnauthenticated_Returns401()
    {
        var unauthClient = _factory.CreateClient();
        var response = await unauthClient.GetAsync("/api/v1/finance/insights");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetVelocity_WhenAuthenticated_ReturnsZeroSpendForNewUser()
    {
        var response = await _client.GetAsync("/api/v1/finance/insights/velocity");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<SpendingVelocityResponse>();
        result.Should().NotBeNull();
        result!.TotalSpentSoFar.Should().Be(0m);
    }

    [Fact]
    public async Task GetVelocity_WhenUnauthenticated_Returns401()
    {
        var unauthClient = _factory.CreateClient();
        var response = await unauthClient.GetAsync("/api/v1/finance/insights/velocity");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetAnomalies_WhenNoTransactions_ReturnsEmptyList()
    {
        var response = await _client.GetAsync("/api/v1/finance/insights/anomalies");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<AnomalyAlert>>();
        result.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public async Task GetSubscriptions_WhenNoTransactions_ReturnsEmptyList()
    {
        var response = await _client.GetAsync("/api/v1/finance/insights/subscriptions");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<SubscriptionAuditResponse>();
        result.Should().NotBeNull();
        result!.Subscriptions.Should().BeEmpty();
    }

    [Fact]
    public async Task GetNegotiationScript_WhenMerchantNameMissing_Returns400()
    {
        var response = await _client.GetAsync("/api/v1/finance/insights/negotiation-script");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetNegotiationScript_WhenNoHistoryForMerchant_Returns404()
    {
        var response = await _client.GetAsync("/api/v1/finance/insights/negotiation-script?merchantName=Nonexistent");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetNegotiationScript_WithTransactionHistory_Returns200WithScript()
    {
        var accountResponse = await _client.PostAsJsonAsync("/api/v1/finance/accounts",
            new CreateAccountRequest("Current Account", AccountType.Checking, "GBP", 0m,
                null, null, null, null, false, null));
        accountResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var account = await accountResponse.Content.ReadFromJsonAsync<AccountSummary>();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var txResponse = await _client.PostAsJsonAsync("/api/v1/finance/transactions",
            new CreateTransactionRequest(account!.Id, null, TransactionType.Debit, 30m, "GBP",
                "Sky Broadband", "Sky Broadband", today, null, null, null));
        txResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var response = await _client.GetAsync("/api/v1/finance/insights/negotiation-script?merchantName=Sky+Broadband");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<NegotiationScriptResponse>();
        result.Should().NotBeNull();
        result!.Script.Should().Contain("Sky Broadband");
    }
}
