using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using LifeApi.Features.Auth.Models;

namespace LifeApi.Features.Notifications.Models;

public enum NotificationType
{
    TaskAssigned,
    TaskUnassigned,
    TaskCompleted,    // Assignee completed owner's task
    ShareInvitation,  // Event share invite sent
    ShareAccepted,
    ShareDeclined,
    ShareRevoked
}

public enum NotificationEntityType
{
    Task,
    Event
}

[Table("notifications")]
public class Notification
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Required]
    [Column("type")]
    public NotificationType Type { get; set; }

    [Required]
    [Column("entity_type")]
    public NotificationEntityType EntityType { get; set; }

    [Required]
    [Column("entity_id")]
    public Guid EntityId { get; set; }

    /// <summary>
    /// Snapshot of the entity title at the time the notification was created.
    /// Displayed even if the entity is later renamed or deleted.
    /// </summary>
    [Required]
    [Column("entity_title")]
    [MaxLength(500)]
    public string EntityTitle { get; set; } = string.Empty;

    [Required]
    [Column("from_user_id")]
    public Guid FromUserId { get; set; }

    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [ForeignKey(nameof(FromUserId))]
    public User FromUser { get; set; } = null!;
}
