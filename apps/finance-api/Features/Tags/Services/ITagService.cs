using FinanceApi.Features.Tags.Models;

namespace FinanceApi.Features.Tags.Services;

public interface ITagService
{
    Task<IEnumerable<TagDto>> GetTagsAsync(Guid userId, CancellationToken ct = default);
    Task<Tag> CreateTagAsync(Guid userId, CreateTagRequest request, CancellationToken ct = default);
    Task<bool> DeleteTagAsync(Guid userId, Guid tagId, CancellationToken ct = default);
}
