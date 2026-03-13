using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FinanceApi.Features.Auth.Models;

namespace FinanceApi.Features.Tasks.Models;

public enum SharePermission
{
    View,
    Edit,
    Manage
}

public enum ShareStatus
{
    Pending,
    Accepted,
    Declined
}

[Table("task_group_shares")]
public class TaskGroupShare
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("task_group_id")]
    public Guid TaskGroupId { get; set; }
    public TaskGroup TaskGroup { get; set; } = null!;

    [Column("shared_with_user_id")]
    public Guid SharedWithUserId { get; set; }
    public User SharedWithUser { get; set; } = null!;

    [Column("permission")]
    public SharePermission Permission { get; set; } = SharePermission.View;

    [Column("shared_by_user_id")]
    public Guid SharedByUserId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
