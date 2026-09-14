using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Common.ActivityLogs.DTOs;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;

namespace FinanceApi.UnitTests.Features.Common.ActivityLogs.Services;

public class ActivityLogServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly ActivityLogService _sut;
    private readonly Guid _userId = Guid.NewGuid();

    public ActivityLogServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options, FinanceApi.UnitTests.TestHelpers.TestEncryption.Service);
        _db.Database.EnsureCreated();
        _sut = new ActivityLogService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ── LogAsync ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task LogAsync_PersistsAllFields()
    {
        await _sut.LogAsync(_userId, FinanceActivityType.AccountCreated, "Created account (Name, InterestRate)", "203.0.113.5", "TestAgent/1.0");

        var stored = await _db.ActivityLogs.SingleAsync();
        stored.UserId.Should().Be(_userId);
        stored.Action.Should().Be(FinanceActivityType.AccountCreated);
        stored.Description.Should().Be("Created account (Name, InterestRate)");
        stored.IpAddress.Should().Be("203.0.113.5");
        stored.UserAgent.Should().Be("TestAgent/1.0");
    }

    [Fact]
    public async Task LogAsync_AllowsNullDescriptionIpAndUserAgent()
    {
        await _sut.LogAsync(_userId, FinanceActivityType.TransactionDeleted, null, null, null);

        var stored = await _db.ActivityLogs.SingleAsync();
        stored.Description.Should().BeNull();
        stored.IpAddress.Should().BeNull();
        stored.UserAgent.Should().BeNull();
    }

    // ── GetLogsAsync ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetLogsAsync_WhenNoLogsExist_ReturnsEmpty()
    {
        var result = await _sut.GetLogsAsync(_userId, new ActivityLogQueryParams());

        result.Logs.Should().BeEmpty();
        result.Total.Should().Be(0);
    }

    [Fact]
    public async Task GetLogsAsync_ReturnsOnlyLogsForRequestingUser()
    {
        await _sut.LogAsync(_userId, FinanceActivityType.AccountCreated, null, null, null);
        await _sut.LogAsync(Guid.NewGuid(), FinanceActivityType.AccountCreated, null, null, null);

        var result = await _sut.GetLogsAsync(_userId, new ActivityLogQueryParams());

        result.Logs.Should().HaveCount(1);
        result.Total.Should().Be(1);
    }

    [Fact]
    public async Task GetLogsAsync_OrdersNewestFirst()
    {
        _db.ActivityLogs.Add(new ActivityLog { UserId = _userId, Action = FinanceActivityType.AccountCreated, CreatedAt = DateTime.UtcNow.AddMinutes(-10) });
        _db.ActivityLogs.Add(new ActivityLog { UserId = _userId, Action = FinanceActivityType.AccountUpdated, CreatedAt = DateTime.UtcNow });
        _db.ActivityLogs.Add(new ActivityLog { UserId = _userId, Action = FinanceActivityType.AccountDeleted, CreatedAt = DateTime.UtcNow.AddMinutes(-5) });
        await _db.SaveChangesAsync();

        var result = await _sut.GetLogsAsync(_userId, new ActivityLogQueryParams());

        result.Logs.Select(l => l.Action).Should().ContainInOrder(
            nameof(FinanceActivityType.AccountUpdated),
            nameof(FinanceActivityType.AccountDeleted),
            nameof(FinanceActivityType.AccountCreated));
    }

    [Fact]
    public async Task GetLogsAsync_PagesCorrectly()
    {
        for (var i = 0; i < 5; i++)
        {
            await _sut.LogAsync(_userId, FinanceActivityType.AccountUpdated, null, null, null);
        }

        var page1 = await _sut.GetLogsAsync(_userId, new ActivityLogQueryParams { Page = 1, Limit = 2 });
        var page2 = await _sut.GetLogsAsync(_userId, new ActivityLogQueryParams { Page = 2, Limit = 2 });

        page1.Logs.Should().HaveCount(2);
        page2.Logs.Should().HaveCount(2);
        page1.Total.Should().Be(5);
        page2.Total.Should().Be(5);
        page1.Logs.Select(l => l.Id).Should().NotIntersectWith(page2.Logs.Select(l => l.Id));
    }

    [Fact]
    public async Task GetLogsAsync_MapsActionEnumToItsStringName()
    {
        await _sut.LogAsync(_userId, FinanceActivityType.CsvImportCompleted, null, null, null);

        var result = await _sut.GetLogsAsync(_userId, new ActivityLogQueryParams());

        result.Logs.Single().Action.Should().Be("CsvImportCompleted");
    }
}
