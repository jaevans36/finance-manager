using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Debt.Models;

namespace FinanceApi.Features.Debt.Services;

public interface IDebtSeverityService
{
    (int Score, string Label, string? Reason) Score(Account account, DateOnly today);
}
