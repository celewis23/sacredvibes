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
    private readonly ILogger<SettingsController> _logger;

    public SettingsController(IAdminAssistantSettingsService adminAssistantSettings, ILogger<SettingsController> logger)
    {
        _adminAssistantSettings = adminAssistantSettings;
        _logger = logger;
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
        try
        {
            var settings = await _adminAssistantSettings.SaveSettingsAsync(request, ct);
            return Ok(ApiResponse<AdminAssistantSettingsDto>.Ok(settings));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<AdminAssistantSettingsDto>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not save admin assistant settings");
            return BadRequest(ApiResponse<AdminAssistantSettingsDto>.Fail("Could not save admin assistant settings. Check backend logs for details."));
        }
    }

    [HttpGet("admin-assistant/resolved")]
    public async Task<ActionResult<ApiResponse<ResolvedAdminAssistantSettingsDto>>> GetResolvedAdminAssistantSettings(CancellationToken ct)
    {
        var settings = await _adminAssistantSettings.GetResolvedSettingsAsync(ct);
        return Ok(ApiResponse<ResolvedAdminAssistantSettingsDto>.Ok(settings));
    }
}
