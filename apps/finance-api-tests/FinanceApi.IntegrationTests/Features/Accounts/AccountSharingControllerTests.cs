using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Accounts.Services;
using FinanceApi.Features.Common.Users.Models;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.Accounts;

[Collection("Finance Integration")]
public class AccountSharingControllerTests
{
    private readonly FinanceWebApplicationFactory _factory;
    private readonly HttpClient _ownerClient;
    private readonly HttpClient _recipientClient;
    private readonly Guid _ownerId = Guid.NewGuid();
    private readonly Guid _recipientId = Guid.NewGuid();
    // Unique per test instance — the integration test factory shares one in-memory database
    // across every test in the "Finance Integration" collection, so a hardcoded username would
    // collide with rows other tests seed the same way.
    private readonly string _recipientUsername;

    public AccountSharingControllerTests(FinanceWebApplicationFactory factory)
    {
        _factory = factory;
        _recipientUsername = $"jade-{_recipientId:N}";

        _ownerClient = factory.CreateClient();
        _ownerClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_ownerId));

        _recipientClient = factory.CreateClient();
        _recipientClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_recipientId));

        // Seed a LifeManagerUser row for the recipient so ShareAccountAsync can resolve them by
        // username — finance-api reads this table but doesn't own it (see LifeManagerUser's doc
        // comment), so tests have to seed it directly the same way the real "public.users" table
        // is populated by life-api's own registration flow.
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
        db.LifeManagerUsers.Add(new LifeManagerUser { Id = _recipientId, Email = $"{_recipientUsername}@example.test", Username = _recipientUsername });
        db.SaveChanges();
    }

    private async Task<Guid> CreateAccountAsOwner()
    {
        var request = new CreateAccountRequest("Shared Account", AccountType.Checking, "GBP", 0m, null, null, null, null, false, null);
        var response = await _ownerClient.PostAsJsonAsync("/api/v1/finance/accounts", request);
        var account = await response.Content.ReadFromJsonAsync<Account>();
        return account!.Id;
    }

    [Fact]
    public async Task ShareAccount_ThenRecipientSeesItInSharedWithMe_AfterAccepting()
    {
        var accountId = await CreateAccountAsOwner();

        var shareResponse = await _ownerClient.PostAsJsonAsync($"/api/v1/finance/accounts/{accountId}/share", new ShareAccountRequest(_recipientUsername));
        shareResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var share = await shareResponse.Content.ReadFromJsonAsync<AccountShareDto>();

        var acceptResponse = await _recipientClient.PostAsync($"/api/v1/finance/accounts/share-invitations/{share!.Id}/accept", null);
        acceptResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var sharedWithMe = await _recipientClient.GetFromJsonAsync<List<AccountShareDto>>("/api/v1/finance/accounts/shared-with-me");
        sharedWithMe.Should().ContainSingle(s => s.AccountId == accountId);
    }

    [Fact]
    public async Task RecipientCanSeeAndEditTheSharedAccount_ViaTheNormalAccountsEndpoints()
    {
        var accountId = await CreateAccountAsOwner();
        var shareResponse = await _ownerClient.PostAsJsonAsync($"/api/v1/finance/accounts/{accountId}/share", new ShareAccountRequest(_recipientUsername));
        var share = await shareResponse.Content.ReadFromJsonAsync<AccountShareDto>();
        await _recipientClient.PostAsync($"/api/v1/finance/accounts/share-invitations/{share!.Id}/accept", null);

        var getResponse = await _recipientClient.GetAsync($"/api/v1/finance/accounts/{accountId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updateRequest = new UpdateAccountRequest("Renamed By Recipient", null, null, null, null, null, null, null, null, null, null);
        var updateResponse = await _recipientClient.PatchAsJsonAsync($"/api/v1/finance/accounts/{accountId}", updateRequest);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task RecipientCannotSeeTheAccount_BeforeAccepting()
    {
        var accountId = await CreateAccountAsOwner();
        await _ownerClient.PostAsJsonAsync($"/api/v1/finance/accounts/{accountId}/share", new ShareAccountRequest(_recipientUsername));

        var getResponse = await _recipientClient.GetAsync($"/api/v1/finance/accounts/{accountId}");

        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task RecipientCannotDeleteTheSharedAccount_OwnerOnly()
    {
        var accountId = await CreateAccountAsOwner();
        var shareResponse = await _ownerClient.PostAsJsonAsync($"/api/v1/finance/accounts/{accountId}/share", new ShareAccountRequest(_recipientUsername));
        var share = await shareResponse.Content.ReadFromJsonAsync<AccountShareDto>();
        await _recipientClient.PostAsync($"/api/v1/finance/accounts/share-invitations/{share!.Id}/accept", null);

        var deleteResponse = await _recipientClient.DeleteAsync($"/api/v1/finance/accounts/{accountId}");

        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ShareAccount_WhenCallerDoesNotOwnTheAccount_Returns404()
    {
        var accountId = await CreateAccountAsOwner();

        // Recipient (who doesn't own the account) tries to share it
        var response = await _recipientClient.PostAsJsonAsync($"/api/v1/finance/accounts/{accountId}/share", new ShareAccountRequest(_recipientUsername));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task RevokeShare_RemovesTheRecipientsAccess()
    {
        var accountId = await CreateAccountAsOwner();
        var shareResponse = await _ownerClient.PostAsJsonAsync($"/api/v1/finance/accounts/{accountId}/share", new ShareAccountRequest(_recipientUsername));
        var share = await shareResponse.Content.ReadFromJsonAsync<AccountShareDto>();
        await _recipientClient.PostAsync($"/api/v1/finance/accounts/share-invitations/{share!.Id}/accept", null);

        var revokeResponse = await _ownerClient.DeleteAsync($"/api/v1/finance/accounts/{accountId}/shares/{share.Id}");
        revokeResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await _recipientClient.GetAsync($"/api/v1/finance/accounts/{accountId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
