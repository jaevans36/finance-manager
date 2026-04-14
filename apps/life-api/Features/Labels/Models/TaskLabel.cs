using System.ComponentModel.DataAnnotations.Schema;
using TaskEntity = LifeApi.Features.Tasks.Models.Task;

namespace LifeApi.Features.Labels.Models;

[Table("task_labels")]
public class TaskLabel
{
    [Column("task_id")]
    public Guid TaskId { get; set; }

    [Column("label_id")]
    public Guid LabelId { get; set; }

    [ForeignKey(nameof(TaskId))]
    public TaskEntity Task { get; set; } = null!;

    [ForeignKey(nameof(LabelId))]
    public Label Label { get; set; } = null!;
}
