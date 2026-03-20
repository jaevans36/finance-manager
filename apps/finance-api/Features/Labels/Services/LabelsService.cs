using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Labels.DTOs;
using FinanceApi.Features.Labels.Models;

namespace FinanceApi.Features.Labels.Services;

public interface ILabelsService
{
    Task<List<LabelDto>> GetLabelsAsync(Guid userId);
    Task<LabelDto?> CreateLabelAsync(Guid userId, CreateLabelRequest request);
    Task<LabelDto?> UpdateLabelAsync(Guid userId, Guid labelId, UpdateLabelRequest request);
    Task<bool> DeleteLabelAsync(Guid userId, Guid labelId);
}

public class LabelsService : ILabelsService
{
    private readonly FinanceDbContext _db;

    public LabelsService(FinanceDbContext db)
    {
        _db = db;
    }

    public async Task<List<LabelDto>> GetLabelsAsync(Guid userId)
    {
        return await _db.Labels
            .Where(l => l.UserId == userId)
            .OrderBy(l => l.Name)
            .Select(l => new LabelDto { Id = l.Id, Name = l.Name, ColourHex = l.ColourHex })
            .ToListAsync();
    }

    public async Task<LabelDto?> CreateLabelAsync(Guid userId, CreateLabelRequest request)
    {
        var trimmedName = request.Name.Trim();
        var exists = await _db.Labels.AnyAsync(l => l.UserId == userId && l.Name == trimmedName);
        if (exists) return null;

        var label = new Label
        {
            UserId = userId,
            Name = trimmedName,
            ColourHex = request.ColourHex.ToUpperInvariant()
        };
        _db.Labels.Add(label);
        await _db.SaveChangesAsync();
        return new LabelDto { Id = label.Id, Name = label.Name, ColourHex = label.ColourHex };
    }

    public async Task<LabelDto?> UpdateLabelAsync(Guid userId, Guid labelId, UpdateLabelRequest request)
    {
        if (request.Name is null && request.ColourHex is null) return null;

        var label = await _db.Labels.FirstOrDefaultAsync(l => l.Id == labelId && l.UserId == userId);
        if (label is null) return null;

        if (request.Name is not null) label.Name = request.Name.Trim();
        if (request.ColourHex is not null) label.ColourHex = request.ColourHex.ToUpperInvariant();
        await _db.SaveChangesAsync();
        return new LabelDto { Id = label.Id, Name = label.Name, ColourHex = label.ColourHex };
    }

    public async Task<bool> DeleteLabelAsync(Guid userId, Guid labelId)
    {
        var label = await _db.Labels.FirstOrDefaultAsync(l => l.Id == labelId && l.UserId == userId);
        if (label is null) return false;
        _db.Labels.Remove(label);
        await _db.SaveChangesAsync();
        return true;
    }
}
