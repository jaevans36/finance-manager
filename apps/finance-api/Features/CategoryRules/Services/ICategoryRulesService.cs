using FinanceApi.Features.CategoryRules.Models;
using FinanceApi.Features.Transactions.Models;

namespace FinanceApi.Features.CategoryRules.Services;

public interface ICategoryRulesService
{
    Task<IEnumerable<CategoryRuleDto>> GetRulesAsync(Guid userId, CancellationToken ct = default);
    Task<CategoryRuleDto> CreateRuleAsync(Guid userId, CreateCategoryRuleRequest request, CancellationToken ct = default);
    Task<CategoryRuleDto?> UpdateRuleAsync(Guid userId, Guid ruleId, UpdateCategoryRuleRequest request, CancellationToken ct = default);
    Task<bool> DeleteRuleAsync(Guid userId, Guid ruleId, CancellationToken ct = default);

    /// <summary>Returns the categoryId from the first matching active rule, or null if no rule matches.</summary>
    Task<Guid?> ApplyRuleAsync(Guid userId, Transaction transaction, CancellationToken ct = default);

    /// <summary>Applies all active rules to every unreviewed transaction belonging to this user. Returns the number of transactions updated.</summary>
    Task<int> ApplyRulesToAllUnreviewedAsync(Guid userId, CancellationToken ct = default);
}
