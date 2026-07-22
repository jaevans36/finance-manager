using System.Security.Claims;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Bills.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Bills.Controllers;

[ApiController]
[Route("api/v1/finance/bills")]
[Authorize]
public class BillsController : ControllerBase
{
    private readonly IBillService _bills;
    private readonly IRecurringPaymentDetector _detector;

    public BillsController(IBillService bills, IRecurringPaymentDetector detector)
    {
        _bills = bills;
        _detector = detector;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>List all active bills for the authenticated user. Optionally filter by linked account.</summary>
    [HttpGet]
    public async Task<IActionResult> GetBills([FromQuery] Guid? accountId, CancellationToken ct)
    {
        if (accountId.HasValue)
            return Ok(await _bills.GetByAccountIdAsync(UserId, accountId.Value, ct));
        return Ok(await _bills.GetBillsAsync(UserId, ct));
    }

    /// <summary>List all bills including inactive ones.</summary>
    [HttpGet("all")]
    public async Task<IActionResult> GetAllBills(CancellationToken ct)
        => Ok(await _bills.GetAllBillsAsync(UserId, ct));

    /// <summary>List upcoming bills within the specified look-ahead window (default 30 days).</summary>
    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcoming([FromQuery] int days = 30, CancellationToken ct = default)
        => Ok(await _bills.GetUpcomingBillsAsync(UserId, daysAhead: days, ct: ct));

    /// <summary>Create a new bill.</summary>
    [HttpPost]
    public async Task<IActionResult> CreateBill([FromBody] CreateBillRequest request, CancellationToken ct)
    {
        if (request.Amount <= 0) return BadRequest("Amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Name is required.");
        var dueDayError = ValidateDueDay(request.DueDay, request.Frequency);
        if (dueDayError is not null) return BadRequest(dueDayError);

        var bill = await _bills.CreateBillAsync(UserId, request, ct);
        return CreatedAtAction(nameof(GetBills), new { id = bill.Id }, bill);
    }

    /// <summary>Update an existing bill.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateBill(Guid id, [FromBody] UpdateBillRequest request, CancellationToken ct)
    {
        if (request.DueDay.HasValue && request.Frequency.HasValue)
        {
            var dueDayError = ValidateDueDay(request.DueDay.Value, request.Frequency.Value);
            if (dueDayError is not null) return BadRequest(dueDayError);
        }

        var updated = await _bills.UpdateBillAsync(UserId, id, request, ct);
        return updated is null ? NotFound() : Ok(updated);
    }

    /// <summary>Mark a bill as paid for the current period.</summary>
    [HttpPatch("{id:guid}/pay")]
    public async Task<IActionResult> MarkAsPaid(Guid id, CancellationToken ct)
    {
        var success = await _bills.MarkAsPaidAsync(UserId, id, ct);
        return success ? NoContent() : NotFound();
    }

    /// <summary>Permanently delete a bill.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteBill(Guid id, CancellationToken ct)
    {
        var success = await _bills.DeleteBillAsync(UserId, id, ct);
        return success ? NoContent() : NotFound();
    }

    /// <summary>Detect recurring payment patterns from the last N days of transactions (default 365).</summary>
    [HttpPost("detect-recurring")]
    public async Task<IActionResult> DetectRecurring([FromQuery] int days = 365, CancellationToken ct = default)
        => Ok(await _detector.DetectAsync(UserId, days, ct));

    /// <summary>
    /// Weekly bills store DueDay as an ISO day of week (1 = Monday .. 7 = Sunday);
    /// all other frequencies store DueDay as a day of the month (1–31).
    /// </summary>
    private static string? ValidateDueDay(int dueDay, BillFrequency frequency) => frequency switch
    {
        BillFrequency.Weekly when dueDay is < 1 or > 7 => "DueDay must be between 1 (Monday) and 7 (Sunday) for weekly bills.",
        not BillFrequency.Weekly when dueDay is < 1 or > 31 => "DueDay must be between 1 and 31.",
        _ => null,
    };
}
