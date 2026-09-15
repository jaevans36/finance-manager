using FinanceApi.Data;
using FinanceApi.Features.Tags.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApi.Features.Tags.Services;

/// <summary>Free-form tag management — creation, listing with usage counts, deletion.</summary>
public class TagService : ITagService
{
    private readonly FinanceDbContext _db;

    public TagService(FinanceDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<TagDto>> GetTagsAsync(Guid userId, CancellationToken ct = default)
    {
        var tags = await _db.Tags
            .Where(t => t.UserId == userId)
            .OrderBy(t => t.Name)
            .Select(t => new TagDto(t.Id, t.Name, t.Colour, t.TransactionTags.Count, t.CreatedAt))
            .ToListAsync(ct);

        return tags;
    }

    public async Task<Tag> CreateTagAsync(Guid userId, CreateTagRequest request, CancellationToken ct = default)
    {
        var tag = new Tag
        {
            UserId = userId,
            Name = request.Name,
            Colour = request.Colour,
        };

        _db.Tags.Add(tag);
        await _db.SaveChangesAsync(ct);
        return tag;
    }

    public async Task<bool> DeleteTagAsync(Guid userId, Guid tagId, CancellationToken ct = default)
    {
        var tag = await _db.Tags.FirstOrDefaultAsync(t => t.Id == tagId && t.UserId == userId, ct);
        if (tag is null) return false;

        _db.Tags.Remove(tag);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
