using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.Features.Transactions.Services;

/// <summary>Represents a parsed row from a CSV bank export.</summary>
public record ParsedCsvRow(
    DateOnly TransactionDate,
    string Description,
    decimal Amount,
    TransactionType Type,
    string? Reference
);

/// <summary>
/// One structured transaction entry for direct JSON import — the richer alternative to
/// building a generic CSV when the caller already has category/payee/notes, not just a
/// date/description/amount, and doesn't want that detail lost in a CSV round-trip.
/// </summary>
public record JsonTransactionEntry(
    DateOnly TransactionDate,
    string Description,
    decimal Amount,
    TransactionType Type,
    string? Reference = null,
    Guid? CategoryId = null,
    string? Payee = null,
    string? Notes = null
);

public interface ICsvImportService
{
    Task<CsvImportResult> ImportAsync(
        Guid userId,
        Guid accountId,
        Stream csvStream,
        string bankFormat,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken ct = default);

    Task<CsvImportResult> ImportJsonAsync(
        Guid userId,
        Guid accountId,
        List<JsonTransactionEntry> entries,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken ct = default);

    IEnumerable<string> GetSupportedFormats();
}
