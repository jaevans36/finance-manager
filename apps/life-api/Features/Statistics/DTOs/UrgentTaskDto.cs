using LifeApi.Features.Tasks.Models;

namespace LifeApi.Features.Statistics.DTOs;

/// <summary>
/// Task with urgency information.
/// </summary>
public class UrgentTaskDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Priority { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public int? DaysUntilDue { get; set; }
    public Guid? GroupId { get; set; }
}
