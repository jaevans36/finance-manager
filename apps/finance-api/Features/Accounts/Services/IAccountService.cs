using FinanceApi.Features.Accounts.Models;

namespace FinanceApi.Features.Accounts.Services;

public record AccountSummary(
    Guid Id,
    string Name,
    AccountType Type,
    string Currency,
    decimal Balance,
    string? Institution,
    string? Colour,
    string? Icon,
    bool IsActive,
    bool ExcludeFromNetWorth,
    decimal? CreditLimit = null,
    decimal? InterestRate = null,
    decimal? PromotionalBalance = null,
    decimal? PromotionalRate = null,
    DateOnly? PromotionalExpiry = null,
    decimal? PromotionalRevertRate = null,
    DateOnly? MortgageStartDate = null,
    int? MortgageTermYears = null,
    bool IsInterestOnly = false,
    decimal? MinimumMonthlyPayment = null,
    decimal? CurrentMonthlyPayment = null,
    DateOnly? LoanEndDate = null
);

public record CreateAccountRequest(
    string Name,
    AccountType Type,
    string Currency,
    decimal? InitialBalance,
    string? Institution,
    string? AccountNumberSuffix,
    string? Colour,
    string? Icon,
    bool ExcludeFromNetWorth,
    string? Notes,
    decimal? CreditLimit = null,
    decimal? InterestRate = null,
    decimal? PromotionalBalance = null,
    decimal? PromotionalRate = null,
    DateOnly? PromotionalExpiry = null,
    decimal? PromotionalRevertRate = null,
    DateOnly? MortgageStartDate = null,
    int? MortgageTermYears = null,
    bool IsInterestOnly = false,
    decimal? MinimumMonthlyPayment = null,
    decimal? CurrentMonthlyPayment = null,
    DateOnly? LoanEndDate = null
);

public record UpdateAccountRequest(
    string? Name,
    AccountType? Type,
    string? Currency,
    decimal? Balance,
    string? Institution,
    string? AccountNumberSuffix,
    bool? IsActive,
    string? Colour,
    string? Icon,
    bool? ExcludeFromNetWorth,
    string? Notes,
    decimal? CreditLimit = null,
    decimal? InterestRate = null,
    decimal? PromotionalBalance = null,
    decimal? PromotionalRate = null,
    DateOnly? PromotionalExpiry = null,
    decimal? PromotionalRevertRate = null,
    DateOnly? MortgageStartDate = null,
    int? MortgageTermYears = null,
    bool? IsInterestOnly = null,
    decimal? MinimumMonthlyPayment = null,
    decimal? CurrentMonthlyPayment = null,
    DateOnly? LoanEndDate = null
);

/// <summary>
/// One point on the net-worth history chart — account balances only (reconstructed from
/// transaction history), not current asset values. See docs/intent/2026-09-14-net-worth-history.md
/// for why the trend line is accounts-only while the current net-worth figure includes assets.
/// </summary>
public record NetWorthHistoryPoint(int Month, int Year, string MonthLabel, decimal NetWorth);

public interface IAccountService
{
    Task<IEnumerable<AccountSummary>> GetAccountsAsync(Guid userId, CancellationToken ct = default);
    Task<Account?> GetAccountByIdAsync(Guid userId, Guid accountId, CancellationToken ct = default);
    Task<Account> CreateAccountAsync(Guid userId, CreateAccountRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<Account?> UpdateAccountAsync(Guid userId, Guid accountId, UpdateAccountRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<bool> DeleteAccountAsync(Guid userId, Guid accountId, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<decimal> GetNetWorthAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<NetWorthHistoryPoint>> GetNetWorthHistoryAsync(Guid userId, int months = 12, CancellationToken ct = default);
}
