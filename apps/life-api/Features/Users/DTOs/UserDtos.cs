namespace LifeApi.Features.Users.DTOs;

public class UserSummaryDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
}