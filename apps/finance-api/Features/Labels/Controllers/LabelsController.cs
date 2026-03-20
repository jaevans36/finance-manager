using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FinanceApi.Features.Labels.DTOs;
using FinanceApi.Features.Labels.Services;

namespace FinanceApi.Features.Labels.Controllers;

[ApiController]
[Route("api/v1/labels")]
[Authorize]
public class LabelsController : ControllerBase
{
    private readonly ILabelsService _labelsService;

    public LabelsController(ILabelsService labelsService)
    {
        _labelsService = labelsService;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetLabels()
    {
        var labels = await _labelsService.GetLabelsAsync(CurrentUserId);
        return Ok(labels);
    }

    [HttpPost]
    public async Task<IActionResult> CreateLabel([FromBody] CreateLabelRequest request)
    {
        var label = await _labelsService.CreateLabelAsync(CurrentUserId, request);
        if (label is null) return Conflict("A label with that name already exists.");
        return CreatedAtAction(nameof(GetLabels), label);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateLabel(Guid id, [FromBody] UpdateLabelRequest request)
    {
        var label = await _labelsService.UpdateLabelAsync(CurrentUserId, id, request);
        if (label is null) return NotFound();
        return Ok(label);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteLabel(Guid id)
    {
        var deleted = await _labelsService.DeleteLabelAsync(CurrentUserId, id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
