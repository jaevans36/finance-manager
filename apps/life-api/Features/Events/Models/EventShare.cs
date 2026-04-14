using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using LifeApi.Features.Auth.Models;
using LifeApi.Features.Tasks.Models;

namespace LifeApi.Features.Events.Models;

/// <summary>
/// Represents a share invitation for an event from one user to another.
/// Unique constraint: (EventId, SharedWithUserId) — one share record per event/recipient pair.
/// </summary>
[Table("event_shares")]
public class EventShare
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("event_id")]
    public Guid EventId { get; set; }

    [Required]
    [Column("shared_by_user_id")]
    public Guid SharedByUserId { get; set; }

    [Required]
    [Column("shared_with_user_id")]
    public Guid SharedWithUserId { get; set; }

    [Required]
    [Column("permission")]
    public SharePermission Permission { get; set; } = SharePermission.View;

    [Required]
    [Column("status")]
    public ShareStatus Status { get; set; } = ShareStatus.Pending;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(EventId))]
    public Event Event { get; set; } = null!;

    [ForeignKey(nameof(SharedByUserId))]
    public User SharedBy { get; set; } = null!;

    [ForeignKey(nameof(SharedWithUserId))]
    public User SharedWith { get; set; } = null!;
}
