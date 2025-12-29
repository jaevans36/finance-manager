using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Statistics.DTOs;
using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Tasks.DTOs;
using FinanceApi.Features.Tasks.Services;

namespace FinanceApi.Features.Statistics.Services;

public interface IStatisticsService
{
    Task<WeeklyStatisticsDto> GetWeeklyStatisticsAsync(Guid userId, DateTime weekStart);
    Task<DailyStatisticsDto> GetDailyStatisticsAsync(Guid userId, DateTime date);
    Task<List<UrgentTaskDto>> GetUrgentTasksAsync(Guid userId, DateTime weekStart);
}

public class StatisticsService : IStatisticsService
{
    private readonly FinanceDbContext _context;
    private readonly ITaskService _taskService;

    public StatisticsService(FinanceDbContext context, ITaskService taskService)
    {
        _context = context;
        _taskService = taskService;
    }

    public async Task<WeeklyStatisticsDto> GetWeeklyStatisticsAsync(Guid userId, DateTime weekStart)
    {
        // Ensure we're working with UTC dates
        var weekStartUtc = DateTime.SpecifyKind(weekStart.Date, DateTimeKind.Utc);
        var weekEndUtc = weekStartUtc.AddDays(7);

        var tasks = await _context.Tasks
            .Include(t => t.Group)
            .Where(t => t.UserId == userId &&
                        t.DueDate != null &&
                        t.DueDate >= weekStartUtc &&
                        t.DueDate < weekEndUtc)
            .ToListAsync();

        var dailyBreakdown = new List<DailyStatisticsDto>();

        // Create a day for each day of the week
        for (var date = weekStartUtc; date < weekEndUtc; date = date.AddDays(1))
        {
            var nextDay = date.AddDays(1);
            var dayTasks = tasks.Where(t => t.DueDate!.Value >= date && t.DueDate.Value < nextDay).ToList();
            var taskDtos = dayTasks.Select(t => new TaskDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                Priority = t.Priority.ToString(),
                DueDate = t.DueDate,
                Completed = t.Completed,
                CompletedAt = t.CompletedAt,
                GroupId = t.GroupId,
                GroupName = t.Group?.Name,
                GroupColour = t.Group?.Colour,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .OrderByDescending(t => t.Priority)
            .ThenBy(t => t.Completed)
            .ToList();

            dailyBreakdown.Add(new DailyStatisticsDto
            {
                Date = date,
                TotalTasks = dayTasks.Count,
                CompletedTasks = dayTasks.Count(t => t.Completed),
                CompletionRate = dayTasks.Any() ? (decimal)dayTasks.Count(t => t.Completed) / dayTasks.Count * 100 : 0,
                Tasks = taskDtos
            });
        }

        var totalTasks = tasks.Count;
        var completedTasks = tasks.Count(t => t.Completed);

        return new WeeklyStatisticsDto
        {
            WeekStart = weekStartUtc,
            WeekEnd = weekEndUtc,
            TotalTasks = totalTasks,
            CompletedTasks = completedTasks,
            CompletionPercentage = totalTasks > 0 ? (decimal)completedTasks / totalTasks * 100 : 0,
            DailyBreakdown = dailyBreakdown
        };
    }

    public async Task<DailyStatisticsDto> GetDailyStatisticsAsync(Guid userId, DateTime date)
    {
        var dayStart = date.Date;
        var dayEnd = dayStart.AddDays(1).AddSeconds(-1);

        var tasks = await _context.Tasks
            .Where(t => t.UserId == userId &&
                        t.DueDate != null &&
                        t.DueDate >= dayStart &&
                        t.DueDate <= dayEnd)
            .ToListAsync();

        var totalTasks = tasks.Count;
        var completedTasks = tasks.Count(t => t.Completed);

        return new DailyStatisticsDto
        {
            Date = dayStart,
            TotalTasks = totalTasks,
            CompletedTasks = completedTasks,
            CompletionRate = totalTasks > 0 ? (decimal)completedTasks / totalTasks * 100 : 0
        };
    }

    public async Task<List<UrgentTaskDto>> GetUrgentTasksAsync(Guid userId, DateTime weekStart)
    {
        var weekStartUtc = DateTime.SpecifyKind(weekStart.Date, DateTimeKind.Utc);
        var weekEndUtc = weekStartUtc.AddDays(7);

        var urgentTasks = await _context.Tasks
            .Where(t => t.UserId == userId &&
                        !t.Completed &&
                        t.DueDate != null &&
                        t.DueDate >= DateTime.UtcNow &&
                        t.DueDate <= weekEndUtc &&
                        (t.Priority == Priority.Critical || t.Priority == Priority.High))
            .OrderBy(t => t.DueDate)
            .ThenByDescending(t => t.Priority)
            .Take(10)
            .Select(t => new UrgentTaskDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                Priority = t.Priority.ToString(),
                DueDate = t.DueDate,
                DaysUntilDue = t.DueDate != null
                    ? (int)(t.DueDate.Value.Date - DateTime.UtcNow.Date).TotalDays
                    : null,
                GroupId = t.GroupId
            })
            .ToListAsync();

        return urgentTasks;
    }
}
