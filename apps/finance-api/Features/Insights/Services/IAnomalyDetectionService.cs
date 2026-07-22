using FinanceApi.Features.Insights.Models;

namespace FinanceApi.Features.Insights.Services;

public interface IAnomalyDetectionService
{
    Task<IReadOnlyList<AnomalyAlert>> GetAnomaliesAsync(Guid userId, CancellationToken ct = default);
}
