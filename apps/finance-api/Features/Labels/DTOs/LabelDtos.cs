using System.ComponentModel.DataAnnotations;

namespace FinanceApi.Features.Labels.DTOs;

public class LabelDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ColourHex { get; set; } = string.Empty;
}

public class CreateLabelRequest
{
    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^#[0-9A-Fa-f]{6}$", ErrorMessage = "ColourHex must be a valid hex colour e.g. #21B8A4")]
    public string ColourHex { get; set; } = string.Empty;
}

public class UpdateLabelRequest
{
    [StringLength(50, MinimumLength = 1)]
    public string? Name { get; set; }

    [RegularExpression("^#[0-9A-Fa-f]{6}$", ErrorMessage = "ColourHex must be a valid hex colour e.g. #21B8A4")]
    public string? ColourHex { get; set; }
}
