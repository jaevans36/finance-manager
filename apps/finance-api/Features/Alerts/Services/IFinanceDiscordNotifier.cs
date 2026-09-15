namespace FinanceApi.Features.Alerts.Services;

public interface IFinanceDiscordNotifier
{
    /// <summary>Posts a message to the configured finance-alerts Discord webhook. No-ops if none is configured.</summary>
    Task SendAsync(string content, CancellationToken ct = default);
}
