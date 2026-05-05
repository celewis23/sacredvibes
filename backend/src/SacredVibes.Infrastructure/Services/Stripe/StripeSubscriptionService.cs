using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SacredVibes.Application.Features.Subscriptions;
using SacredVibes.Domain.Entities;
using SacredVibes.Domain.Enums;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services.Stripe;

public class StripeSubscriptionService : IStripeSubscriptionService
{
    private readonly HttpClient _http;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<StripeSubscriptionService> _logger;

    private string SecretKey   => _config["Stripe:SecretKey"]   ?? throw new InvalidOperationException("Stripe:SecretKey not configured");
    private string WebhookSecret => _config["Stripe:WebhookSecret"] ?? string.Empty;
    private string SeekerPriceId  => _config["Stripe:SeekerPriceId"]  ?? string.Empty;
    private string DevoteePriceId => _config["Stripe:DevoteePriceId"] ?? string.Empty;

    public StripeSubscriptionService(IHttpClientFactory factory, AppDbContext db, IConfiguration config, ILogger<StripeSubscriptionService> logger)
    {
        _http   = factory.CreateClient("Stripe");
        _db     = db;
        _config = config;
        _logger = logger;
        _http.BaseAddress = new Uri("https://api.stripe.com");
    }

    // ── Checkout ──────────────────────────────────────────────────────────────

    public async Task<string> CreateCheckoutSessionAsync(string userId, string userEmail, string tier, string successUrl, string cancelUrl, CancellationToken ct = default)
    {
        var priceId = tier switch
        {
            "Seeker"  => SeekerPriceId,
            "Devotee" => DevoteePriceId,
            _ => throw new ArgumentException($"Unknown tier: {tier}")
        };

        if (string.IsNullOrWhiteSpace(priceId))
            throw new InvalidOperationException($"Stripe Price ID for tier '{tier}' is not configured.");

        // Get or create Stripe customer
        var stripeCustomerId = await EnsureStripeCustomerAsync(userId, userEmail, ct);

        var form = new Dictionary<string, string>
        {
            ["mode"]                            = "subscription",
            ["customer"]                        = stripeCustomerId,
            ["line_items[0][price]"]            = priceId,
            ["line_items[0][quantity]"]         = "1",
            ["success_url"]                     = successUrl,
            ["cancel_url"]                      = cancelUrl,
            ["client_reference_id"]             = userId,
            ["subscription_data[metadata][userId]"] = userId,
        };

        var response = await PostFormAsync("/v1/checkout/sessions", form, ct);
        return response.GetProperty("url").GetString()
            ?? throw new InvalidOperationException("Stripe did not return a checkout URL");
    }

    // ── Portal ────────────────────────────────────────────────────────────────

    public async Task<string> CreatePortalSessionAsync(string userId, string returnUrl, CancellationToken ct = default)
    {
        var sub = await _db.MemberSubscriptions.FirstOrDefaultAsync(s => s.UserId == userId, ct);
        if (sub?.StripeCustomerId is null)
            throw new InvalidOperationException("No Stripe customer found for this user");

        var form = new Dictionary<string, string>
        {
            ["customer"]   = sub.StripeCustomerId,
            ["return_url"] = returnUrl,
        };

        var response = await PostFormAsync("/v1/billing_portal/sessions", form, ct);
        return response.GetProperty("url").GetString()
            ?? throw new InvalidOperationException("Stripe did not return a portal URL");
    }

    // ── Webhook ───────────────────────────────────────────────────────────────

    public async Task HandleWebhookAsync(string payload, string stripeSignature, CancellationToken ct = default)
    {
        if (!string.IsNullOrWhiteSpace(WebhookSecret) && !VerifySignature(payload, stripeSignature, WebhookSecret))
        {
            _logger.LogWarning("Stripe webhook signature verification failed");
            throw new UnauthorizedAccessException("Invalid Stripe webhook signature");
        }

        var doc       = JsonDocument.Parse(payload);
        var eventType = doc.RootElement.GetProperty("type").GetString();
        var dataObj   = doc.RootElement.GetProperty("data").GetProperty("object");

        _logger.LogInformation("Stripe webhook received: {EventType}", eventType);

        switch (eventType)
        {
            case "customer.subscription.created":
            case "customer.subscription.updated":
                await UpsertSubscriptionAsync(dataObj, payload, ct);
                break;

            case "customer.subscription.deleted":
                await CancelSubscriptionAsync(dataObj, payload, ct);
                break;

            case "invoice.payment_failed":
                await MarkPastDueAsync(dataObj, ct);
                break;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<string> EnsureStripeCustomerAsync(string userId, string userEmail, CancellationToken ct)
    {
        var existing = await _db.MemberSubscriptions.FirstOrDefaultAsync(s => s.UserId == userId, ct);
        if (existing?.StripeCustomerId is not null)
            return existing.StripeCustomerId;

        // Create customer in Stripe
        var form = new Dictionary<string, string>
        {
            ["email"]              = userEmail,
            ["metadata[userId]"]   = userId,
        };
        var customer = await PostFormAsync("/v1/customers", form, ct);
        var customerId = customer.GetProperty("id").GetString()!;

        // Persist
        if (existing is null)
        {
            _db.MemberSubscriptions.Add(new MemberSubscription
            {
                UserId           = userId,
                StripeCustomerId = customerId,
                Tier             = StudioTier.Free,
                Status           = SubscriptionStatus.Active,
            });
        }
        else
        {
            existing.StripeCustomerId = customerId;
        }
        await _db.SaveChangesAsync(ct);
        return customerId;
    }

    private async Task UpsertSubscriptionAsync(JsonElement sub, string rawPayload, CancellationToken ct)
    {
        var stripeSubId    = sub.GetProperty("id").GetString()!;
        var stripeCustomer = sub.GetProperty("customer").GetString()!;
        var status         = sub.GetProperty("status").GetString()!;
        var userId         = TryGetMetadata(sub, "userId");

        // Resolve period dates
        DateTime? periodStart = null, periodEnd = null;
        if (sub.TryGetProperty("current_period_start", out var ps) && ps.ValueKind == JsonValueKind.Number)
            periodStart = DateTimeOffset.FromUnixTimeSeconds(ps.GetInt64()).UtcDateTime;
        if (sub.TryGetProperty("current_period_end", out var pe) && pe.ValueKind == JsonValueKind.Number)
            periodEnd = DateTimeOffset.FromUnixTimeSeconds(pe.GetInt64()).UtcDateTime;

        // Resolve tier from price metadata or amount
        var tier = ResolveTierFromSubscription(sub);

        // Find record by Stripe sub ID or customer ID or userId
        var record = await _db.MemberSubscriptions.FirstOrDefaultAsync(
            s => s.StripeSubscriptionId == stripeSubId || s.StripeCustomerId == stripeCustomer, ct);

        if (record is null && userId is not null)
            record = await _db.MemberSubscriptions.FirstOrDefaultAsync(s => s.UserId == userId, ct);

        if (record is null)
        {
            _logger.LogWarning("Could not find MemberSubscription for Stripe sub {SubId}", stripeSubId);
            return;
        }

        record.StripeSubscriptionId = stripeSubId;
        record.StripeCustomerId     = stripeCustomer;
        record.Tier                 = tier;
        record.Status               = MapStripeStatus(status);
        record.CurrentPeriodStart   = periodStart;
        record.CurrentPeriodEnd     = periodEnd;
        record.RawEventJson         = rawPayload;
        await _db.SaveChangesAsync(ct);
    }

    private async Task CancelSubscriptionAsync(JsonElement sub, string rawPayload, CancellationToken ct)
    {
        var stripeSubId = sub.GetProperty("id").GetString()!;
        var record = await _db.MemberSubscriptions.FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubId, ct);
        if (record is null) return;

        record.Status      = SubscriptionStatus.Cancelled;
        record.CancelledAt = DateTime.UtcNow;
        record.RawEventJson = rawPayload;
        await _db.SaveChangesAsync(ct);
    }

    private async Task MarkPastDueAsync(JsonElement invoice, CancellationToken ct)
    {
        var stripeSubId = invoice.TryGetProperty("subscription", out var s) ? s.GetString() : null;
        if (stripeSubId is null) return;

        var record = await _db.MemberSubscriptions.FirstOrDefaultAsync(r => r.StripeSubscriptionId == stripeSubId, ct);
        if (record is null) return;

        record.Status = SubscriptionStatus.PastDue;
        await _db.SaveChangesAsync(ct);
    }

    private StudioTier ResolveTierFromSubscription(JsonElement sub)
    {
        // Try to match on the price ID configured
        try
        {
            var items = sub.GetProperty("items").GetProperty("data");
            foreach (var item in items.EnumerateArray())
            {
                var priceId = item.GetProperty("price").GetProperty("id").GetString();
                if (priceId == DevoteePriceId) return StudioTier.Devotee;
                if (priceId == SeekerPriceId)  return StudioTier.Seeker;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not resolve tier from subscription items");
        }
        return StudioTier.Seeker; // safe fallback for paid subscriptions
    }

    private static string? TryGetMetadata(JsonElement el, string key)
    {
        try
        {
            return el.GetProperty("metadata").GetProperty(key).GetString();
        }
        catch { return null; }
    }

    private static SubscriptionStatus MapStripeStatus(string status) => status switch
    {
        "active"   => SubscriptionStatus.Active,
        "trialing" => SubscriptionStatus.Trialing,
        "past_due" => SubscriptionStatus.PastDue,
        "canceled" or "cancelled" => SubscriptionStatus.Cancelled,
        _ => SubscriptionStatus.Incomplete,
    };

    private static bool VerifySignature(string payload, string header, string secret)
    {
        // Stripe-Signature: t=timestamp,v1=signature
        var parts = header.Split(',');
        var timestamp = parts.FirstOrDefault(p => p.StartsWith("t="))?.Substring(2);
        var signature = parts.FirstOrDefault(p => p.StartsWith("v1="))?.Substring(3);
        if (timestamp is null || signature is null) return false;

        var signed  = $"{timestamp}.{payload}";
        var key     = Encoding.UTF8.GetBytes(secret);
        var data    = Encoding.UTF8.GetBytes(signed);
        var computed = Convert.ToHexString(HMACSHA256.HashData(key, data)).ToLower();
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computed),
            Encoding.UTF8.GetBytes(signature));
    }

    private async Task<JsonElement> PostFormAsync(string path, Dictionary<string, string> form, CancellationToken ct)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, path);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", SecretKey);
        request.Content = new FormUrlEncodedContent(form);

        var response = await _http.SendAsync(request, ct);
        var body     = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Stripe API error {Status}: {Body}", (int)response.StatusCode, body);
            throw new InvalidOperationException($"Stripe error: {body}");
        }

        return JsonDocument.Parse(body).RootElement;
    }
}
