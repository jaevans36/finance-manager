using FinanceApi.Features.Alerts.Services;

namespace FinanceApi.Features.Alerts.BackgroundServices;

/// <summary>
/// Ticks every 15 minutes; once past the configured run hour it asks the scoped
/// <see cref="IFinanceAlertsService"/> to run — which itself checks whether today's
/// run already completed and no-ops if so. All real logic lives in that service; this
/// class is deliberately thin so there's nothing here worth unit-testing in isolation.
/// </summary>
public sealed class FinanceAlertsBackgroundService : BackgroundService
{
    private static readonly TimeSpan TickInterval = TimeSpan.FromMinutes(15);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<FinanceAlertsBackgroundService> _logger;
    private readonly int _runHourUtc;

    public FinanceAlertsBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<FinanceAlertsBackgroundService> logger,
        IConfiguration config)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _runHourUtc = config.GetValue<int?>("Alerts:DailyRunHourUtc") ?? 7;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TickInterval);
        do
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var timeProvider = scope.ServiceProvider.GetRequiredService<TimeProvider>();
                if (timeProvider.GetUtcNow().Hour < _runHourUtc)
                {
                    continue;
                }

                var alerts = scope.ServiceProvider.GetRequiredService<IFinanceAlertsService>();
                await alerts.RunDailyAlertsAsync(bypassRunGate: false, stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Finance alerts tick failed");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
