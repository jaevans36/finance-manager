using FinanceApi.Features.IncomeStreams.Models;

namespace FinanceApi.Features.IncomeStreams.Services;

public interface IIncomeStreamService
{
    Task<IEnumerable<IncomeStreamResponse>> GetStreamsAsync(Guid userId, CancellationToken ct = default);
    Task<IncomeStreamResponse> CreateStreamAsync(Guid userId, CreateIncomeStreamRequest request, CancellationToken ct = default);
    Task<IncomeStreamResponse?> UpdateStreamAsync(Guid userId, Guid streamId, UpdateIncomeStreamRequest request, CancellationToken ct = default);
    Task<bool> DeleteStreamAsync(Guid userId, Guid streamId, CancellationToken ct = default);
    Task<DetectedIncomeResponse> GetDetectedIncomeAsync(Guid userId, Guid accountId, CancellationToken ct = default);
}
