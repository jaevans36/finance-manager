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

public interface ICsvImportService
{
    Task<CsvImportResult> ImportAsync(
        Guid userId,
        Guid accountId,
        Stream csvStream,
        string bankFormat,
        CancellationToken ct = default);

    IEnumerable<string> GetSupportedFormats();
}
