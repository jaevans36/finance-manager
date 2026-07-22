using FinanceApi.Features.Insights.Models;

namespace FinanceApi.Features.Insights.Services;

public interface ISpendingVelocityService
{
    Task<SpendingVelocityResponse> GetVelocityAsync(Guid userId, CancellationToken ct = default);
}
