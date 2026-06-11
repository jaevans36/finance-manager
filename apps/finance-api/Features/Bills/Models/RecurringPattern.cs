using System.Text.Json.Serialization;

namespace FinanceApi.Features.Bills.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RecurringFrequency { Weekly, Monthly, Quarterly, Annual, Unknown }

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RecurringPatternType { FixedBill, VariableBill, Subscription, RegularSpend }

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AmountTrend { Stable, Increasing, Decreasing }

public record RecurringPattern(
    string MerchantName,
    decimal AverageAmount,
    decimal MinAmount,
    decimal MaxAmount,
    RecurringFrequency DetectedFrequency,
    RecurringPatternType PatternType,
    AmountTrend AmountTrend,
    int OccurrencesInPeriod,
    DateOnly? LastOccurrence);
