using SacredVibes.Application.Features.Studio.DTOs;

namespace SacredVibes.Application.Features.Studio;

public interface IStudioService
{
    Task<StudioLibraryDto> GetLibraryAsync(string? userId, CancellationToken ct = default);
    Task<StudioContentDto?> GetContentAsync(Guid contentId, string? userId, CancellationToken ct = default);
    Task<string?> GetStreamUrlAsync(Guid contentId, string userId, CancellationToken ct = default);
    Task<MemberSubscriptionDto> GetSubscriptionAsync(string userId, CancellationToken ct = default);

    // Admin
    Task<List<StudioContentDto>> AdminListContentAsync(CancellationToken ct = default);
    Task<StudioContentDto> AdminCreateContentAsync(CreateStudioContentRequest request, CancellationToken ct = default);
    Task<StudioContentDto> AdminUpdateContentAsync(Guid id, UpdateStudioContentRequest request, CancellationToken ct = default);
    Task AdminDeleteContentAsync(Guid id, CancellationToken ct = default);
    Task AdminTogglePublishedAsync(Guid id, CancellationToken ct = default);
}
