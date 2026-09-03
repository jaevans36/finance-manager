using System.Text.Json.Serialization;

namespace FinanceApi.Features.Insights.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum InsightSeverity { Info, Warning, Critical }

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum InsightType { SpendingVelocity, Anomaly, Subscription, PriceIncrease }

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AnomalyType { CategorySpike, NewMerchant, PotentialDuplicate }

public record CategoryVelocity(
    Guid CategoryId,
    string CategoryName,
    decimal SpentSoFar,
    decimal DailyAverage,
    decimal ProjectedTotal,
    decimal? BudgetLimit,
    decimal? ProjectedOverspend);

public record SpendingVelocityResponse(
    int DaysElapsed,
    int DaysInMonth,
    decimal TotalSpentSoFar,
    decimal DailyAverage,
    decimal ProjectedMonthEndTotal,
    decimal? BudgetTotal,
    decimal? ProjectedOverspend,
    IReadOnlyList<CategoryVelocity> Categories);

public record AnomalyAlert(
    string Id,
    AnomalyType Type,
    Guid TransactionId,
    string MerchantName,
    decimal Amount,
    DateOnly TransactionDate,
    string Description,
    InsightSeverity Severity);

public record SubscriptionAuditItem(
    string MerchantName,
    decimal MonthlyCost,
    decimal AnnualCost,
    string Frequency,
    bool PossiblyUnused,
    DateOnly? LastOccurrence,
    string AmountTrend);

public record SubscriptionAuditResponse(
    IReadOnlyList<SubscriptionAuditItem> Subscriptions,
    decimal TotalMonthlyCost,
    decimal TotalAnnualCost,
    int PossiblyUnusedCount);

public record NegotiationScriptResponse(
    string MerchantName,
    int TenureMonths,
    decimal TotalSpent,
    decimal AverageMonthlyAmount,
    int PaymentCount,
    decimal PaymentConsistencyPct,
    string Script,
    string Disclaimer);

public record InsightCard(
    string Id,
    InsightType Type,
    InsightSeverity Severity,
    string Title,
    string Summary,
    string? ActionLabel);

public record InsightsSummaryResponse(IReadOnlyList<InsightCard> Cards);
