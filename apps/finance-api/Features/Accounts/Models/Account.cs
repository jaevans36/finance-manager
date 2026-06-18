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

    // ── Credit & loan detail ──────────────────────────────────────────────────

    /// <summary>Credit limit for Credit accounts; overdraft limit for Checking accounts.</summary>
    public decimal? CreditLimit { get; set; }

    /// <summary>Standard interest rate as a percentage (e.g. 24.9 for 24.9% APR).</summary>
    public decimal? InterestRate { get; set; }

    /// <summary>Amount currently on a promotional/0% rate deal.</summary>
    public decimal? PromotionalBalance { get; set; }

    /// <summary>Rate applied to the promotional balance (typically 0 for 0% deals).</summary>
    public decimal? PromotionalRate { get; set; }

    /// <summary>Date the promotional deal or fixed rate expires.</summary>
    public DateOnly? PromotionalExpiry { get; set; }

    /// <summary>Rate the promotional balance reverts to after the deal expires.</summary>
    public decimal? PromotionalRevertRate { get; set; }

    // ── Mortgage detail ───────────────────────────────────────────────────────

    /// <summary>Date the mortgage started (draw-down date).</summary>
    public DateOnly? MortgageStartDate { get; set; }

    /// <summary>Original mortgage term in years (e.g. 25).</summary>
    public int? MortgageTermYears { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
