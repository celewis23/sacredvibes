using SacredVibes.Application.Features.Settings.DTOs;

namespace SacredVibes.Application.Features.Settings;

public interface ISocialLinksService
{
    Task<SocialLinksDto> GetSettingsAsync(CancellationToken ct = default);
    Task<SocialLinksDto> SaveSettingsAsync(SaveSocialLinksRequest request, CancellationToken ct = default);
}
