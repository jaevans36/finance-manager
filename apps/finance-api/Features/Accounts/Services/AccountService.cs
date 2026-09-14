using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Accounts.Services;

/// <summary>CRUD and balance operations for financial accounts.</summary>
public class AccountService : IAccountService
{
    private readonly FinanceDbContext _db;
    private readonly IActivityLogService _activityLog;
    private readonly IAccountSharingService _sharing;

    public AccountService(FinanceDbContext db, IActivityLogService activityLog, IAccountSharingService sharing)
    {
        _db = db;
        _activityLog = activityLog;
        _sharing = sharing;
    }

    public async Task<IEnumerable<AccountSummary>> GetAccountsAsync(Guid userId, CancellationToken ct = default)
    {
        var visibleIds = await _sharing.GetVisibleAccountIdsAsync(userId);

        // Name is column-encrypted, so sorting has to happen after materialization — SQL
        // can't meaningfully ORDER BY ciphertext. Per-user account lists are short, so this
        // costs nothing in practice.
        var accounts = await _db.Accounts
            .Where(a => visibleIds.Contains(a.Id) && a.IsActive)
            .Select(a => new AccountSummary(
                a.Id, a.Name, a.Type, a.Currency, a.Balance,
                a.Institution, a.Colour, a.Icon, a.IsActive, a.ExcludeFromNetWorth,
                a.CreditLimit, a.InterestRate, a.PromotionalBalance,
                a.PromotionalRate, a.PromotionalExpiry, a.PromotionalRevertRate,
                a.MortgageStartDate, a.MortgageTermYears,
                a.IsInterestOnly, a.MinimumMonthlyPayment, a.CurrentMonthlyPayment, a.LoanEndDate))
            .ToListAsync(ct);

        return accounts.OrderBy(a => a.Name);
    }

    public async Task<Account?> GetAccountByIdAsync(Guid userId, Guid accountId, CancellationToken ct = default)
    {
        var visibleIds = await _sharing.GetVisibleAccountIdsAsync(userId);
        if (!visibleIds.Contains(accountId)) return null;

        return await _db.Accounts.FirstOrDefaultAsync(a => a.Id == accountId, ct);
    }

    public async Task<Account> CreateAccountAsync(Guid userId, CreateAccountRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var account = new Account
        {
            UserId = userId,
            Name = request.Name,
            Type = request.Type,
            Currency = request.Currency,
            Balance = request.InitialBalance ?? 0m,
            Institution = request.Institution,
            AccountNumberSuffix = request.AccountNumberSuffix,
            Colour = request.Colour,
            Icon = request.Icon,
            ExcludeFromNetWorth = request.ExcludeFromNetWorth,
            Notes = request.Notes,
            CreditLimit = request.CreditLimit,
            InterestRate = request.InterestRate,
            PromotionalBalance = request.PromotionalBalance,
            PromotionalRate = request.PromotionalRate,
            PromotionalExpiry = request.PromotionalExpiry,
            PromotionalRevertRate = request.PromotionalRevertRate,
            MortgageStartDate = request.MortgageStartDate,
            MortgageTermYears = request.MortgageTermYears,
            IsInterestOnly = request.IsInterestOnly,
            MinimumMonthlyPayment = request.MinimumMonthlyPayment,
            CurrentMonthlyPayment = request.CurrentMonthlyPayment,
            LoanEndDate = request.LoanEndDate,
        };

        _db.Accounts.Add(account);
        await _db.SaveChangesAsync(ct);
        await _activityLog.LogAsync(userId, FinanceActivityType.AccountCreated, $"Created {account.Type} account", ipAddress, userAgent);
        return account;
    }

    public async Task<Account?> UpdateAccountAsync(Guid userId, Guid accountId, UpdateAccountRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        // Full read/write for anyone the account is shared with, not just the owner — the
        // deliberate design choice for this feature (see AccountShare's doc comment).
        var visibleIds = await _sharing.GetVisibleAccountIdsAsync(userId);
        if (!visibleIds.Contains(accountId)) return null;

        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == accountId, ct);

        if (account is null) return null;

        // Track which fields actually changed, by name only — never log field values here.
        // Several of these (Name, Institution, Notes, AccountNumberSuffix) are column-encrypted;
        // logging the value would defeat the point of encrypting them.
        var changedFields = new List<string>();
        if (request.Name is not null) { account.Name = request.Name; changedFields.Add(nameof(Account.Name)); }
        if (request.Type is not null) { account.Type = request.Type.Value; changedFields.Add(nameof(Account.Type)); }
        if (request.Currency is not null) { account.Currency = request.Currency; changedFields.Add(nameof(Account.Currency)); }
        if (request.Balance is not null) { account.Balance = request.Balance.Value; changedFields.Add(nameof(Account.Balance)); }
        if (request.Institution is not null) { account.Institution = request.Institution; changedFields.Add(nameof(Account.Institution)); }
        if (request.AccountNumberSuffix is not null) { account.AccountNumberSuffix = request.AccountNumberSuffix; changedFields.Add(nameof(Account.AccountNumberSuffix)); }
        if (request.IsActive is not null) { account.IsActive = request.IsActive.Value; changedFields.Add(nameof(Account.IsActive)); }
        if (request.Colour is not null) { account.Colour = request.Colour; changedFields.Add(nameof(Account.Colour)); }
        if (request.Icon is not null) { account.Icon = request.Icon; changedFields.Add(nameof(Account.Icon)); }
        if (request.ExcludeFromNetWorth is not null) { account.ExcludeFromNetWorth = request.ExcludeFromNetWorth.Value; changedFields.Add(nameof(Account.ExcludeFromNetWorth)); }
        if (request.Notes is not null) { account.Notes = request.Notes; changedFields.Add(nameof(Account.Notes)); }
        if (request.CreditLimit is not null) { account.CreditLimit = request.CreditLimit; changedFields.Add(nameof(Account.CreditLimit)); }
        if (request.InterestRate is not null) { account.InterestRate = request.InterestRate; changedFields.Add(nameof(Account.InterestRate)); }
        if (request.PromotionalBalance is not null) { account.PromotionalBalance = request.PromotionalBalance; changedFields.Add(nameof(Account.PromotionalBalance)); }
        if (request.PromotionalRate is not null) { account.PromotionalRate = request.PromotionalRate; changedFields.Add(nameof(Account.PromotionalRate)); }
        if (request.PromotionalExpiry is not null) { account.PromotionalExpiry = request.PromotionalExpiry; changedFields.Add(nameof(Account.PromotionalExpiry)); }
        if (request.PromotionalRevertRate is not null) { account.PromotionalRevertRate = request.PromotionalRevertRate; changedFields.Add(nameof(Account.PromotionalRevertRate)); }
        if (request.MortgageStartDate is not null) { account.MortgageStartDate = request.MortgageStartDate; changedFields.Add(nameof(Account.MortgageStartDate)); }
        if (request.MortgageTermYears is not null) { account.MortgageTermYears = request.MortgageTermYears; changedFields.Add(nameof(Account.MortgageTermYears)); }
        if (request.IsInterestOnly is not null) { account.IsInterestOnly = request.IsInterestOnly.Value; changedFields.Add(nameof(Account.IsInterestOnly)); }
        if (request.MinimumMonthlyPayment is not null) { account.MinimumMonthlyPayment = request.MinimumMonthlyPayment; changedFields.Add(nameof(Account.MinimumMonthlyPayment)); }
        if (request.CurrentMonthlyPayment is not null) { account.CurrentMonthlyPayment = request.CurrentMonthlyPayment; changedFields.Add(nameof(Account.CurrentMonthlyPayment)); }
        if (request.LoanEndDate is not null) { account.LoanEndDate = request.LoanEndDate; changedFields.Add(nameof(Account.LoanEndDate)); }
        account.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        if (changedFields.Count > 0)
        {
            await _activityLog.LogAsync(userId, FinanceActivityType.AccountUpdated, $"Updated: {string.Join(", ", changedFields)}", ipAddress, userAgent);
        }
        return account;
    }

    public async Task<bool> DeleteAccountAsync(Guid userId, Guid accountId, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        // Deliberately owner-only, unlike Update — sharing an account grants full day-to-day
        // read/write (transactions, balances, details), but deleting the account entirely is a
        // step beyond that. Matches RevokeShareAsync's owner-only restriction on sharing itself.
        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId, ct);

        if (account is null) return false;

        // Soft-delete: mark inactive rather than physically removing
        account.IsActive = false;
        account.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _activityLog.LogAsync(userId, FinanceActivityType.AccountDeleted, $"Deleted {account.Type} account", ipAddress, userAgent);
        return true;
    }

    public async Task<decimal> GetNetWorthAsync(Guid userId, CancellationToken ct = default)
    {
        // Consistent with the read paths above: a shared account counts the same as an owned
        // one everywhere, rather than being visible in the list but silently excluded here.
        var visibleIds = await _sharing.GetVisibleAccountIdsAsync(userId);

        return await _db.Accounts
            .Where(a => visibleIds.Contains(a.Id) && a.IsActive && !a.ExcludeFromNetWorth)
            .SumAsync(a => a.Balance, ct);
    }
}
