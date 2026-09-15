namespace FinanceApi.Features.Alerts.Models;

/// <summary>One detected price change worth alerting on.</summary>
public record PriceChangeDto(
    string MerchantName,
    string AccountName,
    decimal PreviousAmount,
    decimal NewAmount,
    decimal PercentChange);

/// <summary>What happened for one user during a daily alerts run.</summary>
public record UserAlertsSummary(
    Guid UserId,
    IReadOnlyList<string> BillsDueToday,
    IReadOnlyList<PriceChangeDto> PriceChanges);

/// <summary>The full result of one daily alerts run, across all users — returned by the dev-trigger endpoint.</summary>
public record DailyAlertsRunResult(
    DateOnly RunDate,
    IReadOnlyList<UserAlertsSummary> Users);
