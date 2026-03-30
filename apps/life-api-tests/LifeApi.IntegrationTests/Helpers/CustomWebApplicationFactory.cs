using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using LifeApi.Data;

namespace LifeApi.IntegrationTests.Helpers;

/// <summary>
/// Custom WebApplicationFactory for integration testing
///
/// Learning Topics:
/// - WebApplicationFactory for testing ASP.NET Core apps
/// - Overriding services for testing (use in-memory database instead of PostgreSQL)
/// - Creating test servers without external dependencies
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    // Fixed name per factory instance — all requests share the same in-memory database.
    // Must be a field (not inline Guid.NewGuid() in the lambda) because DbContextOptions
    // is registered as Scoped by default; the lambda would otherwise re-evaluate per request.
    private readonly string _dbName = $"InMemoryTestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "test-secret-key-minimum-32-characters-long",
                ["Jwt:Issuer"] = "life-manager-test",
                ["Jwt:Audience"] = "life-manager-test",
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove the existing DbContext registration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<FinanceDbContext>));

            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<FinanceDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName);
            });
        });
    }
}
