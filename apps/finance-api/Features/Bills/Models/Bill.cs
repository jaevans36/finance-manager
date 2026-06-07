using FinanceApi.Features.Categories.Models;

namespace FinanceApi.Features.Bills.Models;

public enum BillFrequency { Weekly, Monthly, Quarterly, Annual }

public class Bill
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public BillFrequency Frequency { get; set; }

    /// <summary>Day of the month the bill is due (1–31).</summary>
    public int DueDay { get; set; }

    public int ReminderDaysBefore { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? LastPaidDate { get; set; }
    public Guid? CategoryId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Category? Category { get; set; }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record CreateBillRequest(
    string Name,
    decimal Amount,
    BillFrequency Frequency,
    int DueDay,
    int ReminderDaysBefore,
    Guid? CategoryId);

public record UpdateBillRequest(
    string? Name = null,
    decimal? Amount = null,
    BillFrequency? Frequency = null,
    int? DueDay = null,
    int? ReminderDaysBefore = null,
    Guid? CategoryId = null);

public record UpcomingBill(
    Bill Bill,
    DateTime NextDueDate,
    int DaysUntilDue,
    bool IsReminderDue);
