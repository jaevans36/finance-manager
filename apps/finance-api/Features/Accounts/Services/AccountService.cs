using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Accounts.Services;

/// <summary>CRUD and balance operations for financial accounts.</summary>
public class AccountService : IAccountService
{
    private readonly FinanceDbContext _db;

    public AccountService(FinanceDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<AccountSummary>> GetAccountsAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.Accounts
            .Where(a => a.UserId == userId && a.IsActive)
            .OrderBy(a => a.Name)
            .Select(a => new AccountSummary(
                a.Id, a.Name, a.Type, a.Currency, a.Balance,
                a.Institution, a.Colour, a.Icon, a.IsActive, a.ExcludeFromNetWorth,
                a.CreditLimit, a.InterestRate, a.PromotionalBalance,
                a.PromotionalRate, a.PromotionalExpiry, a.PromotionalRevertRate,
                a.MortgageStartDate, a.MortgageTermYears,
                a.IsInterestOnly, a.MinimumMonthlyPayment, a.CurrentMonthlyPayment, a.LoanEndDate))
            .ToListAsync(ct);
    }

    public async Task<Account?> GetAccountByIdAsync(Guid userId, Guid accountId, CancellationToken ct = default)
    {
        return await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId, ct);
    }

    public async Task<Account> CreateAccountAsync(Guid userId, CreateAccountRequest request, CancellationToken ct = default)
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
        return account;
    }

    public async Task<Account?> UpdateAccountAsync(Guid userId, Guid accountId, UpdateAccountRequest request, CancellationToken ct = default)
    {
        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId, ct);

        if (account is null) return null;

        if (request.Name is not null) account.Name = request.Name;
        if (request.Type is not null) account.Type = request.Type.Value;
        if (request.Currency is not null) account.Currency = request.Currency;
        if (request.Balance is not null) account.Balance = request.Balance.Value;
        if (request.Institution is not null) account.Institution = request.Institution;
        if (request.AccountNumberSuffix is not null) account.AccountNumberSuffix = request.AccountNumberSuffix;
        if (request.IsActive is not null) account.IsActive = request.IsActive.Value;
        if (request.Colour is not null) account.Colour = request.Colour;
        if (request.Icon is not null) account.Icon = request.Icon;
        if (request.ExcludeFromNetWorth is not null) account.ExcludeFromNetWorth = request.ExcludeFromNetWorth.Value;
        if (request.Notes is not null) account.Notes = request.Notes;
        if (request.CreditLimit is not null) account.CreditLimit = request.CreditLimit;
        if (request.InterestRate is not null) account.InterestRate = request.InterestRate;
        if (request.PromotionalBalance is not null) account.PromotionalBalance = request.PromotionalBalance;
        if (request.PromotionalRate is not null) account.PromotionalRate = request.PromotionalRate;
        if (request.PromotionalExpiry is not null) account.PromotionalExpiry = request.PromotionalExpiry;
        if (request.PromotionalRevertRate is not null) account.PromotionalRevertRate = request.PromotionalRevertRate;
        if (request.MortgageStartDate is not null) account.MortgageStartDate = request.MortgageStartDate;
        if (request.MortgageTermYears is not null) account.MortgageTermYears = request.MortgageTermYears;
        if (request.IsInterestOnly is not null) account.IsInterestOnly = request.IsInterestOnly.Value;
        if (request.MinimumMonthlyPayment is not null) account.MinimumMonthlyPayment = request.MinimumMonthlyPayment;
        if (request.CurrentMonthlyPayment is not null) account.CurrentMonthlyPayment = request.CurrentMonthlyPayment;
        if (request.LoanEndDate is not null) account.LoanEndDate = request.LoanEndDate;
        account.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return account;
    }

    public async Task<bool> DeleteAccountAsync(Guid userId, Guid accountId, CancellationToken ct = default)
    {
        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId, ct);

        if (account is null) return false;

        // Soft-delete: mark inactive rather than physically removing
        account.IsActive = false;
        account.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<decimal> GetNetWorthAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.Accounts
            .Where(a => a.UserId == userId && a.IsActive && !a.ExcludeFromNetWorth)
            .SumAsync(a => a.Balance, ct);
    }
}
