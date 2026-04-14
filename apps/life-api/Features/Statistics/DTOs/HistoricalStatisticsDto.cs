namespace LifeApi.Features.Statistics.DTOs;

/// <summary>
/// Statistics for a single week in historical data.
/// </summary>
public class HistoricalStatisticsDto
{
    public DateTime WeekStart { get; set; }
    public DateTime WeekEnd { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public decimal CompletionRate { get; set; }
}
