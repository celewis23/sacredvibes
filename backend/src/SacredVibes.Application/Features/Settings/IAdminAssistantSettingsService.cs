using SacredVibes.Application.Features.Settings.DTOs;

namespace SacredVibes.Application.Features.Settings;

public interface IAdminAssistantSettingsService
{
    Task<AdminAssistantSettingsDto> GetSettingsAsync(CancellationToken ct = default);
    Task<AdminAssistantSettingsDto> SaveSettingsAsync(SaveAdminAssistantSettingsRequest request, CancellationToken ct = default);
    Task<ResolvedAdminAssistantSettingsDto> GetResolvedSettingsAsync(CancellationToken ct = default);
}
