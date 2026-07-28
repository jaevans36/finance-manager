using FinanceApi.Features.Categories.Models;

namespace FinanceApi.Features.Categories.Services;

public record CategoryDto(
    Guid Id,
    string Name,
    string? Colour,
    string? Icon,
    bool IsSystem,
    Guid? ParentId,
    IEnumerable<CategoryDto>? Children
);

public record CreateCategoryRequest(
    string Name,
    string? Colour,
    string? Icon,
    Guid? ParentId
);

public interface ICategoryService
{
    Task<IEnumerable<CategoryDto>> GetCategoriesAsync(Guid? userId, CancellationToken ct = default);
    Task<Category?> GetCategoryByIdAsync(Guid categoryId, CancellationToken ct = default);
    Task<Category> CreateCategoryAsync(Guid userId, CreateCategoryRequest request, CancellationToken ct = default);
    Task<bool> DeleteCategoryAsync(Guid userId, Guid categoryId, CancellationToken ct = default);
}
