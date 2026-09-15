using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using FinanceApi.Features.Alerts.Models;
using FinanceApi.IntegrationTests.Helpers;

namespace FinanceApi.IntegrationTests.Features.Alerts;

[Collection("Finance Integration")]
public class DevControllerTests
{
    private readonly HttpClient _client;
    private readonly FinanceWebApplicationFactory _factory;
    private readonly Guid _userId = Guid.NewGuid();

    public DevControllerTests(FinanceWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));
    }

    [Fact]
    public async Task RunAlertsNow_WhenConfigFlagNotSet_Returns404()
    {
        // FinanceWebApplicationFactory doesn't set DevFeatures:AllowManualAlertsTrigger,
        // so it defaults to false — the endpoint must stay dead even in Development.
        var response = await _client.PostAsync("/api/v1/dev/alerts/run-now", null);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task RunAlertsNow_WhenBothGatesOpen_Returns200WithARunResult()
    {
        var factoryWithFlagEnabled = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["DevFeatures:AllowManualAlertsTrigger"] = "true",
                });
            });
        });
        var client = factoryWithFlagEnabled.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", JwtTestHelper.GenerateToken(_userId));

        var response = await client.PostAsync("/api/v1/dev/alerts/run-now", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<DailyAlertsRunResult>();
        result.Should().NotBeNull();
    }
}
