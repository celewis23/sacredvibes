using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SacredVibes.Application.Features.Email;
using SacredVibes.Application.Features.Email.DTOs;
using SacredVibes.Application.Features.Newsletters;
using SacredVibes.Domain.Entities;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services.Newsletters;

// Drives one newsletter's send from "due" through to a final Sent/SentWithErrors/Failed
// status. Called by NewsletterDispatchBackgroundService once per due newsletter per tick.
// A send is resumable and idempotent: recipient log rows are only created once, and only
// rows still Pending are (re)attempted, so a mid-send restart picks up where it left off.
public class NewsletterDispatchService : INewsletterDispatchService
{
    private static readonly TimeSpan DelayBetweenSends = TimeSpan.FromMilliseconds(150);

    private readonly AppDbContext _db;
    private readonly IEmailMailboxService _mailbox;
    private readonly ILogger<NewsletterDispatchService> _logger;

    public NewsletterDispatchService(AppDbContext db, IEmailMailboxService mailbox, ILogger<NewsletterDispatchService> logger)
    {
        _db = db;
        _mailbox = mailbox;
        _logger = logger;
    }

    public async Task<List<Guid>> GetDueNewsletterIdsAsync(int take, CancellationToken ct = default) =>
        await _db.Newsletters
            .Where(n => (n.Status == NewsletterStatus.Scheduled && n.ScheduledAt <= DateTime.UtcNow)
                        || n.Status == NewsletterStatus.Sending)
            .OrderBy(n => n.ScheduledAt)
            .Select(n => n.Id)
            .Take(take)
            .ToListAsync(ct);

    public async Task DispatchOneAsync(Guid newsletterId, int maxRecipientsThisTick, CancellationToken ct = default)
    {
        var newsletter = await _db.Newsletters
            .Include(n => n.HeaderImageAsset)
            .Include(n => n.FooterImageAsset)
            .FirstOrDefaultAsync(n => n.Id == newsletterId, ct);
        if (newsletter is null) return;

        if (newsletter.Status == NewsletterStatus.Scheduled)
        {
            newsletter.Status = NewsletterStatus.Sending;
            newsletter.SendStartedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }

        var hasLogRows = await _db.NewsletterRecipientLogs.AnyAsync(l => l.NewsletterId == newsletterId, ct);
        if (!hasLogRows)
        {
            List<EmailContactDto> contacts;
            try
            {
                contacts = await _mailbox.GetGroupRecipientsAsync(newsletter.RecipientGroupId ?? string.Empty, ct);
            }
            catch (InvalidOperationException ex)
            {
                await FailAsync(newsletter, ex.Message, ct);
                return;
            }

            // GetGroupRecipientsAsync only filters unsubscribed contacts out of the
            // subscribers:subscribed group — a newsletter must never email an unsubscribed
            // contact regardless of which group was picked, so re-check against the source
            // of truth here rather than trusting the group's own filtering.
            var candidateIds = contacts.Where(c => c.SubscriberId.HasValue).Select(c => c.SubscriberId!.Value).ToList();
            var subscribedIds = await _db.Subscribers
                .Where(s => candidateIds.Contains(s.Id) && s.IsSubscribed)
                .Select(s => s.Id)
                .ToListAsync(ct);
            var subscribedIdSet = subscribedIds.ToHashSet();

            var eligible = contacts
                .Where(c => c.SubscriberId.HasValue && subscribedIdSet.Contains(c.SubscriberId!.Value))
                .GroupBy(c => c.Email, StringComparer.OrdinalIgnoreCase)
                .Select(g => g.First())
                .ToList();

            if (eligible.Count == 0)
            {
                await FailAsync(newsletter, "No subscribed recipients matched the selected group.", ct);
                return;
            }

            foreach (var contact in eligible)
            {
                await _db.NewsletterRecipientLogs.AddAsync(new NewsletterRecipientLog
                {
                    NewsletterId = newsletter.Id,
                    SubscriberId = contact.SubscriberId!.Value,
                    Email = contact.Email,
                    Status = NewsletterRecipientStatus.Pending
                }, ct);
            }

            newsletter.RecipientCount = eligible.Count;
            await _db.SaveChangesAsync(ct);
        }

        var html = NewsletterHtmlRenderer.Render(newsletter);
        var pending = await _db.NewsletterRecipientLogs
            .Where(l => l.NewsletterId == newsletterId && l.Status == NewsletterRecipientStatus.Pending)
            .OrderBy(l => l.Email)
            .Take(maxRecipientsThisTick)
            .ToListAsync(ct);

        var alreadyAttempted = newsletter.SentCount + newsletter.FailedCount;

        foreach (var log in pending)
        {
            ct.ThrowIfCancellationRequested();

            try
            {
                await _mailbox.SendAsync(new SendEmailRequest
                {
                    Bcc = new List<string> { log.Email },
                    UnsubscribeRecipients = new List<UnsubscribeRecipient>
                    {
                        new() { Email = log.Email, SubscriberId = log.SubscriberId }
                    },
                    Subject = newsletter.Subject,
                    Body = html,
                    IsHtml = true,
                    SkipArchive = alreadyAttempted > 0
                }, ct);

                log.Status = NewsletterRecipientStatus.Sent;
                log.SentAt = DateTime.UtcNow;
                newsletter.SentCount++;
            }
            catch (Exception ex)
            {
                log.Status = NewsletterRecipientStatus.Failed;
                log.ErrorMessage = ex.Message.Length > 1000 ? ex.Message[..1000] : ex.Message;
                newsletter.FailedCount++;
                _logger.LogWarning(ex, "Newsletter {NewsletterId} failed to send to {Email}", newsletter.Id, log.Email);
            }

            alreadyAttempted++;
            await _db.SaveChangesAsync(ct);
            await Task.Delay(DelayBetweenSends, ct);
        }

        var remainingPending = await _db.NewsletterRecipientLogs
            .CountAsync(l => l.NewsletterId == newsletterId && l.Status == NewsletterRecipientStatus.Pending, ct);
        if (remainingPending > 0) return;

        newsletter.Status = newsletter.FailedCount == 0
            ? NewsletterStatus.Sent
            : newsletter.SentCount == 0
                ? NewsletterStatus.Failed
                : NewsletterStatus.SentWithErrors;
        newsletter.SentAt = DateTime.UtcNow;
        if (newsletter.Status == NewsletterStatus.Failed)
            newsletter.FailureReason = "All recipients failed to send — check the mailbox configuration.";

        await _db.SaveChangesAsync(ct);
    }

    private async Task FailAsync(Newsletter newsletter, string reason, CancellationToken ct)
    {
        newsletter.Status = NewsletterStatus.Failed;
        newsletter.FailureReason = reason;
        newsletter.SentAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
