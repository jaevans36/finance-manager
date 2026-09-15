using System.Security.Claims;
using FinanceApi.Features.Tags.Models;
using FinanceApi.Features.Tags.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Tags.Controllers;

/// <summary>Free-form transaction tags — cut across categories (e.g. "Wales holiday 2026").</summary>
[ApiController]
[Route("api/v1/finance/tags")]
[Authorize]
[Produces("application/json")]
public class TagsController : ControllerBase
{
    private readonly ITagService _tags;

    public TagsController(ITagService tags)
    {
        _tags = tags;
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("User ID not found in token");
        return Guid.Parse(sub);
    }

    /// <summary>List all tags for the authenticated user, with how many transactions use each.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTags(CancellationToken ct)
        => Ok(await _tags.GetTagsAsync(GetUserId(), ct));

    /// <summary>Create a new tag.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTag([FromBody] CreateTagRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Name is required.");

        var tag = await _tags.CreateTagAsync(GetUserId(), request, ct);
        return CreatedAtAction(nameof(GetTags), new { }, tag);
    }

    /// <summary>Permanently delete a tag — removes it from every transaction it was on.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTag(Guid id, CancellationToken ct)
    {
        var deleted = await _tags.DeleteTagAsync(GetUserId(), id, ct);
        return deleted ? NoContent() : NotFound();
    }
}
