using System.Collections.Concurrent;
using System.Net;

namespace LifeApi.Middleware;

/// <summary>
/// Rate limiting middleware to prevent abuse and DoS attacks
/// Implements sliding window rate limiting per IP address
/// </summary>
public class RateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitMiddleware> _logger;
    private readonly RateLimitOptions _options;
    
    // IP address -> list of request timestamps
    private static readonly ConcurrentDictionary<string, Queue<DateTime>> RequestLog = new();
    
    public RateLimitMiddleware(
        RequestDelegate next,
        ILogger<RateLimitMiddleware> logger,
        IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        
        _options = new RateLimitOptions
        {
            MaxRequestsPerMinute = configuration.GetValue<int>("RateLimit:MaxRequestsPerMinute", 60),
            MaxRequestsPerHour = configuration.GetValue<int>("RateLimit:MaxRequestsPerHour", 1000),
            EnableRateLimiting = configuration.GetValue<bool>("RateLimit:Enabled", true)
        };
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip rate limiting if disabled
        if (!_options.EnableRateLimiting)
        {
            await _next(context);
            return;
        }

        // Skip rate limiting for certain paths (health checks, swagger)
        var path = context.Request.Path.Value?.ToLower() ?? string.Empty;
        if (path.StartsWith("/health") || path.StartsWith("/swagger"))
        {
            await _next(context);
            return;
        }

        var ipAddress = GetClientIpAddress(context);
        var now = DateTime.UtcNow;

        // Get or create request log for this IP
        var timestamps = RequestLog.GetOrAdd(ipAddress, _ => new Queue<DateTime>());

        bool shouldRateLimitHourly = false;
        bool shouldRateLimitMinute = false;
        int requestsInLastMinute = 0;

        lock (timestamps)
        {
            // Remove timestamps older than 1 hour
            while (timestamps.Count > 0 && (now - timestamps.Peek()).TotalHours >= 1)
            {
                timestamps.Dequeue();
            }

            // Check hourly limit
            if (timestamps.Count >= _options.MaxRequestsPerHour)
            {
                shouldRateLimitHourly = true;
            }
            else
            {
                // Check per-minute limit
                requestsInLastMinute = timestamps.Count(t => (now - t).TotalMinutes < 1);
                if (requestsInLastMinute >= _options.MaxRequestsPerMinute)
                {
                    shouldRateLimitMinute = true;
                }
                else
                {
                    // Add current request timestamp
                    timestamps.Enqueue(now);
                }
            }
        }

        // Handle rate limiting outside the lock
        if (shouldRateLimitHourly)
        {
            _logger.LogWarning(
                "Rate limit exceeded for IP {IpAddress}. Hourly limit reached (limit: {Limit})",
                ipAddress,
                _options.MaxRequestsPerHour);

            context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
            context.Response.Headers.Append("Retry-After", "3600");
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Rate limit exceeded",
                message = "Too many requests. Please try again later.",
                retryAfter = 3600
            });
            return;
        }

        if (shouldRateLimitMinute)
        {
            _logger.LogWarning(
                "Rate limit exceeded for IP {IpAddress}. Per-minute limit reached (limit: {Limit})",
                ipAddress,
                _options.MaxRequestsPerMinute);

            context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
            context.Response.Headers.Append("Retry-After", "60");
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Rate limit exceeded",
                message = "Too many requests. Please slow down.",
                retryAfter = 60
            });
            return;
        }

        // Add rate limit headers
        context.Response.Headers.Append("X-RateLimit-Limit", _options.MaxRequestsPerMinute.ToString());
        context.Response.Headers.Append("X-RateLimit-Remaining",
            Math.Max(0, _options.MaxRequestsPerMinute - requestsInLastMinute - 1).ToString());
        context.Response.Headers.Append("X-RateLimit-Reset",
            new DateTimeOffset(now.AddMinutes(1)).ToUnixTimeSeconds().ToString());

        // Clean up old entries periodically
        if (Random.Shared.Next(100) == 0) // 1% chance
        {
            CleanupOldEntries();
        }

        await _next(context);
    }

    private string GetClientIpAddress(HttpContext context)
    {
        // Check for X-Forwarded-For header (reverse proxy)
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        // Check for X-Real-IP header (nginx)
        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }

        // Fall back to remote IP address
        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private void CleanupOldEntries()
    {
        var now = DateTime.UtcNow;
        var keysToRemove = new List<string>();

        foreach (var kvp in RequestLog)
        {
            lock (kvp.Value)
            {
                // Remove timestamps older than 1 hour
                while (kvp.Value.Count > 0 && (now - kvp.Value.Peek()).TotalHours >= 1)
                {
                    kvp.Value.Dequeue();
                }

                // If no recent requests, remove the entry
                if (kvp.Value.Count == 0)
                {
                    keysToRemove.Add(kvp.Key);
                }
            }
        }

        foreach (var key in keysToRemove)
        {
            RequestLog.TryRemove(key, out _);
        }

        _logger.LogDebug("Cleaned up {Count} rate limit entries", keysToRemove.Count);
    }
}

public class RateLimitOptions
{
    public int MaxRequestsPerMinute { get; set; } = 60;
    public int MaxRequestsPerHour { get; set; } = 1000;
    public bool EnableRateLimiting { get; set; } = true;
}
