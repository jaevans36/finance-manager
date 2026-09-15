using FinanceApi.Features.Tags.Models;
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
    DateTime CreatedAt,
    string? Notes,
    Guid? IncomeStreamId = null,
    string? IncomeStreamName = null,
    IReadOnlyList<TagRef>? Tags = null
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
    bool? IsReviewed,
    TransactionType? Type = null,
    decimal? Amount = null,
    DateOnly? TransactionDate = null,
    Guid? IncomeStreamId = null
);

public record AddTagRequest(Guid TagId);

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
    Task<TransactionDto> CreateTransactionAsync(Guid userId, CreateTransactionRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<TransactionDto?> UpdateTransactionAsync(Guid userId, Guid transactionId, UpdateTransactionRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<bool> DeleteTransactionAsync(Guid userId, Guid transactionId, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task<TransactionDto?> AddTagAsync(Guid userId, Guid transactionId, Guid tagId, CancellationToken ct = default);
    Task<TransactionDto?> RemoveTagAsync(Guid userId, Guid transactionId, Guid tagId, CancellationToken ct = default);
}
