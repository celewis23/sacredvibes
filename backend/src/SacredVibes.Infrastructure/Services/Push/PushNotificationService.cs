using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SacredVibes.Application.Features.Push;
using SacredVibes.Domain.Entities;
using SacredVibes.Infrastructure.Data;
using WebPush;

namespace SacredVibes.Infrastructure.Services.Push;

public class PushNotificationService : IPushNotificationService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<PushNotificationService> _logger;

    public PushNotificationService(AppDbContext db, IConfiguration config, ILogger<PushNotificationService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    public async Task SubscribeAsync(string userId, PushSubscriptionRequest request, CancellationToken ct = default)
    {
        var existing = await _db.PushSubscriptions.FirstOrDefaultAsync(p => p.Endpoint == request.Endpoint, ct);
        if (existing is not null)
        {
            existing.UserId = userId;
            existing.P256dhKey = request.P256dhKey;
            existing.AuthKey = request.AuthKey;
            existing.LastUsedAt = DateTime.UtcNow;
        }
        else
        {
            await _db.PushSubscriptions.AddAsync(new PushSubscription
            {
                UserId = userId,
                Endpoint = request.Endpoint,
                P256dhKey = request.P256dhKey,
                AuthKey = request.AuthKey
            }, ct);
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task UnsubscribeAsync(string userId, string endpoint, CancellationToken ct = default)
    {
        var existing = await _db.PushSubscriptions.FirstOrDefaultAsync(p => p.Endpoint == endpoint, ct);
        if (existing is null) return;

        _db.PushSubscriptions.Remove(existing);
        await _db.SaveChangesAsync(ct);
    }

    public async Task SendToAdminsAsync(string title, string body, string? url = null, CancellationToken ct = default)
    {
        var subscriptions = await _db.PushSubscriptions.ToListAsync(ct);
        if (subscriptions.Count == 0) return;

        VapidDetails vapidDetails;
        try
        {
            vapidDetails = new VapidDetails(
                RequireConfig("Push:VapidSubject", "PUSH_VAPID_SUBJECT"),
                RequireConfig("Push:VapidPublicKey", "PUSH_VAPID_PUBLIC_KEY"),
                RequireConfig("Push:VapidPrivateKey", "PUSH_VAPID_PRIVATE_KEY"));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Push notification not sent — VAPID keys are not configured");
            return;
        }

        var client = new WebPushClient();
        var payload = JsonSerializer.Serialize(new { title, body, url = url ?? "/admin" });
        var staleSubscriptions = new List<PushSubscription>();

        foreach (var sub in subscriptions)
        {
            try
            {
                var pushSubscription = new WebPush.PushSubscription(sub.Endpoint, sub.P256dhKey, sub.AuthKey);
                await client.SendNotificationAsync(pushSubscription, payload, vapidDetails, cancellationToken: ct);
                sub.LastUsedAt = DateTime.UtcNow;
            }
            catch (WebPushException ex) when (ex.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Gone)
            {
                // Subscription no longer valid on the browser's push service — remove it.
                staleSubscriptions.Add(sub);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Push notification failed for subscription {Id}", sub.Id);
            }
        }

        if (staleSubscriptions.Count > 0) _db.PushSubscriptions.RemoveRange(staleSubscriptions);
        await _db.SaveChangesAsync(ct);
    }

    private string RequireConfig(string configKey, string envKey)
    {
        var value = Environment.GetEnvironmentVariable(envKey) ?? _config[configKey];
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException($"{configKey} is not configured.");
        return value;
    }
}
