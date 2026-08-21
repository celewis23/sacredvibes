using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Features.EmailTemplates;
using SacredVibes.Application.Features.EmailTemplates.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services.EmailTemplates;

public class EmailTemplateService : IEmailTemplateService
{
    private const string Provider = "BookingEmailTemplates";

    private readonly AppDbContext _db;

    public EmailTemplateService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<EmailTemplateDto>> GetAllTemplatesAsync(CancellationToken ct = default)
    {
        var stored = await LoadStoredAsync(ct);
        return TemplateKeys.Select(key => Resolve(key, stored)).ToList();
    }

    public async Task<EmailTemplateDto?> GetTemplateAsync(string key, CancellationToken ct = default)
    {
        if (!TemplateKeys.Contains(key)) return null;
        var stored = await LoadStoredAsync(ct);
        return Resolve(key, stored);
    }

    public async Task<EmailTemplateDto> SaveTemplateAsync(string key, SaveEmailTemplateRequest request, CancellationToken ct = default)
    {
        if (!TemplateKeys.Contains(key))
            throw new InvalidOperationException($"Unknown template key: {key}");

        var setting = await GetOrCreateSettingAsync(ct);
        var stored = DeserializeStored(setting.SettingsJson);

        stored[key] = new StoredTemplate
        {
            Subject = request.Subject.Trim(),
            HtmlBody = request.HtmlBody.Trim()
        };

        setting.SettingsJson = JsonSerializer.Serialize(stored);
        await _db.SaveChangesAsync(ct);

        return Resolve(key, stored);
    }

    public async Task<EmailTemplateDto> ResetToDefaultAsync(string key, CancellationToken ct = default)
    {
        if (!TemplateKeys.Contains(key))
            throw new InvalidOperationException($"Unknown template key: {key}");

        var setting = await GetOrCreateSettingAsync(ct);
        var stored = DeserializeStored(setting.SettingsJson);
        stored.Remove(key);

        setting.SettingsJson = JsonSerializer.Serialize(stored);
        await _db.SaveChangesAsync(ct);

        return Resolve(key, stored);
    }

    public string Render(string template, Dictionary<string, string> variables)
    {
        var sb = new StringBuilder(template);
        foreach (var (key, value) in variables)
            sb.Replace($"{{{{{key}}}}}", value ?? string.Empty);
        return sb.ToString();
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private async Task<Dictionary<string, StoredTemplate>> LoadStoredAsync(CancellationToken ct)
    {
        var setting = await _db.IntegrationSettings.FirstOrDefaultAsync(i => i.Provider == Provider, ct);
        return setting is null ? new() : DeserializeStored(setting.SettingsJson);
    }

    private async Task<IntegrationSetting> GetOrCreateSettingAsync(CancellationToken ct)
    {
        var setting = await _db.IntegrationSettings.FirstOrDefaultAsync(i => i.Provider == Provider, ct);
        if (setting is not null) return setting;

        setting = new IntegrationSetting { Provider = Provider, SettingsJson = "{}", IsEnabled = true };
        await _db.IntegrationSettings.AddAsync(setting, ct);
        await _db.SaveChangesAsync(ct);
        return setting;
    }

    private static Dictionary<string, StoredTemplate> DeserializeStored(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, StoredTemplate>>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
        }
        catch { return new(); }
    }

    private static EmailTemplateDto Resolve(string key, Dictionary<string, StoredTemplate> stored)
    {
        var meta = TemplateMeta[key];
        var hasCustom = stored.TryGetValue(key, out var custom);
        return new EmailTemplateDto
        {
            Key = key,
            Name = meta.Name,
            Description = meta.Description,
            Subject = hasCustom && !string.IsNullOrWhiteSpace(custom!.Subject) ? custom.Subject : meta.DefaultSubject,
            HtmlBody = hasCustom && !string.IsNullOrWhiteSpace(custom!.HtmlBody) ? custom.HtmlBody : meta.DefaultHtmlBody,
            Variables = meta.Variables
        };
    }

    private static string Token(string name) => "{{" + name + "}}";

    // ── Template metadata & defaults ──────────────────────────────────────────

    // NOTE: TemplateMeta must be declared before TemplateKeys — C# runs static field
    // initializers in declaration order, so TemplateKeys reading TemplateMeta.Keys while
    // TemplateMeta is still null would throw a TypeInitializationException on every use.
    private static readonly Dictionary<string, TemplateMetadata> TemplateMeta = new()
    {
        ["booking_received"] = new(
            "Booking Received (Customer)",
            "Sent to the customer immediately when they submit a booking request.",
            "Your booking request has been received — {{serviceName}}",
            new List<string> { "customerName", "serviceName", "bookingType", "amount", "currency", "brandName", "bookingId" },
            BuildBookingReceivedTemplate()
        ),
        ["booking_confirmed"] = new(
            "Booking Confirmed (Customer)",
            "Sent to the customer when an admin confirms the booking.",
            "Your booking is confirmed — {{serviceName}}",
            new List<string> { "customerName", "serviceName", "bookingType", "amount", "currency", "brandName", "adminNotes" },
            BuildBookingConfirmedTemplate()
        ),
        ["booking_cancelled"] = new(
            "Booking Cancelled (Customer)",
            "Sent to the customer when a booking is cancelled.",
            "Your booking has been cancelled",
            new List<string> { "customerName", "serviceName", "brandName", "cancellationReason" },
            BuildBookingCancelledTemplate()
        ),
        ["booking_updated"] = new(
            "Booking Updated (Customer)",
            "Sent to the customer when an admin changes the service on their booking.",
            "Your booking has been updated",
            new List<string> { "customerName", "oldServiceName", "newServiceName", "amount", "currency", "brandName" },
            BuildBookingUpdatedTemplate()
        ),
        ["admin_new_booking"] = new(
            "New Booking Alert (Admin)",
            "Sent to the admin inbox when a new booking is submitted.",
            "New booking: {{customerName}} — {{serviceName}}",
            new List<string> { "customerName", "customerEmail", "serviceName", "bookingType", "amount", "currency", "brandName", "bookingId" },
            BuildAdminNewBookingTemplate()
        ),
        ["booking_approved_pending_payment"] = new(
            "Booking Approved — Payment Link (Customer)",
            "Sent to the customer when an admin approves their booking, with a link to pay and confirm.",
            "Your booking is approved — complete payment to confirm",
            new List<string> { "customerName", "serviceName", "requestedDate", "amount", "currency", "brandName", "checkoutUrl" },
            BuildBookingApprovedPendingPaymentTemplate()
        ),
        ["booking_payment_confirmed"] = new(
            "Payment Confirmed (Customer)",
            "Sent to the customer once their payment for an approved booking is received.",
            "You're all set — payment received for {{serviceName}}",
            new List<string> { "customerName", "serviceName", "requestedDate", "amount", "currency", "brandName" },
            BuildBookingPaymentConfirmedTemplate()
        ),
        ["booking_denied"] = new(
            "Booking Denied (Customer)",
            "Sent to the customer when an admin is unable to accommodate their booking request.",
            "Update on your booking request — {{serviceName}}",
            new List<string> { "customerName", "serviceName", "brandName", "cancellationReason" },
            BuildBookingDeniedTemplate()
        ),
        ["booking_rescheduled"] = new(
            "Booking Rescheduled (Customer)",
            "Sent to the customer when an admin proposes a new time for their booking request.",
            "A new time has been proposed for your booking",
            new List<string> { "customerName", "serviceName", "requestedDate", "previousRequestedDate", "brandName" },
            BuildBookingRescheduledTemplate()
        ),
    };

    private static readonly HashSet<string> TemplateKeys = new(TemplateMeta.Keys);

    // ── Default HTML templates ─────────────────────────────────────────────────

    private static string WrapInLayout(string preheader, string headerAccent, string bodyContent, string footerNote = "") => $"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1.0" />
          <meta name="color-scheme" content="light" />
          <title>Sacred Vibes</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f3f0eb;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
          <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">{preheader}&nbsp;&#8199;&nbsp;&#65279;&nbsp;&#847;&nbsp;</div>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f3f0eb;padding:32px 16px;">
            <tr>
              <td>
                <table align="center" width="600" cellpadding="0" cellspacing="0" role="presentation"
                  style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(28,23,20,0.10);">

                  <!-- Header -->
                  <tr>
                    <td style="background-color:#5f5248;padding:32px 32px 28px;text-align:center;">
                      <p style="margin:0 0 2px;color:#f3f0eb;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:400;">Sacred Vibes</p>
                      <p style="margin:0;color:#c9a96e;font-size:18px;letter-spacing:0.06em;font-weight:400;">{headerAccent}</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 36px 32px;">
                      {bodyContent}
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#faf9f7;border-top:1px solid #e8e2d9;padding:24px 36px;text-align:center;">
                      <p style="margin:0 0 6px;color:#a49280;font-size:13px;font-weight:400;">Sacred Vibes Healing &amp; Wellness</p>
                      {(string.IsNullOrWhiteSpace(footerNote)
                          ? "<p style=\"margin:0;color:#bcaf9d;font-size:12px;\">You're receiving this email because you have a booking with us.</p>"
                          : $"<p style=\"margin:0;color:#bcaf9d;font-size:12px;\">{footerNote}</p>")}
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;

    private static string BookingDetailsBox(bool includeAmount = true) => $"""
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="background-color:#faf9f7;border:1px solid #e8e2d9;border-radius:8px;margin:0 0 28px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 12px;color:#a49280;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">Booking Details</p>
              <p style="margin:0 0 6px;color:#1c1714;font-size:14px;"><span style="color:#736456;min-width:80px;display:inline-block;">Service</span> {Token("serviceName")}</p>
              <p style="margin:0 0 6px;color:#1c1714;font-size:14px;"><span style="color:#736456;min-width:80px;display:inline-block;">Type</span> {Token("bookingType")}</p>
              {(includeAmount ? $"<p style=\"margin:0;color:#1c1714;font-size:14px;\"><span style=\"color:#736456;min-width:80px;display:inline-block;\">Amount</span> {Token("amount")}</p>" : "")}
            </td>
          </tr>
        </table>
        """;

    private static string BuildBookingReceivedTemplate() => WrapInLayout(
        "We received your booking request and will confirm it shortly.",
        "Healing &amp; Wellness",
        $"""
        <h2 style="margin:0 0 8px;color:#1c1714;font-size:22px;font-weight:400;line-height:1.3;">Hi {Token("customerName")},</h2>
        <p style="margin:0 0 24px;color:#5f5248;font-size:15px;line-height:1.75;">Thank you for booking with us! We've received your request and will be in touch shortly to confirm your appointment.</p>

        {BookingDetailsBox()}

        <p style="margin:0 0 12px;color:#736456;font-size:14px;line-height:1.7;">If you have any questions, simply reply to this email and we'll be happy to help.</p>
        <p style="margin:0;color:#736456;font-size:14px;line-height:1.7;">With love &amp; light,<br /><strong style="color:#5f5248;">The Sacred Vibes Team</strong></p>
        """);

    private static string BuildBookingConfirmedTemplate() => WrapInLayout(
        "Great news — your booking has been confirmed!",
        "Healing &amp; Wellness",
        $"""
        <h2 style="margin:0 0 8px;color:#1c1714;font-size:22px;font-weight:400;line-height:1.3;">Hi {Token("customerName")},</h2>
        <p style="margin:0 0 24px;color:#5f5248;font-size:15px;line-height:1.75;">We're excited to welcome you! Your booking has been confirmed.</p>

        {BookingDetailsBox()}

        <div id="admin-notes-block" style="margin:0 0 28px;">
          <p style="margin:0 0 4px;color:#a49280;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">Note from us</p>
          <p style="margin:0;color:#5f5248;font-size:14px;line-height:1.7;">{Token("adminNotes")}</p>
        </div>

        <p style="margin:0 0 12px;color:#736456;font-size:14px;line-height:1.7;">If you need to make any changes or have questions, please don't hesitate to reach out.</p>
        <p style="margin:0;color:#736456;font-size:14px;line-height:1.7;">See you soon,<br /><strong style="color:#5f5248;">The Sacred Vibes Team</strong></p>
        """);

    private static string BuildBookingCancelledTemplate() => WrapInLayout(
        "Your booking has been cancelled.",
        "Healing &amp; Wellness",
        $"""
        <h2 style="margin:0 0 8px;color:#1c1714;font-size:22px;font-weight:400;line-height:1.3;">Hi {Token("customerName")},</h2>
        <p style="margin:0 0 24px;color:#5f5248;font-size:15px;line-height:1.75;">Your booking for <strong>{Token("serviceName")}</strong> has been cancelled.</p>

        <div id="reason-block" style="background-color:#faf9f7;border:1px solid #e8e2d9;border-radius:8px;padding:20px 24px;margin:0 0 28px;">
          <p style="margin:0 0 4px;color:#a49280;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">Reason</p>
          <p style="margin:0;color:#5f5248;font-size:14px;line-height:1.7;">{Token("cancellationReason")}</p>
        </div>

        <p style="margin:0 0 12px;color:#736456;font-size:14px;line-height:1.7;">If you'd like to rebook or have any questions, please reach out and we'll be happy to assist.</p>
        <p style="margin:0;color:#736456;font-size:14px;line-height:1.7;">With gratitude,<br /><strong style="color:#5f5248;">The Sacred Vibes Team</strong></p>
        """);

    private static string BuildBookingUpdatedTemplate() => WrapInLayout(
        "Your booking has been updated with a new service.",
        "Healing &amp; Wellness",
        $"""
        <h2 style="margin:0 0 8px;color:#1c1714;font-size:22px;font-weight:400;line-height:1.3;">Hi {Token("customerName")},</h2>
        <p style="margin:0 0 24px;color:#5f5248;font-size:15px;line-height:1.75;">We've made an update to your booking. Here's a summary of what changed:</p>

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="background-color:#faf9f7;border:1px solid #e8e2d9;border-radius:8px;margin:0 0 28px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 12px;color:#a49280;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">Service Change</p>
              <p style="margin:0 0 8px;color:#1c1714;font-size:14px;">
                <span style="color:#736456;min-width:60px;display:inline-block;">From</span>
                <span style="color:#a49280;text-decoration:line-through;">{Token("oldServiceName")}</span>
              </p>
              <p style="margin:0 0 8px;color:#1c1714;font-size:14px;">
                <span style="color:#736456;min-width:60px;display:inline-block;">To</span>
                <strong>{Token("newServiceName")}</strong>
              </p>
              <p style="margin:0;color:#1c1714;font-size:14px;"><span style="color:#736456;min-width:60px;display:inline-block;">Amount</span> {Token("amount")}</p>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 12px;color:#736456;font-size:14px;line-height:1.7;">If this doesn't look right or you have any questions, please reply to this email and we'll sort it out right away.</p>
        <p style="margin:0;color:#736456;font-size:14px;line-height:1.7;">With love &amp; light,<br /><strong style="color:#5f5248;">The Sacred Vibes Team</strong></p>
        """);

    private static string BuildAdminNewBookingTemplate() => WrapInLayout(
        "A new booking has been submitted and is awaiting your confirmation.",
        "New Booking Received",
        $"""
        <p style="margin:0 0 6px;color:#a49280;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">Customer</p>
        <p style="margin:0 0 4px;color:#1c1714;font-size:16px;font-weight:500;">{Token("customerName")}</p>
        <p style="margin:0 0 28px;color:#736456;font-size:14px;">{Token("customerEmail")}</p>

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="background-color:#faf9f7;border:1px solid #e8e2d9;border-radius:8px;margin:0 0 28px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 12px;color:#a49280;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">Booking Details</p>
              <p style="margin:0 0 6px;color:#1c1714;font-size:14px;"><span style="color:#736456;min-width:80px;display:inline-block;">Service</span> {Token("serviceName")}</p>
              <p style="margin:0 0 6px;color:#1c1714;font-size:14px;"><span style="color:#736456;min-width:80px;display:inline-block;">Type</span> {Token("bookingType")}</p>
              <p style="margin:0 0 6px;color:#1c1714;font-size:14px;"><span style="color:#736456;min-width:80px;display:inline-block;">Brand</span> {Token("brandName")}</p>
              <p style="margin:0;color:#1c1714;font-size:14px;"><span style="color:#736456;min-width:80px;display:inline-block;">Amount</span> {Token("amount")}</p>
            </td>
          </tr>
        </table>

        <p style="margin:0;color:#736456;font-size:13px;">Log in to the admin panel to review and confirm this booking.</p>
        """,
        "Internal notification — do not reply directly to this email.");

    private static string BuildBookingApprovedPendingPaymentTemplate() => WrapInLayout(
        "Your booking is approved — complete payment to confirm your spot.",
        "Healing &amp; Wellness",
        $"""
        <h2 style="margin:0 0 8px;color:#1c1714;font-size:22px;font-weight:400;line-height:1.3;">Hi {Token("customerName")},</h2>
        <p style="margin:0 0 24px;color:#5f5248;font-size:15px;line-height:1.75;">Good news — we've checked our availability and your booking request has been approved for <strong>{Token("requestedDate")}</strong>. Complete payment below to lock in your spot.</p>

        {BookingDetailsBox()}

        <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
          <tr>
            <td style="border-radius:6px;background-color:#5f5248;">
              <a href="{Token("checkoutUrl")}" style="display:inline-block;padding:14px 28px;color:#f3f0eb;font-size:14px;font-weight:500;text-decoration:none;">Complete Payment</a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 12px;color:#736456;font-size:14px;line-height:1.7;">If you have any questions before completing payment, just reply to this email.</p>
        <p style="margin:0;color:#736456;font-size:14px;line-height:1.7;">With love &amp; light,<br /><strong style="color:#5f5248;">The Sacred Vibes Team</strong></p>
        """);

    private static string BuildBookingPaymentConfirmedTemplate() => WrapInLayout(
        "Payment received — you're fully confirmed!",
        "Healing &amp; Wellness",
        $"""
        <h2 style="margin:0 0 8px;color:#1c1714;font-size:22px;font-weight:400;line-height:1.3;">Hi {Token("customerName")},</h2>
        <p style="margin:0 0 24px;color:#5f5248;font-size:15px;line-height:1.75;">We've received your payment and you're fully confirmed for <strong>{Token("requestedDate")}</strong>. We can't wait to see you!</p>

        {BookingDetailsBox()}

        <p style="margin:0 0 12px;color:#736456;font-size:14px;line-height:1.7;">If you need to make any changes, please don't hesitate to reach out.</p>
        <p style="margin:0;color:#736456;font-size:14px;line-height:1.7;">See you soon,<br /><strong style="color:#5f5248;">The Sacred Vibes Team</strong></p>
        """);

    private static string BuildBookingDeniedTemplate() => WrapInLayout(
        "An update on your recent booking request.",
        "Healing &amp; Wellness",
        $"""
        <h2 style="margin:0 0 8px;color:#1c1714;font-size:22px;font-weight:400;line-height:1.3;">Hi {Token("customerName")},</h2>
        <p style="margin:0 0 24px;color:#5f5248;font-size:15px;line-height:1.75;">Thank you for your interest in <strong>{Token("serviceName")}</strong>. Unfortunately, we're not able to accommodate this particular request.</p>

        <div id="reason-block" style="background-color:#faf9f7;border:1px solid #e8e2d9;border-radius:8px;padding:20px 24px;margin:0 0 28px;">
          <p style="margin:0 0 4px;color:#a49280;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">Note</p>
          <p style="margin:0;color:#5f5248;font-size:14px;line-height:1.7;">{Token("cancellationReason")}</p>
        </div>

        <p style="margin:0 0 12px;color:#736456;font-size:14px;line-height:1.7;">We'd love to find a time that works — please reply to this email and we'll help you find other availability.</p>
        <p style="margin:0;color:#736456;font-size:14px;line-height:1.7;">With gratitude,<br /><strong style="color:#5f5248;">The Sacred Vibes Team</strong></p>
        """);

    private static string BuildBookingRescheduledTemplate() => WrapInLayout(
        "We've proposed a new time for your booking request.",
        "Healing &amp; Wellness",
        $"""
        <h2 style="margin:0 0 8px;color:#1c1714;font-size:22px;font-weight:400;line-height:1.3;">Hi {Token("customerName")},</h2>
        <p style="margin:0 0 24px;color:#5f5248;font-size:15px;line-height:1.75;">We'd like to propose a new time for your <strong>{Token("serviceName")}</strong> booking request.</p>

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="background-color:#faf9f7;border:1px solid #e8e2d9;border-radius:8px;margin:0 0 28px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 8px;color:#1c1714;font-size:14px;">
                <span style="color:#736456;min-width:100px;display:inline-block;">Previously requested</span>
                <span style="color:#a49280;text-decoration:line-through;">{Token("previousRequestedDate")}</span>
              </p>
              <p style="margin:0;color:#1c1714;font-size:14px;">
                <span style="color:#736456;min-width:100px;display:inline-block;">New proposed time</span>
                <strong>{Token("requestedDate")}</strong>
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 12px;color:#736456;font-size:14px;line-height:1.7;">If this new time works for you, no action is needed — we'll follow up to confirm. If not, just reply to this email and we'll find another time together.</p>
        <p style="margin:0;color:#736456;font-size:14px;line-height:1.7;">With love &amp; light,<br /><strong style="color:#5f5248;">The Sacred Vibes Team</strong></p>
        """);

    // ── Inner types ────────────────────────────────────────────────────────────

    private sealed record TemplateMetadata(
        string Name,
        string Description,
        string DefaultSubject,
        List<string> Variables,
        string DefaultHtmlBody);

    private sealed class StoredTemplate
    {
        public string Subject { get; set; } = string.Empty;
        public string HtmlBody { get; set; } = string.Empty;
    }
}
