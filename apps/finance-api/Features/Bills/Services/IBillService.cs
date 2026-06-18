using FinanceApi.Features.Bills.Models;

namespace FinanceApi.Features.Bills.Services;

public interface IBillService
{
    Task<IEnumerable<Bill>> GetBillsAsync(Guid userId, CancellationToken ct = default);
    Task<IEnumerable<Bill>> GetAllBillsAsync(Guid userId, CancellationToken ct = default);
    Task<IEnumerable<UpcomingBill>> GetUpcomingBillsAsync(Guid userId, DateTime? today = null, int daysAhead = 30, CancellationToken ct = default);
    Task<Bill> CreateBillAsync(Guid userId, CreateBillRequest request, CancellationToken ct = default);
    Task<Bill?> UpdateBillAsync(Guid userId, Guid billId, UpdateBillRequest request, CancellationToken ct = default);
    Task<bool> DeleteBillAsync(Guid userId, Guid billId, CancellationToken ct = default);
    Task<bool> MarkAsPaidAsync(Guid userId, Guid billId, CancellationToken ct = default);
}
