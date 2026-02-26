using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FinanceApi.Features.Auth.Models;

namespace FinanceApi.Features.Tasks.Models;

[Table("tasks")]
public class Task
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("group_id")]
    public Guid? GroupId { get; set; }

    [Column("parent_task_id")]
    public Guid? ParentTaskId { get; set; }

    [Column("depth")]
    public int Depth { get; set; } = 0;

    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    [Required]
    [Column("title")]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [Column("priority")]
    public Priority Priority { get; set; } = Priority.Medium;

    [Column("due_date")]
    public DateTime? DueDate { get; set; }

    [Column("completed")]
    public bool Completed { get; set; } = false;

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [ForeignKey(nameof(GroupId))]
    public TaskGroup? Group { get; set; }

    [ForeignKey(nameof(ParentTaskId))]
    public Task? ParentTask { get; set; }

    public ICollection<Task> Subtasks { get; set; } = new List<Task>();
}

public enum Priority
{
    Low,
    Medium,
    High,
    Critical
}
