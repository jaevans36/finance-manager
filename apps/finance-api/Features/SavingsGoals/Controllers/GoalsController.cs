using System.Security.Claims;
using FinanceApi.Features.SavingsGoals.Models;
using FinanceApi.Features.SavingsGoals.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.SavingsGoals.Controllers;

[ApiController]
[Route("api/v1/finance/goals")]
[Authorize]
public class GoalsController : ControllerBase
{
    private readonly ISavingsGoalService _goals;

    public GoalsController(ISavingsGoalService goals) => _goals = goals;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>List all savings goals for the authenticated user.</summary>
    [HttpGet]
    public async Task<IActionResult> GetGoals(CancellationToken ct)
        => Ok(await _goals.GetGoalsAsync(UserId, ct));

    /// <summary>Create a new savings goal.</summary>
    [HttpPost]
    public async Task<IActionResult> CreateGoal([FromBody] CreateSavingsGoalRequest request, CancellationToken ct)
    {
        if (request.TargetAmount <= 0) return BadRequest("TargetAmount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Name is required.");

        var goal = await _goals.CreateGoalAsync(UserId, request, ct);
        return CreatedAtAction(nameof(GetGoals), new { id = goal.Goal.Id }, goal);
    }

    /// <summary>Update a savings goal.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateGoal(Guid id, [FromBody] UpdateSavingsGoalRequest request, CancellationToken ct)
    {
        var updated = await _goals.UpdateGoalAsync(UserId, id, request, ct);
        return updated is null ? NotFound() : Ok(updated);
    }

    /// <summary>Add a contribution to a savings goal.</summary>
    [HttpPost("{id:guid}/contribute")]
    public async Task<IActionResult> Contribute(Guid id, [FromBody] ContributeRequest request, CancellationToken ct)
    {
        if (request.Amount <= 0) return BadRequest("Amount must be greater than zero.");
        var result = await _goals.ContributeAsync(UserId, id, request.Amount, ct);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Delete a savings goal.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteGoal(Guid id, CancellationToken ct)
    {
        var success = await _goals.DeleteGoalAsync(UserId, id, ct);
        return success ? NoContent() : NotFound();
    }
}
