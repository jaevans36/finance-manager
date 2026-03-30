using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using LifeApi.Features.Auth.Models;

namespace LifeApi.Features.Settings.Models;

[Table("user_settings")]
public class UserSettings
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("global_wip_limit")]
    public int? GlobalWipLimit { get; set; }

    [Column("default_task_status")]
    [MaxLength(20)]
    public string DefaultTaskStatus { get; set; } = "NotStarted";

    [Column("enable_wip_warnings")]
    public bool EnableWipWarnings { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}
