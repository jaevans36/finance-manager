using System.Text.Json.Serialization;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Categories.Models;

namespace FinanceApi.Features.Bills.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum BillFrequency { Weekly, Monthly, Quarterly, Annual }

public class Bill
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
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

    /// <summary>Optional FK to the account this bill debits from.</summary>
    public Guid? AccountId { get; set; }

    public Category? Category { get; set; }
    public Account? Account { get; set; }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record CreateBillRequest(
    string Name,
    decimal Amount,
    BillFrequency Frequency,
    int DueDay,
    int ReminderDaysBefore,
    Guid? CategoryId,
    string? Description = null,
    Guid? AccountId = null);

public record UpdateBillRequest(
    string? Name = null,
    decimal? Amount = null,
    BillFrequency? Frequency = null,
    int? DueDay = null,
    int? ReminderDaysBefore = null,
    Guid? CategoryId = null,
    bool? IsActive = null,
    string? Description = null,
    Guid? AccountId = null);

/// <summary>Flattened response DTO — avoids serialising the full Account navigation.</summary>
public record BillResponse(
    Guid Id,
    Guid UserId,
    string Name,
    string? Description,
    decimal Amount,
    BillFrequency Frequency,
    int DueDay,
    int ReminderDaysBefore,
    bool IsPaid,
    DateTime? LastPaidDate,
    Guid? CategoryId,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    Guid? AccountId,
    string? AccountName);

public record UpcomingBillResponse(
    BillResponse Bill,
    DateTime NextDueDate,
    int DaysUntilDue,
    bool IsReminderDue);

// Keep legacy record for backward-compat with any callers that pass Bill directly
public record UpcomingBill(
    Bill Bill,
    DateTime NextDueDate,
    int DaysUntilDue,
    bool IsReminderDue);
