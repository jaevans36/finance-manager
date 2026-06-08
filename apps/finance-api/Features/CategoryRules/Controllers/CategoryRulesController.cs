using FinanceApi.Features.CategoryRules.Models;
using FinanceApi.Features.CategoryRules.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinanceApi.Features.CategoryRules.Controllers;

[ApiController]
[Route("api/v1/finance/category-rules")]
[Authorize]
public class CategoryRulesController : ControllerBase
{
    private readonly ICategoryRulesService _service;

    public CategoryRulesController(ICategoryRulesService service)
    {
        _service = service;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>List all category rules for the current user.</summary>
    [HttpGet]
    public async Task<IActionResult> GetRules(CancellationToken ct)
    {
        var rules = await _service.GetRulesAsync(UserId, ct);
        return Ok(rules);
    }

    /// <summary>Create a new category rule.</summary>
    [HttpPost]
    public async Task<IActionResult> CreateRule([FromBody] CreateCategoryRuleRequest request, CancellationToken ct)
    {
        var rule = await _service.CreateRuleAsync(UserId, request, ct);
        return CreatedAtAction(nameof(GetRules), new { }, rule);
    }

    /// <summary>Update a rule (toggle active, change priority or category).</summary>
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateRule(Guid id, [FromBody] UpdateCategoryRuleRequest request, CancellationToken ct)
    {
        var rule = await _service.UpdateRuleAsync(UserId, id, request, ct);
        return rule is null ? NotFound() : Ok(rule);
    }

    /// <summary>Delete a rule.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteRule(Guid id, CancellationToken ct)
    {
        var deleted = await _service.DeleteRuleAsync(UserId, id, ct);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Apply all active rules to every unreviewed transaction for the current user.</summary>
    [HttpPost("apply-all")]
    public async Task<IActionResult> ApplyAll(CancellationToken ct)
    {
        var count = await _service.ApplyRulesToAllUnreviewedAsync(UserId, ct);
        return Ok(new { updated = count });
    }
}
