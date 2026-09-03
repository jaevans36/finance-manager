using FinanceApi.Data;
using FinanceApi.Features.Affordability.Services;
using FinanceApi.Features.IncomeStreams.Models;
using FinanceApi.Features.Transactions.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.IncomeStreams.Services;

public class IncomeStreamService(FinanceDbContext db) : IIncomeStreamService
{
    public async Task<IEnumerable<IncomeStreamResponse>> GetStreamsAsync(Guid userId, CancellationToken ct = default)
        => await db.IncomeStreams
            .Include(s => s.Account)
            .Where(s => s.UserId == userId)
            .OrderBy(s => s.CreatedAt)
            .Select(s => ToResponse(s))
            .ToListAsync(ct);

    public async Task<IncomeStreamResponse> CreateStreamAsync(Guid userId, CreateIncomeStreamRequest request, CancellationToken ct = default)
    {
        var stream = new IncomeStream
        {
            UserId = userId,
            Name = request.Name,
            MonthlyAmount = request.MonthlyAmount,
            AccountId = request.AccountId,
        };
        db.IncomeStreams.Add(stream);
        await db.SaveChangesAsync(ct);

        if (stream.AccountId.HasValue)
            await db.Entry(stream).Reference(s => s.Account).LoadAsync(ct);

        return ToResponse(stream);
    }

    public async Task<IncomeStreamResponse?> UpdateStreamAsync(Guid userId, Guid streamId, UpdateIncomeStreamRequest request, CancellationToken ct = default)
    {
        var stream = await db.IncomeStreams
            .Include(s => s.Account)
            .FirstOrDefaultAsync(s => s.Id == streamId && s.UserId == userId, ct);

        if (stream is null) return null;

        if (request.Name is not null) stream.Name = request.Name;
        if (request.MonthlyAmount.HasValue) stream.MonthlyAmount = request.MonthlyAmount.Value;
        // AccountId can be explicitly set to null to unlink
        if (request.AccountId != stream.AccountId)
        {
            stream.AccountId = request.AccountId;
            if (stream.AccountId.HasValue)
                await db.Entry(stream).Reference(s => s.Account).LoadAsync(ct);
            else
                stream.Account = null;
        }

        stream.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return ToResponse(stream);
    }

    public async Task<bool> DeleteStreamAsync(Guid userId, Guid streamId, CancellationToken ct = default)
    {
        var stream = await db.IncomeStreams
            .FirstOrDefaultAsync(s => s.Id == streamId && s.UserId == userId, ct);

        if (stream is null) return false;
        db.IncomeStreams.Remove(stream);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<DetectedIncomeResponse> GetDetectedIncomeAsync(Guid userId, Guid accountId, CancellationToken ct = default)
    {
        var windowStart = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-90);
        var credits = await db.Transactions
            .Where(t => t.UserId == userId
                     && t.AccountId == accountId
                     && t.Type == TransactionType.Credit
                     && t.TransactionDate >= windowStart)
            .ToListAsync(ct);

        var byMonth = IncomeDetectionHeuristics.ClassifyByMonth(credits);
        if (byMonth.Count == 0)
            return new DetectedIncomeResponse(null, 0, []);

        var incomeEvents = byMonth.SelectMany(g => g).ToList();
        var monthlyAmount = (decimal)byMonth.Average(g => (double)g.Sum(t => t.Amount));

        var matched = incomeEvents
            .OrderByDescending(t => t.TransactionDate)
            .Take(6)
            .Select(t => new DetectedIncomeTransaction(t.TransactionDate, t.Payee, t.Description, t.Amount))
            .ToList();

        return new DetectedIncomeResponse(Math.Round(monthlyAmount, 2), incomeEvents.Count, matched);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    internal static IncomeStreamResponse ToResponse(IncomeStream s) => new(
        s.Id, s.UserId, s.Name, s.MonthlyAmount,
        s.AccountId, s.Account?.Name, s.CreatedAt, s.UpdatedAt);
}
