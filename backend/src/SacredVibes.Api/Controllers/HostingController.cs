using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Settings;
using SacredVibes.Application.Features.Settings.DTOs;

namespace SacredVibes.Api.Controllers;

/// <summary>
/// Admin-only: switches which API host (Railway vs. the Render failover standby) the live
/// Vercel frontend points at. Admin is the strictest role in this app (no "Owner" tier exists),
/// so this already excludes Editor/Manager/Member. Deliberately a dedicated controller, not part
/// of SettingsController, so it stays easy to keep locked down even if that one's auth loosens.
/// </summary>
[ApiController]
[Route("api/hosting")]
[Authorize(Roles = "Admin")]
public class HostingController : ControllerBase
{
    private readonly IVercelHostingService _vercelHostingService;
    private readonly ILogger<HostingController> _logger;

    public HostingController(IVercelHostingService vercelHostingService, ILogger<HostingController> logger)
    {
        _vercelHostingService = vercelHostingService;
        _logger = logger;
    }

    [HttpGet("config")]
    public async Task<ActionResult<ApiResponse<VercelHostingConfigDto>>> GetConfig(CancellationToken ct)
    {
        var config = await _vercelHostingService.GetConfigAsync(ct);
        return Ok(ApiResponse<VercelHostingConfigDto>.Ok(config));
    }

    [HttpPut("config")]
    public async Task<ActionResult<ApiResponse<VercelHostingConfigDto>>> SaveConfig(
        [FromBody] SaveVercelHostingConfigRequest request,
        CancellationToken ct)
    {
        var config = await _vercelHostingService.SaveConfigAsync(request, ct);
        return Ok(ApiResponse<VercelHostingConfigDto>.Ok(config));
    }

    [HttpGet("api-host")]
    public async Task<ActionResult<ApiResponse<ApiHostStatusDto>>> GetApiHost(CancellationToken ct)
    {
        var status = await _vercelHostingService.GetApiHostAsync(ct);
        return Ok(ApiResponse<ApiHostStatusDto>.Ok(status));
    }

    [HttpPost("api-host/switch")]
    public async Task<ActionResult<ApiResponse<ApiHostStatusDto>>> SwitchApiHost(
        [FromBody] SwitchApiHostRequest request,
        CancellationToken ct)
    {
        if (request.Target is not ("railway" or "render"))
        {
            return BadRequest(ApiResponse<ApiHostStatusDto>.Fail("Target must be 'railway' or 'render'."));
        }

        try
        {
            var status = await _vercelHostingService.SwitchApiHostAsync(request.Target, ct);
            return Ok(ApiResponse<ApiHostStatusDto>.Ok(status));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ApiHostStatusDto>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not switch API host");
            return BadRequest(ApiResponse<ApiHostStatusDto>.Fail("Could not switch API host. Check backend logs for details."));
        }
    }
}
