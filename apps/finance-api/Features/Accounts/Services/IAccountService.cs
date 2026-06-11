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
    decimal? PromotionalRevertRate = null
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
    decimal? PromotionalRevertRate = null
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
    decimal? PromotionalRevertRate = null
);

public interface IAccountService
{
    Task<IEnumerable<AccountSummary>> GetAccountsAsync(Guid userId, CancellationToken ct = default);
    Task<Account?> GetAccountByIdAsync(Guid userId, Guid accountId, CancellationToken ct = default);
    Task<Account> CreateAccountAsync(Guid userId, CreateAccountRequest request, CancellationToken ct = default);
    Task<Account?> UpdateAccountAsync(Guid userId, Guid accountId, UpdateAccountRequest request, CancellationToken ct = default);
    Task<bool> DeleteAccountAsync(Guid userId, Guid accountId, CancellationToken ct = default);
    Task<decimal> GetNetWorthAsync(Guid userId, CancellationToken ct = default);
}
