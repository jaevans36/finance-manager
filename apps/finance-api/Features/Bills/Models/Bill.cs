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

    /// <summary>
    /// Day the bill is due. For Monthly/Quarterly/Annual this is a day of the month (1–31).
    /// For Weekly this is an ISO day of week (1 = Monday .. 7 = Sunday).
    /// </summary>
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

public static class BillExtensions
{
    /// <summary>Converts this bill's amount to a monthly-equivalent figure, regardless of frequency.</summary>
    public static decimal MonthlyEquivalent(this Bill bill) => bill.Frequency switch
    {
        BillFrequency.Weekly => Math.Round(bill.Amount * 52m / 12m, 2),
        BillFrequency.Quarterly => Math.Round(bill.Amount / 3m, 2),
        BillFrequency.Annual => Math.Round(bill.Amount / 12m, 2),
        _ => bill.Amount, // Monthly
    };
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
    string? CategoryName,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    Guid? AccountId,
    string? AccountName,
    decimal? LinkedAccountPayment,
    bool HasPaymentMismatch);

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
