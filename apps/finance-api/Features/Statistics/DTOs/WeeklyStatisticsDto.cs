namespace FinanceApi.Features.Statistics.DTOs;

/// <summary>
/// Comprehensive statistics for a week.
/// </summary>
public class WeeklyStatisticsDto
{
    public DateTime WeekStart { get; set; }
    public DateTime WeekEnd { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public decimal CompletionPercentage { get; set; }
    public List<DailyStatisticsDto> DailyBreakdown { get; set; } = new();
}
