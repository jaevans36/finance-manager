using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FinanceApi.Features.Common.ActivityLogs.Models;

/// <summary>
/// Records who did what in finance-api — the "who changed what" trail needed once more than one
/// user (an owner plus anyone they've shared accounts with) can write to the same data. Mirrors
/// life-api's ActivityLog (apps/life-api/Features/Common/ActivityLogs/) exactly in shape.
///
/// <see cref="Description"/> must never embed the plaintext of an encrypted column (Account.Name,
/// Institution, Notes, etc. — see FinanceDbContext's ENCRYPTED markers). This table is not itself
/// encrypted, so a description like "renamed to 'Barclays Current'" would leak exactly what
/// column encryption exists to protect. Describe *what changed* (field names, entity type/id),
/// never the *values*.
/// </summary>
[Table("activity_logs")]
public class ActivityLog
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Required]
    [Column("action")]
    public FinanceActivityType Action { get; set; }

    [Column("description")]
    [MaxLength(1000)]
    public string? Description { get; set; }

    [Column("ip_address")]
    [MaxLength(50)]
    public string? IpAddress { get; set; }

    [Column("user_agent")]
    [MaxLength(500)]
    public string? UserAgent { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum FinanceActivityType
{
    AccountCreated,
    AccountUpdated,
    AccountDeleted,
    AccountShared,
    AccountShareAccepted,
    AccountShareDeclined,
    AccountShareRevoked,
    TransactionCreated,
    TransactionUpdated,
    TransactionDeleted,
    CsvImportCompleted,
    BillCreated,
    BillUpdated,
    BillDeleted,
    BudgetCreated,
    BudgetUpdated,
    BudgetDeleted,
    SpendingPotCreated,
    SpendingPotUpdated,
    SpendingPotDeleted,
    SavingsGoalCreated,
    SavingsGoalUpdated,
    SavingsGoalDeleted,
    IncomeStreamCreated,
    IncomeStreamUpdated,
    IncomeStreamDeleted,
    CategoryRuleCreated,
    CategoryRuleUpdated,
    CategoryRuleDeleted
}
