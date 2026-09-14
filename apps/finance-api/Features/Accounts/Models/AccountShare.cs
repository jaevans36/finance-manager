using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace FinanceApi.Features.Accounts.Models;

/// <summary>
/// A share invitation for an account from its owner to another Life Manager user. Mirrors
/// life-api's EventShare/TaskGroupShare shape, deliberately simplified: no Permission tiers —
/// Jay confirmed (2026-09-13) he wants full read/write access for a shared recipient from the
/// start, not the view-only-first model specs/applications/finance/tasks.md Phase 50 originally
/// designed. Once Accepted, the recipient has the same read/write access as the owner; only the
/// owner can share or revoke (no delegation).
/// </summary>
[Table("account_shares")]
public class AccountShare
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid AccountId { get; set; }

    [Required]
    public Guid SharedByUserId { get; set; }

    [Required]
    public Guid SharedWithUserId { get; set; }

    [Required]
    public AccountShareStatus Status { get; set; } = AccountShareStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RespondedAt { get; set; }

    [ForeignKey(nameof(AccountId))]
    public Account Account { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AccountShareStatus
{
    Pending,
    Accepted,
    Declined
}
