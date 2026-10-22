using System.Net;
using Microsoft.Extensions.Logging;
using SacredVibes.Application.Features.Email;
using SacredVibes.Application.Features.Email.DTOs;
using SacredVibes.Application.Features.EmailTemplates;
using SacredVibes.Application.Features.Subscribers;
using SacredVibes.Domain.Entities;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services.Subscribers;

public class SubscriberWelcomeEmailService : ISubscriberWelcomeEmailService
{
    private const string TemplateKey = "subscriber_welcome";

    private readonly AppDbContext _db;
    private readonly IEmailMailboxService _email;
    private readonly IEmailTemplateService _templates;
    private readonly ILogger<SubscriberWelcomeEmailService> _logger;

    public SubscriberWelcomeEmailService(
        AppDbContext db,
        IEmailMailboxService email,
        IEmailTemplateService templates,
        ILogger<SubscriberWelcomeEmailService> logger)
    {
        _db = db;
        _email = email;
        _templates = templates;
        _logger = logger;
    }

    public async Task SendWelcomeEmailAsync(Subscriber subscriber, CancellationToken ct = default)
    {
        try
        {
            // Belt-and-suspenders: the caller only invokes this for a brand-new subscriber, but
            // this guard also stops a second send if this method is ever called again for the
            // same row (e.g. a retried request that reached the DB insert but not this call).
            if (subscriber.WelcomeEmailSentAt.HasValue) return;
            if (!await _templates.IsAutomationEnabledAsync(TemplateKey, ct)) return;

            var template = await _templates.GetTemplateAsync(TemplateKey, ct);
            if (template is null) return;

            var signatures = await _email.GetSignaturesAsync(ct);
            var signature = signatures.FirstOrDefault(s => s.IsDefault)?.Html ?? string.Empty;

            var vars = new Dictionary<string, string>
            {
                ["greeting"] = BuildGreeting(subscriber),
                ["bookingUrl"] = $"{PublicUrlResolver.ResolveFrontendBaseUrl()}/booking",
                ["unsubscribeUrl"] = $"{PublicUrlResolver.ResolveFrontendBaseUrl()}/unsubscribe?id={subscriber.Id}",
                ["signature"] = signature,
            };

            await _email.SendAsync(new SendEmailRequest
            {
                To = new List<string> { subscriber.Email },
                Subject = _templates.Render(template.Subject, vars),
                Body = _templates.Render(template.HtmlBody, vars),
                IsHtml = true
            }, ct);

            // Only recorded on a successful send — a failed attempt leaves this null so the
            // subscriber isn't silently treated as welcomed, and a later retry can still send it.
            subscriber.WelcomeEmailSentAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Welcome email failed for subscriber {SubscriberId} ({Email}): {Message}",
                subscriber.Id, subscriber.Email, ex.Message);
        }
    }

    private static string BuildGreeting(Subscriber subscriber)
    {
        var firstName = subscriber.FirstName?.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return string.IsNullOrWhiteSpace(firstName)
            ? "Hello, beautiful soul!"
            : $"Hi {WebUtility.HtmlEncode(firstName)},";
    }
}
