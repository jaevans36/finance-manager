using System.Security.Claims;
using FinanceApi.Features.IncomeStreams.Models;
using FinanceApi.Features.IncomeStreams.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.IncomeStreams.Controllers;

[ApiController]
[Route("api/v1/finance/income-streams")]
[Authorize]
public class IncomeStreamsController(IIncomeStreamService streams) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>List all income streams for the authenticated user.</summary>
    [HttpGet]
    public async Task<IActionResult> GetStreams(CancellationToken ct)
        => Ok(await streams.GetStreamsAsync(UserId, ct));

    /// <summary>Create a new income stream.</summary>
    [HttpPost]
    public async Task<IActionResult> CreateStream([FromBody] CreateIncomeStreamRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Name is required.");
        if (request.MonthlyAmount < 0) return BadRequest("Monthly amount cannot be negative.");

        var stream = await streams.CreateStreamAsync(UserId, request, ct);
        return CreatedAtAction(nameof(GetStreams), new { id = stream.Id }, stream);
    }

    /// <summary>Update an existing income stream.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateStream(Guid id, [FromBody] UpdateIncomeStreamRequest request, CancellationToken ct)
    {
        if (request.MonthlyAmount.HasValue && request.MonthlyAmount.Value < 0)
            return BadRequest("Monthly amount cannot be negative.");

        var updated = await streams.UpdateStreamAsync(UserId, id, request, ct);
        return updated is null ? NotFound() : Ok(updated);
    }

    /// <summary>Permanently delete an income stream.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteStream(Guid id, CancellationToken ct)
    {
        var success = await streams.DeleteStreamAsync(UserId, id, ct);
        return success ? NoContent() : NotFound();
    }

    /// <summary>Preview the income that would be detected from an account's recent credits, for use before linking it to a stream.</summary>
    [HttpGet("detect")]
    public async Task<IActionResult> DetectIncome([FromQuery] Guid accountId, CancellationToken ct)
        => Ok(await streams.GetDetectedIncomeAsync(UserId, accountId, ct));
}
