using System.Text.Json.Serialization;

namespace FinanceApi.Features.SavingsGoals.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SavingsGoalStatus { Active, Achieved, Abandoned }

public class SavingsGoal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateTime? TargetDate { get; set; }
    public decimal MonthlyContribution { get; set; }
    public SavingsGoalStatus Status { get; set; } = SavingsGoalStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record CreateSavingsGoalRequest(
    string Name,
    decimal TargetAmount,
    DateTime? TargetDate,
    decimal MonthlyContribution);

public record UpdateSavingsGoalRequest(
    string? Name = null,
    decimal? TargetAmount = null,
    DateTime? TargetDate = null,
    decimal? MonthlyContribution = null);

public record SavingsGoalWithProjection(
    SavingsGoal Goal,
    decimal PercentageComplete,
    int MonthsToTarget,
    DateTime? ProjectedCompletionDate,
    bool IsOnTrack);

public record ContributeRequest(decimal Amount);
