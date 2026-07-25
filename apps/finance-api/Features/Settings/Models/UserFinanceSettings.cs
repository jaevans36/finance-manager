namespace FinanceApi.Features.Settings.Models;

public class UserFinanceSettings
{
    public Guid UserId { get; set; }
    public decimal EmergencyBuffer { get; set; } = 200m;

    /// <summary>
    /// When set, income detection is restricted to these account IDs.
    /// Null / empty means all accounts are scanned (default behaviour).
    /// Stored as JSON for InMemory test compatibility.
    /// </summary>
    public List<Guid>? IncomeAccountIds { get; set; }
}
