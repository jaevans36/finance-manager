using FinanceApi.Features.Insights.Models;

namespace FinanceApi.Features.Insights.Services;

public interface INegotiationEngineService
{
    Task<NegotiationScriptResponse?> GetScriptAsync(Guid userId, string merchantName, CancellationToken ct = default);
}
