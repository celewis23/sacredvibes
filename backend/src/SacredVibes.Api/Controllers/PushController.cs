using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Push;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/push")]
public class PushController : ControllerBase
{
    private readonly IPushNotificationService _push;
    private readonly IConfiguration _config;

    public PushController(IPushNotificationService push, IConfiguration config)
    {
        _push = push;
        _config = config;
    }

    [AllowAnonymous]
    [HttpGet("vapid-public-key")]
    public ActionResult<ApiResponse<string>> GetVapidPublicKey()
    {
        var key = Environment.GetEnvironmentVariable("PUSH_VAPID_PUBLIC_KEY") ?? _config["Push:VapidPublicKey"];
        if (string.IsNullOrWhiteSpace(key)) return NotFound();
        return Ok(ApiResponse<string>.Ok(key));
    }

    [HttpPost("subscribe")]
    public async Task<ActionResult> Subscribe([FromBody] PushSubscribeRequest request, CancellationToken ct)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        await _push.SubscribeAsync(userId, new PushSubscriptionRequest(request.Endpoint, request.P256dhKey, request.AuthKey), ct);
        return Ok(new { message = "Subscribed" });
    }

    [HttpDelete("subscribe")]
    public async Task<ActionResult> Unsubscribe([FromQuery] string endpoint, CancellationToken ct)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        await _push.UnsubscribeAsync(userId, endpoint, ct);
        return Ok(new { message = "Unsubscribed" });
    }

    private string? CurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value;
}

public record PushSubscribeRequest(string Endpoint, string P256dhKey, string AuthKey);
