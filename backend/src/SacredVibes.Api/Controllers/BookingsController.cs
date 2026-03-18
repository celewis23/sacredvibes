using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Bookings.DTOs;
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

    public BookingsController(AppDbContext db, ISquareService square)
    {
        _db = db;
        _square = square;
    }

    // ── Public: Create booking & checkout ────────────────────────────────────

    [HttpPost]
    public async Task<ActionResult<ApiResponse<BookingDto>>> CreateBooking(
        [FromBody] CreateBookingRequest request, CancellationToken ct = default)
    {
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

        return CreatedAtAction(nameof(GetBooking), new { id = booking.Id },
            ApiResponse<BookingDto>.Ok(await GetBookingDtoAsync(booking.Id, ct)));
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
        var booking = await _db.Bookings.FindAsync([id], ct);
        if (booking is null) return NotFound();

        booking.Status = request.Status;
        if (request.AdminNotes is not null) booking.AdminNotes = request.AdminNotes;
        if (request.Status == BookingStatus.Confirmed) booking.ConfirmedAt ??= DateTime.UtcNow;
        if (request.Status == BookingStatus.Cancelled)
        {
            booking.CancelledAt = DateTime.UtcNow;
            booking.CancellationReason = request.Reason;
        }

        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<BookingDto>.Ok(await GetBookingDtoAsync(id, ct) ?? MapToDto(booking)));
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
        return Ok(ApiResponse<List<ServiceOfferingDto>>.Ok(services.Select(MapServiceToDto).ToList()));
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

    private static ServiceOfferingDto MapServiceToDto(Domain.Entities.ServiceOffering s) => new()
    {
        Id = s.Id, BrandId = s.BrandId, Name = s.Name, Slug = s.Slug,
        ShortDescription = s.ShortDescription, Description = s.Description, Category = s.Category,
        PriceType = s.PriceType, Price = s.Price, PriceMin = s.PriceMin, PriceMax = s.PriceMax,
        Currency = s.Currency, DurationMinutes = s.DurationMinutes, Location = s.Location,
        IsVirtual = s.IsVirtual, IsBookable = s.IsBookable, IsActive = s.IsActive, SortOrder = s.SortOrder
    };

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
        IsSoundOnTheRiver = e.IsSoundOnTheRiver, InstructorName = e.InstructorName
    };
}

public record UpdateBookingStatusRequest(BookingStatus Status, string? AdminNotes = null, string? Reason = null);
