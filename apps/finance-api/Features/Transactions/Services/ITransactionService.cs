using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.Features.Transactions.Services;

public record TransactionListRequest(
    Guid AccountId,
    DateOnly? From,
    DateOnly? To,
    Guid? CategoryId,
    TransactionType? Type,
    string? Search,
    int Page,
    int PageSize
);

public record PagedResult<T>(
    IEnumerable<T> Items,
    int TotalCount,
    int Page,
    int PageSize
);

public record TransactionDto(
    Guid Id,
    Guid AccountId,
    Guid? CategoryId,
    string? CategoryName,
    TransactionType Type,
    decimal Amount,
    string Currency,
    string Description,
    string? Payee,
    DateOnly TransactionDate,
    string? Reference,
    bool IsReviewed,
    bool IsRecurring,
    bool IsDuplicate,
    ImportSource ImportSource,
    DateTime CreatedAt
);

public record CreateTransactionRequest(
    Guid AccountId,
    Guid? CategoryId,
    TransactionType Type,
    decimal Amount,
    string? Currency,
    string Description,
    string? Payee,
    DateOnly TransactionDate,
    DateOnly? PostingDate,
    string? Reference,
    string? Notes
);

public record UpdateTransactionRequest(
    Guid? CategoryId,
    string? Description,
    string? Payee,
    string? Notes,
    bool? IsReviewed
);

public record CsvImportResult(
    int Imported,
    int Duplicates,
    int Errors,
    IEnumerable<string> ErrorMessages,
    Guid BatchId,
    int Skipped = 0,
    IEnumerable<string>? SkipMessages = null
);

public interface ITransactionService
{
    Task<PagedResult<TransactionDto>> GetTransactionsAsync(Guid userId, TransactionListRequest request, CancellationToken ct = default);
    Task<TransactionDto?> GetTransactionByIdAsync(Guid userId, Guid transactionId, CancellationToken ct = default);
    Task<TransactionDto> CreateTransactionAsync(Guid userId, CreateTransactionRequest request, CancellationToken ct = default);
    Task<TransactionDto?> UpdateTransactionAsync(Guid userId, Guid transactionId, UpdateTransactionRequest request, CancellationToken ct = default);
    Task<bool> DeleteTransactionAsync(Guid userId, Guid transactionId, CancellationToken ct = default);
}
