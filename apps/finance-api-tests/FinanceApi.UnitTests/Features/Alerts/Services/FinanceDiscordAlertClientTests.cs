using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Moq.Protected;
using FinanceApi.Features.Alerts.Services;

namespace FinanceApi.UnitTests.Features.Alerts.Services;

public class FinanceDiscordAlertClientTests
{
    [Fact]
    public async Task SendAsync_WhenNoWebhookConfigured_MakesNoHttpCall()
    {
        var handler = new Mock<HttpMessageHandler>();
        var sut = MakeClient(handler, webhookUrl: null);

        await sut.SendAsync("hello");

        handler.Protected().Verify(
            "SendAsync", Times.Never(),
            ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>());
    }

    [Fact]
    public async Task SendAsync_WhenWebhookConfigured_PostsTheContent()
    {
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.NoContent));
        var sut = MakeClient(handler, webhookUrl: "https://discord.example/webhook");

        var act = async () => await sut.SendAsync("hello");

        await act.Should().NotThrowAsync();
        handler.Protected().Verify(
            "SendAsync", Times.Once(),
            ItExpr.Is<HttpRequestMessage>(r => r.RequestUri!.ToString() == "https://discord.example/webhook"),
            ItExpr.IsAny<CancellationToken>());
    }

    [Fact]
    public async Task SendAsync_WhenDiscordReturnsAnErrorStatus_DoesNotThrow()
    {
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.TooManyRequests));
        var sut = MakeClient(handler, webhookUrl: "https://discord.example/webhook");

        var act = async () => await sut.SendAsync("hello");

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task SendAsync_WhenTheHttpCallThrows_DoesNotThrow()
    {
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("network down"));
        var sut = MakeClient(handler, webhookUrl: "https://discord.example/webhook");

        var act = async () => await sut.SendAsync("hello");

        await act.Should().NotThrowAsync();
    }

    private static FinanceDiscordAlertClient MakeClient(Mock<HttpMessageHandler> handler, string? webhookUrl)
    {
        var http = new HttpClient(handler.Object);
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(webhookUrl is null
                ? []
                : new Dictionary<string, string?> { ["DISCORD_FINANCE_ALERTS_WEBHOOK"] = webhookUrl })
            .Build();
        return new FinanceDiscordAlertClient(http, config, NullLogger<FinanceDiscordAlertClient>.Instance);
    }
}
