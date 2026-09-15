using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Alerts.Models;
using FinanceApi.Features.Alerts.Services;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Bills.Services;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;

namespace FinanceApi.UnitTests.Features.Alerts.Services;

public class FinanceAlertsServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly Mock<IBillService> _mockBills = new();
    private readonly Mock<IRecurringPaymentDetector> _mockDetector = new();
    private readonly Mock<IFinanceDiscordNotifier> _mockDiscord = new();
    private readonly Mock<IActivityLogService> _mockActivityLog = new();
    private readonly FinanceAlertsService _sut;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _accountId = Guid.NewGuid();

    // Fixed time anchor so the service and the test agree on "today".
    private static readonly DateTime Now = new(2026, 9, 15, 10, 0, 0, DateTimeKind.Utc);
    private static readonly DateOnly Today = DateOnly.FromDateTime(Now);

    public FinanceAlertsServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options, FinanceApi.UnitTests.TestHelpers.TestEncryption.Service);

        _db.Accounts.Add(new Account
        {
            Id = _accountId, UserId = _userId, Name = "Current",
            Type = AccountType.Checking, Currency = "GBP", Balance = 0
        });
        _db.SaveChanges();

        _mockBills.Setup(b => b.GetUpcomingBillsAsync(_userId, It.IsAny<DateTime?>(), 0, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<UpcomingBillResponse>());
        _mockDetector.Setup(d => d.DetectAsync(_userId, 365, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<RecurringPattern>());

        var config = new ConfigurationBuilder().Build();

        _sut = new FinanceAlertsService(
            _db, _mockBills.Object, _mockDetector.Object, _mockDiscord.Object,
            _mockActivityLog.Object, new FixedTimeProvider(Now), config);
    }

    public void Dispose() => _db.Dispose();

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    // ── Run gate ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task RunDailyAlertsAsync_WhenTodayAlreadyRan_NoOps()
    {
        _db.NotificationRuns.Add(new NotificationRun { RunDate = Today });
        await _db.SaveChangesAsync();

        var result = await _sut.RunDailyAlertsAsync(bypassRunGate: false);

        result.Users.Should().BeEmpty();
        _mockDetector.Verify(d => d.DetectAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RunDailyAlertsAsync_WhenBypassingGate_RunsEvenIfTodayAlreadyRan()
    {
        _db.NotificationRuns.Add(new NotificationRun { RunDate = Today });
        await _db.SaveChangesAsync();

        var result = await _sut.RunDailyAlertsAsync(bypassRunGate: true);

        result.Users.Should().ContainSingle(u => u.UserId == _userId);
    }

    [Fact]
    public async Task RunDailyAlertsAsync_WhenBypassingGate_DoesNotWriteARunMarker()
    {
        await _sut.RunDailyAlertsAsync(bypassRunGate: true);

        (await _db.NotificationRuns.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task RunDailyAlertsAsync_WhenNotBypassing_WritesARunMarkerAfterCompleting()
    {
        await _sut.RunDailyAlertsAsync(bypassRunGate: false);

        var run = await _db.NotificationRuns.SingleAsync();
        run.RunDate.Should().Be(Today);
    }

    // ── Bill digest ───────────────────────────────────────────────────────────

    [Fact]
    public async Task RunDailyAlertsAsync_WhenBillDueToday_SendsDigestAndLogsActivity()
    {
        var bill = MakeUpcomingBill("Council Tax", 150m, daysUntilDue: 0);
        _mockBills.Setup(b => b.GetUpcomingBillsAsync(_userId, It.IsAny<DateTime?>(), 0, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { bill });

        var result = await _sut.RunDailyAlertsAsync(bypassRunGate: true);

        _mockDiscord.Verify(d => d.SendAsync(It.Is<string>(s => s.Contains("Council Tax")), It.IsAny<CancellationToken>()), Times.Once);
        _mockActivityLog.Verify(a => a.LogAsync(_userId, FinanceActivityType.DailyDigestSent, It.IsAny<string>(), null, null), Times.Once);
        result.Users.Single().BillsDueToday.Should().Contain("Council Tax");
    }

    [Fact]
    public async Task RunDailyAlertsAsync_WhenNoBillsDueToday_SendsNothing()
    {
        await _sut.RunDailyAlertsAsync(bypassRunGate: true);

        _mockDiscord.Verify(d => d.SendAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockActivityLog.Verify(a => a.LogAsync(It.IsAny<Guid>(), FinanceActivityType.DailyDigestSent, It.IsAny<string>(), null, null), Times.Never);
    }

    // ── Price-change alerts ───────────────────────────────────────────────────

    [Fact]
    public async Task RunDailyAlertsAsync_WhenMerchantNeverSeenBefore_SeedsBaselineWithoutAlerting()
    {
        _mockDetector.Setup(d => d.DetectAsync(_userId, 365, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { MakePattern("Netflix", latestAmount: 9.99m) });

        await _sut.RunDailyAlertsAsync(bypassRunGate: true);

        _mockDiscord.Verify(d => d.SendAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        var baseline = await _db.RecurringPaymentBaselines.SingleAsync();
        baseline.MerchantName.Should().Be("Netflix");
        baseline.LastAlertedAmount.Should().Be(9.99m);
    }

    [Fact]
    public async Task RunDailyAlertsAsync_WhenChangeWithinThreshold_DoesNotAlertAndLeavesBaselineUntouched()
    {
        _db.RecurringPaymentBaselines.Add(new RecurringPaymentBaseline
        {
            UserId = _userId, MerchantName = "Netflix", AccountId = _accountId, LastAlertedAmount = 10.00m
        });
        await _db.SaveChangesAsync();
        // 3% increase — below the default 10% threshold
        _mockDetector.Setup(d => d.DetectAsync(_userId, 365, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { MakePattern("Netflix", latestAmount: 10.30m) });

        await _sut.RunDailyAlertsAsync(bypassRunGate: true);

        _mockDiscord.Verify(d => d.SendAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        var baseline = await _db.RecurringPaymentBaselines.SingleAsync();
        baseline.LastAlertedAmount.Should().Be(10.00m);
    }

    [Fact]
    public async Task RunDailyAlertsAsync_WhenChangeOverThreshold_AlertsAndUpdatesBaseline()
    {
        _db.RecurringPaymentBaselines.Add(new RecurringPaymentBaseline
        {
            UserId = _userId, MerchantName = "Netflix", AccountId = _accountId, LastAlertedAmount = 10.00m
        });
        await _db.SaveChangesAsync();
        // 15% increase — over the default 10% threshold
        _mockDetector.Setup(d => d.DetectAsync(_userId, 365, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { MakePattern("Netflix", latestAmount: 11.50m) });

        var result = await _sut.RunDailyAlertsAsync(bypassRunGate: true);

        _mockDiscord.Verify(d => d.SendAsync(It.Is<string>(s => s.Contains("Netflix") && s.Contains("11.50")), It.IsAny<CancellationToken>()), Times.Once);
        _mockActivityLog.Verify(a => a.LogAsync(_userId, FinanceActivityType.PriceChangeAlertSent, It.IsAny<string>(), null, null), Times.Once);
        var baseline = await _db.RecurringPaymentBaselines.SingleAsync();
        baseline.LastAlertedAmount.Should().Be(11.50m);
        result.Users.Single().PriceChanges.Should().ContainSingle(c => c.MerchantName == "Netflix");
    }

    [Fact]
    public async Task RunDailyAlertsAsync_SecondConsecutiveRunAfterAnAlert_DoesNotReAlert()
    {
        // This is the test proving the baseline approach actually fixes the windowed-trend
        // spam problem: after one alert fires and updates the baseline, an unchanged latest
        // amount the next run must not fire again.
        _db.RecurringPaymentBaselines.Add(new RecurringPaymentBaseline
        {
            UserId = _userId, MerchantName = "Netflix", AccountId = _accountId, LastAlertedAmount = 10.00m
        });
        await _db.SaveChangesAsync();
        _mockDetector.Setup(d => d.DetectAsync(_userId, 365, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { MakePattern("Netflix", latestAmount: 11.50m) });

        await _sut.RunDailyAlertsAsync(bypassRunGate: true);
        _mockDiscord.Invocations.Clear();

        // Run again — detector still reports the same (now-current) latest amount.
        await _sut.RunDailyAlertsAsync(bypassRunGate: true);

        _mockDiscord.Verify(d => d.SendAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RunDailyAlertsAsync_WhenPatternIsLikelyInactive_ExcludesItFromPriceChecks()
    {
        _db.RecurringPaymentBaselines.Add(new RecurringPaymentBaseline
        {
            UserId = _userId, MerchantName = "OldGym", AccountId = _accountId, LastAlertedAmount = 10.00m
        });
        await _db.SaveChangesAsync();
        _mockDetector.Setup(d => d.DetectAsync(_userId, 365, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { MakePattern("OldGym", latestAmount: 20.00m, isLikelyInactive: true) });

        await _sut.RunDailyAlertsAsync(bypassRunGate: true);

        _mockDiscord.Verify(d => d.SendAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RunDailyAlertsAsync_WhenPatternTypeIsRegularSpend_ExcludesItFromPriceChecks()
    {
        _mockDetector.Setup(d => d.DetectAsync(_userId, 365, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { MakePattern("Tesco", latestAmount: 50.00m, patternType: RecurringPatternType.RegularSpend) });

        await _sut.RunDailyAlertsAsync(bypassRunGate: true);

        (await _db.RecurringPaymentBaselines.CountAsync()).Should().Be(0);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UpcomingBillResponse MakeUpcomingBill(string name, decimal amount, int daysUntilDue) => new(
        new BillResponse(Guid.NewGuid(), _userId, name, null, amount, BillFrequency.Monthly, 1, 5,
            false, null, null, null, true, DateTime.UtcNow, DateTime.UtcNow, _accountId, "Current", null, false),
        Now.AddDays(daysUntilDue), daysUntilDue, false);

    private RecurringPattern MakePattern(
        string merchantName,
        decimal latestAmount,
        RecurringPatternType patternType = RecurringPatternType.Subscription,
        bool isLikelyInactive = false) => new(
        merchantName, latestAmount, latestAmount, latestAmount, latestAmount,
        RecurringFrequency.Monthly, patternType, AmountTrend.Stable, 3, Today, _accountId, "Current", isLikelyInactive);
}
