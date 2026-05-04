using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SacredVibes.Application.Features.Bookings.DTOs;
using SacredVibes.Application.Features.Payments;
using SacredVibes.Application.Features.Subscribers.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Domain.Enums;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services.Square;

/// <summary>
/// Square integration service.
/// CONFIGURATION REQUIRED: Set Square:AccessToken, Square:LocationId, Square:ApplicationId, and Square:WebhookSignatureKey
/// in appsettings or environment variables. Use the Square Developer Dashboard to obtain these values.
/// For sandbox testing, set Square:Environment to "sandbox".
/// </summary>
public class SquareService : ISquareService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SquareService> _logger;
    private readonly AppDbContext _db;
    private readonly HttpClient _http;

    private string AccessToken => _config["Square:AccessToken"] ?? throw new InvalidOperationException("Square:AccessToken not configured");
    private string LocationId => _config["Square:LocationId"] ?? throw new InvalidOperationException("Square:LocationId not configured");
    private string WebhookSignatureKey => _config["Square:WebhookSignatureKey"] ?? string.Empty;
    private bool IsSandbox => (_config["Square:Environment"] ?? "sandbox").Equals("sandbox", StringComparison.OrdinalIgnoreCase);
    private string BaseUrl => IsSandbox ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
    private const string SquareVersion = "2026-01-22";

    public SquareService(IConfiguration config, ILogger<SquareService> logger, AppDbContext db, IHttpClientFactory httpClientFactory)
    {
        _config = config;
        _logger = logger;
        _db = db;
        _http = httpClientFactory.CreateClient("Square");
    }

    public async Task<CheckoutResponse> CreateCheckoutAsync(CreateCheckoutRequest request, BookingDto booking, CancellationToken ct = default)
    {
        ConfigureSquareHeaders();

        var idempotencyKey = Guid.NewGuid().ToString();
        var amountMoney = new
        {
            amount = (long)(booking.Amount * 100), // Square uses cents
            currency = booking.Currency
        };

        var body = new
        {
            idempotency_key = idempotencyKey,
            order = new
            {
                location_id = LocationId,
                reference_id = booking.Id.ToString(),
                line_items = new[]
                {
                    new
                    {
                        name = booking.ServiceOfferingName ?? booking.EventOfferingName ?? "Sacred Vibes Booking",
                        quantity = "1",
                        base_price_money = amountMoney
                    }
                },
                customer_note = booking.CustomerNotes
            },
            checkout_options = new
            {
                redirect_url = request.ReturnUrl,
                merchant_support_email = "info@sacredvibesyoga.com",
                allow_tipping = false,
                ask_for_shipping_address = false
            },
            pre_populated_data = new
            {
                buyer_email = booking.CustomerEmail,
                buyer_phone_number = booking.CustomerPhone
            }
        };

        try
        {
            var json = JsonSerializer.Serialize(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _http.PostAsync($"{BaseUrl}/v2/online-checkout/payment-links", content, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Square checkout creation failed: {Status} {Body}", response.StatusCode, responseBody);
                throw new InvalidOperationException($"Square checkout failed: {responseBody}");
            }

            using var doc = JsonDocument.Parse(responseBody);
            var paymentLink = doc.RootElement.GetProperty("payment_link");
            var checkoutUrl = paymentLink.GetProperty("url").GetString() ?? throw new InvalidOperationException("No checkout URL returned");
            var checkoutId = paymentLink.GetProperty("id").GetString();

            return new CheckoutResponse
            {
                CheckoutUrl = checkoutUrl,
                ExternalCheckoutId = checkoutId,
                Provider = "Square"
            };
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            _logger.LogError(ex, "Exception creating Square checkout for booking {BookingId}", booking.Id);
            throw;
        }
    }

    public async Task<SquarePaymentStatusResult> GetPaymentStatusAsync(string squarePaymentId, CancellationToken ct = default)
    {
        ConfigureSquareHeaders();

        try
        {
            var response = await _http.GetAsync($"{BaseUrl}/v2/payments/{squarePaymentId}", ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Square payment status check failed: {Status} for {PaymentId}", response.StatusCode, squarePaymentId);
                return new SquarePaymentStatusResult { Found = false, Error = $"HTTP {response.StatusCode}" };
            }

            using var doc = JsonDocument.Parse(body);
            var payment = doc.RootElement.GetProperty("payment");
            var status = payment.GetProperty("status").GetString() ?? "UNKNOWN";
            var amountMoney = payment.GetProperty("amount_money");
            var amount = amountMoney.GetProperty("amount").GetInt64() / 100m;
            var currency = amountMoney.GetProperty("currency").GetString() ?? "USD";

            return new SquarePaymentStatusResult
            {
                Found = true,
                Status = status,
                Amount = amount,
                Currency = currency
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception checking Square payment status for {PaymentId}", squarePaymentId);
            return new SquarePaymentStatusResult { Found = false, Error = ex.Message };
        }
    }

    public async Task<WebhookProcessResult> ProcessWebhookAsync(string rawPayload, string squareSignature, CancellationToken ct = default)
    {
        if (!await ValidateWebhookSignatureAsync(rawPayload, squareSignature, ct))
        {
            _logger.LogWarning("Square webhook signature validation failed");
            return new WebhookProcessResult { Success = false, Message = "Invalid signature" };
        }

        using var doc = JsonDocument.Parse(rawPayload);
        var root = doc.RootElement;
        var eventType = root.TryGetProperty("type", out var typeEl) ? typeEl.GetString() ?? "" : "";
        var eventId = root.TryGetProperty("event_id", out var idEl) ? idEl.GetString() ?? Guid.NewGuid().ToString() : Guid.NewGuid().ToString();

        // Record the event
        var webhookEvent = new WebhookEvent
        {
            Provider = "Square",
            EventType = eventType,
            ExternalEventId = eventId,
            PayloadJson = rawPayload
        };

        // Check for duplicate
        var existing = await _db.WebhookEvents.FirstOrDefaultAsync(w => w.ExternalEventId == eventId, ct);
        if (existing is not null)
        {
            _logger.LogInformation("Duplicate Square webhook event {EventId} ignored", eventId);
            return new WebhookProcessResult { Success = true, EventType = eventType, Message = "Duplicate ignored" };
        }

        await _db.WebhookEvents.AddAsync(webhookEvent, ct);

        try
        {
            string? entityId = null;

            switch (eventType)
            {
                case "payment.created":
                case "payment.completed":
                case "payment.updated":
                    entityId = await HandlePaymentEventAsync(root, eventType, ct);
                    break;
                case "order.created":
                case "order.completed":
                case "order.updated":
                    entityId = await HandleOrderEventAsync(root, ct);
                    break;
                case "refund.created":
                case "refund.updated":
                    entityId = await HandleRefundEventAsync(root, ct);
                    break;
                default:
                    _logger.LogInformation("Unhandled Square webhook event type: {EventType}", eventType);
                    break;
            }

            webhookEvent.IsProcessed = true;
            webhookEvent.ProcessedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            return new WebhookProcessResult { Success = true, EventType = eventType, EntityId = entityId };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Square webhook {EventType} {EventId}", eventType, eventId);
            webhookEvent.ProcessingError = ex.Message;
            webhookEvent.RetryCount++;
            await _db.SaveChangesAsync(ct);
            return new WebhookProcessResult { Success = false, EventType = eventType, Message = ex.Message };
        }
    }

    private async Task<string?> HandlePaymentEventAsync(JsonElement root, string eventType, CancellationToken ct)
    {
        if (!root.TryGetProperty("data", out var data)) return null;
        if (!data.TryGetProperty("object", out var obj)) return null;
        if (!obj.TryGetProperty("payment", out var payment)) return null;

        var squarePaymentId = payment.TryGetProperty("id", out var pid) ? pid.GetString() : null;
        if (squarePaymentId is null) return null;

        var referenceId = payment.TryGetProperty("reference_id", out var refEl) ? refEl.GetString() : null;
        var status = payment.TryGetProperty("status", out var statusEl) ? statusEl.GetString() : null;
        var amountMoney = payment.TryGetProperty("amount_money", out var amEl) ? amEl : (JsonElement?)null;
        var amountCents = amountMoney?.TryGetProperty("amount", out var cents) == true ? cents.GetInt64() : 0L;
        var currency = amountMoney?.TryGetProperty("currency", out var curr) == true ? curr.GetString() : "USD";

        // Try to find associated booking by ExternalPaymentId or by reference_id
        Booking? booking = null;
        if (squarePaymentId is not null)
            booking = await _db.Bookings.FirstOrDefaultAsync(b => b.ExternalPaymentId == squarePaymentId, ct);

        if (booking is null && referenceId is not null && Guid.TryParse(referenceId, out var bookingId))
            booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId, ct);

        if (booking is not null)
        {
            booking.ExternalPaymentId = squarePaymentId;
            booking.PaymentStatus = status switch
            {
                "COMPLETED" => PaymentStatus.Completed,
                "FAILED" or "CANCELED" => PaymentStatus.Failed,
                _ => PaymentStatus.Processing
            };

            if (booking.PaymentStatus == PaymentStatus.Completed)
            {
                booking.Status = BookingStatus.Paid;
                booking.ConfirmedAt ??= DateTime.UtcNow;
            }

            // Create or update payment record
            var existingRecord = await _db.PaymentRecords.FirstOrDefaultAsync(p => p.ProviderPaymentId == squarePaymentId, ct);
            if (existingRecord is null)
            {
                await _db.PaymentRecords.AddAsync(new PaymentRecord
                {
                    BookingId = booking.Id,
                    Provider = "Square",
                    ProviderPaymentId = squarePaymentId!,
                    Amount = amountCents / 100m,
                    Currency = currency ?? "USD",
                    Status = booking.PaymentStatus,
                    RawPayloadJson = root.GetRawText(),
                    ProcessedAt = DateTime.UtcNow
                }, ct);
            }
        }

        return squarePaymentId;
    }

    private async Task<string?> HandleOrderEventAsync(JsonElement root, CancellationToken ct)
    {
        // Basic order handling — extract order id and log
        if (!root.TryGetProperty("data", out var data)) return null;
        if (!data.TryGetProperty("object", out var obj)) return null;
        if (!obj.TryGetProperty("order_created", out var orderData) &&
            !obj.TryGetProperty("order_updated", out orderData)) return null;

        var orderId = orderData.TryGetProperty("order_id", out var oid) ? oid.GetString() : null;
        _logger.LogInformation("Square order event processed: {OrderId}", orderId);
        await Task.CompletedTask;
        return orderId;
    }

    private async Task<string?> HandleRefundEventAsync(JsonElement root, CancellationToken ct)
    {
        if (!root.TryGetProperty("data", out var data)) return null;
        if (!data.TryGetProperty("object", out var obj)) return null;
        if (!obj.TryGetProperty("refund", out var refund)) return null;

        var paymentId = refund.TryGetProperty("payment_id", out var pid) ? pid.GetString() : null;
        var refundStatus = refund.TryGetProperty("status", out var statusEl) ? statusEl.GetString() : null;

        if (paymentId is not null)
        {
            var payment = await _db.PaymentRecords.FirstOrDefaultAsync(p => p.ProviderPaymentId == paymentId, ct);
            if (payment is not null && refundStatus == "COMPLETED")
            {
                payment.Status = PaymentStatus.Refunded;
                var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == payment.BookingId, ct);
                if (booking is not null)
                {
                    booking.Status = BookingStatus.Refunded;
                    booking.PaymentStatus = PaymentStatus.Refunded;
                }
            }
        }

        return paymentId;
    }

    public async Task<SquareCustomerImportResult> ImportCustomersAsync(CancellationToken ct = default)
    {
        ConfigureSquareHeaders();

        var result = new SquareCustomerImportResult();
        string? cursor = null;

        do
        {
            var url = $"{BaseUrl}/v2/customers?limit=100&sort_field=CREATED_AT&sort_order=ASC";
            if (cursor is not null) url += $"&cursor={cursor}";

            var response = await _http.GetAsync(url, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Square customer list failed: {Status} {Body}", response.StatusCode, body);
                result.Errors++;
                result.ErrorMessages.Add($"HTTP {response.StatusCode}: {body}");
                break;
            }

            using var doc = JsonDocument.Parse(body);

            if (!doc.RootElement.TryGetProperty("customers", out var customers))
                break;

            if (customers.ValueKind != JsonValueKind.Array)
            {
                _logger.LogInformation("Square customer list returned no importable customers");
                break;
            }

            foreach (var customer in customers.EnumerateArray())
            {
                result.TotalFetched++;
                try
                {
                    var email = customer.TryGetProperty("email_address", out var emailEl) ? emailEl.GetString() : null;
                    if (string.IsNullOrWhiteSpace(email))
                    {
                        result.Skipped++;
                        continue;
                    }

                    var firstName = customer.TryGetProperty("given_name", out var fn) ? fn.GetString() : null;
                    var lastName = customer.TryGetProperty("family_name", out var ln) ? ln.GetString() : null;
                    var phone = customer.TryGetProperty("phone_number", out var ph) ? ph.GetString() : null;
                    var customerId = customer.TryGetProperty("id", out var cid) ? cid.GetString() : null;

                    var existing = await _db.Subscribers.FirstOrDefaultAsync(s => s.Email == email.ToLowerInvariant(), ct);
                    if (existing is not null)
                    {
                        // Update if needed
                        existing.FirstName ??= firstName;
                        existing.LastName ??= lastName;
                        existing.Phone ??= phone;
                        result.Updated++;
                    }
                    else
                    {
                        await _db.Subscribers.AddAsync(new Subscriber
                        {
                            Email = email.ToLowerInvariant(),
                            FirstName = firstName,
                            LastName = lastName,
                            Phone = phone,
                            Source = ImportSource.Square,
                            ExternalSourceId = customerId,
                            IsSubscribed = true,
                            ConsentStatus = ConsentStatus.Unknown
                        }, ct);
                        result.Inserted++;
                    }
                }
                catch (Exception ex)
                {
                    result.Errors++;
                    result.ErrorMessages.Add($"Row error: {ex.Message}");
                }
            }

            await _db.SaveChangesAsync(ct);
            cursor = doc.RootElement.TryGetProperty("cursor", out var c) ? c.GetString() : null;
        } while (cursor is not null);

        return result;
    }

    public async Task<SquareServiceCatalogSyncResult> ImportServiceCatalogAsync(Guid brandId, CancellationToken ct = default)
    {
        ConfigureSquareHeaders();

        var brandExists = await _db.Brands.AnyAsync(b => b.Id == brandId && !b.IsDeleted, ct);
        if (!brandExists)
            throw new InvalidOperationException("Brand not found");

        var result = new SquareServiceCatalogSyncResult();
        string? cursor = null;

        do
        {
            var url = $"{BaseUrl}/v2/catalog/list?types=ITEM";
            if (cursor is not null) url += $"&cursor={Uri.EscapeDataString(cursor)}";

            var response = await _http.GetAsync(url, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Square catalog list failed: {Status} {Body}", response.StatusCode, body);
                result.ErrorMessages.Add($"HTTP {response.StatusCode}: {body}");
                result.Errors++;
                break;
            }

            using var doc = JsonDocument.Parse(body);
            if (!doc.RootElement.TryGetProperty("objects", out var objects))
                break;

            foreach (var obj in objects.EnumerateArray())
            {
                try
                {
                    if (!IsAppointmentsServiceItem(obj))
                    {
                        result.Skipped++;
                        continue;
                    }

                    result.TotalFetched++;
                    var itemId = obj.GetProperty("id").GetString();
                    if (string.IsNullOrWhiteSpace(itemId) || !obj.TryGetProperty("item_data", out var itemData))
                    {
                        result.Skipped++;
                        continue;
                    }

                    var itemName = GetString(itemData, "name") ?? "Square Service";
                    var itemDescription = GetString(itemData, "description");
                    var category = GetString(itemData, "category_id");

                    if (!itemData.TryGetProperty("variations", out var variations) || variations.GetArrayLength() == 0)
                    {
                        await UpsertServiceFromSquareVariationAsync(
                            brandId, itemId, null, itemName, itemDescription, category, null, result, ct);
                        continue;
                    }

                    foreach (var variation in variations.EnumerateArray())
                    {
                        await UpsertServiceFromSquareVariationAsync(
                            brandId, itemId, variation, itemName, itemDescription, category, variations.GetArrayLength() > 1 ? itemName : null, result, ct);
                    }
                }
                catch (Exception ex)
                {
                    result.Errors++;
                    result.ErrorMessages.Add($"Catalog item error: {ex.Message}");
                }
            }

            await _db.SaveChangesAsync(ct);
            cursor = doc.RootElement.TryGetProperty("cursor", out var c) ? c.GetString() : null;
        } while (cursor is not null);

        return result;
    }

    public async Task<SquareServicePushResult> PushServiceToSquareAsync(Guid serviceId, CancellationToken ct = default)
    {
        ConfigureSquareHeaders();

        var service = await _db.ServiceOfferings.FirstOrDefaultAsync(s => s.Id == serviceId && !s.IsDeleted, ct);
        if (service is null)
            return new SquareServicePushResult { Success = false, Error = "Service not found" };

        try
        {
            var existing = !string.IsNullOrWhiteSpace(service.ExternalSquareItemId)
                ? await RetrieveCatalogObjectNodeAsync(service.ExternalSquareItemId, ct)
                : null;

            var itemId = service.ExternalSquareItemId ?? $"#service-{service.Id:N}";
            var variationId = service.ExternalSquareVariationId ?? $"#variation-{service.Id:N}";
            var catalogObject = BuildSquareServiceCatalogObject(service, itemId, variationId, existing);

            var body = new JsonObject
            {
                ["idempotency_key"] = Guid.NewGuid().ToString(),
                ["batches"] = new JsonArray
                {
                    new JsonObject
                    {
                        ["objects"] = new JsonArray(catalogObject)
                    }
                }
            };

            var response = await _http.PostAsync(
                $"{BaseUrl}/v2/catalog/batch-upsert",
                new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json"),
                ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Square service upsert failed: {Status} {Body}", response.StatusCode, responseBody);
                return new SquareServicePushResult { Success = false, Error = responseBody };
            }

            ApplySquareIdMappings(service, responseBody);
            await _db.SaveChangesAsync(ct);

            return new SquareServicePushResult
            {
                Success = true,
                SquareItemId = service.ExternalSquareItemId,
                SquareVariationId = service.ExternalSquareVariationId
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception pushing service {ServiceId} to Square", serviceId);
            return new SquareServicePushResult { Success = false, Error = ex.Message };
        }
    }

    public async Task<SquareServiceCatalogSyncResult> PushServiceCatalogAsync(Guid? brandId = null, CancellationToken ct = default)
    {
        var result = new SquareServiceCatalogSyncResult();
        var query = _db.ServiceOfferings.Where(s => !s.IsDeleted && s.IsActive);
        if (brandId.HasValue) query = query.Where(s => s.BrandId == brandId.Value);

        var services = await query.OrderBy(s => s.SortOrder).ThenBy(s => s.Name).ToListAsync(ct);
        foreach (var service in services)
        {
            var push = await PushServiceToSquareAsync(service.Id, ct);
            if (push.Success)
            {
                result.Pushed++;
            }
            else
            {
                result.Errors++;
                result.ErrorMessages.Add($"{service.Name}: {push.Error}");
            }
        }

        return result;
    }

    public async Task<SquareServiceDeleteResult> DeleteServiceFromSquareAsync(ServiceOffering service, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(service.ExternalSquareItemId))
            return new SquareServiceDeleteResult { Success = true };

        ConfigureSquareHeaders();

        var response = await _http.DeleteAsync($"{BaseUrl}/v2/catalog/object/{service.ExternalSquareItemId}", ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Square service delete failed: {Status} {Body}", response.StatusCode, body);
            return new SquareServiceDeleteResult
            {
                Success = false,
                SquareItemId = service.ExternalSquareItemId,
                Error = body
            };
        }

        var deletedItemId = service.ExternalSquareItemId;
        service.ExternalSquareItemId = null;
        service.ExternalSquareVariationId = null;
        await _db.SaveChangesAsync(ct);

        return new SquareServiceDeleteResult { Success = true, SquareItemId = deletedItemId };
    }

    public Task<bool> ValidateWebhookSignatureAsync(string rawPayload, string squareSignature, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(WebhookSignatureKey))
        {
            _logger.LogWarning("Square webhook signature key not configured — skipping validation");
            return Task.FromResult(true); // In production, you should return false here
        }

        try
        {
            // Square webhook HMAC-SHA256 signature validation
            // notificationUrl + rawPayload is signed with the signature key
            var notificationUrl = _config["Square:WebhookNotificationUrl"] ?? "";
            var toSign = notificationUrl + rawPayload;

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(WebhookSignatureKey));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(toSign));
            var computed = Convert.ToBase64String(hash);

            return Task.FromResult(computed == squareSignature);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Square webhook signature");
            return Task.FromResult(false);
        }
    }

    private void ConfigureSquareHeaders()
    {
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", AccessToken);
        _http.DefaultRequestHeaders.Remove("Square-Version");
        _http.DefaultRequestHeaders.Add("Square-Version", SquareVersion);
    }

    private static bool IsAppointmentsServiceItem(JsonElement obj)
    {
        return obj.TryGetProperty("item_data", out var itemData)
            && itemData.TryGetProperty("product_type", out var productType)
            && productType.GetString()?.Equals("APPOINTMENTS_SERVICE", StringComparison.OrdinalIgnoreCase) == true;
    }

    private async Task UpsertServiceFromSquareVariationAsync(
        Guid brandId,
        string itemId,
        JsonElement? variation,
        string itemName,
        string? itemDescription,
        string? category,
        string? multiVariationItemName,
        SquareServiceCatalogSyncResult result,
        CancellationToken ct)
    {
        string? variationId = null;
        string? variationName = null;
        decimal? price = null;
        string currency = "USD";
        int? durationMinutes = null;
        var priceType = PriceType.Variable;

        if (variation.HasValue)
        {
            var v = variation.Value;
            variationId = GetString(v, "id");
            if (v.TryGetProperty("item_variation_data", out var variationData))
            {
                variationName = GetString(variationData, "name");
                var pricingType = GetString(variationData, "pricing_type");
                priceType = pricingType == "FIXED_PRICING" ? PriceType.Fixed : PriceType.Variable;

                if (variationData.TryGetProperty("price_money", out var priceMoney))
                {
                    price = GetLong(priceMoney, "amount") / 100m;
                    currency = GetString(priceMoney, "currency") ?? "USD";
                }

                var durationMs = GetLong(variationData, "service_duration");
                if (durationMs > 0)
                    durationMinutes = (int)Math.Round(durationMs / 60000m);
            }
        }

        var serviceName = BuildImportedServiceName(itemName, variationName, multiVariationItemName);
        var service = await _db.ServiceOfferings.FirstOrDefaultAsync(s =>
            s.ExternalSquareVariationId == variationId && variationId != null, ct);

        service ??= await _db.ServiceOfferings.FirstOrDefaultAsync(s =>
            s.ExternalSquareItemId == itemId && s.ExternalSquareVariationId == null && variationId == null, ct);

        if (service is null)
        {
            service = new ServiceOffering
            {
                BrandId = brandId,
                Name = serviceName,
                Slug = await UniqueServiceSlugAsync(brandId, GenerateSlug(serviceName), ct),
                SortOrder = await _db.ServiceOfferings.Where(s => s.BrandId == brandId).CountAsync(ct)
            };
            await _db.ServiceOfferings.AddAsync(service, ct);
            result.Inserted++;
        }
        else
        {
            result.Updated++;
        }

        service.BrandId = brandId;
        service.Name = serviceName;
        service.Description = itemDescription;
        service.ShortDescription ??= itemDescription;
        service.Category = category;
        service.PriceType = priceType;
        service.Price = price;
        service.Currency = currency;
        service.DurationMinutes = durationMinutes;
        service.IsActive = true;
        service.IsBookable = true;
        service.ExternalSquareItemId = itemId;
        service.ExternalSquareVariationId = variationId;
    }

    private async Task<JsonObject?> RetrieveCatalogObjectNodeAsync(string objectId, CancellationToken ct)
    {
        var response = await _http.GetAsync($"{BaseUrl}/v2/catalog/object/{objectId}", ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
            return null;

        var root = JsonNode.Parse(body)?.AsObject();
        return root?["object"]?.AsObject();
    }

    private static JsonObject BuildSquareServiceCatalogObject(ServiceOffering service, string itemId, string variationId, JsonObject? existing)
    {
        var item = existing?.DeepClone().AsObject() ?? new JsonObject
        {
            ["type"] = "ITEM",
            ["id"] = itemId,
            ["present_at_all_locations"] = true,
            ["item_data"] = new JsonObject()
        };

        item["type"] = "ITEM";
        item["id"] = itemId;
        item["present_at_all_locations"] = true;

        var itemData = item["item_data"]?.AsObject();
        if (itemData is null)
        {
            itemData = new JsonObject();
            item["item_data"] = itemData;
        }

        itemData["name"] = service.Name;
        itemData["description"] = service.Description ?? service.ShortDescription;
        itemData["product_type"] = "APPOINTMENTS_SERVICE";

        var variations = itemData["variations"]?.AsArray();
        if (variations is null)
        {
            variations = new JsonArray();
            itemData["variations"] = variations;
        }

        var variation = FindVariation(variations, service.ExternalSquareVariationId) ?? variations.FirstOrDefault()?.AsObject();
        if (variation is null)
        {
            variation = new JsonObject
            {
                ["type"] = "ITEM_VARIATION",
                ["id"] = variationId,
                ["present_at_all_locations"] = true,
                ["item_variation_data"] = new JsonObject()
            };
            variations.Add(variation);
        }
        else if (string.IsNullOrWhiteSpace(service.ExternalSquareVariationId))
        {
            variationId = variation["id"]?.GetValue<string>() ?? variationId;
        }

        variation["type"] = "ITEM_VARIATION";
        variation["id"] = variationId;
        variation["present_at_all_locations"] = true;

        var variationData = variation["item_variation_data"]?.AsObject();
        if (variationData is null)
        {
            variationData = new JsonObject();
            variation["item_variation_data"] = variationData;
        }

        variationData["item_id"] = itemId;
        variationData["name"] = service.Name;
        variationData["available_for_booking"] = service.IsBookable;
        variationData["pricing_type"] = service.PriceType == PriceType.Fixed && service.Price.HasValue
            ? "FIXED_PRICING"
            : "VARIABLE_PRICING";

        if (service.PriceType == PriceType.Fixed && service.Price.HasValue)
        {
            variationData["price_money"] = new JsonObject
            {
                ["amount"] = (long)Math.Round(service.Price.Value * 100m),
                ["currency"] = service.Currency
            };
        }
        else
        {
            variationData.Remove("price_money");
        }

        if (service.DurationMinutes.HasValue)
            variationData["service_duration"] = service.DurationMinutes.Value * 60000L;

        return item;
    }

    private static JsonObject? FindVariation(JsonArray variations, string? variationId)
    {
        if (string.IsNullOrWhiteSpace(variationId)) return null;
        foreach (var node in variations)
        {
            var variation = node?.AsObject();
            if (variation?["id"]?.GetValue<string>() == variationId)
                return variation;
        }

        return null;
    }

    private static void ApplySquareIdMappings(ServiceOffering service, string responseBody)
    {
        using var doc = JsonDocument.Parse(responseBody);
        if (doc.RootElement.TryGetProperty("id_mappings", out var mappings))
        {
            foreach (var mapping in mappings.EnumerateArray())
            {
                var clientId = GetString(mapping, "client_object_id");
                var objectId = GetString(mapping, "object_id");
                if (clientId is null || objectId is null) continue;
                if (clientId.StartsWith("#service-", StringComparison.Ordinal))
                    service.ExternalSquareItemId = objectId;
                if (clientId.StartsWith("#variation-", StringComparison.Ordinal))
                    service.ExternalSquareVariationId = objectId;
            }
        }

        if ((string.IsNullOrWhiteSpace(service.ExternalSquareItemId) || string.IsNullOrWhiteSpace(service.ExternalSquareVariationId))
            && doc.RootElement.TryGetProperty("objects", out var objects))
        {
            foreach (var obj in objects.EnumerateArray())
            {
                if (GetString(obj, "type") == "ITEM")
                {
                    service.ExternalSquareItemId ??= GetString(obj, "id");
                    if (obj.TryGetProperty("item_data", out var itemData)
                        && itemData.TryGetProperty("variations", out var variations)
                        && variations.GetArrayLength() > 0)
                    {
                        service.ExternalSquareVariationId ??= GetString(variations[0], "id");
                    }
                }
            }
        }
    }

    private async Task<string> UniqueServiceSlugAsync(Guid brandId, string baseSlug, CancellationToken ct)
    {
        var slug = baseSlug;
        var counter = 1;
        while (await _db.ServiceOfferings.AnyAsync(s => s.BrandId == brandId && s.Slug == slug, ct))
            slug = $"{baseSlug}-{counter++}";
        return slug;
    }

    private static string BuildImportedServiceName(string itemName, string? variationName, string? multiVariationItemName)
    {
        if (string.IsNullOrWhiteSpace(variationName) || variationName.Equals("Regular", StringComparison.OrdinalIgnoreCase))
            return itemName;
        return multiVariationItemName is null ? variationName : $"{multiVariationItemName} - {variationName}";
    }

    private static string GenerateSlug(string name) =>
        System.Text.RegularExpressions.Regex.Replace(
            name.ToLowerInvariant().Trim().Replace("'", "").Replace("\"", "").Replace(" ", "-"),
            @"[^a-z0-9\-]", "").Trim('-');

    private static string? GetString(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var property) && property.ValueKind != JsonValueKind.Null
            ? property.GetString()
            : null;

    private static long GetLong(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.Number
            ? property.GetInt64()
            : 0L;
}
