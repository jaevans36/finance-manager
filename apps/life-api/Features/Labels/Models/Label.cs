using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using LifeApi.Features.Auth.Models;

namespace LifeApi.Features.Labels.Models;

[Table("labels")]
public class Label
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Required]
    [Column("name")]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Column("colour_hex", TypeName = "character(7)")]
    [RegularExpression("^#[0-9A-Fa-f]{6}$")]
    public string ColourHex { get; set; } = "#6366f1";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public ICollection<TaskLabel> TaskLabels { get; set; } = new List<TaskLabel>();
}
