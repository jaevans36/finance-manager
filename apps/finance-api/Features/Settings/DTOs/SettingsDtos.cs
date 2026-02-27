using System.ComponentModel.DataAnnotations;

namespace FinanceApi.Features.Settings.DTOs;

public class UserSettingsDto
{
    public Guid Id { get; set; }
    public int? GlobalWipLimit { get; set; }
    public string DefaultTaskStatus { get; set; } = "NotStarted";
    public bool EnableWipWarnings { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateUserSettingsRequest
{
    [Range(1, 50, ErrorMessage = "Global WIP limit must be between 1 and 50")]
    public int? GlobalWipLimit { get; set; }

    [RegularExpression("^(NotStarted|InProgress)$",
        ErrorMessage = "Default task status must be NotStarted or InProgress")]
    public string? DefaultTaskStatus { get; set; }

    public bool? EnableWipWarnings { get; set; }
}

public class WipSummaryDto
{
    public int InProgressCount { get; set; }
    public int? GlobalWipLimit { get; set; }
    public bool IsOverLimit { get; set; }
    public List<GroupWipSummaryDto> Groups { get; set; } = new();
}

public class GroupWipSummaryDto
{
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string GroupColour { get; set; } = string.Empty;
    public int InProgressCount { get; set; }
    public int? WipLimit { get; set; }
    public bool IsOverLimit { get; set; }
}
