using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using LifeApi.Data;
using LifeApi.Features.Auth.Models;
using LifeApi.Features.Auth.Services;
using LifeApi.Features.Dev.Controllers;
using LifeApi.Features.Dev.Models;

namespace LifeApi.UnitTests.Features.Dev.Controllers;

public class DevControllerTests : IDisposable
{
    private readonly FinanceDbContext _context;
    private readonly Mock<IPasswordHasher> _mockPasswordHasher;
    private readonly Mock<ILogger<DevController>> _mockLogger;

    public DevControllerTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new FinanceDbContext(options);
        _mockPasswordHasher = new Mock<IPasswordHasher>();
        _mockLogger = new Mock<ILogger<DevController>>();
    }

    private DevController CreateController(bool isDevelopment, bool flagEnabled)
    {
        var mockEnv = new Mock<IHostEnvironment>();
        mockEnv.Setup(e => e.EnvironmentName)
               .Returns(isDevelopment ? "Development" : "Production");

        var configData = new Dictionary<string, string?>
        {
            ["DevFeatures:AllowDirectPasswordReset"] = flagEnabled ? "true" : "false"
        };
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        return new DevController(
            mockEnv.Object,
            config,
            _context,
            _mockPasswordHasher.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async System.Threading.Tasks.Task ResetPassword_WhenNotDevelopment_Returns404()
    {
        var controller = CreateController(isDevelopment: false, flagEnabled: true);
        var request = new DevPasswordResetRequest { Email = "test@example.com", NewPassword = "Password1" };

        var result = await controller.ResetPassword(request);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async System.Threading.Tasks.Task ResetPassword_WhenFlagDisabled_Returns404()
    {
        var controller = CreateController(isDevelopment: true, flagEnabled: false);
        var request = new DevPasswordResetRequest { Email = "test@example.com", NewPassword = "Password1" };

        var result = await controller.ResetPassword(request);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async System.Threading.Tasks.Task ResetPassword_WhenUserNotFound_Returns404()
    {
        var controller = CreateController(isDevelopment: true, flagEnabled: true);
        var request = new DevPasswordResetRequest { Email = "nobody@example.com", NewPassword = "Password1" };

        var result = await controller.ResetPassword(request);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async System.Threading.Tasks.Task ResetPassword_WithValidRequest_UpdatesPasswordHash()
    {
        _context.Users.Add(new User
        {
            Email = "jay@example.com",
            Username = "jay",
            PasswordHash = "old-hash",
            FailedLoginAttempts = 3,
            AccountLockedUntil = DateTime.UtcNow.AddMinutes(10)
        });
        await _context.SaveChangesAsync();

        _mockPasswordHasher
            .Setup(h => h.HashPassword("NewPass1!"))
            .Returns("new-hash");

        var controller = CreateController(isDevelopment: true, flagEnabled: true);
        var request = new DevPasswordResetRequest { Email = "jay@example.com", NewPassword = "NewPass1!" };

        var result = await controller.ResetPassword(request);

        result.Should().BeOfType<OkObjectResult>();
        var user = await _context.Users.FirstAsync(u => u.Email == "jay@example.com");
        user.PasswordHash.Should().Be("new-hash");
        user.FailedLoginAttempts.Should().Be(0);
        user.AccountLockedUntil.Should().BeNull();
    }

    public void Dispose() => _context.Dispose();
}
