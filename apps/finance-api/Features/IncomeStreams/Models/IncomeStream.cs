using FinanceApi.Features.Accounts.Models;

namespace FinanceApi.Features.IncomeStreams.Models;

/// <summary>
/// A named monthly income source (e.g. "My salary", "Wife's salary"), optionally
/// linked to an account so a suggested amount can be detected from its transactions.
/// </summary>
public class IncomeStream
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyAmount { get; set; }
    public Guid? AccountId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Account? Account { get; set; }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record CreateIncomeStreamRequest(
    string Name,
    decimal MonthlyAmount,
    Guid? AccountId = null);

public record UpdateIncomeStreamRequest(
    string? Name = null,
    decimal? MonthlyAmount = null,
    Guid? AccountId = null);

/// <summary>Flattened response DTO — avoids serialising the full Account navigation.</summary>
public record IncomeStreamResponse(
    Guid Id,
    Guid UserId,
    string Name,
    decimal MonthlyAmount,
    Guid? AccountId,
    string? AccountName,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record DetectedIncomeTransaction(
    DateOnly Date,
    string? Payee,
    string? Description,
    decimal Amount);

public record DetectedIncomeResponse(
    decimal? DetectedMonthlyAmount,
    int TransactionCount,
    IReadOnlyList<DetectedIncomeTransaction> MatchedTransactions);
