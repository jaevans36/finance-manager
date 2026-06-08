using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using FinanceApi.Features.CategoryRules.Models;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.CategoryRules;

[Collection("Finance Integration")]
public class CategoryRulesControllerTests
{
    private readonly HttpClient _client;
    private readonly FinanceWebApplicationFactory _factory;
    private readonly Guid _userId = Guid.NewGuid();

    public CategoryRulesControllerTests(FinanceWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    [Fact]
    public async Task GetRules_WhenAuthenticated_ReturnsEmptyListForNewUser()
    {
        var response = await _client.GetAsync("/api/v1/finance/category-rules");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var rules = await response.Content.ReadFromJsonAsync<List<CategoryRuleDto>>();
        rules.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public async Task GetRules_WhenUnauthenticated_Returns401()
    {
        var unauthClient = _factory.CreateClient();
        var response = await unauthClient.GetAsync("/api/v1/finance/category-rules");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateRule_WithValidRequest_Returns201AndRule()
    {
        var categoryId = await GetFirstSystemCategoryIdAsync();
        var request = new CreateCategoryRuleRequest("Tesco", RuleMatchType.Contains, categoryId);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/category-rules", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var rule = await response.Content.ReadFromJsonAsync<CategoryRuleDto>();
        rule.Should().NotBeNull();
        rule!.Pattern.Should().Be("Tesco");
        rule.MatchType.Should().Be(RuleMatchType.Contains);
        rule.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task CreateThenGet_RoundTripsCorrectly()
    {
        var categoryId = await GetFirstSystemCategoryIdAsync();
        await _client.PostAsJsonAsync("/api/v1/finance/category-rules",
            new CreateCategoryRuleRequest("Netflix", RuleMatchType.Contains, categoryId));

        var response = await _client.GetAsync("/api/v1/finance/category-rules");
        var rules = await response.Content.ReadFromJsonAsync<List<CategoryRuleDto>>();

        rules.Should().ContainSingle(r => r.Pattern == "Netflix");
    }

    [Fact]
    public async Task DeleteRule_WhenOwner_Returns204()
    {
        var categoryId = await GetFirstSystemCategoryIdAsync();
        var created = await (await _client.PostAsJsonAsync("/api/v1/finance/category-rules",
            new CreateCategoryRuleRequest("ALDI", RuleMatchType.StartsWith, categoryId)))
            .Content.ReadFromJsonAsync<CategoryRuleDto>();

        var response = await _client.DeleteAsync($"/api/v1/finance/category-rules/{created!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteRule_WhenOtherUserOwns_Returns404()
    {
        var categoryId = await GetFirstSystemCategoryIdAsync();
        var otherClient = _factory.CreateClient();
        otherClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(Guid.NewGuid()));

        var created = await (await otherClient.PostAsJsonAsync("/api/v1/finance/category-rules",
            new CreateCategoryRuleRequest("LIDL", RuleMatchType.Contains, categoryId)))
            .Content.ReadFromJsonAsync<CategoryRuleDto>();

        var response = await _client.DeleteAsync($"/api/v1/finance/category-rules/{created!.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ApplyAll_WhenNoTransactions_ReturnsZeroUpdated()
    {
        var response = await _client.PostAsync("/api/v1/finance/category-rules/apply-all", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ApplyAllResult>();
        result!.Updated.Should().Be(0);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<Guid> GetFirstSystemCategoryIdAsync()
    {
        var response = await _client.GetAsync("/api/v1/finance/categories");
        var categories = await response.Content.ReadFromJsonAsync<List<CategorySummary>>();
        return categories!.First().Id;
    }

    private record CategorySummary(Guid Id, string Name);
    private record ApplyAllResult(int Updated);
}
