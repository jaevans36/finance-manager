using Microsoft.EntityFrameworkCore;
using FinanceApi.Data;
using FinanceApi.Features.Labels.DTOs;
using FinanceApi.Features.Labels.Models;

namespace FinanceApi.Features.Labels.Services;

public class LabelsService
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

    public async Task<LabelDto> CreateLabelAsync(Guid userId, CreateLabelRequest request)
    {
        var label = new Label
        {
            UserId = userId,
            Name = request.Name.Trim(),
            ColourHex = request.ColourHex
        };
        _db.Labels.Add(label);
        await _db.SaveChangesAsync();
        return new LabelDto { Id = label.Id, Name = label.Name, ColourHex = label.ColourHex };
    }

    public async Task<LabelDto?> UpdateLabelAsync(Guid userId, Guid labelId, UpdateLabelRequest request)
    {
        var label = await _db.Labels.FirstOrDefaultAsync(l => l.Id == labelId && l.UserId == userId);
        if (label is null) return null;

        if (request.Name is not null) label.Name = request.Name.Trim();
        if (request.ColourHex is not null) label.ColourHex = request.ColourHex;
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
