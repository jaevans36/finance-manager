using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Accounts.Services;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.Accounts;

[Collection("Finance Integration")]
public class AccountsControllerTests
{
    private readonly HttpClient _client;
    private readonly FinanceWebApplicationFactory _factory;
    private readonly Guid _userId = Guid.NewGuid();

    public AccountsControllerTests(FinanceWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    // ── Authentication ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAccounts_WhenUnauthenticated_Returns401()
    {
        var unauthClient = _factory.CreateClient();

        var response = await unauthClient.GetAsync("/api/v1/finance/accounts");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── GET /accounts ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAccounts_WhenAuthenticated_ReturnsEmptyListForNewUser()
    {
        var response = await _client.GetAsync("/api/v1/finance/accounts");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var accounts = await response.Content.ReadFromJsonAsync<List<AccountSummary>>();
        accounts.Should().NotBeNull();
        accounts!.Where(a => a.Id != Guid.Empty).Should().BeEmpty();
    }

    // ── POST /accounts ────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAccount_WhenValidRequest_Returns201WithAccountData()
    {
        var request = new CreateAccountRequest(
            "My Current Account", AccountType.Checking, "GBP",
            1000m, "Barclays", null, "#3B82F6", "wallet", false, null);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/accounts", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var account = await response.Content.ReadFromJsonAsync<Account>();
        account.Should().NotBeNull();
        account!.Name.Should().Be("My Current Account");
        account.Institution.Should().Be("Barclays");
        account.Balance.Should().Be(1000m);
    }

    [Fact]
    public async Task CreateAccount_WhenNameIsEmpty_Returns400()
    {
        var request = new CreateAccountRequest(
            "", AccountType.Checking, "GBP", null, null, null, null, null, false, null);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/accounts", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── GET /accounts/{id} ────────────────────────────────────────────────────

    [Fact]
    public async Task GetAccount_WhenAccountDoesNotExist_Returns404()
    {
        var response = await _client.GetAsync($"/api/v1/finance/accounts/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetAccount_WhenAccountExists_ReturnsAccount()
    {
        var createReq = new CreateAccountRequest(
            "Savings Pot", AccountType.Savings, "GBP", 500m, null, null, null, null, false, null);
        var createResp = await _client.PostAsJsonAsync("/api/v1/finance/accounts", createReq);
        var created = await createResp.Content.ReadFromJsonAsync<Account>();

        var response = await _client.GetAsync($"/api/v1/finance/accounts/{created!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var account = await response.Content.ReadFromJsonAsync<Account>();
        account!.Name.Should().Be("Savings Pot");
    }

    // ── PATCH /accounts/{id} ──────────────────────────────────────────────────

    [Fact]
    public async Task UpdateAccount_WhenValidRequest_ReturnsUpdatedAccount()
    {
        var createReq = new CreateAccountRequest(
            "Original Name", AccountType.Checking, "GBP", null, null, null, null, null, false, null);
        var createResp = await _client.PostAsJsonAsync("/api/v1/finance/accounts", createReq);
        var created = await createResp.Content.ReadFromJsonAsync<Account>();

        var updateReq = new UpdateAccountRequest("Renamed Account", null, null, null, "HSBC", null, null, null, null, null, null);
        var response = await _client.PatchAsJsonAsync($"/api/v1/finance/accounts/{created!.Id}", updateReq);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await response.Content.ReadFromJsonAsync<Account>();
        updated!.Name.Should().Be("Renamed Account");
        updated.Institution.Should().Be("HSBC");
    }

    // ── DELETE /accounts/{id} ─────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAccount_WhenAccountExists_Returns204AndIsRemovedFromList()
    {
        var createReq = new CreateAccountRequest(
            "To Be Deleted", AccountType.Checking, "GBP", null, null, null, null, null, false, null);
        var createResp = await _client.PostAsJsonAsync("/api/v1/finance/accounts", createReq);
        var created = await createResp.Content.ReadFromJsonAsync<Account>();

        var deleteResponse = await _client.DeleteAsync($"/api/v1/finance/accounts/{created!.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var listResp = await _client.GetAsync("/api/v1/finance/accounts");
        var accounts = await listResp.Content.ReadFromJsonAsync<List<AccountSummary>>();
        accounts!.Should().NotContain(a => a.Id == created.Id);
    }

    // ── GET /accounts/net-worth ───────────────────────────────────────────────

    [Fact]
    public async Task GetNetWorth_SumsActiveNonExcludedAccounts()
    {
        await _client.PostAsJsonAsync("/api/v1/finance/accounts",
            new CreateAccountRequest("Current", AccountType.Checking, "GBP", 1000m, null, null, null, null, false, null));
        await _client.PostAsJsonAsync("/api/v1/finance/accounts",
            new CreateAccountRequest("Savings", AccountType.Savings, "GBP", 2500m, null, null, null, null, false, null));
        await _client.PostAsJsonAsync("/api/v1/finance/accounts",
            new CreateAccountRequest("Mortgage", AccountType.Mortgage, "GBP", -150000m, null, null, null, null, true, null));

        var response = await _client.GetAsync("/api/v1/finance/accounts/net-worth");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<NetWorthResult>();
        result!.NetWorth.Should().Be(3500m); // 1000 + 2500 (mortgage excluded)
    }

    private record NetWorthResult(decimal NetWorth);
}
