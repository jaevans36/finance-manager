using System.Security.Claims;
using FinanceApi.Features.Debt.Models;
using FinanceApi.Features.Debt.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Debt.Controllers;

[ApiController]
[Route("api/v1/finance/debt")]
[Authorize]
public class DebtController(IDebtProjectionService projectionService) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<ActionResult<DebtOverviewResponse>> GetOverview(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await projectionService.GetOverviewAsync(userId.Value, ct);
        return Ok(result);
    }

    [HttpPost("projection")]
    public async Task<ActionResult<DebtProjectionResponse>> GetProjection(
        [FromBody] ProjectionRequest request,
        CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        if (request.ExtraMonthlyPayment is < 0)
            return BadRequest("Extra monthly payment cannot be negative.");

        if (request.CustomAllocations is not null)
        {
            if (request.CustomAllocations.Any(a => a.MonthlyPayment < 0))
                return BadRequest("Custom allocations cannot have negative monthly payments.");
        }

        var result = await projectionService.ProjectAsync(userId.Value, request, ct);
        return Ok(result);
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
