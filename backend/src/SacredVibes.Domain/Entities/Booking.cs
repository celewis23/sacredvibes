using SacredVibes.Domain.Enums;

namespace SacredVibes.Domain.Entities;

public class Booking : BaseEntity
{
    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerNotes { get; set; }

    public BookingType BookingType { get; set; }

    public Guid? ServiceOfferingId { get; set; }
    public ServiceOffering? ServiceOffering { get; set; }

    public Guid? EventOfferingId { get; set; }
    public EventOffering? EventOffering { get; set; }

    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";

    public string? Notes { get; set; }
    public string? AdminNotes { get; set; }

    // External payment/booking references
    public string? ExternalPaymentProvider { get; set; }
    public string? ExternalPaymentId { get; set; }
    public string? ExternalBookingId { get; set; }
    public string? ExternalCheckoutUrl { get; set; }

    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }

    public string? ReferralSource { get; set; }
    public string MetadataJson { get; set; } = "{}";

    public ICollection<PaymentRecord> PaymentRecords { get; set; } = new List<PaymentRecord>();
}

public class PaymentRecord : BaseEntity
{
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;

    public string Provider { get; set; } = string.Empty;
    public string ProviderPaymentId { get; set; } = string.Empty;
    public string? ProviderOrderId { get; set; }

    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public string? RawPayloadJson { get; set; }
    public string? ErrorMessage { get; set; }

    public DateTime? ProcessedAt { get; set; }
}
