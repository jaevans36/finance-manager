using FinanceApi.Data;
using FinanceApi.Features.Categories.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Categories.Services;

/// <summary>Category management — system and user-created spending categories.</summary>
public class CategoryService : ICategoryService
{
    private readonly FinanceDbContext _db;

    public CategoryService(FinanceDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<CategoryDto>> GetCategoriesAsync(Guid? userId, CancellationToken ct = default)
    {
        var categories = await _db.Categories
            .Where(c => c.IsSystem || c.UserId == userId)
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync(ct);

        // Return flat list; clients can tree-build from ParentId
        return categories.Select(ToDto);
    }

    public async Task<Category?> GetCategoryByIdAsync(Guid categoryId, CancellationToken ct = default)
    {
        return await _db.Categories.FirstOrDefaultAsync(c => c.Id == categoryId, ct);
    }

    public async Task<Category> CreateCategoryAsync(Guid userId, CreateCategoryRequest request, CancellationToken ct = default)
    {
        var category = new Category
        {
            UserId = userId,
            Name = request.Name,
            Colour = request.Colour,
            Icon = request.Icon,
            ParentId = request.ParentId,
            IsSystem = false
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync(ct);
        return category;
    }

    public async Task<bool> DeleteCategoryAsync(Guid userId, Guid categoryId, CancellationToken ct = default)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Id == categoryId && c.UserId == userId && !c.IsSystem, ct);

        if (category is null) return false;

        category.IsActive = false;
        category.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static CategoryDto ToDto(Category c) =>
        new(c.Id, c.Name, c.Colour, c.Icon, c.IsSystem, c.ParentId, null);
}
