using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using FinanceApi.Features.Assets.Models;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.Assets;

[Collection("Finance Integration")]
public class AssetsControllerTests
{
    private readonly HttpClient _client;
    private readonly FinanceWebApplicationFactory _factory;
    private readonly Guid _userId = Guid.NewGuid();

    public AssetsControllerTests(FinanceWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    [Fact]
    public async Task GetAssets_WhenUnauthenticated_Returns401()
    {
        var unauthClient = _factory.CreateClient();

        var response = await unauthClient.GetAsync("/api/v1/finance/assets");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateAsset_WhenValidRequest_Returns201WithAsset()
    {
        var request = new CreateAssetRequest("The house", AssetType.Property, 350000m, "3-bed semi");

        var response = await _client.PostAsJsonAsync("/api/v1/finance/assets", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var asset = await response.Content.ReadFromJsonAsync<AssetDto>();
        asset!.Name.Should().Be("The house");
        asset.Value.Should().Be(350000m);
    }

    [Fact]
    public async Task CreateAsset_WhenNameMissing_Returns400()
    {
        var request = new CreateAssetRequest("", AssetType.Other, 100m);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/assets", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAssets_ReturnsCreatedAssets()
    {
        await _client.PostAsJsonAsync("/api/v1/finance/assets", new CreateAssetRequest("The car", AssetType.Vehicle, 8000m));

        var response = await _client.GetAsync("/api/v1/finance/assets");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var assets = await response.Content.ReadFromJsonAsync<List<AssetDto>>();
        assets.Should().ContainSingle(a => a.Name == "The car");
    }

    [Fact]
    public async Task UpdateAsset_WhenAssetExists_UpdatesValue()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/v1/finance/assets",
            new CreateAssetRequest("The house", AssetType.Property, 350000m));
        var created = await createResponse.Content.ReadFromJsonAsync<AssetDto>();

        var response = await _client.PatchAsJsonAsync($"/api/v1/finance/assets/{created!.Id}",
            new UpdateAssetRequest(Value: 375000m));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await response.Content.ReadFromJsonAsync<AssetDto>();
        updated!.Value.Should().Be(375000m);
    }

    [Fact]
    public async Task UpdateAsset_WhenAssetNotFound_Returns404()
    {
        var response = await _client.PatchAsJsonAsync($"/api/v1/finance/assets/{Guid.NewGuid()}",
            new UpdateAssetRequest(Value: 1m));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteAsset_WhenAssetExists_RemovesIt()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/v1/finance/assets",
            new CreateAssetRequest("To delete", AssetType.Other, 1m));
        var created = await createResponse.Content.ReadFromJsonAsync<AssetDto>();

        var deleteResponse = await _client.DeleteAsync($"/api/v1/finance/assets/{created!.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await _client.GetAsync("/api/v1/finance/assets");
        var assets = await getResponse.Content.ReadFromJsonAsync<List<AssetDto>>();
        assets.Should().NotContain(a => a.Id == created.Id);
    }
}
