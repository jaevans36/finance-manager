using FinanceApi.Features.Insights.Models;

namespace FinanceApi.Features.Insights.Services;

public interface ISubscriptionAuditorService
{
    Task<SubscriptionAuditResponse> GetSubscriptionsAsync(Guid userId, CancellationToken ct = default);
}
