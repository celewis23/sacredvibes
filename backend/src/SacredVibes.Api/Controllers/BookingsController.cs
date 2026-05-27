using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Bookings.DTOs;
using SacredVibes.Application.Features.Bookings.Services;
using SacredVibes.Application.Features.Payments;
using SacredVibes.Domain.Enums;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ISquareService _square;
    private readonly IBookingNotificationService _notifications;

    public BookingsController(AppDbContext db, ISquareService square, IBookingNotificationService notifications)
    {
        _db = db;
        _square = square;
        _notifications = notifications;
    }

    // ── Public: Create booking & checkout ────────────────────────────────────

    [HttpPost]
    [EnableRateLimiting("bookings")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> CreateBooking(
        [FromBody] CreateBookingRequest request, CancellationToken ct = default)
    {
        // Honeypot: bots fill this field, humans don't
        if (!string.IsNullOrEmpty(request.Website))
            return CreatedAtAction(nameof(GetBooking), new { id = Guid.NewGuid() },
                ApiResponse<BookingDto>.Ok(new BookingDto { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow }));

        // Validate service or event exists
        if (request.ServiceOfferingId.HasValue)
        {
            var service = await _db.ServiceOfferings.FindAsync([request.ServiceOfferingId.Value], ct);
            if (service is null || !service.IsActive || !service.IsBookable)
                return BadRequest(ApiResponse<BookingDto>.Fail("Service not available for booking"));
        }

        if (request.EventOfferingId.HasValue)
        {
            var ev = await _db.EventOfferings.FindAsync([request.EventOfferingId.Value], ct);
            if (ev is null || !ev.IsActive || !ev.IsBookable)
                return BadRequest(ApiResponse<BookingDto>.Fail("Event not available for booking"));

            if (ev.Capacity.HasValue && ev.RegisteredCount >= ev.Capacity.Value)
                return BadRequest(ApiResponse<BookingDto>.Fail("This event is sold out"));
        }

        var booking = new Domain.Entities.Booking
        {
            BrandId = request.BrandId,
            CustomerName = request.CustomerName,
            CustomerEmail = request.CustomerEmail.ToLowerInvariant(),
            CustomerPhone = request.CustomerPhone,
            CustomerNotes = request.CustomerNotes,
            BookingType = request.BookingType,
            ServiceOfferingId = request.ServiceOfferingId,
            EventOfferingId = request.EventOfferingId,
            Amount = request.Amount,
            Currency = request.Currency,
            Notes = request.Notes,
            Status = BookingStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            ReferralSource = request.ReferralSource
        };

        await _db.Bookings.AddAsync(booking, ct);

        // Update event registration count
        if (request.EventOfferingId.HasValue)
        {
            var ev = await _db.EventOfferings.FindAsync([request.EventOfferingId.Value], ct);
            if (ev is not null) ev.RegisteredCount++;
        }

        await _db.SaveChangesAsync(ct);

        var dto = await GetBookingDtoAsync(booking.Id, ct) ?? MapToDto(booking);
        var notifData = ToNotificationData(booking, dto);
        await _notifications.SendBookingReceivedAsync(notifData, ct);
        await _notifications.SendAdminNewBookingAsync(notifData, ct);

        return CreatedAtAction(nameof(GetBooking), new { id = booking.Id },
            ApiResponse<BookingDto>.Ok(dto!));
    }

    [HttpPost("{id:guid}/checkout")]
    public async Task<ActionResult<ApiResponse<CheckoutResponse>>> CreateCheckout(
        Guid id, [FromBody] CreateCheckoutRequest request, CancellationToken ct = default)
    {
        var booking = await GetBookingDtoAsync(id, ct);
        if (booking is null) return NotFound();
        if (booking.PaymentStatus == PaymentStatus.Completed)
            return BadRequest(ApiResponse<CheckoutResponse>.Fail("Booking is already paid"));

        request = request with { BookingId = id };

        try
        {
            var checkout = await _square.CreateCheckoutAsync(request, booking, ct);

            // Store the checkout URL on the booking
            var entity = await _db.Bookings.FindAsync([id], ct);
            if (entity is not null)
            {
                entity.ExternalPaymentProvider = "Square";
                entity.ExternalBookingId = checkout.ExternalCheckoutId;
                entity.ExternalCheckoutUrl = checkout.CheckoutUrl;
                await _db.SaveChangesAsync(ct);
            }

            return Ok(ApiResponse<CheckoutResponse>.Ok(checkout));
        }
        catch (Exception ex)
        {
            return StatusCode(502, ApiResponse<CheckoutResponse>.Fail($"Payment provider error: {ex.Message}"));
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> GetBooking(Guid id, CancellationToken ct = default)
    {
        var dto = await GetBookingDtoAsync(id, ct);
        return dto is null ? NotFound() : Ok(ApiResponse<BookingDto>.Ok(dto));
    }

    // ── Admin Endpoints ───────────────────────────────────────────────────────

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<BookingDto>>>> GetBookings(
        [FromQuery] Guid? brandId,
        [FromQuery] BookingStatus? status,
        [FromQuery] PaymentStatus? paymentStatus,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = _db.Bookings
            .Include(b => b.Brand)
            .Include(b => b.ServiceOffering)
            .Include(b => b.EventOffering)
            .Include(b => b.PaymentRecords)
            .AsQueryable();

        if (brandId.HasValue) query = query.Where(b => b.BrandId == brandId);
        if (status.HasValue) query = query.Where(b => b.Status == status);
        if (paymentStatus.HasValue) query = query.Where(b => b.PaymentStatus == paymentStatus);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(b => b.CustomerName.Contains(search) || b.CustomerEmail.Contains(search));

        var total = await query.CountAsync(ct);
        var bookings = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var dtos = bookings.Select(MapToDto).ToList();
        return Ok(ApiResponse<PagedResult<BookingDto>>.Ok(PagedResult<BookingDto>.Create(dtos, total, page, pageSize)));
    }

    [Authorize]
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> UpdateStatus(
        Guid id, [FromBody] UpdateBookingStatusRequest request, CancellationToken ct = default)
    {
        var booking = await _db.Bookings
            .Include(b => b.Brand)
            .Include(b => b.ServiceOffering)
            .Include(b => b.EventOffering)
            .FirstOrDefaultAsync(b => b.Id == id, ct);
        if (booking is null) return NotFound();

        var previousStatus = booking.Status;
        booking.Status = request.Status;
        if (request.AdminNotes is not null) booking.AdminNotes = request.AdminNotes;
        if (request.Status == BookingStatus.Confirmed) booking.ConfirmedAt ??= DateTime.UtcNow;
        if (request.Status == BookingStatus.Cancelled)
        {
            booking.CancelledAt = DateTime.UtcNow;
            booking.CancellationReason = request.Reason;
        }

        await _db.SaveChangesAsync(ct);

        if (previousStatus != request.Status)
        {
            var dto = await GetBookingDtoAsync(id, ct) ?? MapToDto(booking);
            var notifData = ToNotificationData(booking, dto);
            if (request.Status == BookingStatus.Confirmed)
                await _notifications.SendBookingConfirmedAsync(notifData, ct);
            else if (request.Status == BookingStatus.Cancelled)
                await _notifications.SendBookingCancelledAsync(notifData, ct);
        }

        return Ok(ApiResponse<BookingDto>.Ok(await GetBookingDtoAsync(id, ct) ?? MapToDto(booking)));
    }

    [Authorize]
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> UpdateBooking(
        Guid id, [FromBody] UpdateBookingRequest request, CancellationToken ct = default)
    {
        // Load without navigation includes to avoid EF Core relationship fixup conflicts
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (booking is null) return NotFound();

        // Capture old display name for change notification (query separately, no tracking)
        var oldServiceName = await _db.ServiceOfferings
            .Where(s => s.Id == booking.ServiceOfferingId)
            .Select(s => s.Name)
            .FirstOrDefaultAsync(ct)
            ?? await _db.EventOfferings
                .Where(e => e.Id == booking.EventOfferingId)
                .Select(e => e.Name)
                .FirstOrDefaultAsync(ct)
            ?? booking.BookingType.ToString();

        if (request.ServiceOfferingId.HasValue)
        {
            var service = await _db.ServiceOfferings
                .Include(s => s.Brand)
                .FirstOrDefaultAsync(s => s.Id == request.ServiceOfferingId.Value, ct);

            if (service is null || !service.IsActive)
                return BadRequest(ApiResponse<BookingDto>.Fail("Service not available."));

            // Decrement old event count if switching away from an event
            if (booking.EventOfferingId.HasValue)
                await DecrementEventCountAsync(booking.EventOfferingId.Value, ct);

            booking.ServiceOfferingId = service.Id;
            booking.EventOfferingId = null;
            booking.BrandId = service.BrandId;
            booking.BookingType = BookingTypeFromBrandSlug(service.Brand?.Slug, isEvent: false);
            if (!request.Amount.HasValue) booking.Amount = service.Price ?? 0;
        }
        else if (request.EventOfferingId.HasValue)
        {
            var ev = await _db.EventOfferings
                .Include(e => e.Brand)
                .FirstOrDefaultAsync(e => e.Id == request.EventOfferingId.Value, ct);

            if (ev is null || !ev.IsActive)
                return BadRequest(ApiResponse<BookingDto>.Fail("Event not available."));
            if (ev.Capacity.HasValue && ev.RegisteredCount >= ev.Capacity.Value)
                return BadRequest(ApiResponse<BookingDto>.Fail("This event is sold out."));

            // Decrement old event if switching from a different event
            if (booking.EventOfferingId.HasValue && booking.EventOfferingId != request.EventOfferingId)
                await DecrementEventCountAsync(booking.EventOfferingId.Value, ct);

            // Increment new event count only if it's actually changing
            if (!booking.EventOfferingId.HasValue || booking.EventOfferingId != request.EventOfferingId)
                ev.RegisteredCount++;

            booking.EventOfferingId = ev.Id;
            booking.ServiceOfferingId = null;
            booking.BrandId = ev.BrandId;
            booking.BookingType = BookingTypeFromBrandSlug(ev.Brand?.Slug, isEvent: true);
            if (!request.Amount.HasValue) booking.Amount = ev.Price ?? 0;
        }

        if (request.Amount.HasValue) booking.Amount = request.Amount.Value;
        if (request.Notes is not null) booking.Notes = request.Notes;

        await _db.SaveChangesAsync(ct);

        var updatedDto = await GetBookingDtoAsync(id, ct) ?? MapToDto(booking);
        var newServiceName = updatedDto.ServiceOfferingName ?? updatedDto.EventOfferingName ?? booking.BookingType.ToString();

        if (oldServiceName != newServiceName)
        {
            var notifData = ToNotificationData(booking, updatedDto);
            await _notifications.SendBookingUpdatedAsync(notifData, oldServiceName, ct);
        }

        return Ok(ApiResponse<BookingDto>.Ok(updatedDto));
    }

    private Task DecrementEventCountAsync(Guid eventId, CancellationToken ct) =>
        _db.EventOfferings
            .Where(e => e.Id == eventId && e.RegisteredCount > 0)
            .ExecuteUpdateAsync(s => s.SetProperty(e => e.RegisteredCount, e => e.RegisteredCount - 1), ct);

    private static BookingType BookingTypeFromBrandSlug(string? slug, bool isEvent) => slug switch
    {
        "sacred-hands"   => BookingType.MassageService,
        "sacred-sound"   => isEvent ? BookingType.SoundHealingEvent : BookingType.SoundHealingClass,
        _                => isEvent ? BookingType.YogaEvent : BookingType.YogaClass,
    };

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteBooking(Guid id, CancellationToken ct = default)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (booking is null) return NotFound();

        if (booking.EventOfferingId.HasValue)
            await DecrementEventCountAsync(booking.EventOfferingId.Value, ct);

        booking.IsDeleted = true;
        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    // ── Square Webhook ────────────────────────────────────────────────────────

    [HttpPost("webhooks/square")]
    [AllowAnonymous]
    public async Task<ActionResult> SquareWebhook(CancellationToken ct = default)
    {
        var signature = Request.Headers["x-square-hmacsha256-signature"].FirstOrDefault() ?? string.Empty;

        using var reader = new System.IO.StreamReader(Request.Body);
        var rawPayload = await reader.ReadToEndAsync(ct);

        var result = await _square.ProcessWebhookAsync(rawPayload, signature, ct);
        return result.Success ? Ok() : BadRequest(new { error = result.Message });
    }

    // ── Services & Events (Public) ────────────────────────────────────────────

    [AllowAnonymous]
    [HttpGet("services")]
    public async Task<ActionResult<ApiResponse<List<ServiceOfferingDto>>>> GetServices(
        [FromQuery] Guid? brandId, [FromQuery] string? category, CancellationToken ct = default)
    {
        var query = _db.ServiceOfferings
            .Where(s => s.IsActive)
            .AsQueryable();

        if (brandId.HasValue) query = query.Where(s => s.BrandId == brandId);
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(s => s.Category == category);

        var services = await query.OrderBy(s => s.SortOrder).ToListAsync(ct);
        var imageUrls = await GetAssetUrlsAsync(services.Select(s => s.FeaturedImageAssetId), ct);
        return Ok(ApiResponse<List<ServiceOfferingDto>>.Ok(services.Select(s => MapServiceToDto(s, imageUrls)).ToList()));
    }

    [AllowAnonymous]
    [HttpGet("events")]
    public async Task<ActionResult<ApiResponse<List<EventOfferingDto>>>> GetEvents(
        [FromQuery] Guid? brandId,
        [FromQuery] bool? soundOnTheRiver,
        [FromQuery] bool upcomingOnly = true,
        CancellationToken ct = default)
    {
        var query = _db.EventOfferings
            .Where(e => e.IsActive)
            .AsQueryable();

        if (brandId.HasValue) query = query.Where(e => e.BrandId == brandId);
        if (soundOnTheRiver.HasValue) query = query.Where(e => e.IsSoundOnTheRiver == soundOnTheRiver);
        if (upcomingOnly) query = query.Where(e => e.StartAt >= DateTime.UtcNow);

        var events = await query.OrderBy(e => e.StartAt).ToListAsync(ct);
        return Ok(ApiResponse<List<EventOfferingDto>>.Ok(events.Select(MapEventToDto).ToList()));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<BookingDto?> GetBookingDtoAsync(Guid id, CancellationToken ct)
    {
        var booking = await _db.Bookings
            .Include(b => b.Brand)
            .Include(b => b.ServiceOffering)
            .Include(b => b.EventOffering)
            .Include(b => b.PaymentRecords)
            .FirstOrDefaultAsync(b => b.Id == id, ct);

        return booking is null ? null : MapToDto(booking);
    }

    private static BookingDto MapToDto(Domain.Entities.Booking b) => new()
    {
        Id = b.Id,
        BrandId = b.BrandId,
        BrandName = b.Brand?.Name ?? "",
        CustomerName = b.CustomerName,
        CustomerEmail = b.CustomerEmail,
        CustomerPhone = b.CustomerPhone,
        CustomerNotes = b.CustomerNotes,
        BookingType = b.BookingType,
        ServiceOfferingId = b.ServiceOfferingId,
        ServiceOfferingName = b.ServiceOffering?.Name,
        EventOfferingId = b.EventOfferingId,
        EventOfferingName = b.EventOffering?.Name,
        Status = b.Status,
        PaymentStatus = b.PaymentStatus,
        Amount = b.Amount,
        Currency = b.Currency,
        Notes = b.Notes,
        AdminNotes = b.AdminNotes,
        ExternalPaymentProvider = b.ExternalPaymentProvider,
        ExternalPaymentId = b.ExternalPaymentId,
        ExternalCheckoutUrl = b.ExternalCheckoutUrl,
        ConfirmedAt = b.ConfirmedAt,
        CancelledAt = b.CancelledAt,
        CreatedAt = b.CreatedAt,
        PaymentRecords = b.PaymentRecords.Select(p => new PaymentRecordDto
        {
            Id = p.Id,
            Provider = p.Provider,
            ProviderPaymentId = p.ProviderPaymentId,
            Amount = p.Amount,
            Currency = p.Currency,
            Status = p.Status,
            ProcessedAt = p.ProcessedAt,
            CreatedAt = p.CreatedAt
        }).ToList()
    };

    private async Task<Dictionary<Guid, string?>> GetAssetUrlsAsync(IEnumerable<Guid?> assetIds, CancellationToken ct)
    {
        var ids = assetIds.Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
        if (ids.Count == 0) return new Dictionary<Guid, string?>();

        return await _db.Assets
            .Where(a => ids.Contains(a.Id) && !a.IsDeleted)
            .ToDictionaryAsync(a => a.Id, a => a.PublicUrl, ct);
    }

    private static ServiceOfferingDto MapServiceToDto(Domain.Entities.ServiceOffering s, IReadOnlyDictionary<Guid, string?>? imageUrls = null) => new()
    {
        Id = s.Id, BrandId = s.BrandId, Name = s.Name, Slug = s.Slug,
        ShortDescription = s.ShortDescription, Description = s.Description, Category = s.Category,
        PriceType = s.PriceType, Price = s.Price, PriceMin = s.PriceMin, PriceMax = s.PriceMax,
        Currency = s.Currency, DurationMinutes = s.DurationMinutes, Location = s.Location,
        IsVirtual = s.IsVirtual, IsBookable = s.IsBookable, IsActive = s.IsActive, SortOrder = s.SortOrder,
        FeaturedImageAssetId = s.FeaturedImageAssetId,
        FeaturedImageUrl = s.FeaturedImageAssetId.HasValue && imageUrls?.TryGetValue(s.FeaturedImageAssetId.Value, out var url) == true ? url : null
    };

    private static BookingNotificationData ToNotificationData(Domain.Entities.Booking b, BookingDto dto) => new(
        CustomerName: b.CustomerName,
        CustomerEmail: b.CustomerEmail,
        ServiceName: dto.ServiceOfferingName ?? dto.EventOfferingName ?? b.BookingType.ToString(),
        BookingType: b.BookingType.ToString(),
        Amount: b.Amount,
        Currency: b.Currency,
        BrandName: b.Brand?.Name ?? dto.BrandName,
        BookingId: b.Id,
        AdminNotes: b.AdminNotes,
        CancellationReason: b.CancellationReason
    );

    private static EventOfferingDto MapEventToDto(Domain.Entities.EventOffering e) => new()
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
}

public record UpdateBookingStatusRequest(BookingStatus Status, string? AdminNotes = null, string? Reason = null);
