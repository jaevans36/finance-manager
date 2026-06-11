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
    Custom
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

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
