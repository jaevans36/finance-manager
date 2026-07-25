namespace FinanceApi.Features.Budgets.Services;

public record BudgetWithProgress(
    Guid Id,
    Guid CategoryId,
    string? CategoryName,
    string? CategoryColour,
    string? CategoryIcon,
    int Month,
    int Year,
    decimal Amount,
    decimal Spent,
    decimal RolloverFromPrevious,
    decimal PercentageUsed,
    bool IsWarning,
    bool IsExceeded
);

public record CreateBudgetRequest(Guid CategoryId, int Month, int Year, decimal Amount);

public record UpdateBudgetRequest(decimal? Amount);

public record CategoryBudgetSpend(string CategoryName, string? CategoryColour, decimal Budgeted, decimal Spent);

public record BudgetTrendPoint(int Month, int Year, string MonthLabel, IEnumerable<CategoryBudgetSpend> Categories);

public record SuggestedBudgetResponse(decimal? SuggestedAmount, int TransactionCount);

public interface IBudgetService
{
    Task<IEnumerable<BudgetWithProgress>> GetBudgetsAsync(Guid userId, int month, int year, CancellationToken ct = default);
    Task<IEnumerable<BudgetWithProgress>> GetCurrentBudgetsAsync(Guid userId, CancellationToken ct = default);
    Task<IEnumerable<BudgetTrendPoint>> GetTrendsAsync(Guid userId, int months = 6, CancellationToken ct = default);
    Task<BudgetWithProgress> CreateBudgetAsync(Guid userId, CreateBudgetRequest request, CancellationToken ct = default);
    Task<BudgetWithProgress?> UpdateBudgetAsync(Guid userId, Guid budgetId, UpdateBudgetRequest request, CancellationToken ct = default);
    Task<bool> DeleteBudgetAsync(Guid userId, Guid budgetId, CancellationToken ct = default);
    Task<IEnumerable<BudgetWithProgress>> CopyFromPreviousMonthAsync(Guid userId, int month, int year, CancellationToken ct = default);
    Task<SuggestedBudgetResponse> GetSuggestedBudgetAsync(Guid userId, Guid categoryId, CancellationToken ct = default);
}
