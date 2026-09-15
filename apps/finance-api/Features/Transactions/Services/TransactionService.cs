using FinanceApi.Data;
using FinanceApi.Features.Accounts.Services;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Transactions.Services;

/// <summary>CRUD and search for financial transactions.</summary>
public class TransactionService : ITransactionService
{
    private readonly FinanceDbContext _db;
    private readonly IAccountSharingService _sharing;
    private readonly IActivityLogService _activityLog;

    public TransactionService(FinanceDbContext db, IAccountSharingService sharing, IActivityLogService activityLog)
    {
        _db = db;
        _sharing = sharing;
        _activityLog = activityLog;
    }

    public async Task<PagedResult<TransactionDto>> GetTransactionsAsync(Guid userId, TransactionListRequest request, CancellationToken ct = default)
    {
        var visibleIds = await _sharing.GetVisibleAccountIdsAsync(userId);
        if (!visibleIds.Contains(request.AccountId))
            return new PagedResult<TransactionDto>(Enumerable.Empty<TransactionDto>(), 0, request.Page, request.PageSize);

        // Scoped by AccountId only, not by who created each row — full read access for anyone
        // the account is visible to, matching AccountsController (see AccountShare's doc comment).
        var query = _db.Transactions
            .Include(t => t.Category)
            .Include(t => t.IncomeStream)
            .Where(t => t.AccountId == request.AccountId);

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
            .Include(t => t.IncomeStream)
            .FirstOrDefaultAsync(t => t.Id == transactionId, ct);

        if (t is null) return null;

        var visibleIds = await _sharing.GetVisibleAccountIdsAsync(userId);
        // Not-visible and not-found both surface as null here, deliberately — mirrors
        // AccountSharingController's "can't tell doesn't-exist from isn't-yours" principle.
        if (!visibleIds.Contains(t.AccountId)) return null;

        return ToDto(t);
    }

    public async Task<TransactionDto> CreateTransactionAsync(Guid userId, CreateTransactionRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var visibleIds = await _sharing.GetVisibleAccountIdsAsync(userId);
        if (!visibleIds.Contains(request.AccountId))
            throw new UnauthorizedAccessException("You do not have access to this account.");

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
        // Description/Payee/Notes are free text — logged by field name only, never the value.
        await _activityLog.LogAsync(userId, FinanceActivityType.TransactionCreated, $"Created {transaction.Type} transaction", ipAddress, userAgent);
        return ToDto(transaction);
    }

    public async Task<TransactionDto?> UpdateTransactionAsync(Guid userId, Guid transactionId, UpdateTransactionRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var transaction = await _db.Transactions
            .Include(t => t.Category)
            .Include(t => t.IncomeStream)
            .FirstOrDefaultAsync(t => t.Id == transactionId, ct);

        if (transaction is null) return null;

        var visibleIds = await _sharing.GetVisibleAccountIdsAsync(userId);
        if (!visibleIds.Contains(transaction.AccountId)) return null;

        var changedFields = new List<string>();
        if (request.CategoryId is not null) { transaction.CategoryId = request.CategoryId; changedFields.Add(nameof(Transaction.CategoryId)); }
        if (request.IncomeStreamId is not null) { transaction.IncomeStreamId = request.IncomeStreamId; changedFields.Add(nameof(Transaction.IncomeStreamId)); }
        if (request.Description is not null) { transaction.Description = request.Description; changedFields.Add(nameof(Transaction.Description)); }
        if (request.Payee is not null) { transaction.Payee = request.Payee; changedFields.Add(nameof(Transaction.Payee)); }
        if (request.Notes is not null) { transaction.Notes = request.Notes; changedFields.Add(nameof(Transaction.Notes)); }
        if (request.IsReviewed is not null) { transaction.IsReviewed = request.IsReviewed.Value; changedFields.Add(nameof(Transaction.IsReviewed)); }
        if (request.TransactionDate.HasValue) { transaction.TransactionDate = request.TransactionDate.Value; changedFields.Add(nameof(Transaction.TransactionDate)); }

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
            changedFields.Add(nameof(Transaction.Amount));
            changedFields.Add(nameof(Transaction.Type));
        }

        transaction.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        if (changedFields.Count > 0)
        {
            await _activityLog.LogAsync(userId, FinanceActivityType.TransactionUpdated, $"Updated: {string.Join(", ", changedFields)}", ipAddress, userAgent);
        }
        return ToDto(transaction);
    }

    public async Task<bool> DeleteTransactionAsync(Guid userId, Guid transactionId, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var transaction = await _db.Transactions
            .FirstOrDefaultAsync(t => t.Id == transactionId, ct);

        if (transaction is null) return false;

        var visibleIds = await _sharing.GetVisibleAccountIdsAsync(userId);
        if (!visibleIds.Contains(transaction.AccountId)) return false;

        _db.Transactions.Remove(transaction);

        // Reverse the balance effect
        var account = await _db.Accounts.FindAsync(new object[] { transaction.AccountId });
        if (account is not null)
        {
            account.Balance += transaction.Type == TransactionType.Credit ? -transaction.Amount : transaction.Amount;
            account.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
        await _activityLog.LogAsync(userId, FinanceActivityType.TransactionDeleted, $"Deleted {transaction.Type} transaction", ipAddress, userAgent);
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
            t.Notes,
            t.IncomeStreamId,
            t.IncomeStream?.Name
        );
}
