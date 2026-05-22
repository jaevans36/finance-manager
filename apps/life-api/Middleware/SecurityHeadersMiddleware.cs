namespace LifeApi.Middleware;

/// <summary>
/// Security headers middleware to protect against common web vulnerabilities
/// Implements OWASP security best practices
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityHeadersMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    public SecurityHeadersMiddleware(
        RequestDelegate next,
        ILogger<SecurityHeadersMiddleware> logger,
        IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // X-Content-Type-Options: Prevent MIME type sniffing
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";

        // X-Frame-Options: Prevent clickjacking attacks
        context.Response.Headers["X-Frame-Options"] = "DENY";

        // X-XSS-Protection: Enable XSS filter (legacy browsers)
        context.Response.Headers["X-XSS-Protection"] = "1; mode=block";

        // Referrer-Policy: Control referrer information
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // Permissions-Policy: Control browser features
        context.Response.Headers["Permissions-Policy"] =
            "geolocation=(), microphone=(), camera=(), payment=()";

        // Content-Security-Policy: Prevent XSS and injection attacks
        // Note: In production, this should be more restrictive
        var csp = _env.IsDevelopment()
            ? "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: https:; " +
              "font-src 'self' data:; " +
              "connect-src 'self' http://localhost:* ws://localhost:*; " +
              "frame-ancestors 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'"
            : "default-src 'self'; " +
              "script-src 'self'; " +
              "style-src 'self'; " +
              "img-src 'self' data: https:; " +
              "font-src 'self'; " +
              "connect-src 'self'; " +
              "frame-ancestors 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'";

        context.Response.Headers["Content-Security-Policy"] = csp;

        // Cache-Control: Prevent caching of API responses (including error responses)
        context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate";

        // Cross-Origin-Resource-Policy: Prevent cross-origin resource reads
        context.Response.Headers["Cross-Origin-Resource-Policy"] = "same-origin";

        // Strict-Transport-Security (HSTS): Enforce HTTPS
        // Only add in production with HTTPS
        if (!_env.IsDevelopment() && context.Request.IsHttps)
        {
            context.Response.Headers["Strict-Transport-Security"] =
                "max-age=31536000; includeSubDomains; preload";
        }

        // Remove server information headers
        context.Response.Headers.Remove("Server");
        context.Response.Headers.Remove("X-Powered-By");
        context.Response.Headers.Remove("X-AspNet-Version");
        context.Response.Headers.Remove("X-AspNetMvc-Version");

        // Add security header for API responses
        context.Response.Headers["X-API-Version"] = "1.0";

        _logger.LogDebug("Security headers added for {Path}", context.Request.Path);

        await _next(context);
    }
}
