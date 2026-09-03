using FinanceApi.Features.Categories.Models;

namespace FinanceApi.Features.Budgets.Models;

/// <summary>
/// Represents a budget for a category within a specific month and year.
/// </summary>
public class Budget
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>ID of the owning user (validated against Life Manager JWT sub claim).</summary>
    public Guid UserId { get; set; }

    /// <summary>The category this budget is allocated to.</summary>
    public Guid CategoryId { get; set; }

    /// <summary>Month number (1–12).</summary>
    public int Month { get; set; }

    /// <summary>Year (e.g. 2026).</summary>
    public int Year { get; set; }

    /// <summary>Budget amount allocated for this month.</summary>
    public decimal Amount { get; set; }

    /// <summary>Amount rolled over from the previous month's unused budget.</summary>
    public decimal RolloverFromPrevious { get; set; }

    /// <summary>Optional short title, e.g. "Big shop" — falls back to the category name when not set.</summary>
    public string? Title { get; set; }

    /// <summary>Optional free-text note.</summary>
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Category? Category { get; set; }
}
