using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using FinanceApi.Data;

namespace FinanceApi.IntegrationTests.Helpers;

public class FinanceWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"FinanceTestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "test-secret-key-minimum-32-characters-long!!",
                ["Jwt:Issuer"] = "finance-test",
                ["Jwt:Audience"] = "finance-test",
            });
        });

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<FinanceDbContext>));

            if (descriptor != null)
                services.Remove(descriptor);

            services.AddDbContext<FinanceDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));
        });
    }

    // Called after the host is fully built — safe to resolve services here
    protected override void ConfigureClient(System.Net.Http.HttpClient client)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
        db.Database.EnsureCreated();
    }
}
