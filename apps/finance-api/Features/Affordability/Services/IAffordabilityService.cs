using FinanceApi.Features.Affordability.Models;

namespace FinanceApi.Features.Affordability.Services;

public interface IAffordabilityService
{
    Task<AffordabilityResponse> GetAffordabilityAsync(Guid userId, CancellationToken ct = default);
    Task UpdateManualIncomeAsync(Guid userId, decimal monthlyIncome, CancellationToken ct = default);
    Task UpdateIncomeAccountsAsync(Guid userId, IReadOnlyList<Guid> accountIds, CancellationToken ct = default);
}
