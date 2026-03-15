using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Users.DTOs;

namespace FinanceApi.Features.Events.DTOs;

public class EventShareDto
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public UserSummaryDto? SharedBy { get; set; }
    public UserSummaryDto? SharedWith { get; set; }
    public SharePermission Permission { get; set; }
    public ShareStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class EventShareInvitationDto
{
    public Guid ShareId { get; set; }
    public Guid EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public DateTime EventStartDate { get; set; }
    public DateTime EventEndDate { get; set; }
    public UserSummaryDto? SharedBy { get; set; }
    public SharePermission Permission { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateEventShareRequest
{
    public string UsernameOrEmail { get; set; } = string.Empty;
    public SharePermission Permission { get; set; }
}

public class UpdateEventShareRequest
{
    public SharePermission Permission { get; set; }
}