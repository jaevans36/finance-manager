using System.ComponentModel.DataAnnotations;

namespace FinanceApi.Features.Finance.Models;

public class Budget
{
    public Guid Id { get; set; }

    [Required]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    public Guid? CategoryId { get; set; }

    [Required]
    public decimal Amount { get; set; }

    [MaxLength(20)]
    public string Period { get; set; } = "Monthly"; // Monthly, Yearly, Weekly

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Category? Category { get; set; }
}
