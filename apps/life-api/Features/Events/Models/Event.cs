using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using LifeApi.Features.Auth.Models;
using LifeApi.Features.Tasks.Models;

namespace LifeApi.Features.Events.Models;

/// <summary>
/// Represents a scheduled event or appointment (distinct from action-oriented tasks)
/// </summary>
[Table("events")]
public class Event
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("group_id")]
    public Guid? GroupId { get; set; }

    [Required]
    [Column("title")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [Column("start_date")]
    public DateTime StartDate { get; set; }

    [Required]
    [Column("end_date")]
    public DateTime EndDate { get; set; }

    [Column("is_all_day")]
    public bool IsAllDay { get; set; } = false;

    [Column("location")]
    [MaxLength(500)]
    public string? Location { get; set; }

    [Column("reminder_minutes")]
    public int? ReminderMinutes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [ForeignKey(nameof(GroupId))]
    public TaskGroup? Group { get; set; }
}
