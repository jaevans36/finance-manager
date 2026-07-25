using System.Security.Claims;
using FinanceApi.Features.Affordability.Models;
using FinanceApi.Features.Affordability.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Affordability.Controllers;

[ApiController]
[Route("api/v1/finance/affordability")]
[Authorize]
public class AffordabilityController(IAffordabilityService affordabilityService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AffordabilityResponse>> GetAffordability(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await affordabilityService.GetAffordabilityAsync(userId.Value, ct);
        return Ok(result);
    }

    [HttpPut("income-accounts")]
    public async Task<IActionResult> UpdateIncomeAccounts(
        [FromBody] UpdateIncomeAccountsRequest request,
        CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        await affordabilityService.UpdateIncomeAccountsAsync(userId.Value, request.AccountIds, ct);
        return NoContent();
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
