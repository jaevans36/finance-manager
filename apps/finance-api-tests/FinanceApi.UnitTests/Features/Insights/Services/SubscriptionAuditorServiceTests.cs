using FluentAssertions;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Bills.Services;
using FinanceApi.Features.Insights.Services;

namespace FinanceApi.UnitTests.Features.Insights.Services;

public class SubscriptionAuditorServiceTests
{
    [Fact]
    public async Task GetSubscriptionsAsync_IncludesPatternsClassifiedAsSubscription()
    {
        var detector = new FakeRecurringPaymentDetector(
            new RecurringPattern("NETFLIX", 15.99m, 15.99m, 15.99m, 15.99m,
                RecurringFrequency.Monthly, RecurringPatternType.Subscription, AmountTrend.Stable,
                3, DateOnly.FromDateTime(DateTime.UtcNow), false));
        var sut = new SubscriptionAuditorService(detector);

        var result = await sut.GetSubscriptionsAsync(Guid.NewGuid());

        result.Subscriptions.Should().ContainSingle(s => s.MerchantName == "NETFLIX");
        result.Subscriptions[0].MonthlyCost.Should().Be(15.99m);
    }

    [Fact]
    public async Task GetSubscriptionsAsync_IncludesKnownMerchant_EvenIfNotClassifiedAsSubscription()
    {
        var detector = new FakeRecurringPaymentDetector(
            new RecurringPattern("SPOTIFY PREMIUM", 11.99m, 11.99m, 9.99m, 11.99m,
                RecurringFrequency.Monthly, RecurringPatternType.VariableBill, AmountTrend.Increasing,
                4, DateOnly.FromDateTime(DateTime.UtcNow), false));
        var sut = new SubscriptionAuditorService(detector);

        var result = await sut.GetSubscriptionsAsync(Guid.NewGuid());

        result.Subscriptions.Should().ContainSingle(s => s.MerchantName == "SPOTIFY PREMIUM");
    }

    [Fact]
    public async Task GetSubscriptionsAsync_ExcludesUnrelatedRecurringSpend()
    {
        var detector = new FakeRecurringPaymentDetector(
            new RecurringPattern("COSTA COFFEE", 4.50m, 4.50m, 3.50m, 5.50m,
                RecurringFrequency.Weekly, RecurringPatternType.RegularSpend, AmountTrend.Stable,
                10, DateOnly.FromDateTime(DateTime.UtcNow), false));
        var sut = new SubscriptionAuditorService(detector);

        var result = await sut.GetSubscriptionsAsync(Guid.NewGuid());

        result.Subscriptions.Should().BeEmpty();
    }

    [Fact]
    public async Task GetSubscriptionsAsync_NormalisesAnnualCostToMonthly()
    {
        var detector = new FakeRecurringPaymentDetector(
            new RecurringPattern("AMAZON PRIME", 95m, 95m, 95m, 95m,
                RecurringFrequency.Annual, RecurringPatternType.Subscription, AmountTrend.Stable,
                1, DateOnly.FromDateTime(DateTime.UtcNow), false));
        var sut = new SubscriptionAuditorService(detector);

        var result = await sut.GetSubscriptionsAsync(Guid.NewGuid());

        result.Subscriptions[0].MonthlyCost.Should().Be(Math.Round(95m / 12, 2));
    }

    [Fact]
    public async Task GetSubscriptionsAsync_FlagsPossiblyUnused_WhenLikelyInactive()
    {
        var detector = new FakeRecurringPaymentDetector(
            new RecurringPattern("DISNEY+", 7.99m, 7.99m, 7.99m, 7.99m,
                RecurringFrequency.Monthly, RecurringPatternType.Subscription, AmountTrend.Stable,
                2, DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-3)), true));
        var sut = new SubscriptionAuditorService(detector);

        var result = await sut.GetSubscriptionsAsync(Guid.NewGuid());

        result.Subscriptions[0].PossiblyUnused.Should().BeTrue();
        result.PossiblyUnusedCount.Should().Be(1);
    }

    [Fact]
    public async Task GetSubscriptionsAsync_SumsTotalMonthlyAndAnnualCost()
    {
        var detector = new FakeRecurringPaymentDetector(
            new RecurringPattern("NETFLIX", 10m, 10m, 10m, 10m, RecurringFrequency.Monthly, RecurringPatternType.Subscription, AmountTrend.Stable, 3, null, false),
            new RecurringPattern("SPOTIFY", 10m, 10m, 10m, 10m, RecurringFrequency.Monthly, RecurringPatternType.Subscription, AmountTrend.Stable, 3, null, false));
        var sut = new SubscriptionAuditorService(detector);

        var result = await sut.GetSubscriptionsAsync(Guid.NewGuid());

        result.TotalMonthlyCost.Should().Be(20m);
        result.TotalAnnualCost.Should().Be(240m);
    }

    private class FakeRecurringPaymentDetector(params RecurringPattern[] patterns) : IRecurringPaymentDetector
    {
        public Task<IEnumerable<RecurringPattern>> DetectAsync(Guid userId, int days = 365, CancellationToken ct = default)
            => Task.FromResult<IEnumerable<RecurringPattern>>(patterns);
    }
}
