using Microsoft.Extensions.Logging;
using SacredVibes.Application.Features.Bookings.Services;
using SacredVibes.Application.Features.Email;
using SacredVibes.Application.Features.Email.DTOs;
using SacredVibes.Application.Features.EmailTemplates;

namespace SacredVibes.Infrastructure.Services.Bookings;

public class BookingNotificationService : IBookingNotificationService
{
    private const string AdminEmail = "info@sacredvibesyoga.com";

    private readonly IEmailMailboxService _email;
    private readonly IEmailTemplateService _templates;
    private readonly ILogger<BookingNotificationService> _logger;

    public BookingNotificationService(
        IEmailMailboxService email,
        IEmailTemplateService templates,
        ILogger<BookingNotificationService> logger)
    {
        _email = email;
        _templates = templates;
        _logger = logger;
    }

    public async Task SendBookingReceivedAsync(BookingNotificationData data, CancellationToken ct = default)
    {
        await SendSafeAsync(async () =>
        {
            var template = await _templates.GetTemplateAsync("booking_received", ct);
            if (template is null) return;

            var vars = BaseVars(data);
            await _email.SendAsync(new SendEmailRequest
            {
                To = [data.CustomerEmail],
                Subject = _templates.Render(template.Subject, vars),
                Body = _templates.Render(template.HtmlBody, vars),
                IsHtml = true
            }, ct);
        }, "booking_received", data.CustomerEmail);
    }

    public async Task SendBookingConfirmedAsync(BookingNotificationData data, CancellationToken ct = default)
    {
        await SendSafeAsync(async () =>
        {
            var template = await _templates.GetTemplateAsync("booking_confirmed", ct);
            if (template is null) return;

            var vars = BaseVars(data);
            vars["adminNotes"] = string.IsNullOrWhiteSpace(data.AdminNotes)
                ? "We look forward to seeing you!"
                : data.AdminNotes;

            await _email.SendAsync(new SendEmailRequest
            {
                To = [data.CustomerEmail],
                Subject = _templates.Render(template.Subject, vars),
                Body = _templates.Render(template.HtmlBody, vars),
                IsHtml = true
            }, ct);
        }, "booking_confirmed", data.CustomerEmail);
    }

    public async Task SendBookingCancelledAsync(BookingNotificationData data, CancellationToken ct = default)
    {
        await SendSafeAsync(async () =>
        {
            var template = await _templates.GetTemplateAsync("booking_cancelled", ct);
            if (template is null) return;

            var vars = BaseVars(data);
            vars["cancellationReason"] = string.IsNullOrWhiteSpace(data.CancellationReason)
                ? "No reason provided."
                : data.CancellationReason;

            await _email.SendAsync(new SendEmailRequest
            {
                To = [data.CustomerEmail],
                Subject = _templates.Render(template.Subject, vars),
                Body = _templates.Render(template.HtmlBody, vars),
                IsHtml = true
            }, ct);
        }, "booking_cancelled", data.CustomerEmail);
    }

    public async Task SendBookingUpdatedAsync(BookingNotificationData data, string oldServiceName, CancellationToken ct = default)
    {
        await SendSafeAsync(async () =>
        {
            var template = await _templates.GetTemplateAsync("booking_updated", ct);
            if (template is null) return;

            var vars = BaseVars(data);
            vars["oldServiceName"] = oldServiceName;
            vars["newServiceName"] = data.ServiceName;

            await _email.SendAsync(new SendEmailRequest
            {
                To = [data.CustomerEmail],
                Subject = _templates.Render(template.Subject, vars),
                Body = _templates.Render(template.HtmlBody, vars),
                IsHtml = true
            }, ct);
        }, "booking_updated", data.CustomerEmail);
    }

    public async Task SendAdminNewBookingAsync(BookingNotificationData data, CancellationToken ct = default)
    {
        await SendSafeAsync(async () =>
        {
            var template = await _templates.GetTemplateAsync("admin_new_booking", ct);
            if (template is null) return;

            var vars = BaseVars(data);
            vars["customerEmail"] = data.CustomerEmail;

            await _email.SendAsync(new SendEmailRequest
            {
                To = [AdminEmail],
                Subject = _templates.Render(template.Subject, vars),
                Body = _templates.Render(template.HtmlBody, vars),
                IsHtml = true
            }, ct);
        }, "admin_new_booking", AdminEmail);
    }

    public async Task SendBookingApprovedPendingPaymentAsync(BookingNotificationData data, string checkoutUrl, CancellationToken ct = default)
    {
        await SendSafeAsync(async () =>
        {
            var template = await _templates.GetTemplateAsync("booking_approved_pending_payment", ct);
            if (template is null) return;

            var vars = BaseVars(data);
            vars["checkoutUrl"] = checkoutUrl;

            await _email.SendAsync(new SendEmailRequest
            {
                To = [data.CustomerEmail],
                Subject = _templates.Render(template.Subject, vars),
                Body = _templates.Render(template.HtmlBody, vars),
                IsHtml = true
            }, ct);
        }, "booking_approved_pending_payment", data.CustomerEmail);
    }

    public async Task SendBookingPaymentConfirmedAsync(BookingNotificationData data, CancellationToken ct = default)
    {
        await SendSafeAsync(async () =>
        {
            var template = await _templates.GetTemplateAsync("booking_payment_confirmed", ct);
            if (template is null) return;

            var vars = BaseVars(data);
            await _email.SendAsync(new SendEmailRequest
            {
                To = [data.CustomerEmail],
                Subject = _templates.Render(template.Subject, vars),
                Body = _templates.Render(template.HtmlBody, vars),
                IsHtml = true
            }, ct);
        }, "booking_payment_confirmed", data.CustomerEmail);
    }

    public async Task SendBookingDeniedAsync(BookingNotificationData data, CancellationToken ct = default)
    {
        await SendSafeAsync(async () =>
        {
            var template = await _templates.GetTemplateAsync("booking_denied", ct);
            if (template is null) return;

            var vars = BaseVars(data);
            vars["cancellationReason"] = string.IsNullOrWhiteSpace(data.CancellationReason)
                ? "Please reach out if you'd like to discuss other availability."
                : data.CancellationReason;

            await _email.SendAsync(new SendEmailRequest
            {
                To = [data.CustomerEmail],
                Subject = _templates.Render(template.Subject, vars),
                Body = _templates.Render(template.HtmlBody, vars),
                IsHtml = true
            }, ct);
        }, "booking_denied", data.CustomerEmail);
    }

    public async Task SendBookingRescheduledAsync(BookingNotificationData data, DateTime? previousStartAt, CancellationToken ct = default)
    {
        await SendSafeAsync(async () =>
        {
            var template = await _templates.GetTemplateAsync("booking_rescheduled", ct);
            if (template is null) return;

            var vars = BaseVars(data);
            vars["previousRequestedDate"] = FormatRequestedDate(previousStartAt, data.RequestedTimeZone);

            await _email.SendAsync(new SendEmailRequest
            {
                To = [data.CustomerEmail],
                Subject = _templates.Render(template.Subject, vars),
                Body = _templates.Render(template.HtmlBody, vars),
                IsHtml = true
            }, ct);
        }, "booking_rescheduled", data.CustomerEmail);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static Dictionary<string, string> BaseVars(BookingNotificationData data)
    {
        var formattedAmount = data.Amount > 0
            ? new System.Globalization.CultureInfo("en-US").NumberFormat
                .CurrencySymbol + data.Amount.ToString("N2")
            : "Free";

        return new Dictionary<string, string>
        {
            ["customerName"] = data.CustomerName,
            ["customerEmail"] = data.CustomerEmail,
            ["serviceName"] = data.ServiceName,
            ["bookingType"] = FormatBookingType(data.BookingType),
            ["amount"] = formattedAmount,
            ["currency"] = data.Currency,
            ["brandName"] = data.BrandName,
            ["bookingId"] = data.BookingId.ToString("N")[..8].ToUpperInvariant(),
            ["adminNotes"] = data.AdminNotes ?? string.Empty,
            ["cancellationReason"] = data.CancellationReason ?? string.Empty,
            ["requestedDate"] = FormatRequestedDate(data.RequestedStartAt, data.RequestedTimeZone),
        };
    }

    private static string FormatRequestedDate(DateTime? startAt, string? timeZone)
    {
        if (!startAt.HasValue) return "a time to be confirmed";
        var formatted = startAt.Value.ToString("dddd, MMMM d 'at' h:mm tt", System.Globalization.CultureInfo.InvariantCulture);
        return string.IsNullOrWhiteSpace(timeZone) ? formatted : $"{formatted} ({timeZone})";
    }

    private static string FormatBookingType(string raw) =>
        System.Text.RegularExpressions.Regex.Replace(raw, "([A-Z])", " $1").Trim();

    private async Task SendSafeAsync(Func<Task> action, string templateKey, string recipient)
    {
        try
        {
            await action();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Booking notification email failed (template={Template}, recipient={Recipient}): {Message}",
                templateKey, recipient, ex.Message);
        }
    }
}
