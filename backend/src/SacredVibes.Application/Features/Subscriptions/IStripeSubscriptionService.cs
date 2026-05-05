namespace SacredVibes.Application.Features.Subscriptions;

public interface IStripeSubscriptionService
{
    Task<string> CreateCheckoutSessionAsync(string userId, string userEmail, string tier, string successUrl, string cancelUrl, CancellationToken ct = default);
    Task<string> CreatePortalSessionAsync(string userId, string returnUrl, CancellationToken ct = default);
    Task HandleWebhookAsync(string payload, string stripeSignature, CancellationToken ct = default);
}
