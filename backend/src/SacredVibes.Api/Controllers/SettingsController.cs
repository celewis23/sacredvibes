using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Settings;
using SacredVibes.Application.Features.Settings.DTOs;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly IAdminAssistantSettingsService _adminAssistantSettings;

    public SettingsController(IAdminAssistantSettingsService adminAssistantSettings)
    {
        _adminAssistantSettings = adminAssistantSettings;
    }

    [HttpGet("admin-assistant")]
    public async Task<ActionResult<ApiResponse<AdminAssistantSettingsDto>>> GetAdminAssistantSettings(CancellationToken ct)
    {
        var settings = await _adminAssistantSettings.GetSettingsAsync(ct);
        return Ok(ApiResponse<AdminAssistantSettingsDto>.Ok(settings));
    }

    [HttpPut("admin-assistant")]
    public async Task<ActionResult<ApiResponse<AdminAssistantSettingsDto>>> SaveAdminAssistantSettings(
        [FromBody] SaveAdminAssistantSettingsRequest request,
        CancellationToken ct)
    {
        var settings = await _adminAssistantSettings.SaveSettingsAsync(request, ct);
        return Ok(ApiResponse<AdminAssistantSettingsDto>.Ok(settings));
    }

    [HttpGet("admin-assistant/resolved")]
    public async Task<ActionResult<ApiResponse<ResolvedAdminAssistantSettingsDto>>> GetResolvedAdminAssistantSettings(CancellationToken ct)
    {
        var settings = await _adminAssistantSettings.GetResolvedSettingsAsync(ct);
        return Ok(ApiResponse<ResolvedAdminAssistantSettingsDto>.Ok(settings));
    }
}
