using FinanceApi.Data;
using FinanceApi.Features.Bills.Models;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.ActivityLogs.Services;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Bills.Services;

public class BillService : IBillService
{
    private readonly FinanceDbContext _db;
    private readonly IActivityLogService _activityLog;

    public BillService(FinanceDbContext db, IActivityLogService activityLog)
    {
        _db = db;
        _activityLog = activityLog;
    }

    public async Task<IEnumerable<BillResponse>> GetBillsAsync(Guid userId, CancellationToken ct = default)
        => await _db.Bills
            .Include(b => b.Account)
            .Include(b => b.Category)
            .Where(b => b.UserId == userId && b.IsActive)
            .OrderBy(b => b.DueDay)
            .Select(b => ToResponse(b))
            .ToListAsync(ct);

    public async Task<IEnumerable<BillResponse>> GetAllBillsAsync(Guid userId, CancellationToken ct = default)
        => await _db.Bills
            .Include(b => b.Account)
            .Include(b => b.Category)
            .Where(b => b.UserId == userId)
            .OrderBy(b => b.IsActive ? 0 : 1)
            .ThenBy(b => b.Name)
            .Select(b => ToResponse(b))
            .ToListAsync(ct);

    public async Task<IEnumerable<BillResponse>> GetByAccountIdAsync(Guid userId, Guid accountId, CancellationToken ct = default)
        => await _db.Bills
            .Include(b => b.Account)
            .Include(b => b.Category)
            .Where(b => b.UserId == userId && b.AccountId == accountId && b.IsActive)
            .OrderBy(b => b.DueDay)
            .Select(b => ToResponse(b))
            .ToListAsync(ct);

    public async Task<IEnumerable<UpcomingBillResponse>> GetUpcomingBillsAsync(
        Guid userId, DateTime? today = null, int daysAhead = 30, CancellationToken ct = default)
    {
        var reference = (today ?? DateTime.UtcNow).Date;
        var bills = await _db.Bills
            .Include(b => b.Account)
            .Include(b => b.Category)
            .Where(b => b.UserId == userId && b.IsActive)
            .OrderBy(b => b.DueDay)
            .ToListAsync(ct);

        var results = new List<UpcomingBillResponse>();
        foreach (var bill in bills)
        {
            var nextDue = GetNextDueDate(bill, reference);
            var daysUntil = (nextDue - reference).Days;
            if (daysUntil <= daysAhead)
                results.Add(new UpcomingBillResponse(ToResponse(bill), nextDue, daysUntil, daysUntil <= bill.ReminderDaysBefore));
        }

        return results.OrderBy(u => u.NextDueDate);
    }

    public async Task<BillResponse> CreateBillAsync(Guid userId, CreateBillRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var bill = new Bill
        {
            UserId = userId,
            Name = request.Name,
            Description = request.Description,
            Amount = request.Amount,
            Frequency = request.Frequency,
            DueDay = request.DueDay,
            ReminderDaysBefore = request.ReminderDaysBefore,
            CategoryId = request.CategoryId,
            AccountId = request.AccountId,
        };
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync(ct);

        if (bill.AccountId.HasValue)
            await _db.Entry(bill).Reference(b => b.Account).LoadAsync(ct);
        if (bill.CategoryId.HasValue)
            await _db.Entry(bill).Reference(b => b.Category).LoadAsync(ct);

        // Bill.Name and Bill.Description are column-encrypted — never put their values in a log.
        await _activityLog.LogAsync(userId, FinanceActivityType.BillCreated, $"Created {bill.Frequency} bill", ipAddress, userAgent);
        return ToResponse(bill);
    }

    public async Task<BillResponse?> UpdateBillAsync(Guid userId, Guid billId, UpdateBillRequest request, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var bill = await _db.Bills
            .Include(b => b.Account)
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == billId && b.UserId == userId, ct);

        if (bill is null) return null;

        // Track which fields actually changed, by name only — never log field values here.
        // Name/Description are column-encrypted; logging them would defeat the point.
        var changedFields = new List<string>();
        if (request.Name is not null) { bill.Name = request.Name; changedFields.Add(nameof(Bill.Name)); }
        if (request.Description is not null) { bill.Description = request.Description == string.Empty ? null : request.Description; changedFields.Add(nameof(Bill.Description)); }
        if (request.Amount.HasValue) { bill.Amount = request.Amount.Value; changedFields.Add(nameof(Bill.Amount)); }
        if (request.Frequency.HasValue) { bill.Frequency = request.Frequency.Value; changedFields.Add(nameof(Bill.Frequency)); }
        if (request.DueDay.HasValue) { bill.DueDay = request.DueDay.Value; changedFields.Add(nameof(Bill.DueDay)); }
        if (request.ReminderDaysBefore.HasValue) { bill.ReminderDaysBefore = request.ReminderDaysBefore.Value; changedFields.Add(nameof(Bill.ReminderDaysBefore)); }
        if (request.IsActive.HasValue) { bill.IsActive = request.IsActive.Value; changedFields.Add(nameof(Bill.IsActive)); }
        // CategoryId can be explicitly set to null to unlink
        if (request.CategoryId != bill.CategoryId)
        {
            bill.CategoryId = request.CategoryId;
            changedFields.Add(nameof(Bill.CategoryId));
            if (bill.CategoryId.HasValue)
                await _db.Entry(bill).Reference(b => b.Category).LoadAsync(ct);
            else
                bill.Category = null;
        }
        // AccountId can be explicitly set to null to unlink
        if (request.AccountId != bill.AccountId)
        {
            bill.AccountId = request.AccountId;
            changedFields.Add(nameof(Bill.AccountId));
            // Reload the Account navigation after change
            if (bill.AccountId.HasValue)
                await _db.Entry(bill).Reference(b => b.Account).LoadAsync(ct);
            else
                bill.Account = null;
        }

        bill.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        if (changedFields.Count > 0)
        {
            await _activityLog.LogAsync(userId, FinanceActivityType.BillUpdated, $"Updated: {string.Join(", ", changedFields)}", ipAddress, userAgent);
        }
        return ToResponse(bill);
    }

    public async Task<bool> DeleteBillAsync(Guid userId, Guid billId, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var bill = await _db.Bills
            .FirstOrDefaultAsync(b => b.Id == billId && b.UserId == userId, ct);

        if (bill is null) return false;
        _db.Bills.Remove(bill);
        await _db.SaveChangesAsync(ct);
        await _activityLog.LogAsync(userId, FinanceActivityType.BillDeleted, $"Deleted {bill.Frequency} bill", ipAddress, userAgent);
        return true;
    }

    public async Task<bool> MarkAsPaidAsync(Guid userId, Guid billId, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var bill = await _db.Bills
            .FirstOrDefaultAsync(b => b.Id == billId && b.UserId == userId && b.IsActive, ct);

        if (bill is null) return false;
        bill.IsPaid = true;
        bill.LastPaidDate = DateTime.UtcNow;
        bill.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _activityLog.LogAsync(userId, FinanceActivityType.BillUpdated, "Marked as paid", ipAddress, userAgent);
        return true;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    internal static BillResponse ToResponse(Bill b)
    {
        // Only an explicit "what I'm actually paying" figure on the linked account counts
        // as a source of truth to compare against — a lender minimum can legitimately
        // differ from what's actually paid, so it's not treated as a mismatch.
        var linkedAccountPayment = b.Account?.CurrentMonthlyPayment is > 0 ? b.Account.CurrentMonthlyPayment : null;
        var hasPaymentMismatch = linkedAccountPayment.HasValue
            && Math.Abs(linkedAccountPayment.Value - b.MonthlyEquivalent()) > 0.01m;

        return new(
            b.Id, b.UserId, b.Name, b.Description, b.Amount, b.Frequency,
            b.DueDay, b.ReminderDaysBefore, b.IsPaid, b.LastPaidDate,
            b.CategoryId, b.Category?.Name, b.IsActive, b.CreatedAt, b.UpdatedAt,
            b.AccountId, b.Account?.Name,
            linkedAccountPayment, hasPaymentMismatch);
    }

    private static DateTime GetNextDueDate(Bill bill, DateTime today)
    {
        if (bill.Frequency == BillFrequency.Monthly)
        {
            var dueDay = Math.Min(bill.DueDay, DateTime.DaysInMonth(today.Year, today.Month));
            var thisMonth = new DateTime(today.Year, today.Month, dueDay);
            if (thisMonth >= today) return thisMonth;
            var next = today.AddMonths(1);
            return new DateTime(next.Year, next.Month, Math.Min(bill.DueDay, DateTime.DaysInMonth(next.Year, next.Month)));
        }

        if (bill.Frequency == BillFrequency.Weekly)
        {
            // DueDay is an ISO day of week (1 = Monday .. 7 = Sunday) for Weekly bills.
            var targetDayOfWeek = (DayOfWeek)(bill.DueDay % 7);
            var candidate = NextOrSameWeekday(today, targetDayOfWeek);
            // Don't show a due date already covered by the last payment.
            if (bill.LastPaidDate.HasValue && candidate <= bill.LastPaidDate.Value.Date)
                candidate = candidate.AddDays(7);
            return candidate;
        }

        if (bill.Frequency == BillFrequency.Quarterly)
        {
            var anchor = bill.LastPaidDate?.Date ?? bill.CreatedAt.Date;
            var candidate = anchor;
            while (candidate < today) candidate = candidate.AddMonths(3);
            return candidate;
        }

        // Annual
        {
            var anchor = bill.LastPaidDate?.Date ?? bill.CreatedAt.Date;
            var candidate = anchor;
            while (candidate < today) candidate = candidate.AddYears(1);
            return candidate;
        }
    }

    /// <summary>Returns the next date on or after <paramref name="from"/> that falls on <paramref name="target"/>.</summary>
    private static DateTime NextOrSameWeekday(DateTime from, DayOfWeek target)
    {
        var diff = ((int)target - (int)from.DayOfWeek + 7) % 7;
        return from.AddDays(diff);
    }
}
