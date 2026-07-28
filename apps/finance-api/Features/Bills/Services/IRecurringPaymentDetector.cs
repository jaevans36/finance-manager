using FinanceApi.Features.Bills.Models;

namespace FinanceApi.Features.Bills.Services;

public interface IRecurringPaymentDetector
{
    Task<IEnumerable<RecurringPattern>> DetectAsync(Guid userId, int days = 365, CancellationToken ct = default);
}
