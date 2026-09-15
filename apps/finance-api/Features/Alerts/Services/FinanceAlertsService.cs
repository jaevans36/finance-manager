using FinanceApi.Data;
using FinanceApi.Features.Alerts.Models;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Bills.Services;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Alerts.Services;

/// <summary>
/// The real "what to check and send" logic for the daily finance alerts job — a plain
/// scoped service with no dependency on <see cref="Microsoft.Extensions.Hosting.IHostedService"/>,
/// so it's directly unit-testable. <see cref="Features.Alerts.BackgroundServices.FinanceAlertsBackgroundService"/>
/// is just a timer that calls this on a schedule.
/// </summary>
public class FinanceAlertsService : IFinanceAlertsService
{
    private static readonly RecurringPatternType[] AlertablePatternTypes =
    {
        RecurringPatternType.Subscription,
        RecurringPatternType.FixedBill,
        RecurringPatternType.VariableBill
    };

    private readonly FinanceDbContext _db;
    private readonly IBillService _bills;
    private readonly IRecurringPaymentDetector _detector;
    private readonly IFinanceDiscordNotifier _discord;
    private readonly IActivityLogService _activityLog;
    private readonly TimeProvider _timeProvider;
    private readonly decimal _priceChangeThresholdPercent;

    public FinanceAlertsService(
        FinanceDbContext db,
        IBillService bills,
        IRecurringPaymentDetector detector,
        IFinanceDiscordNotifier discord,
        IActivityLogService activityLog,
        TimeProvider timeProvider,
        IConfiguration config)
    {
        _db = db;
        _bills = bills;
        _detector = detector;
        _discord = discord;
        _activityLog = activityLog;
        _timeProvider = timeProvider;
        _priceChangeThresholdPercent = config.GetValue<decimal?>("Alerts:PriceChangeThresholdPercent") ?? 10m;
    }

    public async Task<DailyAlertsRunResult> RunDailyAlertsAsync(bool bypassRunGate, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(_timeProvider.GetUtcNow().UtcDateTime);

        if (!bypassRunGate)
        {
            var alreadyRan = await _db.NotificationRuns.AnyAsync(r => r.RunDate == today, ct);
            if (alreadyRan)
                return new DailyAlertsRunResult(today, Array.Empty<UserAlertsSummary>());
        }

        var userIds = await _db.Accounts.Select(a => a.UserId).Distinct().ToListAsync(ct);
        var summaries = new List<UserAlertsSummary>();

        foreach (var userId in userIds)
        {
            summaries.Add(await ProcessUserAsync(userId, today, ct));
        }

        if (!bypassRunGate)
        {
            _db.NotificationRuns.Add(new NotificationRun { RunDate = today });
            await _db.SaveChangesAsync(ct);
        }

        return new DailyAlertsRunResult(today, summaries);
    }

    private async Task<UserAlertsSummary> ProcessUserAsync(Guid userId, DateOnly today, CancellationToken ct)
    {
        var upcoming = await _bills.GetUpcomingBillsAsync(userId, today.ToDateTime(TimeOnly.MinValue), daysAhead: 0, ct: ct);
        // Filter defensively for exactly "due today" rather than trusting the daysAhead boundary alone.
        var dueToday = upcoming.Where(u => u.DaysUntilDue == 0).ToList();

        var patterns = await _detector.DetectAsync(userId, days: 365, ct);
        var priceChanges = new List<PriceChangeDto>();

        foreach (var pattern in patterns)
        {
            if (pattern.IsLikelyInactive) continue;
            if (!AlertablePatternTypes.Contains(pattern.PatternType)) continue;

            var baseline = await _db.RecurringPaymentBaselines.FirstOrDefaultAsync(
                b => b.UserId == userId && b.MerchantName == pattern.MerchantName && b.AccountId == pattern.AccountId, ct);

            if (baseline is null)
            {
                // First time we've ever seen this merchant — seed the baseline, don't
                // alert (alerting here would flood every existing subscription on day one).
                _db.RecurringPaymentBaselines.Add(new RecurringPaymentBaseline
                {
                    UserId = userId,
                    MerchantName = pattern.MerchantName,
                    AccountId = pattern.AccountId,
                    LastAlertedAmount = pattern.LatestAmount
                });
                continue;
            }

            if (baseline.LastAlertedAmount == 0) continue;

            var percentChange = (pattern.LatestAmount - baseline.LastAlertedAmount) / baseline.LastAlertedAmount * 100m;
            if (Math.Abs(percentChange) < _priceChangeThresholdPercent) continue;

            priceChanges.Add(new PriceChangeDto(
                pattern.MerchantName, pattern.AccountName, baseline.LastAlertedAmount, pattern.LatestAmount, percentChange));

            // Update the baseline to the new price so the same jump can't re-fire tomorrow.
            baseline.LastAlertedAmount = pattern.LatestAmount;
            baseline.LastAlertedAtUtc = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        if (dueToday.Count > 0)
        {
            await _discord.SendAsync(FormatDigest(dueToday), ct);
            await _activityLog.LogAsync(userId, FinanceActivityType.DailyDigestSent,
                $"Sent digest for {dueToday.Count} bill(s) due today", null, null);
        }

        if (priceChanges.Count > 0)
        {
            await _discord.SendAsync(FormatPriceChanges(priceChanges), ct);
            await _activityLog.LogAsync(userId, FinanceActivityType.PriceChangeAlertSent,
                $"Sent price-change alert for {priceChanges.Count} recurring payment(s)", null, null);
        }

        return new UserAlertsSummary(userId, dueToday.Select(u => u.Bill.Name).ToList(), priceChanges);
    }

    private static string FormatDigest(List<UpcomingBillResponse> dueToday)
    {
        var lines = new List<string> { $"**Bills due today ({dueToday.Count})**" };
        lines.AddRange(dueToday.Select(u => $"- {u.Bill.Name} — £{u.Bill.Amount:0.00}"));
        return string.Join('\n', lines);
    }

    private static string FormatPriceChanges(List<PriceChangeDto> changes)
    {
        var lines = new List<string> { $"**Price changes detected ({changes.Count})**" };
        lines.AddRange(changes.Select(c =>
        {
            var direction = c.PercentChange >= 0 ? "up" : "down";
            return $"- {c.MerchantName} ({c.AccountName}): £{c.PreviousAmount:0.00} → £{c.NewAmount:0.00} ({direction} {Math.Abs(c.PercentChange):0.0}%)";
        }));
        return string.Join('\n', lines);
    }
}
