using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Bills.Services;
using FinanceApi.Features.Insights.Models;

namespace FinanceApi.Features.Insights.Services;

public class SubscriptionAuditorService(IRecurringPaymentDetector detector) : ISubscriptionAuditorService
{
    // Cross-referenced against detected recurring merchants — catches subscriptions whose
    // amount variance didn't classify them as RecurringPatternType.Subscription (e.g. a
    // variable-price streaming tier) as long as the merchant name matches a known provider.
    private static readonly string[] KnownSubscriptionKeywords =
    [
        "netflix", "spotify", "disney", "amazon prime", "apple", "youtube premium",
        "now tv", "nowtv", "playstation", "xbox game pass", "audible", "icloud",
        "google one", "hbo", "paramount", "hulu"
    ];

    public async Task<SubscriptionAuditResponse> GetSubscriptionsAsync(Guid userId, CancellationToken ct = default)
    {
        var patterns = await detector.DetectAsync(userId, days: 90, ct);

        var items = patterns
            .Where(p => p.PatternType == RecurringPatternType.Subscription || IsKnownSubscription(p.MerchantName))
            .Select(p =>
            {
                var monthlyCost = Math.Round(NormaliseToMonthly(p.AverageAmount, p.DetectedFrequency), 2);
                return new SubscriptionAuditItem(
                    p.MerchantName,
                    monthlyCost,
                    Math.Round(monthlyCost * 12, 2),
                    p.DetectedFrequency.ToString(),
                    p.IsLikelyInactive,
                    p.LastOccurrence,
                    p.AmountTrend.ToString());
            })
            .OrderByDescending(i => i.MonthlyCost)
            .ToList();

        return new SubscriptionAuditResponse(
            items,
            Math.Round(items.Sum(i => i.MonthlyCost), 2),
            Math.Round(items.Sum(i => i.AnnualCost), 2),
            items.Count(i => i.PossiblyUnused));
    }

    private static bool IsKnownSubscription(string merchantName)
    {
        var normalised = merchantName.ToLowerInvariant();
        return Array.Exists(KnownSubscriptionKeywords, kw => normalised.Contains(kw));
    }

    private static decimal NormaliseToMonthly(decimal amount, RecurringFrequency frequency) => frequency switch
    {
        RecurringFrequency.Weekly => amount * 52m / 12m,
        RecurringFrequency.Monthly => amount,
        RecurringFrequency.Quarterly => amount / 3m,
        RecurringFrequency.Annual => amount / 12m,
        _ => amount,
    };
}
