using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Studio;
using SacredVibes.Application.Features.Studio.DTOs;
using SacredVibes.Application.Features.Subscriptions;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/studio")]
public class StudioController : ControllerBase
{
    private readonly IStudioService _studio;
    private readonly IStripeSubscriptionService _stripe;

    public StudioController(IStudioService studio, IStripeSubscriptionService stripe)
    {
        _studio = studio;
        _stripe = stripe;
    }

    private string? UserId =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value;

    // ── Public / Member ───────────────────────────────────────────────────────

    [HttpGet("library")]
    public async Task<ActionResult<ApiResponse<StudioLibraryDto>>> GetLibrary(CancellationToken ct)
    {
        var library = await _studio.GetLibraryAsync(UserId, ct);
        return Ok(ApiResponse<StudioLibraryDto>.Ok(library));
    }

    [HttpGet("content/{id:guid}")]
    public async Task<ActionResult<ApiResponse<StudioContentDto>>> GetContent(Guid id, CancellationToken ct)
    {
        var content = await _studio.GetContentAsync(id, UserId, ct);
        return content is null ? NotFound() : Ok(ApiResponse<StudioContentDto>.Ok(content));
    }

    [Authorize]
    [HttpGet("stream/{id:guid}")]
    public async Task<IActionResult> Stream(Guid id, CancellationToken ct)
    {
        if (UserId is null) return Unauthorized();
        var url = await _studio.GetStreamUrlAsync(id, UserId, ct);
        if (url is null) return Forbid();
        return Redirect(url);
    }

    [Authorize]
    [HttpGet("subscription")]
    public async Task<ActionResult<ApiResponse<MemberSubscriptionDto>>> GetSubscription(CancellationToken ct)
    {
        if (UserId is null) return Unauthorized();
        var sub = await _studio.GetSubscriptionAsync(UserId, ct);
        return Ok(ApiResponse<MemberSubscriptionDto>.Ok(sub));
    }

    [Authorize]
    [HttpPost("checkout")]
    public async Task<ActionResult<ApiResponse<object>>> CreateCheckout([FromBody] CheckoutRequest request, CancellationToken ct)
    {
        if (UserId is null) return Unauthorized();
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                 ?? User.FindFirst("email")?.Value ?? string.Empty;

        try
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var successUrl = $"{baseUrl}/account?subscription=success";
            var cancelUrl  = $"{baseUrl}/account";

            var checkoutUrl = await _stripe.CreateCheckoutSessionAsync(
                UserId, email, request.Tier, successUrl, cancelUrl, ct);

            return Ok(ApiResponse<object>.Ok(new { checkoutUrl }));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize]
    [HttpPost("portal")]
    public async Task<ActionResult<ApiResponse<object>>> CreatePortal(CancellationToken ct)
    {
        if (UserId is null) return Unauthorized();
        try
        {
            var baseUrl   = $"{Request.Scheme}://{Request.Host}";
            var returnUrl = $"{baseUrl}/account";
            var portalUrl = await _stripe.CreatePortalSessionAsync(UserId, returnUrl, ct);
            return Ok(ApiResponse<object>.Ok(new { portalUrl }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    [Authorize(Roles = "Admin,Editor,Manager")]
    [HttpGet("admin/content")]
    public async Task<ActionResult<ApiResponse<List<StudioContentDto>>>> AdminListContent(CancellationToken ct)
    {
        var items = await _studio.AdminListContentAsync(ct);
        return Ok(ApiResponse<List<StudioContentDto>>.Ok(items));
    }

    [Authorize(Roles = "Admin,Editor,Manager")]
    [HttpPost("admin/content")]
    public async Task<ActionResult<ApiResponse<StudioContentDto>>> AdminCreateContent(
        [FromBody] CreateStudioContentRequest request, CancellationToken ct)
    {
        try
        {
            var created = await _studio.AdminCreateContentAsync(request, ct);
            return Ok(ApiResponse<StudioContentDto>.Ok(created));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<StudioContentDto>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin,Editor,Manager")]
    [HttpPut("admin/content/{id:guid}")]
    public async Task<ActionResult<ApiResponse<StudioContentDto>>> AdminUpdateContent(
        Guid id, [FromBody] UpdateStudioContentRequest request, CancellationToken ct)
    {
        try
        {
            var updated = await _studio.AdminUpdateContentAsync(id, request, ct);
            return Ok(ApiResponse<StudioContentDto>.Ok(updated));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [Authorize(Roles = "Admin,Editor,Manager")]
    [HttpDelete("admin/content/{id:guid}")]
    public async Task<IActionResult> AdminDeleteContent(Guid id, CancellationToken ct)
    {
        try { await _studio.AdminDeleteContentAsync(id, ct); return Ok(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [Authorize(Roles = "Admin,Editor,Manager")]
    [HttpPatch("admin/content/{id:guid}/toggle")]
    public async Task<IActionResult> AdminTogglePublished(Guid id, CancellationToken ct)
    {
        try { await _studio.AdminTogglePublishedAsync(id, ct); return Ok(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}

public record CheckoutRequest(string Tier);
