using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Email;
using SacredVibes.Application.Features.Email.DTOs;
using SacredVibes.Application.Features.Newsletters;
using SacredVibes.Application.Features.Newsletters.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services.Newsletters;

public class NewsletterService : INewsletterService
{
    private static readonly NewsletterStatus[] EditableStatuses =
        { NewsletterStatus.Draft, NewsletterStatus.Scheduled, NewsletterStatus.Cancelled, NewsletterStatus.Failed };

    private readonly AppDbContext _db;
    private readonly IEmailMailboxService _mailbox;

    public NewsletterService(AppDbContext db, IEmailMailboxService mailbox)
    {
        _db = db;
        _mailbox = mailbox;
    }

    public async Task<PagedResult<NewsletterListItemDto>> GetAllAsync(int page, int pageSize, NewsletterStatus? status, CancellationToken ct = default)
    {
        var query = _db.Newsletters.AsQueryable();
        if (status.HasValue)
            query = query.Where(n => n.Status == status.Value);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(n => n.ScheduledAt ?? n.UpdatedAt)
            .ThenByDescending(n => n.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => ToListItemDto(n))
            .ToListAsync(ct);

        return PagedResult<NewsletterListItemDto>.Create(items, totalCount, page, pageSize);
    }

    public async Task<NewsletterDto?> GetAsync(Guid id, CancellationToken ct = default)
    {
        var newsletter = await FindAsync(id, ct);
        return newsletter is null ? null : ToDto(newsletter);
    }

    public async Task<NewsletterDto> CreateAsync(CreateNewsletterRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Newsletter name is required.");

        var newsletter = new Newsletter
        {
            Name = request.Name.Trim(),
            Subject = request.Subject?.Trim() ?? string.Empty,
        };

        if (request.TemplateId.HasValue)
        {
            var template = await _db.NewsletterTemplates.FirstOrDefaultAsync(t => t.Id == request.TemplateId.Value, ct)
                ?? throw new InvalidOperationException("Template not found.");

            newsletter.TemplateId = template.Id;
            newsletter.HeaderBackgroundColor = template.HeaderBackgroundColor;
            newsletter.HeaderImageAssetId = template.HeaderImageAssetId;
            newsletter.HeaderText = template.HeaderText;
            newsletter.HeaderTextColor = template.HeaderTextColor;
            newsletter.BodyContentHtml = template.BodyContentHtml;
            newsletter.FooterBackgroundColor = template.FooterBackgroundColor;
            newsletter.FooterImageAssetId = template.FooterImageAssetId;
            newsletter.FooterText = template.FooterText;
            newsletter.FooterTextColor = template.FooterTextColor;
        }

        await _db.Newsletters.AddAsync(newsletter, ct);
        await _db.SaveChangesAsync(ct);
        return await GetAsync(newsletter.Id, ct) ?? throw new InvalidOperationException("Newsletter could not be created.");
    }

    public async Task<NewsletterDto> UpdateAsync(Guid id, UpdateNewsletterRequest request, CancellationToken ct = default)
    {
        var newsletter = await FindAsync(id, ct) ?? throw new InvalidOperationException("Newsletter not found.");
        EnsureEditable(newsletter);

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Newsletter name is required.");

        newsletter.Name = request.Name.Trim();
        newsletter.Subject = request.Subject?.Trim() ?? string.Empty;
        newsletter.HeaderBackgroundColor = request.Header.BackgroundColor;
        newsletter.HeaderImageAssetId = request.Header.ImageAssetId;
        newsletter.HeaderText = request.Header.Text;
        newsletter.HeaderTextColor = request.Header.TextColor;
        newsletter.BodyContentHtml = request.BodyContentHtml ?? string.Empty;
        newsletter.FooterBackgroundColor = request.Footer.BackgroundColor;
        newsletter.FooterImageAssetId = request.Footer.ImageAssetId;
        newsletter.FooterText = request.Footer.Text;
        newsletter.FooterTextColor = request.Footer.TextColor;

        // Editing content after a schedule was already set reverts it to Draft — a scheduled
        // send should never silently pick up a mid-edit change without her re-confirming it.
        if (newsletter.Status == NewsletterStatus.Scheduled)
        {
            newsletter.Status = NewsletterStatus.Draft;
            newsletter.ScheduledAt = null;
        }

        await _db.SaveChangesAsync(ct);
        return await GetAsync(newsletter.Id, ct) ?? throw new InvalidOperationException("Newsletter could not be updated.");
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var newsletter = await FindAsync(id, ct) ?? throw new InvalidOperationException("Newsletter not found.");
        if (newsletter.Status == NewsletterStatus.Sending)
            throw new InvalidOperationException("This newsletter is currently sending and can't be deleted.");

        newsletter.IsDeleted = true;
        newsletter.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<NewsletterDto> ScheduleAsync(Guid id, ScheduleNewsletterRequest request, CancellationToken ct = default)
    {
        var newsletter = await FindAsync(id, ct) ?? throw new InvalidOperationException("Newsletter not found.");
        EnsureEditable(newsletter);

        if (string.IsNullOrWhiteSpace(newsletter.Subject))
            throw new InvalidOperationException("Add a subject line before scheduling.");
        if (request.ScheduledAtUtc <= DateTime.UtcNow)
            throw new InvalidOperationException("Choose a date and time in the future.");

        var groupLabel = await ResolveGroupLabelAsync(request.RecipientGroupId, ct);

        newsletter.RecipientGroupId = request.RecipientGroupId;
        newsletter.RecipientGroupLabel = groupLabel;
        newsletter.ScheduledAt = request.ScheduledAtUtc;
        newsletter.Status = NewsletterStatus.Scheduled;
        newsletter.FailureReason = null;
        newsletter.CancelledReason = null;

        await _db.SaveChangesAsync(ct);
        return await GetAsync(newsletter.Id, ct) ?? throw new InvalidOperationException("Newsletter could not be scheduled.");
    }

    public async Task<NewsletterDto> CancelAsync(Guid id, CancellationToken ct = default)
    {
        var newsletter = await FindAsync(id, ct) ?? throw new InvalidOperationException("Newsletter not found.");
        if (newsletter.Status != NewsletterStatus.Scheduled)
            throw new InvalidOperationException("Only a scheduled newsletter can be cancelled.");

        newsletter.Status = NewsletterStatus.Cancelled;
        newsletter.ScheduledAt = null;
        newsletter.CancelledReason = "Cancelled before sending.";

        await _db.SaveChangesAsync(ct);
        return await GetAsync(newsletter.Id, ct) ?? throw new InvalidOperationException("Newsletter could not be cancelled.");
    }

    public async Task<NewsletterDto> SendNowAsync(Guid id, SendNewsletterNowRequest request, CancellationToken ct = default)
    {
        var newsletter = await FindAsync(id, ct) ?? throw new InvalidOperationException("Newsletter not found.");
        EnsureEditable(newsletter);

        if (string.IsNullOrWhiteSpace(newsletter.Subject))
            throw new InvalidOperationException("Add a subject line before sending.");

        var groupLabel = await ResolveGroupLabelAsync(request.RecipientGroupId, ct);

        newsletter.RecipientGroupId = request.RecipientGroupId;
        newsletter.RecipientGroupLabel = groupLabel;
        newsletter.ScheduledAt = DateTime.UtcNow;
        newsletter.Status = NewsletterStatus.Scheduled;
        newsletter.FailureReason = null;
        newsletter.CancelledReason = null;

        await _db.SaveChangesAsync(ct);
        return await GetAsync(newsletter.Id, ct) ?? throw new InvalidOperationException("Newsletter could not be sent.");
    }

    public async Task SendTestAsync(Guid id, string testEmail, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(testEmail))
            throw new InvalidOperationException("A test email address is required.");

        var newsletter = await FindAsync(id, ct) ?? throw new InvalidOperationException("Newsletter not found.");
        var html = BuildHtml(newsletter);

        await _mailbox.SendAsync(new SendEmailRequest
        {
            To = new List<string> { testEmail.Trim() },
            Subject = string.IsNullOrWhiteSpace(newsletter.Subject) ? "(no subject)" : $"[Test] {newsletter.Subject}",
            Body = html,
            IsHtml = true
        }, ct);
    }

    public async Task<string> PreviewHtmlAsync(Guid id, CancellationToken ct = default)
    {
        var newsletter = await FindAsync(id, ct) ?? throw new InvalidOperationException("Newsletter not found.");
        return BuildHtml(newsletter);
    }

    public async Task<PagedResult<NewsletterRecipientLogDto>> GetRecipientLogsAsync(Guid id, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _db.NewsletterRecipientLogs.Where(l => l.NewsletterId == id);
        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderBy(l => l.Email)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new NewsletterRecipientLogDto
            {
                Id = l.Id,
                Email = l.Email,
                Status = l.Status.ToString(),
                SentAt = l.SentAt,
                ErrorMessage = l.ErrorMessage
            })
            .ToListAsync(ct);

        return PagedResult<NewsletterRecipientLogDto>.Create(items, totalCount, page, pageSize);
    }

    private async Task<string> ResolveGroupLabelAsync(string groupId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(groupId))
            throw new InvalidOperationException("Choose who this newsletter should go to.");

        var groups = await _mailbox.GetRecipientGroupsAsync(ct);
        var group = groups.FirstOrDefault(g => g.Id.Equals(groupId, StringComparison.OrdinalIgnoreCase))
            ?? throw new InvalidOperationException("That recipient group no longer exists.");
        return group.Name;
    }

    private static void EnsureEditable(Newsletter newsletter)
    {
        if (!EditableStatuses.Contains(newsletter.Status))
            throw new InvalidOperationException("This newsletter is sending or already sent and can no longer be edited.");
    }

    private async Task<Newsletter?> FindAsync(Guid id, CancellationToken ct) =>
        await _db.Newsletters
            .Include(n => n.HeaderImageAsset)
            .Include(n => n.FooterImageAsset)
            .FirstOrDefaultAsync(n => n.Id == id, ct);

    private static string BuildHtml(Newsletter n) => NewsletterHtmlRenderer.Render(n);

    private static NewsletterListItemDto ToListItemDto(Newsletter n) => new()
    {
        Id = n.Id,
        Name = n.Name,
        Subject = n.Subject,
        Status = n.Status.ToString(),
        RecipientGroupLabel = n.RecipientGroupLabel,
        ScheduledAt = n.ScheduledAt,
        SentAt = n.SentAt,
        RecipientCount = n.RecipientCount,
        SentCount = n.SentCount,
        FailedCount = n.FailedCount,
        UpdatedAt = n.UpdatedAt
    };

    private static NewsletterDto ToDto(Newsletter n) => new()
    {
        Id = n.Id,
        Name = n.Name,
        Subject = n.Subject,
        Status = n.Status.ToString(),
        RecipientGroupLabel = n.RecipientGroupLabel,
        ScheduledAt = n.ScheduledAt,
        SentAt = n.SentAt,
        RecipientCount = n.RecipientCount,
        SentCount = n.SentCount,
        FailedCount = n.FailedCount,
        UpdatedAt = n.UpdatedAt,
        TemplateId = n.TemplateId,
        Header = new NewsletterBannerFieldsDto
        {
            BackgroundColor = n.HeaderBackgroundColor,
            ImageAssetId = n.HeaderImageAssetId,
            ImageUrl = n.HeaderImageAsset?.PublicUrl,
            Text = n.HeaderText,
            TextColor = n.HeaderTextColor
        },
        BodyContentHtml = n.BodyContentHtml,
        Footer = new NewsletterBannerFieldsDto
        {
            BackgroundColor = n.FooterBackgroundColor,
            ImageAssetId = n.FooterImageAssetId,
            ImageUrl = n.FooterImageAsset?.PublicUrl,
            Text = n.FooterText,
            TextColor = n.FooterTextColor
        },
        RecipientGroupId = n.RecipientGroupId,
        FailureReason = n.FailureReason,
        CancelledReason = n.CancelledReason
    };
}
