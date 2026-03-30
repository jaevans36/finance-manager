using LifeApi.Features.Tasks.DTOs;

namespace LifeApi.Features.Statistics.DTOs;

/// <summary>
/// Statistics for a single day.
/// </summary>
public class DailyStatisticsDto
{
    public DateTime Date { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public decimal CompletionRate { get; set; }
    public List<TaskDto> Tasks { get; set; } = new();
}
