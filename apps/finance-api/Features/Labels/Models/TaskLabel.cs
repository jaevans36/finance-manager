using System.ComponentModel.DataAnnotations.Schema;

namespace FinanceApi.Features.Labels.Models;

[Table("task_labels")]
public class TaskLabel
{
    [Column("task_id")]
    public Guid TaskId { get; set; }

    [Column("label_id")]
    public Guid LabelId { get; set; }

    [ForeignKey(nameof(TaskId))]
    public FinanceApi.Features.Tasks.Models.Task Task { get; set; } = null!;

    [ForeignKey(nameof(LabelId))]
    public Label Label { get; set; } = null!;
}
