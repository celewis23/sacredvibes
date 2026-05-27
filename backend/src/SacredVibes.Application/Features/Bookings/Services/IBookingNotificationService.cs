namespace SacredVibes.Application.Features.Bookings.Services;

public interface IBookingNotificationService
{
    Task SendBookingReceivedAsync(BookingNotificationData data, CancellationToken ct = default);
    Task SendBookingConfirmedAsync(BookingNotificationData data, CancellationToken ct = default);
    Task SendBookingCancelledAsync(BookingNotificationData data, CancellationToken ct = default);
    Task SendBookingUpdatedAsync(BookingNotificationData data, string oldServiceName, CancellationToken ct = default);
    Task SendAdminNewBookingAsync(BookingNotificationData data, CancellationToken ct = default);
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
    string? CancellationReason = null
);
