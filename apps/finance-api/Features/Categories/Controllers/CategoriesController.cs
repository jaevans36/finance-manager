using System.Security.Claims;
using FinanceApi.Features.Categories.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Categories.Controllers;

/// <summary>Spending category management endpoints.</summary>
[ApiController]
[Route("api/v1/finance/categories")]
[Authorize]
[Produces("application/json")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categories;

    public CategoriesController(ICategoryService categories)
    {
        _categories = categories;
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("User ID not found in token");
        return Guid.Parse(sub);
    }

    /// <summary>Get all categories (system + user's own).</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories(CancellationToken ct)
    {
        var categories = await _categories.GetCategoriesAsync(GetUserId(), ct);
        return Ok(categories);
    }

    /// <summary>Create a custom user category.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var category = await _categories.CreateCategoryAsync(GetUserId(), request, ct);
        return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, category);
    }

    /// <summary>Delete a user-created category (cannot delete system categories).</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCategory(Guid id, CancellationToken ct)
    {
        var deleted = await _categories.DeleteCategoryAsync(GetUserId(), id, ct);
        return deleted ? NoContent() : NotFound();
    }
}
