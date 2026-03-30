using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
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
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the existing DbContext registration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<FinanceDbContext>));

            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Add DbContext using in-memory database for testing
            services.AddDbContext<FinanceDbContext>(options =>
            {
                options.UseInMemoryDatabase("InMemoryTestDb");
            });

            // Build the service provider and create the database
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var scopedServices = scope.ServiceProvider;
            var db = scopedServices.GetRequiredService<FinanceDbContext>();

            // Ensure the database is created
            db.Database.EnsureCreated();
        });
    }
}
