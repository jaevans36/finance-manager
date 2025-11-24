using System.ComponentModel.DataAnnotations;

namespace FinanceApi.Features.Finance.Models;

public class Category
{
    public Guid Id { get; set; }

    [Required]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    [MaxLength(50)]
    public string? Type { get; set; } // Income, Expense

    public string? Color { get; set; }

    public string? Icon { get; set; }

    public Guid? ParentCategoryId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Category? ParentCategory { get; set; }
    public ICollection<Category> SubCategories { get; set; } = new List<Category>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
