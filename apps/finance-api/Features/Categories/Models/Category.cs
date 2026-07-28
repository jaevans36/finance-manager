namespace FinanceApi.Features.Categories.Models;

/// <summary>
/// Spending category, either system-defined or user-created.
/// </summary>
public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>null for system-level categories; set for user-created categories.</summary>
    public Guid? UserId { get; set; }

    /// <summary>Parent category ID for sub-categories (e.g. "Food" → "Groceries").</summary>
    public Guid? ParentId { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>Display colour as a hex string (e.g. "#22C55E").</summary>
    public string? Colour { get; set; }

    /// <summary>Lucide icon name (e.g. "shopping-cart").</summary>
    public string? Icon { get; set; }

    public bool IsSystem { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Category? Parent { get; set; }
    public ICollection<Category> Children { get; set; } = new List<Category>();
}
