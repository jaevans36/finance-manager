using FinanceApi.Features.Debt.Models;

namespace FinanceApi.Features.Debt.Services;

public interface IDebtProjectionService
{
    Task<DebtOverviewResponse> GetOverviewAsync(Guid userId, CancellationToken ct = default);
    Task<DebtProjectionResponse> ProjectAsync(Guid userId, ProjectionRequest request, CancellationToken ct = default);
}
