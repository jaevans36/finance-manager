using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using FinanceApi.Features.Tags.Models;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.Tags;

[Collection("Finance Integration")]
public class TagsControllerTests
{
    private readonly HttpClient _client;
    private readonly FinanceWebApplicationFactory _factory;
    private readonly Guid _userId = Guid.NewGuid();

    public TagsControllerTests(FinanceWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    [Fact]
    public async Task GetTags_WhenUnauthenticated_Returns401()
    {
        var unauthClient = _factory.CreateClient();

        var response = await unauthClient.GetAsync("/api/v1/finance/tags");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateTag_WhenValidRequest_Returns201WithTag()
    {
        var request = new CreateTagRequest("Wales holiday 2026", "#22C55E");

        var response = await _client.PostAsJsonAsync("/api/v1/finance/tags", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var tag = await response.Content.ReadFromJsonAsync<TagDto>();
        tag!.Name.Should().Be("Wales holiday 2026");
        tag.Colour.Should().Be("#22C55E");
    }

    [Fact]
    public async Task CreateTag_WhenNameMissing_Returns400()
    {
        var request = new CreateTagRequest("");

        var response = await _client.PostAsJsonAsync("/api/v1/finance/tags", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetTags_ReturnsCreatedTags()
    {
        await _client.PostAsJsonAsync("/api/v1/finance/tags", new CreateTagRequest("Kitchen reno"));

        var response = await _client.GetAsync("/api/v1/finance/tags");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var tags = await response.Content.ReadFromJsonAsync<List<TagDto>>();
        tags.Should().ContainSingle(t => t.Name == "Kitchen reno");
    }

    [Fact]
    public async Task DeleteTag_WhenTagExists_RemovesIt()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/v1/finance/tags", new CreateTagRequest("To delete"));
        var created = await createResponse.Content.ReadFromJsonAsync<TagDto>();

        var deleteResponse = await _client.DeleteAsync($"/api/v1/finance/tags/{created!.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await _client.GetAsync("/api/v1/finance/tags");
        var tags = await getResponse.Content.ReadFromJsonAsync<List<TagDto>>();
        tags.Should().NotContain(t => t.Id == created.Id);
    }

    [Fact]
    public async Task DeleteTag_WhenTagNotFound_Returns404()
    {
        var response = await _client.DeleteAsync($"/api/v1/finance/tags/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
