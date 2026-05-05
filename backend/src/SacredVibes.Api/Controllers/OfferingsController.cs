using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Bookings.DTOs;
using SacredVibes.Application.Features.Events;
using SacredVibes.Application.Features.Payments;
using SacredVibes.Domain.Entities;
using SacredVibes.Domain.Enums;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/offerings")]
[Authorize]
public class OfferingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ISquareService _square;
    private readonly IEventbriteService _eventbrite;
    private readonly IConfiguration _config;

    public OfferingsController(AppDbContext db, ISquareService square, IEventbriteService eventbrite, IConfiguration config)
    {
        _db = db;
        _square = square;
        _eventbrite = eventbrite;
        _config = config;
    }

    // ── Services ─────────────────────────────────────────────────────────────

    [HttpGet("services")]
    public async Task<ActionResult<ApiResponse<List<ServiceOfferingDto>>>> GetServices(
        [FromQuery] Guid? brandId,
        [FromQuery] bool includeInactive = true,
        CancellationToken ct = default)
    {
        var query = _db.ServiceOfferings.AsQueryable();
        if (brandId.HasValue) query = query.Where(s => s.BrandId == brandId);
        if (!includeInactive) query = query.Where(s => s.IsActive);

        var services = await query.OrderBy(s => s.SortOrder).ThenBy(s => s.Name).ToListAsync(ct);
        var imageUrls = await GetAssetUrlsAsync(services.Select(s => s.FeaturedImageAssetId), ct);
        return Ok(ApiResponse<List<ServiceOfferingDto>>.Ok(services.Select(s => MapService(s, imageUrls)).ToList()));
    }

    [HttpGet("services/{id:guid}")]
    public async Task<ActionResult<ApiResponse<ServiceOfferingDto>>> GetService(Guid id, CancellationToken ct = default)
    {
        var s = await _db.ServiceOfferings.FindAsync([id], ct);
        if (s is null) return NotFound();

        var imageUrls = await GetAssetUrlsAsync([s.FeaturedImageAssetId], ct);
        return Ok(ApiResponse<ServiceOfferingDto>.Ok(MapService(s, imageUrls)));
    }

    [HttpPost("services")]
    public async Task<ActionResult<ApiResponse<ServiceOfferingDto>>> CreateService(
        [FromBody] SaveServiceRequest req, CancellationToken ct = default)
    {
        if (!await _db.Brands.AnyAsync(b => b.Id == req.BrandId && !b.IsDeleted, ct))
            return BadRequest(ApiResponse<ServiceOfferingDto>.Fail("Choose a valid brand for this service."));
        if (!await IsValidFeaturedImageAsync(req.FeaturedImageAssetId, ct))
            return BadRequest(ApiResponse<ServiceOfferingDto>.Fail("Choose a valid image from the media library."));

        var slug = await UniqueSlug(req.Slug ?? GenerateSlug(req.Name),
            s => _db.ServiceOfferings.AnyAsync(x => x.BrandId == req.BrandId && x.Slug == s, ct));

        var service = new ServiceOffering
        {
            BrandId = req.BrandId, Name = req.Name, Slug = slug,
            ShortDescription = req.ShortDescription, Description = req.Description,
            Category = req.Category, PriceType = req.PriceType,
            Price = req.Price, PriceMin = req.PriceMin, PriceMax = req.PriceMax,
            Currency = req.Currency ?? "USD", DurationMinutes = req.DurationMinutes,
            Location = req.Location, IsVirtual = req.IsVirtual,
            IsBookable = req.IsBookable, IsActive = req.IsActive,
            FeaturedImageAssetId = req.FeaturedImageAssetId,
            SortOrder = req.SortOrder, SeoTitle = req.SeoTitle, SeoDescription = req.SeoDescription
        };

        await _db.ServiceOfferings.AddAsync(service, ct);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetService), new { id = service.Id },
            ApiResponse<ServiceOfferingDto>.Ok(MapService(service)));
    }

    [HttpPut("services/{id:guid}")]
    public async Task<ActionResult<ApiResponse<ServiceOfferingDto>>> UpdateService(
        Guid id, [FromBody] SaveServiceRequest req, CancellationToken ct = default)
    {
        var service = await _db.ServiceOfferings.FindAsync([id], ct);
        if (service is null) return NotFound();

        if (!await _db.Brands.AnyAsync(b => b.Id == req.BrandId && !b.IsDeleted, ct))
            return BadRequest(ApiResponse<ServiceOfferingDto>.Fail("Choose a valid brand for this service."));
        if (!await IsValidFeaturedImageAsync(req.FeaturedImageAssetId, ct))
            return BadRequest(ApiResponse<ServiceOfferingDto>.Fail("Choose a valid image from the media library."));

        var nextSlug = !string.IsNullOrWhiteSpace(req.Slug) ? req.Slug : service.Slug;
        if (service.BrandId != req.BrandId || !nextSlug.Equals(service.Slug, StringComparison.OrdinalIgnoreCase))
        {
            nextSlug = await UniqueSlug(nextSlug,
                s => _db.ServiceOfferings.AnyAsync(x => x.Id != id && x.BrandId == req.BrandId && x.Slug == s, ct));
        }

        service.BrandId = req.BrandId;
        service.Name = req.Name;
        service.Slug = nextSlug;
        service.ShortDescription = req.ShortDescription;
        service.Description = req.Description;
        service.Category = req.Category;
        service.PriceType = req.PriceType;
        service.Price = req.Price;
        service.PriceMin = req.PriceMin;
        service.PriceMax = req.PriceMax;
        service.Currency = req.Currency ?? "USD";
        service.DurationMinutes = req.DurationMinutes;
        service.Location = req.Location;
        service.IsVirtual = req.IsVirtual;
        service.IsBookable = req.IsBookable;
        service.IsActive = req.IsActive;
        service.FeaturedImageAssetId = req.FeaturedImageAssetId;
        service.SortOrder = req.SortOrder;
        service.SeoTitle = req.SeoTitle;
        service.SeoDescription = req.SeoDescription;

        await _db.SaveChangesAsync(ct);
        var imageUrls = await GetAssetUrlsAsync([service.FeaturedImageAssetId], ct);
        return Ok(ApiResponse<ServiceOfferingDto>.Ok(MapService(service, imageUrls)));
    }

    [HttpDelete("services/{id:guid}")]
    public async Task<ActionResult> DeleteService(
        Guid id,
        [FromQuery] bool deleteFromSquare = false,
        CancellationToken ct = default)
    {
        var service = await _db.ServiceOfferings.FindAsync([id], ct);
        if (service is null) return NotFound();

        if (deleteFromSquare)
        {
            var squareDelete = await _square.DeleteServiceFromSquareAsync(service, ct);
            if (!squareDelete.Success)
                return BadRequest(ApiResponse<object>.Fail(squareDelete.Error ?? "Square delete failed"));
        }

        service.IsDeleted = true;
        service.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Eventbrite Events ────────────────────────────────────────────────────

    [HttpGet("events/eventbrite-diagnostics")]
    public async Task<ActionResult<ApiResponse<EventbriteDiagnosticsResult>>> GetEventbriteDiagnostics(
        CancellationToken ct = default)
    {
        var result = await _eventbrite.GetDiagnosticsAsync(ct);
        return Ok(ApiResponse<EventbriteDiagnosticsResult>.Ok(result));
    }

    [HttpPost("events/import-eventbrite")]
    public async Task<ActionResult<ApiResponse<EventbriteEventSyncResult>>> ImportEventbriteEvents(
        [FromQuery] Guid brandId,
        CancellationToken ct = default)
    {
        if (brandId == Guid.Empty)
            return BadRequest(ApiResponse<EventbriteEventSyncResult>.Fail("Choose the brand these Eventbrite events should belong to."));

        var result = await _eventbrite.ImportEventsAsync(brandId, ct);
        return Ok(ApiResponse<EventbriteEventSyncResult>.Ok(result));
    }

    [HttpPost("events/push-eventbrite")]
    public async Task<ActionResult<ApiResponse<EventbriteEventSyncResult>>> PushEventbriteEvents(
        [FromQuery] Guid? brandId,
        CancellationToken ct = default)
    {
        var result = await _eventbrite.PushEventsAsync(brandId, ct);
        return Ok(ApiResponse<EventbriteEventSyncResult>.Ok(result));
    }

    [HttpPost("events/sync-eventbrite")]
    public async Task<ActionResult<ApiResponse<EventbriteEventSyncResult>>> SyncEventbriteEvents(
        [FromQuery] Guid brandId,
        CancellationToken ct = default)
    {
        if (brandId == Guid.Empty)
            return BadRequest(ApiResponse<EventbriteEventSyncResult>.Fail("Choose the brand these Eventbrite events should belong to."));

        var imported = await _eventbrite.ImportEventsAsync(brandId, ct);
        var pushed = await _eventbrite.PushEventsAsync(brandId, ct);

        imported.Pushed = pushed.Pushed;
        imported.Errors += pushed.Errors;
        imported.ErrorMessages.AddRange(pushed.ErrorMessages);
        return Ok(ApiResponse<EventbriteEventSyncResult>.Ok(imported));
    }

    [HttpPost("events/{id:guid}/push-eventbrite")]
    public async Task<ActionResult<ApiResponse<EventbriteEventPushResult>>> PushEventbriteEvent(
        Guid id,
        CancellationToken ct = default)
    {
        var result = await _eventbrite.PushEventAsync(id, ct);
        if (!result.Success)
            return BadRequest(ApiResponse<EventbriteEventPushResult>.Fail(result.Error ?? "Eventbrite push failed"));

        return Ok(ApiResponse<EventbriteEventPushResult>.Ok(result));
    }

    [HttpPost("services/import-square")]
    public async Task<ActionResult<ApiResponse<SquareServiceCatalogSyncResult>>> ImportSquareServices(
        [FromQuery] Guid brandId,
        CancellationToken ct = default)
    {
        if (brandId == Guid.Empty)
            return BadRequest(ApiResponse<SquareServiceCatalogSyncResult>.Fail("Choose the brand these Square services should belong to."));

        var result = await _square.ImportServiceCatalogAsync(brandId, ct);
        return Ok(ApiResponse<SquareServiceCatalogSyncResult>.Ok(result));
    }

    [HttpPost("services/push-square")]
    public async Task<ActionResult<ApiResponse<SquareServiceCatalogSyncResult>>> PushSquareServices(
        [FromQuery] Guid? brandId,
        CancellationToken ct = default)
    {
        var result = await _square.PushServiceCatalogAsync(brandId, ct);
        return Ok(ApiResponse<SquareServiceCatalogSyncResult>.Ok(result));
    }

    [HttpPost("services/sync-square")]
    public async Task<ActionResult<ApiResponse<SquareServiceCatalogSyncResult>>> SyncSquareServices(
        [FromQuery] Guid brandId,
        CancellationToken ct = default)
    {
        if (brandId == Guid.Empty)
            return BadRequest(ApiResponse<SquareServiceCatalogSyncResult>.Fail("Choose the brand these Square services should belong to."));

        var imported = await _square.ImportServiceCatalogAsync(brandId, ct);
        var pushed = await _square.PushServiceCatalogAsync(brandId, ct);

        imported.Pushed = pushed.Pushed;
        imported.Errors += pushed.Errors;
        imported.ErrorMessages.AddRange(pushed.ErrorMessages);
        return Ok(ApiResponse<SquareServiceCatalogSyncResult>.Ok(imported));
    }

    [HttpPost("services/{id:guid}/push-square")]
    public async Task<ActionResult<ApiResponse<SquareServicePushResult>>> PushSquareService(
        Guid id,
        CancellationToken ct = default)
    {
        var result = await _square.PushServiceToSquareAsync(id, ct);
        if (!result.Success)
            return BadRequest(ApiResponse<SquareServicePushResult>.Fail(result.Error ?? "Square push failed"));

        return Ok(ApiResponse<SquareServicePushResult>.Ok(result));
    }

    // ── Events ────────────────────────────────────────────────────────────────

    [HttpGet("events")]
    public async Task<ActionResult<ApiResponse<List<EventOfferingDto>>>> GetEvents(
        [FromQuery] Guid? brandId,
        [FromQuery] bool includeInactive = true,
        [FromQuery] bool upcomingOnly = false,
        CancellationToken ct = default)
    {
        var query = _db.EventOfferings.AsQueryable();
        if (brandId.HasValue) query = query.Where(e => e.BrandId == brandId);
        if (!includeInactive) query = query.Where(e => e.IsActive);
        if (upcomingOnly) query = query.Where(e => e.StartAt >= DateTime.UtcNow);

        var events = await query.OrderByDescending(e => e.StartAt).ToListAsync(ct);
        return Ok(ApiResponse<List<EventOfferingDto>>.Ok(events.Select(MapEvent).ToList()));
    }

    [HttpGet("events/{id:guid}")]
    public async Task<ActionResult<ApiResponse<EventOfferingDto>>> GetEvent(Guid id, CancellationToken ct = default)
    {
        var ev = await _db.EventOfferings.FindAsync([id], ct);
        return ev is null ? NotFound() : Ok(ApiResponse<EventOfferingDto>.Ok(MapEvent(ev)));
    }

    [HttpPost("events")]
    public async Task<ActionResult<ApiResponse<EventOfferingDto>>> CreateEvent(
        [FromBody] SaveEventRequest req, CancellationToken ct = default)
    {
        var slug = await UniqueSlug(req.Slug ?? GenerateSlug(req.Name),
            s => _db.EventOfferings.AnyAsync(x => x.BrandId == req.BrandId && x.Slug == s, ct));

        var ev = new EventOffering
        {
            BrandId = req.BrandId, Name = req.Name, Slug = slug,
            ShortDescription = req.ShortDescription, Description = req.Description,
            Category = req.Category, StartAt = req.StartAt, EndAt = req.EndAt,
            TimeZone = req.TimeZone ?? "America/New_York",
            Venue = req.Venue, Address = req.Address, City = req.City, State = req.State,
            IsVirtual = req.IsVirtual, VirtualUrl = req.VirtualUrl,
            Capacity = req.Capacity, PriceType = req.PriceType,
            Price = req.Price, Currency = req.Currency ?? "USD",
            IsBookable = req.IsBookable, IsActive = req.IsActive,
            IsFeatured = req.IsFeatured, IsSoundOnTheRiver = req.IsSoundOnTheRiver,
            InstructorName = req.InstructorName, InstructorBio = req.InstructorBio,
            ExternalUrl = req.ExternalUrl, ExternalEventbriteId = req.ExternalEventbriteId,
            SeoTitle = req.SeoTitle, SeoDescription = req.SeoDescription
        };

        await _db.EventOfferings.AddAsync(ev, ct);
        await _db.SaveChangesAsync(ct);

        var eventbriteResult = await PushToEventbriteIfEnabledAsync(ev.Id, ct);
        if (eventbriteResult is { Success: false })
            return BadRequest(ApiResponse<EventOfferingDto>.Fail($"Event created locally, but Eventbrite push failed: {eventbriteResult.Error}"));

        return CreatedAtAction(nameof(GetEvent), new { id = ev.Id },
            ApiResponse<EventOfferingDto>.Ok(MapEvent(ev)));
    }

    [HttpPut("events/{id:guid}")]
    public async Task<ActionResult<ApiResponse<EventOfferingDto>>> UpdateEvent(
        Guid id, [FromBody] SaveEventRequest req, CancellationToken ct = default)
    {
        var ev = await _db.EventOfferings.FindAsync([id], ct);
        if (ev is null) return NotFound();

        ev.Name = req.Name;
        if (!string.IsNullOrWhiteSpace(req.Slug)) ev.Slug = req.Slug;
        ev.ShortDescription = req.ShortDescription;
        ev.Description = req.Description;
        ev.Category = req.Category;
        ev.StartAt = req.StartAt;
        ev.EndAt = req.EndAt;
        ev.TimeZone = req.TimeZone ?? "America/New_York";
        ev.Venue = req.Venue;
        ev.Address = req.Address;
        ev.City = req.City;
        ev.State = req.State;
        ev.IsVirtual = req.IsVirtual;
        ev.VirtualUrl = req.VirtualUrl;
        ev.Capacity = req.Capacity;
        ev.PriceType = req.PriceType;
        ev.Price = req.Price;
        ev.Currency = req.Currency ?? "USD";
        ev.IsBookable = req.IsBookable;
        ev.IsActive = req.IsActive;
        ev.IsFeatured = req.IsFeatured;
        ev.IsSoundOnTheRiver = req.IsSoundOnTheRiver;
        ev.InstructorName = req.InstructorName;
        ev.InstructorBio = req.InstructorBio;
        ev.ExternalUrl = req.ExternalUrl;
        ev.ExternalEventbriteId = req.ExternalEventbriteId ?? ev.ExternalEventbriteId;
        ev.SeoTitle = req.SeoTitle;
        ev.SeoDescription = req.SeoDescription;

        await _db.SaveChangesAsync(ct);

        var eventbriteResult = await PushToEventbriteIfEnabledAsync(ev.Id, ct);
        if (eventbriteResult is { Success: false })
            return BadRequest(ApiResponse<EventOfferingDto>.Fail($"Event updated locally, but Eventbrite push failed: {eventbriteResult.Error}"));

        return Ok(ApiResponse<EventOfferingDto>.Ok(MapEvent(ev)));
    }

    [HttpDelete("events/{id:guid}")]
    public async Task<ActionResult> DeleteEvent(
        Guid id,
        [FromQuery] bool deleteFromEventbrite = false,
        CancellationToken ct = default)
    {
        var ev = await _db.EventOfferings.FindAsync([id], ct);
        if (ev is null) return NotFound();

        if (deleteFromEventbrite)
        {
            var eventbriteDelete = await _eventbrite.DeleteEventAsync(ev, ct);
            if (!eventbriteDelete.Success)
                return BadRequest(ApiResponse<object>.Fail(eventbriteDelete.Error ?? "Eventbrite delete failed"));
        }

        ev.IsDeleted = true;
        ev.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static string GenerateSlug(string name) =>
        System.Text.RegularExpressions.Regex.Replace(
            name.ToLowerInvariant().Trim().Replace("'", "").Replace("\"", "").Replace(" ", "-"),
            @"[^a-z0-9\-]", "").Trim('-');

    private static async Task<string> UniqueSlug(string baseSlug, Func<string, Task<bool>> exists)
    {
        var slug = baseSlug;
        var counter = 1;
        while (await exists(slug)) slug = $"{baseSlug}-{counter++}";
        return slug;
    }

    private async Task<Dictionary<Guid, string?>> GetAssetUrlsAsync(IEnumerable<Guid?> assetIds, CancellationToken ct)
    {
        var ids = assetIds.Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
        if (ids.Count == 0) return new Dictionary<Guid, string?>();

        return await _db.Assets
            .Where(a => ids.Contains(a.Id) && !a.IsDeleted)
            .ToDictionaryAsync(a => a.Id, a => a.PublicUrl, ct);
    }

    private async Task<bool> IsValidFeaturedImageAsync(Guid? assetId, CancellationToken ct)
    {
        return !assetId.HasValue || await _db.Assets.AnyAsync(a => a.Id == assetId.Value && a.AssetType == AssetType.Image && !a.IsDeleted, ct);
    }

    private static ServiceOfferingDto MapService(ServiceOffering s, IReadOnlyDictionary<Guid, string?>? imageUrls = null) => new()
    {
        Id = s.Id, BrandId = s.BrandId, Name = s.Name, Slug = s.Slug,
        ShortDescription = s.ShortDescription, Description = s.Description, Category = s.Category,
        PriceType = s.PriceType, Price = s.Price, PriceMin = s.PriceMin, PriceMax = s.PriceMax,
        Currency = s.Currency, DurationMinutes = s.DurationMinutes, Location = s.Location,
        IsVirtual = s.IsVirtual, IsBookable = s.IsBookable, IsActive = s.IsActive, SortOrder = s.SortOrder,
        FeaturedImageAssetId = s.FeaturedImageAssetId,
        FeaturedImageUrl = s.FeaturedImageAssetId.HasValue && imageUrls?.TryGetValue(s.FeaturedImageAssetId.Value, out var url) == true ? url : null,
        ExternalSquareItemId = s.ExternalSquareItemId, ExternalSquareVariationId = s.ExternalSquareVariationId
    };

    private static EventOfferingDto MapEvent(EventOffering e) => new()
    {
        Id = e.Id, BrandId = e.BrandId, Name = e.Name, Slug = e.Slug,
        ShortDescription = e.ShortDescription, Description = e.Description, Category = e.Category,
        StartAt = e.StartAt, EndAt = e.EndAt, TimeZone = e.TimeZone,
        Venue = e.Venue, Address = e.Address, City = e.City, State = e.State,
        IsVirtual = e.IsVirtual, VirtualUrl = e.VirtualUrl,
        Capacity = e.Capacity, RegisteredCount = e.RegisteredCount,
        PriceType = e.PriceType, Price = e.Price, Currency = e.Currency,
        IsBookable = e.IsBookable, IsActive = e.IsActive, IsFeatured = e.IsFeatured,
        IsSoldOut = e.IsSoldOut || (e.Capacity.HasValue && e.RegisteredCount >= e.Capacity.Value),
        IsSoundOnTheRiver = e.IsSoundOnTheRiver, InstructorName = e.InstructorName,
        ExternalUrl = e.ExternalUrl, ExternalEventbriteId = e.ExternalEventbriteId
    };

    private async Task<EventbriteEventPushResult?> PushToEventbriteIfEnabledAsync(Guid eventId, CancellationToken ct)
    {
        if (!IsEventbriteEnabled()) return null;
        return await _eventbrite.PushEventAsync(eventId, ct);
    }

    private bool IsEventbriteEnabled()
    {
        var token = _config["Eventbrite:PrivateToken"];
        var organizationId = _config["Eventbrite:OrganizationId"];
        return !string.IsNullOrWhiteSpace(token)
            && !token.StartsWith("REPLACE_WITH", StringComparison.OrdinalIgnoreCase)
            && (string.IsNullOrWhiteSpace(organizationId) || !organizationId.StartsWith("REPLACE_WITH", StringComparison.OrdinalIgnoreCase));
    }
}

// ── Request models ────────────────────────────────────────────────────────────

public class SaveServiceRequest
{
    public Guid BrandId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public PriceType PriceType { get; set; } = PriceType.Fixed;
    public decimal? Price { get; set; }
    public decimal? PriceMin { get; set; }
    public decimal? PriceMax { get; set; }
    public string? Currency { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Location { get; set; }
    public bool IsVirtual { get; set; }
    public bool IsBookable { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public Guid? FeaturedImageAssetId { get; set; }
    public int SortOrder { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
}

public class SaveEventRequest
{
    public Guid BrandId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public string? TimeZone { get; set; }
    public string? Venue { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public bool IsVirtual { get; set; }
    public string? VirtualUrl { get; set; }
    public int? Capacity { get; set; }
    public PriceType PriceType { get; set; } = PriceType.Fixed;
    public decimal? Price { get; set; }
    public string? Currency { get; set; }
    public bool IsBookable { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; }
    public bool IsSoundOnTheRiver { get; set; }
    public string? InstructorName { get; set; }
    public string? InstructorBio { get; set; }
    public string? ExternalUrl { get; set; }
    public string? ExternalEventbriteId { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
}
