namespace FinanceApi.DTOs.ActivityLogs;

public class ActivityLogDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ActivityLogQueryParams
{
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 20;
}

public class ActivityLogResponse
{
    public List<ActivityLogDto> Logs { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
}
