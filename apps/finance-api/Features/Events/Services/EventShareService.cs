using FinanceApi.Data;
using FinanceApi.Features.Notifications.Services;

namespace FinanceApi.Features.Events.Services;

/// <summary>
/// Service for managing event shares between users.
/// Full implementation to follow in a subsequent phase task.
/// </summary>
public class EventShareService
{
    private readonly FinanceDbContext _context;
    private readonly INotificationService _notificationService;

    public EventShareService(FinanceDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }
}
