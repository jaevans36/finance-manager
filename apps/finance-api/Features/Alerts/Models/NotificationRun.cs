namespace FinanceApi.Features.Alerts.Models;

/// <summary>
/// Marks that the daily alerts job completed for a given calendar date. Written only
/// after a full run finishes successfully — a crash mid-run leaves no row, so the next
/// background-service tick retries automatically rather than silently skipping a day.
/// </summary>
public class NotificationRun
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateOnly RunDate { get; set; }
    public DateTime CompletedAtUtc { get; set; } = DateTime.UtcNow;
}
