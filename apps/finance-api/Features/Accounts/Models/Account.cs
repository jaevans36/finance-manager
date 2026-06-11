using System.Text.Json.Serialization;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.Features.Accounts.Models;

/// <summary>
/// UK bank/investment account types supported by the Finance Manager.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AccountType
{
    Checking,
    Savings,
    Credit,
    CashIsa,
    StocksIsa,
    Sipp,
    PremiumBonds,
    LifetimeIsa,
    Investment,
    Mortgage,
    Loan,
    Other
}

/// <summary>
/// Represents a financial account owned by a user.
/// </summary>
public class Account
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>ID of the owning user (validated against Life Manager JWT sub claim).</summary>
    public Guid UserId { get; set; }

    public string Name { get; set; } = string.Empty;

    public AccountType Type { get; set; } = AccountType.Checking;

    /// <summary>ISO 4217 currency code. Defaults to GBP.</summary>
    public string Currency { get; set; } = "GBP";

    /// <summary>Current balance in minor units (pence for GBP).</summary>
    public decimal Balance { get; set; }

    /// <summary>Institution / bank name (e.g. "Barclays", "Monzo").</summary>
    public string? Institution { get; set; }

    /// <summary>Last 4 digits of account/card number for display.</summary>
    public string? AccountNumberSuffix { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>Whether this account is excluded from net-worth calculations (e.g. a mortgage).</summary>
    public bool ExcludeFromNetWorth { get; set; }

    /// <summary>Display colour as a hex string (e.g. "#3B82F6").</summary>
    public string? Colour { get; set; }

    /// <summary>Lucide icon name for display.</summary>
    public string? Icon { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
