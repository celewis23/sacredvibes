using SacredVibes.Domain.Enums;

namespace SacredVibes.Application.Features.Bookings.DTOs;

public class BookingDto
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerNotes { get; set; }
    public BookingType BookingType { get; set; }
    public Guid? ServiceOfferingId { get; set; }
    public string? ServiceOfferingName { get; set; }
    public Guid? EventOfferingId { get; set; }
    public string? EventOfferingName { get; set; }
    public BookingStatus Status { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string? Notes { get; set; }
    public string? AdminNotes { get; set; }
    public string? ExternalPaymentProvider { get; set; }
    public string? ExternalPaymentId { get; set; }
    public string? ExternalCheckoutUrl { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<PaymentRecordDto> PaymentRecords { get; set; } = new();
}

public class PaymentRecordDto
{
    public Guid Id { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string ProviderPaymentId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public PaymentStatus Status { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateBookingRequest
{
    public Guid BrandId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerNotes { get; set; }
    public BookingType BookingType { get; set; }
    public Guid? ServiceOfferingId { get; set; }
    public Guid? EventOfferingId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string? Notes { get; set; }
    public string? ReferralSource { get; set; }
}

public class CreateCheckoutRequest
{
    public Guid BookingId { get; set; }
    public string ReturnUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
}

public class CheckoutResponse
{
    public string CheckoutUrl { get; set; } = string.Empty;
    public string? ExternalCheckoutId { get; set; }
    public string Provider { get; set; } = "Square";
}

public class ServiceOfferingDto
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public PriceType PriceType { get; set; }
    public decimal? Price { get; set; }
    public decimal? PriceMin { get; set; }
    public decimal? PriceMax { get; set; }
    public string Currency { get; set; } = "USD";
    public int? DurationMinutes { get; set; }
    public string? Location { get; set; }
    public bool IsVirtual { get; set; }
    public bool IsBookable { get; set; }
    public bool IsActive { get; set; }
    public string? FeaturedImageUrl { get; set; }
    public int SortOrder { get; set; }
}

public class EventOfferingDto
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
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
    public int RegisteredCount { get; set; }
    public int? SpotsRemaining => Capacity.HasValue ? Math.Max(0, Capacity.Value - RegisteredCount) : null;
    public PriceType PriceType { get; set; }
    public decimal? Price { get; set; }
    public string Currency { get; set; } = "USD";
    public bool IsBookable { get; set; }
    public bool IsActive { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsSoldOut { get; set; }
    public bool IsSoundOnTheRiver { get; set; }
    public string? InstructorName { get; set; }
    public string? FeaturedImageUrl { get; set; }
}
