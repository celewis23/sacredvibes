using SacredVibes.Application.Features.Settings.DTOs;

namespace SacredVibes.Application.Features.Settings;

public interface IVercelHostingService
{
    Task<VercelHostingConfigDto> GetConfigAsync(CancellationToken ct = default);
    Task<VercelHostingConfigDto> SaveConfigAsync(SaveVercelHostingConfigRequest request, CancellationToken ct = default);
    Task<ApiHostStatusDto> GetApiHostAsync(CancellationToken ct = default);
    Task<ApiHostStatusDto> SwitchApiHostAsync(string target, CancellationToken ct = default);
}
