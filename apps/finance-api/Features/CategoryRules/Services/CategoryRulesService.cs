using FinanceApi.Data;
using FinanceApi.Features.CategoryRules.Models;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.CategoryRules.Services;

public class CategoryRulesService : ICategoryRulesService
{
    private readonly FinanceDbContext _db;
    private readonly IActivityLogService _activityLog;

    public CategoryRulesService(FinanceDbContext db, IActivityLogService activityLog)
    {
        _db = db;
        _activityLog = activityLog;
    }

    public async Task<IEnumerable<CategoryRuleDto>> GetRulesAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.CategoryRules
            .Include(r => r.Category)
            .Where(r => r.UserId == userId)
            .OrderBy(r => r.Priority)
            .ThenBy(r => r.CreatedAt)
            .Select(r => ToDto(r))
            .ToListAsync(ct);
    }

    public async Task<CategoryRuleDto> CreateRuleAsync(Guid userId, CreateCategoryRuleRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var rule = new CategoryRule
        {
            UserId = userId,
            Pattern = request.Pattern,
            MatchType = request.MatchType,
            CategoryId = request.CategoryId,
            Priority = request.Priority
        };

        _db.CategoryRules.Add(rule);
        await _db.SaveChangesAsync(ct);

        await _db.Entry(rule).Reference(r => r.Category).LoadAsync(ct);
        // Pattern is column-encrypted — never put its value in a log.
        await _activityLog.LogAsync(userId, FinanceActivityType.CategoryRuleCreated, $"Created a {rule.MatchType} category rule", ipAddress, userAgent);
        return ToDto(rule);
    }

    public async Task<CategoryRuleDto?> UpdateRuleAsync(Guid userId, Guid ruleId, UpdateCategoryRuleRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var rule = await _db.CategoryRules
            .Include(r => r.Category)
            .FirstOrDefaultAsync(r => r.Id == ruleId && r.UserId == userId, ct);

        if (rule is null) return null;

        var changedFields = new List<string>();
        if (request.IsActive is not null) { rule.IsActive = request.IsActive.Value; changedFields.Add(nameof(CategoryRule.IsActive)); }
        if (request.Priority is not null) { rule.Priority = request.Priority.Value; changedFields.Add(nameof(CategoryRule.Priority)); }
        if (request.CategoryId is not null) { rule.CategoryId = request.CategoryId.Value; changedFields.Add(nameof(CategoryRule.CategoryId)); }
        rule.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        await _db.Entry(rule).Reference(r => r.Category).LoadAsync(ct);
        if (changedFields.Count > 0)
        {
            await _activityLog.LogAsync(userId, FinanceActivityType.CategoryRuleUpdated, $"Updated: {string.Join(", ", changedFields)}", ipAddress, userAgent);
        }
        return ToDto(rule);
    }

    public async Task<bool> DeleteRuleAsync(Guid userId, Guid ruleId, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var rule = await _db.CategoryRules
            .FirstOrDefaultAsync(r => r.Id == ruleId && r.UserId == userId, ct);

        if (rule is null) return false;

        _db.CategoryRules.Remove(rule);
        await _db.SaveChangesAsync(ct);
        await _activityLog.LogAsync(userId, FinanceActivityType.CategoryRuleDeleted, "Deleted category rule", ipAddress, userAgent);
        return true;
    }

    public async Task<Guid?> ApplyRuleAsync(Guid userId, Transaction transaction, CancellationToken ct = default)
    {
        var rules = await _db.CategoryRules
            .Where(r => r.UserId == userId && r.IsActive)
            .OrderBy(r => r.Priority)
            .ThenBy(r => r.CreatedAt)
            .ToListAsync(ct);

        var subject = transaction.Payee ?? transaction.Description;

        foreach (var rule in rules)
        {
            if (Matches(rule, subject))
            {
                rule.AppliedCount++;
                rule.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(ct);
                return rule.CategoryId;
            }
        }

        return null;
    }

    public async Task<int> ApplyRulesToAllUnreviewedAsync(Guid userId, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var rules = await _db.CategoryRules
            .Where(r => r.UserId == userId && r.IsActive)
            .OrderBy(r => r.Priority)
            .ThenBy(r => r.CreatedAt)
            .ToListAsync(ct);

        if (rules.Count == 0) return 0;

        var transactions = await _db.Transactions
            .Where(t => t.UserId == userId && !t.IsReviewed)
            .ToListAsync(ct);

        var updated = 0;
        foreach (var tx in transactions)
        {
            var subject = tx.Payee ?? tx.Description;
            foreach (var rule in rules)
            {
                if (Matches(rule, subject))
                {
                    tx.CategoryId = rule.CategoryId;
                    rule.AppliedCount++;
                    updated++;
                    break;
                }
            }
        }

        if (updated > 0)
        {
            await _db.SaveChangesAsync(ct);
            // One entry for the bulk action, not one per rule/transaction it touched.
            await _activityLog.LogAsync(userId, FinanceActivityType.CategoryRuleUpdated, $"Applied rules to {updated} transaction(s)", ipAddress, userAgent);
        }
        return updated;
    }

    private static bool Matches(CategoryRule rule, string? subject)
    {
        if (string.IsNullOrWhiteSpace(subject)) return false;

        return rule.MatchType switch
        {
            RuleMatchType.Contains    => subject.Contains(rule.Pattern, StringComparison.OrdinalIgnoreCase),
            RuleMatchType.StartsWith  => subject.StartsWith(rule.Pattern, StringComparison.OrdinalIgnoreCase),
            RuleMatchType.Exact       => subject.Equals(rule.Pattern, StringComparison.OrdinalIgnoreCase),
            _ => false
        };
    }

    private static CategoryRuleDto ToDto(CategoryRule r) =>
        new(r.Id, r.Pattern, r.MatchType, r.CategoryId,
            r.Category?.Name, r.Category?.Colour,
            r.Priority, r.IsActive, r.AppliedCount, r.CreatedAt);
}
