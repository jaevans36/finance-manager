using FinanceApi.Features.Bills.Models;

namespace FinanceApi.Features.Bills.Services;

public interface IBillService
{
    Task<IEnumerable<BillResponse>> GetBillsAsync(Guid userId, CancellationToken ct = default);
    Task<IEnumerable<BillResponse>> GetAllBillsAsync(Guid userId, CancellationToken ct = default);
    Task<IEnumerable<BillResponse>> GetByAccountIdAsync(Guid userId, Guid accountId, CancellationToken ct = default);
    Task<IEnumerable<UpcomingBillResponse>> GetUpcomingBillsAsync(Guid userId, DateTime? today = null, int daysAhead = 30, CancellationToken ct = default);
    Task<BillResponse> CreateBillAsync(Guid userId, CreateBillRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<BillResponse?> UpdateBillAsync(Guid userId, Guid billId, UpdateBillRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<bool> DeleteBillAsync(Guid userId, Guid billId, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<bool> MarkAsPaidAsync(Guid userId, Guid billId, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
}
