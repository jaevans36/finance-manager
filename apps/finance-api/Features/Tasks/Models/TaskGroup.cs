using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FinanceApi.Features.Auth.Models;

namespace FinanceApi.Features.Tasks.Models;

[Table("task_groups")]
public class TaskGroup
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Required]
    [Column("name")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    [MaxLength(500)]
    public string? Description { get; set; }

    [Column("colour")]
    [MaxLength(7)]
    public string Colour { get; set; } = "#3B82F6";

    [Column("icon")]
    [MaxLength(50)]
    public string? Icon { get; set; }

    [Column("is_default")]
    public bool IsDefault { get; set; } = false;

    [Column("wip_limit")]
    public int? WipLimit { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public ICollection<Task> Tasks { get; set; } = new List<Task>();
}
