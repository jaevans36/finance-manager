using FinanceApi.Features.Events.DTOs;

namespace FinanceApi.Features.Events.Validators;

public static class EventValidator
{
    private static readonly int[] ValidReminderMinutes = { 15, 30, 60, 1440 }; // 15min, 30min, 1hr, 1day

    public static bool ValidateDateRange(DateTime startDate, DateTime endDate, out string? errorMessage)
    {
        if (endDate < startDate)
        {
            errorMessage = "End date must be on or after start date.";
            return false;
        }

        errorMessage = null;
        return true;
    }

    public static bool ValidateReminderMinutes(int? reminderMinutes, out string? errorMessage)
    {
        if (reminderMinutes.HasValue)
        {
            if (reminderMinutes.Value <= 0)
            {
                errorMessage = "Reminder minutes must be a positive value.";
                return false;
            }

            if (!ValidReminderMinutes.Contains(reminderMinutes.Value))
            {
                errorMessage = $"Reminder must be one of: {string.Join(", ", ValidReminderMinutes)} minutes.";
                return false;
            }
        }

        errorMessage = null;
        return true;
    }

    public static bool ValidateCreateEventRequest(CreateEventRequest request, out List<string> errors)
    {
        errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            errors.Add("Title is required");
        }

        if (!ValidateDateRange(request.StartDate, request.EndDate, out var dateError))
        {
            errors.Add(dateError!);
        }

        if (!ValidateReminderMinutes(request.ReminderMinutes, out var reminderError))
        {
            errors.Add(reminderError!);
        }

        return errors.Count == 0;
    }

    public static bool ValidateUpdateEventRequest(UpdateEventRequest request, DateTime existingStartDate, DateTime existingEndDate, out List<string> errors)
    {
        errors = new List<string>();

        var startDate = request.StartDate ?? existingStartDate;
        var endDate = request.EndDate ?? existingEndDate;

        if (!ValidateDateRange(startDate, endDate, out var dateError))
        {
            errors.Add(dateError!);
        }

        if (!ValidateReminderMinutes(request.ReminderMinutes, out var reminderError))
        {
            errors.Add(reminderError!);
        }

        return errors.Count == 0;
    }
}
