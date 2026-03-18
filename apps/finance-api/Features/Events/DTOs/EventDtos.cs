using System.ComponentModel.DataAnnotations;
using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Users.DTOs;

namespace FinanceApi.Features.Events.DTOs;

public class CreateEventRequest
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    [StringLength(5000)]
    public string? Description { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public bool IsAllDay { get; set; } = false;

    [StringLength(500)]
    public string? Location { get; set; }

    public int? ReminderMinutes { get; set; }

    public Guid? GroupId { get; set; }
}

public class UpdateEventRequest
{
    [StringLength(200, MinimumLength = 1)]
    public string? Title { get; set; }

    [StringLength(5000)]
    public string? Description { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool? IsAllDay { get; set; }

    [StringLength(500)]
    public string? Location { get; set; }

    public int? ReminderMinutes { get; set; }

    public Guid? GroupId { get; set; }
}

public class EventDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsAllDay { get; set; }
    public string? Location { get; set; }
    public int? ReminderMinutes { get; set; }
    public Guid? GroupId { get; set; }
    public string? GroupName { get; set; }
    public string? GroupColour { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Sharing metadata — populated when caller is not the event owner
    public bool IsOwner { get; set; } = true;
    public UserSummaryDto? SharedBy { get; set; }
    public SharePermission? MyPermission { get; set; }
}
