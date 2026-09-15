using FinanceApi.Features.Alerts.Models;

namespace FinanceApi.Features.Alerts.Services;

public interface IFinanceAlertsService
{
    /// <summary>
    /// Checks every user's bills due today and recurring-payment price changes, and
    /// posts a Discord alert for anything worth surfacing.
    /// </summary>
    /// <param name="bypassRunGate">
    /// When true, runs regardless of whether today's scheduled run already completed,
    /// and doesn't write the completion marker — for the dev-only manual trigger, so
    /// testing never blocks or falsely satisfies the real scheduled run later that day.
    /// </param>
    /// <param name="ct">Cancellation token.</param>
    Task<DailyAlertsRunResult> RunDailyAlertsAsync(bool bypassRunGate, CancellationToken ct = default);
}
