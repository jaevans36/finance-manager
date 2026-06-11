using System.Text.Json.Serialization;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Categories.Models;

namespace FinanceApi.Features.Transactions.Models;

/// <summary>Transaction type discriminator.</summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TransactionType
{
    Debit,
    Credit,
    Transfer
}

/// <summary>Source of the transaction record.</summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ImportSource
{
    Manual,
    CsvImport,
    BankSync
}

/// <summary>
/// Represents a single financial transaction against an account.
/// </summary>
public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public Guid AccountId { get; set; }

    public Guid? CategoryId { get; set; }

    /// <summary>Batch identifier for grouping transactions from a single CSV import.</summary>
    public Guid? ImportBatchId { get; set; }

    public TransactionType Type { get; set; } = TransactionType.Debit;

    /// <summary>Amount in the account's currency (negative = debit, positive = credit).</summary>
    public decimal Amount { get; set; }

    /// <summary>Equivalent amount in GBP for multi-currency net-worth calculations.</summary>
    public decimal BaseCurrencyAmount { get; set; }

    /// <summary>Currency of this transaction (ISO 4217).</summary>
    public string Currency { get; set; } = "GBP";

    public string Description { get; set; } = string.Empty;

    /// <summary>Original payee string from the bank statement.</summary>
    public string? OriginalDescription { get; set; }

    public string? Notes { get; set; }

    /// <summary>Merchant / payee name after normalisation.</summary>
    public string? Payee { get; set; }

    public DateOnly TransactionDate { get; set; }

    /// <summary>Date the transaction settled/posted.</summary>
    public DateOnly? PostingDate { get; set; }

    /// <summary>Bank's own reference number.</summary>
    public string? Reference { get; set; }

    public bool IsDuplicate { get; set; }

    /// <summary>Whether this transaction was auto-detected as recurring.</summary>
    public bool IsRecurring { get; set; }

    /// <summary>Whether the user has manually reviewed/confirmed this transaction.</summary>
    public bool IsReviewed { get; set; }

    public ImportSource ImportSource { get; set; } = ImportSource.Manual;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Account Account { get; set; } = null!;
    public Category? Category { get; set; }
}
