using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FinanceApi.Features.Auth.Models;

namespace FinanceApi.Features.Common.ActivityLogs.Models;

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
    public ActivityType Action { get; set; }

    [Column("description")]
    [MaxLength(1000)]
    public string? Description { get; set; }

    [Column("ip_address")]
    [MaxLength(50)]
    public string? IpAddress { get; set; }

    [Column("user_agent")]
    [MaxLength(500)]
    public string? UserAgent { get; set; }

    [Column("metadata")]
    public string? Metadata { get; set; } // JSON string

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}

public enum ActivityType
{
    Login,
    Logout,
    PasswordChange,
    EmailChange,
    EmailVerified,
    PasswordResetRequest,
    PasswordResetComplete,
    SessionTerminated,
    AccountLocked,
    AccountUnlocked,
    DataExport,
    AccountDeletionRequest,
    TaskCreated,
    TaskUpdated,
    TaskDeleted,
    TaskCompleted,
    EventCreated,
    EventUpdated,
    EventDeleted
}
