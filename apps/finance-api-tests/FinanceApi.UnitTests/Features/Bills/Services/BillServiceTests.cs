using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Accounts.Models;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Bills.Services;

namespace FinanceApi.UnitTests.Features.Bills.Services;

public class BillServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly BillService _sut;
    private readonly Guid _userId = Guid.NewGuid();

    public BillServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options);
        _db.Database.EnsureCreated();
        _sut = new BillService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ── GetBillsAsync ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetBillsAsync_WhenNoBillsExist_ReturnsEmpty()
    {
        var result = await _sut.GetBillsAsync(_userId);
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetBillsAsync_ReturnsOnlyBillsForRequestingUser()
    {
        _db.Bills.Add(MakeBill(_userId, "Netflix"));
        _db.Bills.Add(MakeBill(Guid.NewGuid(), "Other"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetBillsAsync(_userId);

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("Netflix");
    }

    [Fact]
    public async Task GetBillsAsync_ExcludesInactiveBills()
    {
        _db.Bills.Add(MakeBill(_userId, "Active", isActive: true));
        _db.Bills.Add(MakeBill(_userId, "Inactive", isActive: false));
        await _db.SaveChangesAsync();

        var result = await _sut.GetBillsAsync(_userId);

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("Active");
    }

    // ── GetUpcomingBillsAsync ────────────────────────────────────────────────

    [Fact]
    public async Task GetUpcomingBillsAsync_WhenMonthlyBillDueLaterThisMonth_IncludesInResults()
    {
        // Bill due on 28th; today is well before that
        var today = new DateTime(2026, 6, 7, 0, 0, 0, DateTimeKind.Utc);
        _db.Bills.Add(MakeBill(_userId, "Broadband", dueDay: 28, frequency: BillFrequency.Monthly));
        await _db.SaveChangesAsync();

        var result = await _sut.GetUpcomingBillsAsync(_userId, today: today);

        result.Should().HaveCount(1);
        result.First().NextDueDate.Should().Be(new DateTime(2026, 6, 28));
        result.First().DaysUntilDue.Should().Be(21);
    }

    [Fact]
    public async Task GetUpcomingBillsAsync_WhenMonthlyBillAlreadyPassedThisMonth_ShowsNextMonth()
    {
        var today = new DateTime(2026, 6, 7, 0, 0, 0, DateTimeKind.Utc);
        _db.Bills.Add(MakeBill(_userId, "Electricity", dueDay: 5, frequency: BillFrequency.Monthly));
        await _db.SaveChangesAsync();

        var result = await _sut.GetUpcomingBillsAsync(_userId, today: today, daysAhead: 30);

        result.Should().HaveCount(1);
        result.First().NextDueDate.Should().Be(new DateTime(2026, 7, 5));
    }

    [Fact]
    public async Task GetUpcomingBillsAsync_WhenBillDueBeyondWindow_ExcludesFromResults()
    {
        var today = new DateTime(2026, 6, 7, 0, 0, 0, DateTimeKind.Utc);
        // June 5 has already passed; next due = July 5 = 28 days away; window is 20 days → excluded
        _db.Bills.Add(MakeBill(_userId, "Insurance", dueDay: 5, frequency: BillFrequency.Monthly));
        await _db.SaveChangesAsync();

        var result = await _sut.GetUpcomingBillsAsync(_userId, today: today, daysAhead: 20);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetUpcomingBillsAsync_WhenWithinReminderWindow_SetsIsReminderDueTrue()
    {
        var today = new DateTime(2026, 6, 7, 0, 0, 0, DateTimeKind.Utc);
        // Due June 10 (3 days away); reminder = 5 days before → should flag
        _db.Bills.Add(MakeBill(_userId, "Gas", dueDay: 10, frequency: BillFrequency.Monthly, reminderDaysBefore: 5));
        await _db.SaveChangesAsync();

        var result = await _sut.GetUpcomingBillsAsync(_userId, today: today);

        result.First().IsReminderDue.Should().BeTrue();
    }

    // ── CreateBillAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task CreateBillAsync_WithValidRequest_CreatesBillAndReturnsIt()
    {
        var request = new CreateBillRequest("Spotify", 9.99m, BillFrequency.Monthly, 1, 3, null);

        var result = await _sut.CreateBillAsync(_userId, request);

        result.Name.Should().Be("Spotify");
        result.Amount.Should().Be(9.99m);
        result.IsActive.Should().BeTrue();
        _db.Bills.Should().HaveCount(1);
    }

    // ── UpdateBillAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateBillAsync_WhenBillExists_UpdatesAmount()
    {
        var bill = MakeBill(_userId, "Water", amount: 30m);
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateBillAsync(_userId, bill.Id, new UpdateBillRequest(Amount: 35m));

        result.Should().NotBeNull();
        result!.Amount.Should().Be(35m);
    }

    [Fact]
    public async Task UpdateBillAsync_WhenBillBelongsToOtherUser_ReturnsNull()
    {
        var bill = MakeBill(Guid.NewGuid(), "Other");
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateBillAsync(_userId, bill.Id, new UpdateBillRequest(Amount: 50m));

        result.Should().BeNull();
    }

    // ── MarkAsPaidAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task MarkAsPaidAsync_WhenBillExists_UpdatesIsPaidAndRecordsDate()
    {
        var bill = MakeBill(_userId, "Council Tax");
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var success = await _sut.MarkAsPaidAsync(_userId, bill.Id);

        success.Should().BeTrue();
        var updated = await _db.Bills.FindAsync(bill.Id);
        updated!.IsPaid.Should().BeTrue();
        updated.LastPaidDate.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task MarkAsPaidAsync_WhenBillBelongsToOtherUser_ReturnsFalse()
    {
        var bill = MakeBill(Guid.NewGuid(), "Someone Else's Bill");
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var success = await _sut.MarkAsPaidAsync(_userId, bill.Id);

        success.Should().BeFalse();
    }

    // ── DeleteBillAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteBillAsync_WhenBillExists_SoftDeletesIt()
    {
        var bill = MakeBill(_userId, "Mortgage");
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var success = await _sut.DeleteBillAsync(_userId, bill.Id);

        success.Should().BeTrue();
        var stored = await _db.Bills.FindAsync(bill.Id);
        stored!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteBillAsync_WhenBillBelongsToOtherUser_ReturnsFalse()
    {
        var bill = MakeBill(Guid.NewGuid(), "Other");
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();

        var success = await _sut.DeleteBillAsync(_userId, bill.Id);

        success.Should().BeFalse();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static Bill MakeBill(
        Guid userId,
        string name,
        decimal amount = 20m,
        int dueDay = 1,
        BillFrequency frequency = BillFrequency.Monthly,
        int reminderDaysBefore = 3,
        bool isActive = true) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Name = name,
        Amount = amount,
        Frequency = frequency,
        DueDay = dueDay,
        ReminderDaysBefore = reminderDaysBefore,
        IsActive = isActive,
    };
}
