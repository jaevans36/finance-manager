using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using FinanceApi.Features.IncomeStreams.Models;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.IncomeStreams;

[Collection("Finance Integration")]
public class IncomeStreamsControllerTests
{
    private readonly HttpClient _client;
    private readonly FinanceWebApplicationFactory _factory;
    private readonly Guid _userId = Guid.NewGuid();

    public IncomeStreamsControllerTests(FinanceWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    [Fact]
    public async Task GetStreams_WhenAuthenticated_ReturnsEmptyListForNewUser()
    {
        var response = await _client.GetAsync("/api/v1/finance/income-streams");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var streams = await response.Content.ReadFromJsonAsync<List<IncomeStreamResponse>>();
        streams.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public async Task GetStreams_WhenUnauthenticated_Returns401()
    {
        var unauthClient = _factory.CreateClient();
        var response = await unauthClient.GetAsync("/api/v1/finance/income-streams");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateStream_WhenValidRequest_Returns201WithStreamData()
    {
        var request = new CreateIncomeStreamRequest("Wife's salary", 2200m);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/income-streams", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var stream = await response.Content.ReadFromJsonAsync<IncomeStreamResponse>();
        stream.Should().NotBeNull();
        stream!.Name.Should().Be("Wife's salary");
        stream.MonthlyAmount.Should().Be(2200m);
    }

    [Fact]
    public async Task CreateStream_WhenNameIsBlank_Returns400()
    {
        var request = new CreateIncomeStreamRequest("", 2200m);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/income-streams", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateStream_WhenAmountIsNegative_Returns400()
    {
        var request = new CreateIncomeStreamRequest("My salary", -100m);

        var response = await _client.PostAsJsonAsync("/api/v1/finance/income-streams", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateStream_WhenStreamExists_UpdatesAmount()
    {
        var created = await _client.PostAsJsonAsync("/api/v1/finance/income-streams",
            new CreateIncomeStreamRequest("My salary", 2000m));
        var stream = await created.Content.ReadFromJsonAsync<IncomeStreamResponse>();

        var response = await _client.PutAsJsonAsync($"/api/v1/finance/income-streams/{stream!.Id}",
            new UpdateIncomeStreamRequest(MonthlyAmount: 3200m));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await response.Content.ReadFromJsonAsync<IncomeStreamResponse>();
        updated!.MonthlyAmount.Should().Be(3200m);
    }

    [Fact]
    public async Task UpdateStream_WhenStreamDoesNotExist_Returns404()
    {
        var response = await _client.PutAsJsonAsync($"/api/v1/finance/income-streams/{Guid.NewGuid()}",
            new UpdateIncomeStreamRequest(MonthlyAmount: 100m));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteStream_WhenStreamExists_Returns204AndRemovesStream()
    {
        var created = await _client.PostAsJsonAsync("/api/v1/finance/income-streams",
            new CreateIncomeStreamRequest("My salary", 2000m));
        var stream = await created.Content.ReadFromJsonAsync<IncomeStreamResponse>();

        var response = await _client.DeleteAsync($"/api/v1/finance/income-streams/{stream!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var list = await _client.GetFromJsonAsync<List<IncomeStreamResponse>>("/api/v1/finance/income-streams");
        list.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteStream_WhenStreamDoesNotExist_Returns404()
    {
        var response = await _client.DeleteAsync($"/api/v1/finance/income-streams/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DetectIncome_WhenAccountHasNoCredits_ReturnsNullAmount()
    {
        var response = await _client.GetAsync($"/api/v1/finance/income-streams/detect?accountId={Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<DetectedIncomeResponse>();
        result!.DetectedMonthlyAmount.Should().BeNull();
    }
}
