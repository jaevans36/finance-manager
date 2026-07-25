using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.SavingsGoals.Models;
using FinanceApi.Features.SavingsGoals.Services;

namespace FinanceApi.UnitTests.Features.SavingsGoals.Services;

public class SavingsGoalServiceTests : IDisposable
{
    private readonly FinanceDbContext _db;
    private readonly SavingsGoalService _sut;
    private readonly Guid _userId = Guid.NewGuid();

    public SavingsGoalServiceTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FinanceDbContext(options);
        _db.Database.EnsureCreated();
        _sut = new SavingsGoalService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ── GetGoalsAsync ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetGoalsAsync_WhenNoGoalsExist_ReturnsEmpty()
    {
        var result = await _sut.GetGoalsAsync(_userId);
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetGoalsAsync_ReturnsOnlyGoalsForRequestingUser()
    {
        _db.SavingsGoals.Add(MakeGoal(_userId, "Holiday"));
        _db.SavingsGoals.Add(MakeGoal(Guid.NewGuid(), "Other"));
        await _db.SaveChangesAsync();

        var result = await _sut.GetGoalsAsync(_userId);

        result.Should().HaveCount(1);
        result.First().Goal.Name.Should().Be("Holiday");
    }

    // ── CreateGoalAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task CreateGoalAsync_WithValidRequest_CreatesGoalWithZeroCurrentAmount()
    {
        var targetDate = DateTime.UtcNow.AddMonths(12);
        var request = new CreateSavingsGoalRequest("Emergency Fund", 3000m, targetDate, 250m);

        var result = await _sut.CreateGoalAsync(_userId, request);

        result.Goal.Name.Should().Be("Emergency Fund");
        result.Goal.TargetAmount.Should().Be(3000m);
        result.Goal.CurrentAmount.Should().Be(0m);
        result.Goal.Status.Should().Be(SavingsGoalStatus.Active);
        _db.SavingsGoals.Should().HaveCount(1);
    }

    // ── UpdateGoalAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateGoalAsync_WhenGoalExists_UpdatesFields()
    {
        var goal = MakeGoal(_userId, "Old Name", targetAmount: 1000m);
        _db.SavingsGoals.Add(goal);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateGoalAsync(_userId, goal.Id,
            new UpdateSavingsGoalRequest(Name: "New Name", TargetAmount: 1500m, MonthlyContribution: 200m));

        result.Should().NotBeNull();
        result!.Goal.Name.Should().Be("New Name");
        result.Goal.TargetAmount.Should().Be(1500m);
        result.Goal.MonthlyContribution.Should().Be(200m);
    }

    [Fact]
    public async Task UpdateGoalAsync_WhenGoalBelongsToOtherUser_ReturnsNull()
    {
        var goal = MakeGoal(Guid.NewGuid(), "Other");
        _db.SavingsGoals.Add(goal);
        await _db.SaveChangesAsync();

        var result = await _sut.UpdateGoalAsync(_userId, goal.Id, new UpdateSavingsGoalRequest(Name: "Hijacked"));

        result.Should().BeNull();
    }

    // ── ContributeAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task ContributeAsync_WhenGoalExists_AddsAmountToCurrentAmount()
    {
        var goal = MakeGoal(_userId, "Car", targetAmount: 5000m, currentAmount: 1000m);
        _db.SavingsGoals.Add(goal);
        await _db.SaveChangesAsync();

        var result = await _sut.ContributeAsync(_userId, goal.Id, 500m);

        result.Should().NotBeNull();
        result!.Goal.CurrentAmount.Should().Be(1500m);
    }

    [Fact]
    public async Task ContributeAsync_WhenContributionReachesTarget_SetsStatusToAchieved()
    {
        var goal = MakeGoal(_userId, "Phone", targetAmount: 500m, currentAmount: 450m);
        _db.SavingsGoals.Add(goal);
        await _db.SaveChangesAsync();

        var result = await _sut.ContributeAsync(_userId, goal.Id, 50m);

        result!.Goal.Status.Should().Be(SavingsGoalStatus.Achieved);
    }

    [Fact]
    public async Task ContributeAsync_WhenGoalBelongsToOtherUser_ReturnsNull()
    {
        var goal = MakeGoal(Guid.NewGuid(), "Other");
        _db.SavingsGoals.Add(goal);
        await _db.SaveChangesAsync();

        var result = await _sut.ContributeAsync(_userId, goal.Id, 100m);

        result.Should().BeNull();
    }

    // ── DeleteGoalAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteGoalAsync_WhenGoalExists_RemovesItFromDatabase()
    {
        var goal = MakeGoal(_userId, "Laptop");
        _db.SavingsGoals.Add(goal);
        await _db.SaveChangesAsync();

        var success = await _sut.DeleteGoalAsync(_userId, goal.Id);

        success.Should().BeTrue();
        _db.SavingsGoals.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteGoalAsync_WhenGoalBelongsToOtherUser_ReturnsFalse()
    {
        var goal = MakeGoal(Guid.NewGuid(), "Other");
        _db.SavingsGoals.Add(goal);
        await _db.SaveChangesAsync();

        var success = await _sut.DeleteGoalAsync(_userId, goal.Id);

        success.Should().BeFalse();
    }

    // ── Projection ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetGoalsAsync_WithMonthlyContributionAndTargetDate_CalculatesProjection()
    {
        // £1000 saved, £4000 remaining at £250/month = 16 months to target
        var goal = MakeGoal(_userId, "House Deposit", targetAmount: 5000m, currentAmount: 1000m, monthlyContribution: 250m);
        _db.SavingsGoals.Add(goal);
        await _db.SaveChangesAsync();

        var result = (await _sut.GetGoalsAsync(_userId)).First();

        result.MonthsToTarget.Should().Be(16);
    }

    [Fact]
    public async Task GetGoalsAsync_WhenGoalAlreadyAchieved_MonthsToTargetIsZero()
    {
        var goal = MakeGoal(_userId, "Done", targetAmount: 500m, currentAmount: 600m, status: SavingsGoalStatus.Achieved);
        _db.SavingsGoals.Add(goal);
        await _db.SaveChangesAsync();

        var result = (await _sut.GetGoalsAsync(_userId)).First();

        result.MonthsToTarget.Should().Be(0);
        result.PercentageComplete.Should().Be(100m);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static SavingsGoal MakeGoal(
        Guid userId,
        string name,
        decimal targetAmount = 1000m,
        decimal currentAmount = 0m,
        decimal monthlyContribution = 100m,
        SavingsGoalStatus status = SavingsGoalStatus.Active) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Name = name,
        TargetAmount = targetAmount,
        CurrentAmount = currentAmount,
        MonthlyContribution = monthlyContribution,
        Status = status,
    };
}
