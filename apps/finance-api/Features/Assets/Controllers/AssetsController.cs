using System.Security.Claims;
using FinanceApi.Features.Assets.Models;
using FinanceApi.Features.Assets.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApi.Features.Assets.Controllers;

/// <summary>Manually-tracked real assets (property, vehicle, other) that net into net worth.</summary>
[ApiController]
[Route("api/v1/finance/assets")]
[Authorize]
[Produces("application/json")]
public class AssetsController : ControllerBase
{
    private readonly IAssetService _assets;

    public AssetsController(IAssetService assets)
    {
        _assets = assets;
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("User ID not found in token");
        return Guid.Parse(sub);
    }

    private string? GetIpAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();

    private string? GetUserAgent() => HttpContext.Request.Headers["User-Agent"].ToString();

    /// <summary>List all assets for the authenticated user.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAssets(CancellationToken ct)
        => Ok(await _assets.GetAssetsAsync(GetUserId(), ct));

    /// <summary>Create a new asset.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAsset([FromBody] CreateAssetRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Name is required.");
        if (request.Value < 0) return BadRequest("Value cannot be negative.");

        var asset = await _assets.CreateAssetAsync(GetUserId(), request, GetIpAddress(), GetUserAgent(), ct);
        return CreatedAtAction(nameof(GetAssets), new { id = asset.Id }, asset);
    }

    /// <summary>Update an asset.</summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsset(Guid id, [FromBody] UpdateAssetRequest request, CancellationToken ct)
    {
        if (request.Value is < 0) return BadRequest("Value cannot be negative.");

        var asset = await _assets.UpdateAssetAsync(GetUserId(), id, request, GetIpAddress(), GetUserAgent(), ct);
        return asset is null ? NotFound() : Ok(asset);
    }

    /// <summary>Permanently delete an asset.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsset(Guid id, CancellationToken ct)
    {
        var success = await _assets.DeleteAssetAsync(GetUserId(), id, GetIpAddress(), GetUserAgent(), ct);
        return success ? NoContent() : NotFound();
    }
}
