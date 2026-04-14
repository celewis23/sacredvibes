using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Bookings.DTOs;
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
    public OfferingsController(AppDbContext db) => _db = db;

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
        return Ok(ApiResponse<List<ServiceOfferingDto>>.Ok(services.Select(MapService).ToList()));
    }

    [HttpGet("services/{id:guid}")]
    public async Task<ActionResult<ApiResponse<ServiceOfferingDto>>> GetService(Guid id, CancellationToken ct = default)
    {
        var s = await _db.ServiceOfferings.FindAsync([id], ct);
        return s is null ? NotFound() : Ok(ApiResponse<ServiceOfferingDto>.Ok(MapService(s)));
    }

    [HttpPost("services")]
    public async Task<ActionResult<ApiResponse<ServiceOfferingDto>>> CreateService(
        [FromBody] SaveServiceRequest req, CancellationToken ct = default)
    {
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

        service.Name = req.Name;
        if (!string.IsNullOrWhiteSpace(req.Slug)) service.Slug = req.Slug;
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
        service.SortOrder = req.SortOrder;
        service.SeoTitle = req.SeoTitle;
        service.SeoDescription = req.SeoDescription;

        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<ServiceOfferingDto>.Ok(MapService(service)));
    }

    [HttpDelete("services/{id:guid}")]
    public async Task<ActionResult> DeleteService(Guid id, CancellationToken ct = default)
    {
        var service = await _db.ServiceOfferings.FindAsync([id], ct);
        if (service is null) return NotFound();
        service.IsDeleted = true;
        service.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
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
            ExternalUrl = req.ExternalUrl, SeoTitle = req.SeoTitle, SeoDescription = req.SeoDescription
        };

        await _db.EventOfferings.AddAsync(ev, ct);
        await _db.SaveChangesAsync(ct);
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
        ev.SeoTitle = req.SeoTitle;
        ev.SeoDescription = req.SeoDescription;

        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<EventOfferingDto>.Ok(MapEvent(ev)));
    }

    [HttpDelete("events/{id:guid}")]
    public async Task<ActionResult> DeleteEvent(Guid id, CancellationToken ct = default)
    {
        var ev = await _db.EventOfferings.FindAsync([id], ct);
        if (ev is null) return NotFound();
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

    private static ServiceOfferingDto MapService(ServiceOffering s) => new()
    {
        Id = s.Id, BrandId = s.BrandId, Name = s.Name, Slug = s.Slug,
        ShortDescription = s.ShortDescription, Description = s.Description, Category = s.Category,
        PriceType = s.PriceType, Price = s.Price, PriceMin = s.PriceMin, PriceMax = s.PriceMax,
        Currency = s.Currency, DurationMinutes = s.DurationMinutes, Location = s.Location,
        IsVirtual = s.IsVirtual, IsBookable = s.IsBookable, IsActive = s.IsActive, SortOrder = s.SortOrder
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
        IsSoundOnTheRiver = e.IsSoundOnTheRiver, InstructorName = e.InstructorName
    };
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
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
}
