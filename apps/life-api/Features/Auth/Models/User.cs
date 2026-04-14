using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using LifeApi.Features.Common.Sessions.Models;
using LifeApi.Features.Common.EmailVerification.Models;
using LifeApi.Features.Common.ActivityLogs.Models;

namespace LifeApi.Features.Auth.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("email")]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Column("username")]
    [MaxLength(20)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [Column("password_hash")]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("email_verified")]
    public bool EmailVerified { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("last_login_at")]
    public DateTime? LastLoginAt { get; set; }

    [Column("failed_login_attempts")]
    public int FailedLoginAttempts { get; set; } = 0;

    [Column("account_locked_until")]
    public DateTime? AccountLockedUntil { get; set; }

    [Column("is_admin")]
    public bool IsAdmin { get; set; } = false;

    // Navigation properties
    public ICollection<LifeApi.Features.Tasks.Models.Task> Tasks { get; set; } = new List<LifeApi.Features.Tasks.Models.Task>();
    public ICollection<LifeApi.Features.Tasks.Models.TaskGroup> TaskGroups { get; set; } = new List<LifeApi.Features.Tasks.Models.TaskGroup>();
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
    public ICollection<EmailToken> EmailTokens { get; set; } = new List<EmailToken>();
    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
    public LifeApi.Features.Settings.Models.UserSettings? Settings { get; set; }
}
