using Microsoft.AspNetCore.Mvc;
using SacredVibes.Application.Features.Subscriptions;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/stripe")]
public class StripeWebhookController : ControllerBase
{
    private readonly IStripeSubscriptionService _stripe;
    private readonly ILogger<StripeWebhookController> _logger;

    public StripeWebhookController(IStripeSubscriptionService stripe, ILogger<StripeWebhookController> logger)
    {
        _stripe = stripe;
        _logger = logger;
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook(CancellationToken ct)
    {
        // Read raw body — must not use model binding so signature verification works
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync(ct);

        var signature = Request.Headers["Stripe-Signature"].ToString();

        try
        {
            await _stripe.HandleWebhookAsync(payload, signature, ct);
            return Ok();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Stripe webhook processing failed");
            return StatusCode(500);
        }
    }
}
