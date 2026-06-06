using System.Security.Claims;
using FinanceApi.Features.Budgets.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Budgets.Controllers;

[ApiController]
[Route("api/v1/finance/pots")]
[Authorize]
[Produces("application/json")]
public class PotsController : ControllerBase
{
    private readonly ISpendingPotService _pots;

    public PotsController(ISpendingPotService pots) => _pots = pots;

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("User ID not found in token");
        return Guid.Parse(sub);
    }

    /// <summary>List all spending pots with live progress for the given month/year.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPots([FromQuery] int? month, [FromQuery] int? year, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        return Ok(await _pots.GetPotsWithProgressAsync(GetUserId(), month ?? now.Month, year ?? now.Year, ct));
    }

    /// <summary>Create a spending pot.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePot([FromBody] CreateSpendingPotRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Pot name is required");
        if (request.BudgetAmount <= 0) return BadRequest("Budget amount must be greater than zero");
        var pot = await _pots.CreatePotAsync(GetUserId(), request, ct);
        return Created($"/api/v1/finance/pots/{pot.Id}", pot);
    }

    /// <summary>Update a spending pot.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePot(Guid id, [FromBody] UpdateSpendingPotRequest request, CancellationToken ct)
    {
        var pot = await _pots.UpdatePotAsync(GetUserId(), id, request, ct);
        return pot is null ? NotFound() : Ok(pot);
    }

    /// <summary>Delete a spending pot.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePot(Guid id, CancellationToken ct)
    {
        var deleted = await _pots.DeletePotAsync(GetUserId(), id, ct);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Manually assign a transaction's category to this pot.</summary>
    [HttpPost("{id:guid}/assign-transaction")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignTransaction(Guid id, [FromQuery] Guid transactionId, CancellationToken ct)
    {
        if (transactionId == Guid.Empty) return BadRequest("transactionId is required");
        var result = await _pots.AssignTransactionAsync(GetUserId(), id, transactionId, ct);
        return result ? Ok() : NotFound();
    }
}
