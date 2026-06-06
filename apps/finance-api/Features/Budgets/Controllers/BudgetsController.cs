using System.Security.Claims;
using FinanceApi.Features.Budgets.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Budgets.Controllers;

[ApiController]
[Route("api/v1/finance/budgets")]
[Authorize]
[Produces("application/json")]
public class BudgetsController : ControllerBase
{
    private readonly IBudgetService _budgets;

    public BudgetsController(IBudgetService budgets) => _budgets = budgets;

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("User ID not found in token");
        return Guid.Parse(sub);
    }

    /// <summary>List budgets for a given month/year (defaults to current month).</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBudgets([FromQuery] int? month, [FromQuery] int? year, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        return Ok(await _budgets.GetBudgetsAsync(GetUserId(), month ?? now.Month, year ?? now.Year, ct));
    }

    /// <summary>Get budgets for the current calendar month with live spending progress.</summary>
    [HttpGet("current")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCurrentBudgets(CancellationToken ct) =>
        Ok(await _budgets.GetCurrentBudgetsAsync(GetUserId(), ct));

    /// <summary>Budget trends: budgeted vs actual for the last N months.</summary>
    [HttpGet("trends")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetTrends([FromQuery] int months = 6, CancellationToken ct = default)
    {
        if (months < 1 || months > 24) return BadRequest("months must be between 1 and 24");
        return Ok(await _budgets.GetTrendsAsync(GetUserId(), months, ct));
    }

    /// <summary>Create a budget for a category and month/year.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateBudget([FromBody] CreateBudgetRequest request, CancellationToken ct)
    {
        if (request.Amount <= 0) return BadRequest("Budget amount must be greater than zero");
        if (request.CategoryId == Guid.Empty) return BadRequest("Category ID is required");
        var budget = await _budgets.CreateBudgetAsync(GetUserId(), request, ct);
        return Created($"/api/v1/finance/budgets/{budget.Id}", budget);
    }

    /// <summary>Update a budget's amount.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateBudget(Guid id, [FromBody] UpdateBudgetRequest request, CancellationToken ct)
    {
        var budget = await _budgets.UpdateBudgetAsync(GetUserId(), id, request, ct);
        return budget is null ? NotFound() : Ok(budget);
    }

    /// <summary>Delete a budget.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBudget(Guid id, CancellationToken ct)
    {
        var deleted = await _budgets.DeleteBudgetAsync(GetUserId(), id, ct);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Copy budgets from the previous month into the target month (skips existing ones).</summary>
    [HttpPost("copy-from-previous")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> CopyFromPrevious([FromQuery] int? month, [FromQuery] int? year, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        return Ok(await _budgets.CopyFromPreviousMonthAsync(GetUserId(), month ?? now.Month, year ?? now.Year, ct));
    }
}
