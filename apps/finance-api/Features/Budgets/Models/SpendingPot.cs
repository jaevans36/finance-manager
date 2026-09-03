using System.Text.Json.Serialization;

namespace FinanceApi.Features.Budgets.Models;

/// <summary>
/// UK spending pot types that users can create custom budgets for.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PotType
{
    Groceries,
    Fuel,
    EatingOut,
    Kids,
    Clothing,
    Entertainment,
    Bills,
    Subscriptions,
    Savings,
    EmergencyFund,
    Holiday,
    Custom,
    SinkingFund
}

/// <summary>
/// Represents a spending pot, a user-defined budget container that groups transactions from one or more categories.
/// </summary>
public class SpendingPot
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>ID of the owning user (validated against Life Manager JWT sub claim).</summary>
    public Guid UserId { get; set; }

    /// <summary>Human-readable name for the pot (e.g. "Weekly Groceries").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>The type of spending this pot tracks.</summary>
    public PotType Type { get; set; }

    /// <summary>Budget amount allocated for this pot.</summary>
    public decimal BudgetAmount { get; set; }

    /// <summary>Whether unused budget from this month rolls over to the next.</summary>
    public bool RolloverEnabled { get; set; }

    /// <summary>Lucide icon name for display (e.g. "shopping-cart").</summary>
    public string? Icon { get; set; }

    /// <summary>Display colour as a hex string (e.g. "#EF4444").</summary>
    public string? Colour { get; set; }

    /// <summary>IDs of categories whose transactions count toward this pot's spending.</summary>
    public List<Guid> CategoryIds { get; set; } = new();

    // ── Sinking fund fields (Type == SinkingFund only) ──────────────────────

    /// <summary>The full annual cost being spread — e.g. £600 for car insurance.</summary>
    public decimal? AnnualAmount { get; set; }

    /// <summary>When the lump sum will next be needed (e.g. insurance renewal date).</summary>
    public DateOnly? NextPaymentDate { get; set; }

    /// <summary>Total set aside so far this cycle. Resets to 0 when <see cref="NextPaymentDate"/> passes.</summary>
    public decimal AccumulatedAmount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
