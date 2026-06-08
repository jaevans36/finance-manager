using FinanceApi.Features.Categories.Models;

namespace FinanceApi.Features.CategoryRules.Models;

public enum RuleMatchType { Contains, StartsWith, Exact }

public class CategoryRule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Pattern { get; set; } = string.Empty;
    public RuleMatchType MatchType { get; set; } = RuleMatchType.Contains;
    public Guid CategoryId { get; set; }
    public int Priority { get; set; } = 100;
    public bool IsActive { get; set; } = true;
    public int AppliedCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Category? Category { get; set; }
}

public record CreateCategoryRuleRequest(
    string Pattern,
    RuleMatchType MatchType,
    Guid CategoryId,
    int Priority = 100);

public record UpdateCategoryRuleRequest(
    bool? IsActive,
    int? Priority,
    Guid? CategoryId);

public record CategoryRuleDto(
    Guid Id,
    string Pattern,
    RuleMatchType MatchType,
    Guid CategoryId,
    string? CategoryName,
    string? CategoryColour,
    int Priority,
    bool IsActive,
    int AppliedCount,
    DateTime CreatedAt);
