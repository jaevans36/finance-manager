using FinanceApi.Data;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Transactions.Services;

/// <summary>CRUD and search for financial transactions.</summary>
public class TransactionService : ITransactionService
{
    private readonly FinanceDbContext _db;

    public TransactionService(FinanceDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<TransactionDto>> GetTransactionsAsync(Guid userId, TransactionListRequest request, CancellationToken ct = default)
    {
        var query = _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.AccountId == request.AccountId);

        if (request.From.HasValue)
            query = query.Where(t => t.TransactionDate >= request.From.Value);

        if (request.To.HasValue)
            query = query.Where(t => t.TransactionDate <= request.To.Value);

        if (request.CategoryId.HasValue)
            query = query.Where(t => t.CategoryId == request.CategoryId.Value);

        if (request.Type.HasValue)
            query = query.Where(t => t.Type == request.Type.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.ToLower();
            query = query.Where(t =>
                t.Description.ToLower().Contains(term) ||
                (t.Payee != null && t.Payee.ToLower().Contains(term)) ||
                (t.Reference != null && t.Reference.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => ToDto(t))
            .ToListAsync(ct);

        return new PagedResult<TransactionDto>(items, totalCount, request.Page, request.PageSize);
    }

    public async Task<TransactionDto?> GetTransactionByIdAsync(Guid userId, Guid transactionId, CancellationToken ct = default)
    {
        var t = await _db.Transactions
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId, ct);

        return t is null ? null : ToDto(t);
    }

    public async Task<TransactionDto> CreateTransactionAsync(Guid userId, CreateTransactionRequest request, CancellationToken ct = default)
    {
        var transaction = new Transaction
        {
            UserId = userId,
            AccountId = request.AccountId,
            CategoryId = request.CategoryId,
            Type = request.Type,
            Amount = request.Amount,
            BaseCurrencyAmount = request.Amount, // TODO: FX conversion in Phase 47
            Currency = request.Currency ?? "GBP",
            Description = request.Description,
            Payee = request.Payee,
            TransactionDate = request.TransactionDate,
            PostingDate = request.PostingDate,
            Reference = request.Reference,
            Notes = request.Notes,
            ImportSource = ImportSource.Manual
        };

        _db.Transactions.Add(transaction);

        // Adjust account balance
        var account = await _db.Accounts.FindAsync(new object[] { request.AccountId }, ct);
        if (account is not null)
        {
            account.Balance += request.Type == TransactionType.Credit ? request.Amount : -request.Amount;
            account.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
        return ToDto(transaction);
    }

    public async Task<TransactionDto?> UpdateTransactionAsync(Guid userId, Guid transactionId, UpdateTransactionRequest request, CancellationToken ct = default)
    {
        var transaction = await _db.Transactions
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId, ct);

        if (transaction is null) return null;

        if (request.CategoryId is not null) transaction.CategoryId = request.CategoryId;
        if (request.Description is not null) transaction.Description = request.Description;
        if (request.Payee is not null) transaction.Payee = request.Payee;
        if (request.Notes is not null) transaction.Notes = request.Notes;
        if (request.IsReviewed is not null) transaction.IsReviewed = request.IsReviewed.Value;
        if (request.TransactionDate.HasValue) transaction.TransactionDate = request.TransactionDate.Value;

        if (request.Amount.HasValue || request.Type.HasValue)
        {
            var oldAmount = transaction.Amount;
            var oldType = transaction.Type;
            var newAmount = request.Amount ?? oldAmount;
            var newType = request.Type ?? oldType;

            var account = await _db.Accounts.FindAsync(new object[] { transaction.AccountId }, ct);
            if (account is not null)
            {
                account.Balance += oldType == TransactionType.Credit ? -oldAmount : oldAmount;
                account.Balance += newType == TransactionType.Credit ? newAmount : -newAmount;
                account.UpdatedAt = DateTime.UtcNow;
            }

            transaction.Amount = newAmount;
            transaction.BaseCurrencyAmount = newAmount;
            transaction.Type = newType;
        }

        transaction.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return ToDto(transaction);
    }

    public async Task<bool> DeleteTransactionAsync(Guid userId, Guid transactionId, CancellationToken ct = default)
    {
        var transaction = await _db.Transactions
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId, ct);

        if (transaction is null) return false;

        _db.Transactions.Remove(transaction);

        // Reverse the balance effect
        var account = await _db.Accounts.FindAsync(new object[] { transaction.AccountId });
        if (account is not null)
        {
            account.Balance += transaction.Type == TransactionType.Credit ? -transaction.Amount : transaction.Amount;
            account.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static TransactionDto ToDto(Transaction t) =>
        new(
            t.Id,
            t.AccountId,
            t.CategoryId,
            t.Category?.Name,
            t.Type,
            t.Amount,
            t.Currency,
            t.Description,
            t.Payee,
            t.TransactionDate,
            t.Reference,
            t.IsReviewed,
            t.IsRecurring,
            t.IsDuplicate,
            t.ImportSource,
            t.CreatedAt,
            t.Notes
        );
}
