using FinanceApi.Data;
using FinanceApi.Features.Bills.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Bills.Services;

public class BillService : IBillService
{
    private readonly FinanceDbContext _db;

    public BillService(FinanceDbContext db) => _db = db;

    public async Task<IEnumerable<Bill>> GetBillsAsync(Guid userId, CancellationToken ct = default)
        => await _db.Bills
            .Include(b => b.Category)
            .Where(b => b.UserId == userId && b.IsActive)
            .OrderBy(b => b.DueDay)
            .ToListAsync(ct);

    public async Task<IEnumerable<Bill>> GetAllBillsAsync(Guid userId, CancellationToken ct = default)
        => await _db.Bills
            .Include(b => b.Category)
            .Where(b => b.UserId == userId)
            .OrderBy(b => b.IsActive ? 0 : 1)
            .ThenBy(b => b.Name)
            .ToListAsync(ct);

    public async Task<IEnumerable<UpcomingBill>> GetUpcomingBillsAsync(
        Guid userId, DateTime? today = null, int daysAhead = 30, CancellationToken ct = default)
    {
        var reference = (today ?? DateTime.UtcNow).Date;
        var bills = await GetBillsAsync(userId, ct);
        var results = new List<UpcomingBill>();

        foreach (var bill in bills)
        {
            var nextDue = GetNextDueDate(bill, reference);
            var daysUntil = (nextDue - reference).Days;
            if (daysUntil <= daysAhead)
                results.Add(new UpcomingBill(bill, nextDue, daysUntil, daysUntil <= bill.ReminderDaysBefore));
        }

        return results.OrderBy(u => u.NextDueDate);
    }

    public async Task<Bill> CreateBillAsync(Guid userId, CreateBillRequest request, CancellationToken ct = default)
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
        };
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync(ct);
        if (bill.CategoryId.HasValue)
            await _db.Entry(bill).Reference(b => b.Category).LoadAsync(ct);
        return bill;
    }

    public async Task<Bill?> UpdateBillAsync(Guid userId, Guid billId, UpdateBillRequest request, CancellationToken ct = default)
    {
        var bill = await _db.Bills
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.Id == billId && b.UserId == userId, ct);

        if (bill is null) return null;

        if (request.Name is not null) bill.Name = request.Name;
        if (request.Description is not null) bill.Description = request.Description == string.Empty ? null : request.Description;
        if (request.Amount.HasValue) bill.Amount = request.Amount.Value;
        if (request.Frequency.HasValue) bill.Frequency = request.Frequency.Value;
        if (request.DueDay.HasValue) bill.DueDay = request.DueDay.Value;
        if (request.ReminderDaysBefore.HasValue) bill.ReminderDaysBefore = request.ReminderDaysBefore.Value;
        if (request.CategoryId.HasValue) bill.CategoryId = request.CategoryId.Value;
        if (request.IsActive.HasValue) bill.IsActive = request.IsActive.Value;
        bill.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return bill;
    }

    public async Task<bool> DeleteBillAsync(Guid userId, Guid billId, CancellationToken ct = default)
    {
        var bill = await _db.Bills
            .FirstOrDefaultAsync(b => b.Id == billId && b.UserId == userId, ct);

        if (bill is null) return false;
        _db.Bills.Remove(bill);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> MarkAsPaidAsync(Guid userId, Guid billId, CancellationToken ct = default)
    {
        var bill = await _db.Bills
            .FirstOrDefaultAsync(b => b.Id == billId && b.UserId == userId && b.IsActive, ct);

        if (bill is null) return false;
        bill.IsPaid = true;
        bill.LastPaidDate = DateTime.UtcNow;
        bill.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
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
            // Count from creation or last paid date
            var anchor = bill.LastPaidDate?.Date ?? bill.CreatedAt.Date;
            var candidate = anchor;
            while (candidate < today) candidate = candidate.AddDays(7);
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
}
