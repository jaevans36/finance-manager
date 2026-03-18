namespace FinanceApi.Features.Statistics.DTOs;

/// <summary>
/// Statistics for tasks delegated to others.
/// </summary>
public record DelegatedStatsDto(int Total, int Completed, double CompletionRate);

/// <summary>
/// Statistics for tasks assigned to the current user by others.
/// </summary>
public record AssignedToMeStatsDto(int Total, int Completed, double CompletionRate);

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
    public DelegatedStatsDto Delegated { get; init; } = new(0, 0, 0);
    public AssignedToMeStatsDto AssignedToMe { get; init; } = new(0, 0, 0);
}
