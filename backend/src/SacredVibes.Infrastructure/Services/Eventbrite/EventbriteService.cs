using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SacredVibes.Application.Features.Events;
using SacredVibes.Domain.Entities;
using SacredVibes.Domain.Enums;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services.Eventbrite;

public class EventbriteService : IEventbriteService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EventbriteService> _logger;
    private readonly AppDbContext _db;
    private readonly HttpClient _http;

    private string PrivateToken => _config["Eventbrite:PrivateToken"] ?? throw new InvalidOperationException("Eventbrite:PrivateToken not configured");
    private string? ConfiguredOrganizationId => _config["Eventbrite:OrganizationId"];
    private string? DefaultVenueId => _config["Eventbrite:DefaultVenueId"];
    private bool PublishOnCreate => bool.TryParse(_config["Eventbrite:PublishOnCreate"], out var publish) && publish;

    public EventbriteService(IConfiguration config, ILogger<EventbriteService> logger, AppDbContext db, IHttpClientFactory httpClientFactory)
    {
        _config = config;
        _logger = logger;
        _db = db;
        _http = httpClientFactory.CreateClient("Eventbrite");
        _http.BaseAddress = new Uri("https://www.eventbriteapi.com/v3/");
    }

    public async Task<EventbriteEventSyncResult> ImportEventsAsync(Guid brandId, CancellationToken ct = default)
    {
        ConfigureHeaders();

        var result = new EventbriteEventSyncResult();
        var organizationId = await ResolveOrganizationIdAsync(ct);
        string? continuation = null;

        do
        {
            var path = $"organizations/{organizationId}/events/?expand=venue&order_by=start_asc&status=all";
            if (!string.IsNullOrWhiteSpace(continuation))
            {
                path += $"&continuation={Uri.EscapeDataString(continuation)}";
            }

            var response = await _http.GetAsync(path, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound && HasConfiguredOrganizationId())
                {
                    var fallbackOrganizationId = await DiscoverOrganizationIdAsync(ct);
                    if (!string.Equals(fallbackOrganizationId, organizationId, StringComparison.Ordinal))
                    {
                        organizationId = fallbackOrganizationId;
                        continuation = null;
                        continue;
                    }
                }

                result.Errors++;
                result.ErrorMessages.Add(GetEventbriteErrorMessage("import", response, body));
                break;
            }

            var root = JsonNode.Parse(body)?.AsObject();
            var events = root?["events"]?.AsArray() ?? new JsonArray();
            result.TotalFetched += events.Count;

            foreach (var node in events.OfType<JsonObject>())
            {
                try
                {
                    await ImportOneAsync(node, brandId, result, ct);
                }
                catch (Exception ex)
                {
                    result.Errors++;
                    result.ErrorMessages.Add($"{GetString(node, "id") ?? "unknown"}: {ex.Message}");
                    _logger.LogError(ex, "Eventbrite event import failed");
                }
            }

            var pagination = root?["pagination"]?.AsObject();
            continuation = GetString(pagination, "continuation");
            var hasMore = pagination is not null && GetBool(pagination, "has_more_items") == true;
            if (!hasMore) continuation = null;
        }
        while (!string.IsNullOrWhiteSpace(continuation) && !ct.IsCancellationRequested);

        await _db.SaveChangesAsync(ct);
        return result;
    }

    public async Task<EventbriteDiagnosticsResult> GetDiagnosticsAsync(CancellationToken ct = default)
    {
        var result = new EventbriteDiagnosticsResult
        {
            TokenConfigured = HasConfiguredPrivateToken(),
            ConfiguredOrganizationId = ConfiguredOrganizationId
        };

        if (!result.TokenConfigured)
        {
            result.Error = "Eventbrite:PrivateToken is not configured.";
            return result;
        }

        try
        {
            ConfigureHeaders();

            var organizationsResponse = await _http.GetAsync("users/me/organizations/", ct);
            var organizationsBody = await organizationsResponse.Content.ReadAsStringAsync(ct);
            if (!organizationsResponse.IsSuccessStatusCode)
            {
                result.Error = GetEventbriteErrorMessage("organization diagnostics", organizationsResponse, organizationsBody);
                return result;
            }

            var organizationsRoot = JsonNode.Parse(organizationsBody)?.AsObject();
            var organizations = organizationsRoot?["organizations"]?.AsArray() ?? new JsonArray();
            result.Organizations = organizations
                .OfType<JsonObject>()
                .Select(org => new EventbriteOrganizationSummary
                {
                    Id = GetString(org, "id"),
                    Name = GetString(org, "name")
                })
                .Where(org => !string.IsNullOrWhiteSpace(org.Id))
                .ToList();
            result.OrganizationCount = result.Organizations.Count;

            result.ResolvedOrganizationId = HasConfiguredOrganizationId()
                ? ConfiguredOrganizationId!.Trim()
                : result.Organizations.FirstOrDefault()?.Id;

            if (string.IsNullOrWhiteSpace(result.ResolvedOrganizationId))
            {
                result.Error = "Eventbrite returned no organizations for this private token.";
                return result;
            }

            result.EventsEndpoint = $"organizations/{result.ResolvedOrganizationId}/events/?expand=venue&order_by=start_asc&status=all&page_size=5";
            var eventsResponse = await _http.GetAsync(result.EventsEndpoint, ct);
            var eventsBody = await eventsResponse.Content.ReadAsStringAsync(ct);
            if (!eventsResponse.IsSuccessStatusCode)
            {
                result.Error = GetEventbriteErrorMessage("event diagnostics", eventsResponse, eventsBody);
                return result;
            }

            var eventsRoot = JsonNode.Parse(eventsBody)?.AsObject();
            var events = eventsRoot?["events"]?.AsArray() ?? new JsonArray();
            result.SampleEventCount = events.Count;
            result.SampleEvents = events
                .OfType<JsonObject>()
                .Select(ev => new EventbriteEventSummary
                {
                    Id = GetString(ev, "id"),
                    Name = GetNestedString(ev, "name", "text") ?? GetNestedString(ev, "name", "html"),
                    Status = GetString(ev, "status"),
                    StartAt = ParseEventbriteDate(ev, "start"),
                    Url = GetString(ev, "url")
                })
                .ToList();
        }
        catch (Exception ex)
        {
            result.Error = ex.Message;
            _logger.LogError(ex, "Eventbrite diagnostics failed");
        }

        return result;
    }

    public async Task<EventbriteEventPushResult> PushEventAsync(Guid eventId, CancellationToken ct = default)
    {
        var ev = await _db.EventOfferings.FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted, ct);
        if (ev is null) return new EventbriteEventPushResult { Success = false, Error = "Event not found" };

        return await PushEventAsync(ev, ct);
    }

    public async Task<EventbriteEventSyncResult> PushEventsAsync(Guid? brandId = null, CancellationToken ct = default)
    {
        var result = new EventbriteEventSyncResult();
        var query = _db.EventOfferings.Where(e => !e.IsDeleted && e.IsActive);
        if (brandId.HasValue) query = query.Where(e => e.BrandId == brandId.Value);

        var events = await query.OrderBy(e => e.StartAt).ToListAsync(ct);
        foreach (var ev in events)
        {
            var pushed = await PushEventAsync(ev, ct);
            if (pushed.Success)
            {
                result.Pushed++;
            }
            else
            {
                result.Errors++;
                result.ErrorMessages.Add($"{ev.Name}: {pushed.Error ?? "Eventbrite push failed"}");
            }
        }

        return result;
    }

    public async Task<EventbriteEventDeleteResult> DeleteEventAsync(EventOffering ev, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(ev.ExternalEventbriteId))
        {
            return new EventbriteEventDeleteResult { Success = true };
        }

        ConfigureHeaders();
        var response = await _http.DeleteAsync($"events/{ev.ExternalEventbriteId}/", ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            return new EventbriteEventDeleteResult
            {
                Success = false,
                EventbriteEventId = ev.ExternalEventbriteId,
                Error = $"Eventbrite delete failed: {(int)response.StatusCode} {body}"
            };
        }

        return new EventbriteEventDeleteResult { Success = true, EventbriteEventId = ev.ExternalEventbriteId };
    }

    private async Task<EventbriteEventPushResult> PushEventAsync(EventOffering ev, CancellationToken ct)
    {
        ConfigureHeaders();

        var organizationId = await ResolveOrganizationIdAsync(ct);
        var payload = BuildEventPayload(ev);
        var path = string.IsNullOrWhiteSpace(ev.ExternalEventbriteId)
            ? $"organizations/{organizationId}/events/"
            : $"events/{ev.ExternalEventbriteId}/";

        var response = await _http.PostAsJsonAsync(path, payload, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            return new EventbriteEventPushResult
            {
                Success = false,
                EventbriteEventId = ev.ExternalEventbriteId,
                Error = GetEventbriteErrorMessage("push", response, body)
            };
        }

        var json = JsonNode.Parse(body)?.AsObject();
        ev.ExternalEventbriteId = GetString(json, "id") ?? ev.ExternalEventbriteId;
        ev.ExternalUrl = GetString(json, "url") ?? ev.ExternalUrl;

        await _db.SaveChangesAsync(ct);

        if (PublishOnCreate && !string.IsNullOrWhiteSpace(ev.ExternalEventbriteId))
        {
            await PublishAsync(ev.ExternalEventbriteId, ct);
        }

        return new EventbriteEventPushResult
        {
            Success = true,
            EventbriteEventId = ev.ExternalEventbriteId,
            EventbriteUrl = ev.ExternalUrl
        };
    }

    private async Task PublishAsync(string eventbriteEventId, CancellationToken ct)
    {
        var response = await _http.PostAsync($"events/{eventbriteEventId}/publish/", null, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Eventbrite publish failed for {EventbriteEventId}: {Status} {Body}", eventbriteEventId, response.StatusCode, body);
        }
    }

    private async Task ImportOneAsync(JsonObject source, Guid brandId, EventbriteEventSyncResult result, CancellationToken ct)
    {
        var eventbriteId = GetString(source, "id");
        if (string.IsNullOrWhiteSpace(eventbriteId))
        {
            result.Skipped++;
            return;
        }

        var name = GetNestedString(source, "name", "text") ?? GetNestedString(source, "name", "html") ?? "Untitled Event";
        var startAt = ParseEventbriteDate(source, "start") ?? DateTime.UtcNow;
        var endAt = ParseEventbriteDate(source, "end") ?? startAt.AddHours(2);

        var ev = await _db.EventOfferings.FirstOrDefaultAsync(e => e.ExternalEventbriteId == eventbriteId, ct);
        ev ??= await _db.EventOfferings.FirstOrDefaultAsync(e =>
            e.BrandId == brandId &&
            e.Name == name &&
            e.StartAt == startAt,
            ct);

        if (ev is null)
        {
            ev = new EventOffering
            {
                BrandId = brandId,
                Name = name,
                Slug = await UniqueSlugAsync(GenerateSlug(name), brandId, ct),
                IsActive = true,
                IsBookable = false
            };
            await _db.EventOfferings.AddAsync(ev, ct);
            result.Inserted++;
        }
        else
        {
            result.Updated++;
        }

        ev.ExternalEventbriteId = eventbriteId;
        ev.ExternalUrl = GetString(source, "url") ?? ev.ExternalUrl;
        ev.Name = name;
        ev.Description = GetNestedString(source, "description", "html") ?? GetNestedString(source, "description", "text") ?? ev.Description;
        ev.ShortDescription = GetString(source, "summary") ?? ev.ShortDescription;
        ev.StartAt = startAt;
        ev.EndAt = endAt;
        ev.TimeZone = GetNestedString(source, "start", "timezone") ?? ev.TimeZone ?? "America/New_York";
        ev.Capacity = GetInt(source, "capacity") ?? ev.Capacity;
        ev.IsVirtual = GetBool(source, "online_event") ?? ev.IsVirtual;
        ev.IsActive = !string.Equals(GetString(source, "status"), "canceled", StringComparison.OrdinalIgnoreCase);

        var venue = source["venue"]?.AsObject();
        if (venue is not null)
        {
            ev.Venue = GetString(venue, "name") ?? ev.Venue;
            var address = venue["address"]?.AsObject();
            ev.Address = GetString(address, "address_1") ?? ev.Address;
            ev.City = GetString(address, "city") ?? ev.City;
            ev.State = GetString(address, "region") ?? ev.State;
            ev.Zip = GetString(address, "postal_code") ?? ev.Zip;
        }
    }

    private JsonObject BuildEventPayload(EventOffering ev)
    {
        var eventObject = new JsonObject
        {
            ["name"] = new JsonObject { ["html"] = ev.Name },
            ["description"] = new JsonObject { ["html"] = ev.Description ?? ev.ShortDescription ?? ev.Name },
            ["start"] = new JsonObject
            {
                ["timezone"] = ev.TimeZone ?? "America/New_York",
                ["utc"] = ev.StartAt.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            },
            ["end"] = new JsonObject
            {
                ["timezone"] = ev.TimeZone ?? "America/New_York",
                ["utc"] = ev.EndAt.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            },
            ["currency"] = ev.Currency,
            ["online_event"] = ev.IsVirtual,
            ["listed"] = ev.IsActive,
            ["shareable"] = true
        };

        if (ev.Capacity.HasValue && ev.Capacity.Value > 0) eventObject["capacity"] = ev.Capacity.Value;
        if (!ev.IsVirtual && !string.IsNullOrWhiteSpace(DefaultVenueId)) eventObject["venue_id"] = DefaultVenueId;

        return new JsonObject { ["event"] = eventObject };
    }

    private void ConfigureHeaders()
    {
        _http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", PrivateToken);
    }

    private async Task<string> ResolveOrganizationIdAsync(CancellationToken ct)
    {
        if (HasConfiguredOrganizationId())
        {
            return ConfiguredOrganizationId!.Trim();
        }

        return await DiscoverOrganizationIdAsync(ct);
    }

    private bool HasConfiguredOrganizationId()
    {
        return !string.IsNullOrWhiteSpace(ConfiguredOrganizationId)
            && !ConfiguredOrganizationId.StartsWith("REPLACE_WITH", StringComparison.OrdinalIgnoreCase);
    }

    private bool HasConfiguredPrivateToken()
    {
        var token = _config["Eventbrite:PrivateToken"];
        return !string.IsNullOrWhiteSpace(token)
            && !token.StartsWith("REPLACE_WITH", StringComparison.OrdinalIgnoreCase);
    }

    private async Task<string> DiscoverOrganizationIdAsync(CancellationToken ct)
    {
        ConfigureHeaders();

        var response = await _http.GetAsync("users/me/organizations/", ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(GetEventbriteErrorMessage("organization lookup", response, body));
        }

        var root = JsonNode.Parse(body)?.AsObject();
        var organizations = root?["organizations"]?.AsArray() ?? new JsonArray();
        var organizationId = organizations
            .OfType<JsonObject>()
            .Select(org => GetString(org, "id"))
            .FirstOrDefault(id => !string.IsNullOrWhiteSpace(id));

        if (string.IsNullOrWhiteSpace(organizationId))
        {
            throw new InvalidOperationException("Eventbrite organization lookup returned no organizations for this private token. Confirm the token belongs to the Eventbrite account that owns the events.");
        }

        return organizationId;
    }

    private static string GetEventbriteErrorMessage(string action, HttpResponseMessage response, string body)
    {
        var details = TryGetEventbriteErrorDescription(body) ?? body;
        var hint = response.StatusCode == System.Net.HttpStatusCode.NotFound
            ? " This usually means Eventbrite__OrganizationId is not an API organization ID for this token. Clear Eventbrite__OrganizationId to auto-discover it, or set the value returned by /users/me/organizations/."
            : string.Empty;

        return $"Eventbrite {action} failed: {(int)response.StatusCode} {details}{hint}";
    }

    private static string? TryGetEventbriteErrorDescription(string body)
    {
        try
        {
            var root = JsonNode.Parse(body)?.AsObject();
            return GetString(root, "error_description") ?? GetString(root, "error");
        }
        catch
        {
            return null;
        }
    }

    private async Task<string> UniqueSlugAsync(string baseSlug, Guid brandId, CancellationToken ct)
    {
        var slug = baseSlug;
        var counter = 1;
        while (await _db.EventOfferings.AnyAsync(e => e.BrandId == brandId && e.Slug == slug, ct))
        {
            slug = $"{baseSlug}-{counter++}";
        }

        return slug;
    }

    private static string GenerateSlug(string name) =>
        System.Text.RegularExpressions.Regex.Replace(
            name.ToLowerInvariant().Trim().Replace("'", "").Replace("\"", "").Replace(" ", "-"),
            @"[^a-z0-9\-]", "").Trim('-');

    private static DateTime? ParseEventbriteDate(JsonObject source, string key)
    {
        var utc = GetNestedString(source, key, "utc");
        return DateTime.TryParse(utc, null, System.Globalization.DateTimeStyles.AssumeUniversal, out var parsed)
            ? parsed.ToUniversalTime()
            : null;
    }

    private static string? GetString(JsonObject? obj, string key)
    {
        try
        {
            return obj is not null && obj.TryGetPropertyValue(key, out var value) ? value?.GetValue<string>() : null;
        }
        catch
        {
            return null;
        }
    }

    private static string? GetNestedString(JsonObject obj, string key, string nestedKey) =>
        obj[key]?.AsObject() is { } nested ? GetString(nested, nestedKey) : null;

    private static int? GetInt(JsonObject obj, string key)
    {
        try
        {
            return obj.TryGetPropertyValue(key, out var value) && value is not null ? value.GetValue<int>() : null;
        }
        catch
        {
            return null;
        }
    }

    private static bool? GetBool(JsonObject obj, string key)
    {
        try
        {
            return obj.TryGetPropertyValue(key, out var value) && value is not null ? value.GetValue<bool>() : null;
        }
        catch
        {
            return null;
        }
    }
}
