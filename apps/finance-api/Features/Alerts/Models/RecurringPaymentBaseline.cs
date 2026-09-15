namespace FinanceApi.Features.Alerts.Models;

/// <summary>
/// The last amount a price-change alert actually fired on for one user's recurring
/// payment (merchant + account). Independent of <c>RecurringPaymentDetector</c>'s
/// windowed trend — that signal is stateless and recomputed every call, which would
/// keep flagging "Increasing" for months after a single jump. This baseline lets the
/// daily alert job fire once per real price change, not once per day the window still
/// contains it.
/// </summary>
public class RecurringPaymentBaseline
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string MerchantName { get; set; } = string.Empty;
    public Guid AccountId { get; set; }
    public decimal LastAlertedAmount { get; set; }
    public DateTime LastAlertedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
