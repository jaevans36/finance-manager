using System.Text.Json.Serialization;

namespace FinanceApi.Features.Assets.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AssetType { Property, Vehicle, Other }

/// <summary>
/// A manually-tracked real asset (a house, a car) that nets into the user's net worth
/// alongside their finance accounts. No automated valuation — manually entered, updated
/// occasionally. Owner-scoped only, not shared — see docs/intent/2026-09-14-net-worth-history.md.
/// </summary>
public class Asset
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public AssetType Type { get; set; } = AssetType.Other;
    public decimal Value { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record CreateAssetRequest(
    string Name,
    AssetType Type,
    decimal Value,
    string? Notes = null);

public record UpdateAssetRequest(
    string? Name = null,
    AssetType? Type = null,
    decimal? Value = null,
    string? Notes = null);

public record AssetDto(
    Guid Id,
    string Name,
    AssetType Type,
    decimal Value,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt);
