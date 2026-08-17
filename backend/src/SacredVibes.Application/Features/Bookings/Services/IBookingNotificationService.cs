namespace SacredVibes.Application.Features.Bookings.Services;

public interface IBookingNotificationService
{
    Task SendBookingReceivedAsync(BookingNotificationData data, CancellationToken ct = default);
    Task SendBookingConfirmedAsync(BookingNotificationData data, CancellationToken ct = default);
    Task SendBookingCancelledAsync(BookingNotificationData data, CancellationToken ct = default);
    Task SendBookingUpdatedAsync(BookingNotificationData data, string oldServiceName, CancellationToken ct = default);
    Task SendAdminNewBookingAsync(BookingNotificationData data, CancellationToken ct = default);
    Task SendBookingApprovedPendingPaymentAsync(BookingNotificationData data, string checkoutUrl, CancellationToken ct = default);
    Task SendBookingPaymentConfirmedAsync(BookingNotificationData data, CancellationToken ct = default);
    Task SendBookingDeniedAsync(BookingNotificationData data, CancellationToken ct = default);
    Task SendBookingRescheduledAsync(BookingNotificationData data, DateTime? previousStartAt, CancellationToken ct = default);
}

public record BookingNotificationData(
    string CustomerName,
    string CustomerEmail,
    string ServiceName,
    string BookingType,
    decimal Amount,
    string Currency,
    string BrandName,
    Guid BookingId,
    string? AdminNotes = null,
    string? CancellationReason = null,
    DateTime? RequestedStartAt = null,
    string? RequestedTimeZone = null
);
