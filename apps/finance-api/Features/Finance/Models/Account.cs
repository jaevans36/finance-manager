using System.ComponentModel.DataAnnotations;

namespace FinanceApi.Features.Finance.Models;

public class Account
{
    public Guid Id { get; set; }

    [Required]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    [Required]
    [MaxLength(20)]
    public required string Type { get; set; } // Checking, Savings, Credit, Investment, etc.

    public string? Institution { get; set; }

    public string? AccountNumber { get; set; }

    public decimal Balance { get; set; }

    public string? Currency { get; set; } = "USD";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
