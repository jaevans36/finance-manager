namespace FinanceApi.Features.Admin.DTOs;

/// <summary>
/// System configuration settings response.
/// </summary>
public class SystemConfigurationResponse
{
    public RateLimitConfiguration RateLimit { get; set; } = new();
    public string Environment { get; set; } = string.Empty;
}

/// <summary>
/// Rate limiting configuration.
/// </summary>
public class RateLimitConfiguration
{
    public bool Enabled { get; set; }
    public int MaxRequestsPerMinute { get; set; }
    public int MaxRequestsPerHour { get; set; }
}
