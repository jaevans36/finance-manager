using System.Text;
using System.Text.Json;

namespace FinanceApi.Features.Alerts.Services;

/// <summary>
/// Posts finance alerts (bill digest, price-change warnings) to a dedicated Discord
/// webhook — same HTTP+JSON body shape as <c>LifeApi.Infrastructure.Logging.DiscordWebhookSink</c>,
/// but as a normal DI-registered typed client (see <c>AddHttpClient</c> in Program.cs)
/// rather than a Serilog sink's manually-constructed static client, since this is an
/// ordinary injectable service and a failed send here is worth logging rather than
/// silently swallowing.
/// </summary>
public sealed class FinanceDiscordAlertClient : IFinanceDiscordNotifier
{
    private readonly HttpClient _http;
    private readonly string? _webhookUrl;
    private readonly ILogger<FinanceDiscordAlertClient> _logger;

    public FinanceDiscordAlertClient(HttpClient http, IConfiguration config, ILogger<FinanceDiscordAlertClient> logger)
    {
        _http = http;
        var configured = config["DISCORD_FINANCE_ALERTS_WEBHOOK"];
        _webhookUrl = string.IsNullOrWhiteSpace(configured) ? null : configured;
        _logger = logger;
    }

    public async Task SendAsync(string content, CancellationToken ct = default)
    {
        if (_webhookUrl is null)
        {
            _logger.LogWarning("DISCORD_FINANCE_ALERTS_WEBHOOK not configured; finance alert suppressed.");
            return;
        }

        try
        {
            var payload = JsonSerializer.Serialize(new { content, username = "Finance Alerts" });
            using var body = new StringContent(payload, Encoding.UTF8, "application/json");
            using var response = await _http.PostAsync(_webhookUrl, body, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Discord finance alert post failed with status {Status}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Discord finance alert post threw");
        }
    }
}
