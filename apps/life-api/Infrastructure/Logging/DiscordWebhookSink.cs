using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using Serilog.Core;
using Serilog.Events;

namespace LifeApi.Infrastructure.Logging;

/// <summary>
/// Serilog sink that posts <see cref="LogEventLevel.Error"/> and <see cref="LogEventLevel.Fatal"/>
/// events to a Discord channel via an incoming webhook. It no-ops when no webhook URL is configured,
/// never throws (a logging failure must not affect the request), and applies a per-signature cooldown
/// so a crash loop cannot flood the channel.
/// </summary>
internal sealed class DiscordWebhookSink : ILogEventSink
{
    private const int DiscordContentLimit = 1900;
    private const int MaxTrackedSignatures = 500;

    private static readonly TimeSpan Cooldown = TimeSpan.FromMinutes(5);
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(10) };

    private readonly string? webhookUrl;
    private readonly ConcurrentDictionary<string, DateTime> lastSentUtc = new();

    /// <summary>
    /// Initializes a new instance of the <see cref="DiscordWebhookSink"/> class.
    /// </summary>
    /// <param name="webhookUrl">
    /// The Discord incoming-webhook URL. When null, empty, or whitespace the sink is disabled.
    /// </param>
    public DiscordWebhookSink(string? webhookUrl)
    {
        this.webhookUrl = string.IsNullOrWhiteSpace(webhookUrl) ? null : webhookUrl;
    }

    /// <inheritdoc />
    public void Emit(LogEvent logEvent)
    {
        if (this.webhookUrl is null || logEvent.Level < LogEventLevel.Error)
        {
            return;
        }

        var signature = BuildSignature(logEvent);
        var now = DateTime.UtcNow;

        if (this.lastSentUtc.TryGetValue(signature, out var last) && now - last < Cooldown)
        {
            return;
        }

        this.lastSentUtc[signature] = now;
        if (this.lastSentUtc.Count > MaxTrackedSignatures)
        {
            this.lastSentUtc.Clear();
        }

        _ = PostAsync(this.webhookUrl, BuildContent(logEvent));
    }

    private static string BuildSignature(LogEvent logEvent)
        => logEvent.Exception is { } ex
            ? $"{ex.GetType().FullName}|{ex.Message}"
            : logEvent.MessageTemplate.Text;

    private static string BuildContent(LogEvent logEvent)
    {
        var sb = new StringBuilder();
        sb.Append("**[").Append(logEvent.Level.ToString().ToUpperInvariant()).Append("]** ");
        sb.Append(logEvent.Timestamp.UtcDateTime.ToString("yyyy-MM-dd HH:mm:ss 'UTC'"));
        sb.Append('\n');
        sb.Append(logEvent.RenderMessage());

        if (logEvent.Exception is { } ex)
        {
            sb.Append("\n```\n");
            sb.Append(ex.GetType().Name).Append(": ").Append(ex.Message).Append('\n');
            if (!string.IsNullOrEmpty(ex.StackTrace))
            {
                sb.Append(ex.StackTrace);
            }

            sb.Append("\n```");
        }

        var text = sb.ToString();
        return text.Length > DiscordContentLimit
            ? string.Concat(text.AsSpan(0, DiscordContentLimit), "…")
            : text;
    }

    private static async Task PostAsync(string webhookUrl, string content)
    {
        try
        {
            var payload = JsonSerializer.Serialize(new { content, username = "Life Manager" });
            using var body = new StringContent(payload, Encoding.UTF8, "application/json");
            using var response = await Http.PostAsync(webhookUrl, body).ConfigureAwait(false);
        }
        catch
        {
            // A logging sink must never throw or surface errors into the application.
        }
    }
}
