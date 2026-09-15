using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.Features.Tags.Models;

/// <summary>
/// A free-form, user-defined label that can be attached to any number of transactions,
/// cutting across categories — e.g. "Wales holiday 2026" spanning flights, food, and fuel,
/// none of which share a single spending category.
/// </summary>
public class Tag
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Colour { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TransactionTag> TransactionTags { get; set; } = new List<TransactionTag>();
}

/// <summary>Join row for the many-to-many between Transaction and Tag.</summary>
public class TransactionTag
{
    public Guid TransactionId { get; set; }
    public Guid TagId { get; set; }

    public Transaction Transaction { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record CreateTagRequest(string Name, string? Colour = null);

public record TagDto(Guid Id, string Name, string? Colour, int TransactionCount, DateTime CreatedAt);

/// <summary>Lightweight reference embedded in TransactionDto — no count, avoids an N+1.</summary>
public record TagRef(Guid Id, string Name, string? Colour);
