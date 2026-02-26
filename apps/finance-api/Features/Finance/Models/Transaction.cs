using System.ComponentModel.DataAnnotations;

namespace FinanceApi.Features.Finance.Models;

public class Transaction
{
    public Guid Id { get; set; }

    [Required]
    public required Guid AccountId { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Description { get; set; }

    [Required]
    public decimal Amount { get; set; }

    [MaxLength(50)]
    public string? Type { get; set; } // Debit, Credit, Transfer

    public Guid? CategoryId { get; set; }

    public string? Notes { get; set; }

    public string? Merchant { get; set; }

    public string? ReferenceNumber { get; set; }

    public bool IsReconciled { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Account Account { get; set; } = null!;
    public Category? Category { get; set; }
}
