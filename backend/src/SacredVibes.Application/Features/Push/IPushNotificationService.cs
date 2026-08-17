namespace SacredVibes.Application.Features.Push;

public interface IPushNotificationService
{
    Task SubscribeAsync(string userId, PushSubscriptionRequest request, CancellationToken ct = default);
    Task UnsubscribeAsync(string userId, string endpoint, CancellationToken ct = default);
    Task SendToAdminsAsync(string title, string body, string? url = null, CancellationToken ct = default);
}

public record PushSubscriptionRequest(string Endpoint, string P256dhKey, string AuthKey);
