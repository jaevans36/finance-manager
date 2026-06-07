namespace FinanceApi.Features.Bills.Models;

public enum RecurringFrequency { Weekly, Monthly, Quarterly, Annual, Unknown }
public enum RecurringPatternType { FixedBill, VariableBill, Subscription, RegularSpend }
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
