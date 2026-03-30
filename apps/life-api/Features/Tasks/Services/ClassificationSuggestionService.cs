using LifeApi.Data;
using LifeApi.Features.Tasks.DTOs;
using LifeApi.Features.Tasks.Models;
using Microsoft.EntityFrameworkCore;

using TaskStatus = LifeApi.Features.Tasks.Models.TaskStatus;

namespace LifeApi.Features.Tasks.Services;

public interface IClassificationSuggestionService
{
    System.Threading.Tasks.Task<ClassificationSuggestionDto> SuggestClassificationAsync(Guid userId, Guid taskId);
    System.Threading.Tasks.Task<List<ClassificationSuggestionDto>> PreviewAutoClassifyAsync(Guid userId);
}

public class ClassificationSuggestionService : IClassificationSuggestionService
{
    private readonly FinanceDbContext _context;

    public ClassificationSuggestionService(FinanceDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task<ClassificationSuggestionDto> SuggestClassificationAsync(Guid userId, Guid taskId)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);

        if (task == null)
        {
            throw new KeyNotFoundException("Task not found");
        }

        return BuildSuggestion(task);
    }

    public async System.Threading.Tasks.Task<List<ClassificationSuggestionDto>> PreviewAutoClassifyAsync(Guid userId)
    {
        // Only suggest for unclassified, non-completed root tasks
        var tasks = await _context.Tasks
            .Where(t => t.UserId == userId
                && t.ParentTaskId == null
                && !t.Completed
                && (t.Urgency == null || t.Importance == null))
            .OrderByDescending(t => t.Priority)
            .ThenBy(t => t.DueDate)
            .ToListAsync();

        return tasks.Select(BuildSuggestion).ToList();
    }

    internal static ClassificationSuggestionDto BuildSuggestion(Models.Task task)
    {
        var (urgency, importance, reason) = SuggestFromPriorityAndDueDate(task.Priority, task.DueDate);

        return new ClassificationSuggestionDto
        {
            TaskId = task.Id,
            Title = task.Title,
            SuggestedUrgency = urgency.ToString(),
            SuggestedImportance = importance.ToString(),
            SuggestedQuadrant = TaskService.ComputeQuadrant(urgency, importance),
            Reason = reason,
            CurrentUrgency = task.Urgency?.ToString(),
            CurrentImportance = task.Importance?.ToString(),
        };
    }

    internal static (UrgencyLevel Urgency, ImportanceLevel Importance, string Reason) SuggestFromPriorityAndDueDate(
        Priority priority, DateTime? dueDate)
    {
        // Importance: derived from Priority
        var importance = priority switch
        {
            Priority.Critical => ImportanceLevel.High,
            Priority.High => ImportanceLevel.High,
            Priority.Medium => ImportanceLevel.Medium,
            Priority.Low => ImportanceLevel.Low,
            _ => ImportanceLevel.Medium,
        };

        // Urgency: derived from how soon it is due
        UrgencyLevel urgency;
        string timeReason;

        if (!dueDate.HasValue)
        {
            // No due date — base urgency on priority
            urgency = priority switch
            {
                Priority.Critical => UrgencyLevel.High,
                Priority.High => UrgencyLevel.Medium,
                _ => UrgencyLevel.Low,
            };
            timeReason = "no due date set";
        }
        else
        {
            var daysUntilDue = (dueDate.Value.Date - DateTime.UtcNow.Date).TotalDays;

            if (daysUntilDue < 0)
            {
                urgency = UrgencyLevel.High;
                timeReason = "overdue";
            }
            else if (daysUntilDue <= 2)
            {
                urgency = UrgencyLevel.High;
                timeReason = "due within 2 days";
            }
            else if (daysUntilDue <= 7)
            {
                urgency = UrgencyLevel.Medium;
                timeReason = "due within a week";
            }
            else
            {
                urgency = UrgencyLevel.Low;
                timeReason = "due in more than a week";
            }
        }

        var reason = $"Priority is {priority} (importance={importance}); {timeReason} (urgency={urgency})";

        return (urgency, importance, reason);
    }
}
