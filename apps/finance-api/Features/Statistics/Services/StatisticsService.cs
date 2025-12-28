using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Statistics.DTOs;
using FinanceApi.Models;

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

    public StatisticsService(FinanceDbContext context)
    {
        _context = context;
    }

    public async Task<WeeklyStatisticsDto> GetWeeklyStatisticsAsync(Guid userId, DateTime weekStart)
    {
        var weekEnd = weekStart.AddDays(7).AddSeconds(-1);

        var tasks = await _context.Tasks
            .Where(t => t.UserId == userId &&
                        t.DueDate != null &&
                        t.DueDate >= weekStart &&
                        t.DueDate <= weekEnd)
            .ToListAsync();

        var dailyBreakdown = tasks
            .GroupBy(t => t.DueDate!.Value.Date)
            .Select(g => new DailyStatisticsDto
            {
                Date = g.Key,
                TotalTasks = g.Count(),
                CompletedTasks = g.Count(t => t.Completed),
                CompletionRate = g.Any() ? (decimal)g.Count(t => t.Completed) / g.Count() * 100 : 0
            })
            .OrderBy(d => d.Date)
            .ToList();

        // Fill in missing days with zero stats
        for (var date = weekStart.Date; date < weekEnd.Date; date = date.AddDays(1))
        {
            if (!dailyBreakdown.Any(d => d.Date == date))
            {
                dailyBreakdown.Add(new DailyStatisticsDto
                {
                    Date = date,
                    TotalTasks = 0,
                    CompletedTasks = 0,
                    CompletionRate = 0
                });
            }
        }

        dailyBreakdown = dailyBreakdown.OrderBy(d => d.Date).ToList();

        var totalTasks = tasks.Count;
        var completedTasks = tasks.Count(t => t.Completed);

        return new WeeklyStatisticsDto
        {
            WeekStart = weekStart,
            WeekEnd = weekEnd,
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
        var weekEnd = weekStart.AddDays(7);

        var urgentTasks = await _context.Tasks
            .Where(t => t.UserId == userId &&
                        !t.Completed &&
                        t.DueDate != null &&
                        t.DueDate >= DateTime.UtcNow &&
                        t.DueDate <= weekEnd &&
                        (t.Priority == TaskPriority.Critical || t.Priority == TaskPriority.High))
            .OrderBy(t => t.DueDate)
            .ThenByDescending(t => t.Priority)
            .Take(10)
            .Select(t => new UrgentTaskDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                Priority = t.Priority,
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
