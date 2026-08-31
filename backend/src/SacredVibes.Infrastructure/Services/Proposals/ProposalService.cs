using AngleSharp.Html.Parser;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Email;
using SacredVibes.Application.Features.Email.DTOs;
using SacredVibes.Application.Features.Proposals;
using SacredVibes.Application.Features.Proposals.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services.Proposals;

public class ProposalService : IProposalService
{
    private readonly AppDbContext _db;
    private readonly IEmailMailboxService _mailbox;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<ProposalService> _logger;

    public ProposalService(
        AppDbContext db,
        IEmailMailboxService mailbox,
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<ProposalService> logger)
    {
        _db = db;
        _mailbox = mailbox;
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    public async Task<PagedResult<ProposalListItemDto>> GetAllAsync(int page, int pageSize, ProposalStatus? status, CancellationToken ct = default)
    {
        var query = _db.Proposals.Include(p => p.LineItems).AsQueryable();
        if (status.HasValue)
            query = query.Where(p => p.Status == status.Value);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(p => p.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return PagedResult<ProposalListItemDto>.Create(items.Select(ToListItemDto).ToList(), totalCount, page, pageSize);
    }

    public async Task<ProposalDto?> GetAsync(Guid id, CancellationToken ct = default)
    {
        var proposal = await FindAsync(id, ct);
        return proposal is null ? null : ToDto(proposal);
    }

    public async Task<ProposalDto> CreateAsync(CreateProposalRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new InvalidOperationException("Proposal title is required.");

        var proposal = new Proposal { Title = request.Title.Trim() };

        // Carry the letterhead/footer forward from the most recently created proposal (even a
        // Draft) so Shanna isn't rebuilding it from scratch every time — no separate "Proposal
        // Templates" library, just a copy at creation time.
        var previous = await _db.Proposals.OrderByDescending(p => p.CreatedAt).FirstOrDefaultAsync(ct);
        if (previous is not null)
        {
            proposal.HeaderBackgroundColor = previous.HeaderBackgroundColor;
            proposal.HeaderImageAssetId = previous.HeaderImageAssetId;
            proposal.HeaderText = previous.HeaderText;
            proposal.HeaderTextColor = previous.HeaderTextColor;
            proposal.FooterBackgroundColor = previous.FooterBackgroundColor;
            proposal.FooterImageAssetId = previous.FooterImageAssetId;
            proposal.FooterText = previous.FooterText;
            proposal.FooterTextColor = previous.FooterTextColor;
        }

        await _db.Proposals.AddAsync(proposal, ct);
        await _db.SaveChangesAsync(ct);
        return await GetAsync(proposal.Id, ct) ?? throw new InvalidOperationException("Proposal could not be created.");
    }

    public async Task<ProposalDto> UpdateAsync(Guid id, UpdateProposalRequest request, CancellationToken ct = default)
    {
        var proposal = await FindAsync(id, ct) ?? throw new InvalidOperationException("Proposal not found.");
        EnsureEditable(proposal);

        if (string.IsNullOrWhiteSpace(request.Title))
            throw new InvalidOperationException("Proposal title is required.");

        proposal.Title = request.Title.Trim();
        proposal.Subject = request.Subject?.Trim() ?? string.Empty;
        proposal.RecipientName = request.RecipientName?.Trim() ?? string.Empty;
        proposal.RecipientEmail = request.RecipientEmail?.Trim() ?? string.Empty;
        proposal.HeaderBackgroundColor = request.Header.BackgroundColor;
        proposal.HeaderImageAssetId = request.Header.ImageAssetId;
        proposal.HeaderText = request.Header.Text;
        proposal.HeaderTextColor = request.Header.TextColor;
        proposal.BodyContentHtml = request.BodyContentHtml ?? string.Empty;
        proposal.FooterBackgroundColor = request.Footer.BackgroundColor;
        proposal.FooterImageAssetId = request.Footer.ImageAssetId;
        proposal.FooterText = request.Footer.Text;
        proposal.FooterTextColor = request.Footer.TextColor;

        // Replace-all-on-save: simplest correct reconciliation for a short freeform list the
        // frontend always resubmits in full — no id-level diffing needed.
        _db.ProposalLineItems.RemoveRange(proposal.LineItems);
        var newItems = request.LineItems.Select((li, index) => new ProposalLineItem
        {
            ProposalId = proposal.Id,
            Description = li.Description?.Trim() ?? string.Empty,
            Price = li.Price,
            SortOrder = index,
            ServiceOfferingId = li.ServiceOfferingId
        }).ToList();
        await _db.ProposalLineItems.AddRangeAsync(newItems, ct);

        await _db.SaveChangesAsync(ct);
        return await GetAsync(proposal.Id, ct) ?? throw new InvalidOperationException("Proposal could not be updated.");
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var proposal = await FindAsync(id, ct) ?? throw new InvalidOperationException("Proposal not found.");
        proposal.IsDeleted = true;
        proposal.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<ProposalDto> SendAsync(Guid id, SendProposalRequest request, CancellationToken ct = default)
    {
        var proposal = await FindAsync(id, ct) ?? throw new InvalidOperationException("Proposal not found.");
        EnsureEditable(proposal);

        if (string.IsNullOrWhiteSpace(proposal.RecipientEmail))
            throw new InvalidOperationException("Add the client's email address before sending.");
        if (string.IsNullOrWhiteSpace(proposal.Subject))
            throw new InvalidOperationException("Add a subject line before sending.");

        var publicViewUrl = BuildPublicViewUrl(proposal.Id);
        var pdfBytes = await RenderPdfBytesAsync(proposal, publicViewUrl, ct);
        var coverHtml = BuildCoverNoteHtml(proposal, request.CoverNote, publicViewUrl);

        await _mailbox.SendAsync(new SendEmailRequest
        {
            To = new List<string> { proposal.RecipientEmail },
            Subject = proposal.Subject,
            Body = coverHtml,
            IsHtml = true,
            Attachments = new List<SendEmailAttachmentRequest>
            {
                new()
                {
                    FileName = $"{SanitizeFileName(proposal.Title)}.pdf",
                    ContentType = "application/pdf",
                    Base64Content = Convert.ToBase64String(pdfBytes)
                }
            }
        }, ct);

        proposal.Status = ProposalStatus.Sent;
        proposal.SentAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return await GetAsync(proposal.Id, ct) ?? throw new InvalidOperationException("Proposal could not be sent.");
    }

    public async Task SendTestAsync(Guid id, string testEmail, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(testEmail))
            throw new InvalidOperationException("A test email address is required.");

        var proposal = await FindAsync(id, ct) ?? throw new InvalidOperationException("Proposal not found.");
        var publicViewUrl = BuildPublicViewUrl(proposal.Id);
        var pdfBytes = await RenderPdfBytesAsync(proposal, publicViewUrl, ct);
        var coverHtml = BuildCoverNoteHtml(proposal, coverNote: null, publicViewUrl);

        await _mailbox.SendAsync(new SendEmailRequest
        {
            To = new List<string> { testEmail.Trim() },
            Subject = string.IsNullOrWhiteSpace(proposal.Subject) ? "[Test] (no subject)" : $"[Test] {proposal.Subject}",
            Body = coverHtml,
            IsHtml = true,
            Attachments = new List<SendEmailAttachmentRequest>
            {
                new()
                {
                    FileName = $"{SanitizeFileName(proposal.Title)}.pdf",
                    ContentType = "application/pdf",
                    Base64Content = Convert.ToBase64String(pdfBytes)
                }
            }
        }, ct);
    }

    public async Task<byte[]> RenderPdfAsync(Guid id, CancellationToken ct = default)
    {
        var proposal = await FindAsync(id, ct) ?? throw new InvalidOperationException("Proposal not found.");
        return await RenderPdfBytesAsync(proposal, BuildPublicViewUrl(proposal.Id), ct);
    }

    public async Task<string> PreviewHtmlAsync(Guid id, CancellationToken ct = default)
    {
        var proposal = await FindAsync(id, ct) ?? throw new InvalidOperationException("Proposal not found.");
        return ProposalHtmlRenderer.Render(proposal);
    }

    public async Task<PublicProposalDto?> GetPublicAsync(Guid id, CancellationToken ct = default)
    {
        var proposal = await FindAsync(id, ct);
        if (proposal is null || proposal.Status != ProposalStatus.Sent) return null;

        proposal.ViewCount++;
        proposal.FirstViewedAt ??= DateTime.UtcNow;
        proposal.LastViewedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new PublicProposalDto
        {
            Title = proposal.Title,
            Header = ToBannerDto(proposal.HeaderBackgroundColor, proposal.HeaderImageAssetId, proposal.HeaderImageAsset?.PublicUrl, proposal.HeaderText, proposal.HeaderTextColor),
            BodyContentHtml = proposal.BodyContentHtml,
            Footer = ToBannerDto(proposal.FooterBackgroundColor, proposal.FooterImageAssetId, proposal.FooterImageAsset?.PublicUrl, proposal.FooterText, proposal.FooterTextColor),
            LineItems = proposal.LineItems.OrderBy(l => l.SortOrder).Select(ToLineItemDto).ToList(),
            Total = proposal.LineItems.Sum(l => l.Price)
        };
    }

    public async Task<byte[]?> GetPublicPdfAsync(Guid id, CancellationToken ct = default)
    {
        var proposal = await FindAsync(id, ct);
        if (proposal is null || proposal.Status != ProposalStatus.Sent) return null;

        return await RenderPdfBytesAsync(proposal, BuildPublicViewUrl(proposal.Id), ct);
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private async Task<byte[]> RenderPdfBytesAsync(Proposal proposal, string publicViewUrl, CancellationToken ct)
    {
        var httpClient = _httpClientFactory.CreateClient();

        var headerImageBytes = await TryFetchAsync(httpClient, proposal.HeaderImageAsset?.PublicUrl, ct);
        var footerImageBytes = await TryFetchAsync(httpClient, proposal.FooterImageAsset?.PublicUrl, ct);

        var bodyImageUrls = CollectBodyImageUrls(proposal.BodyContentHtml);
        var bodyImageBytesBySrc = new Dictionary<string, byte[]>();
        foreach (var url in bodyImageUrls)
        {
            var bytes = await TryFetchAsync(httpClient, url, ct);
            if (bytes is { Length: > 0 }) bodyImageBytesBySrc[url] = bytes;
        }

        var input = new ProposalPdfRenderer.RenderInput(proposal, headerImageBytes, footerImageBytes, bodyImageBytesBySrc, publicViewUrl);
        return ProposalPdfRenderer.Render(input);
    }

    private async Task<byte[]?> TryFetchAsync(HttpClient client, string? url, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(url)) return null;
        try
        {
            return await client.GetByteArrayAsync(url, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not fetch image for proposal PDF: {Url}", url);
            return null;
        }
    }

    private static List<string> CollectBodyImageUrls(string html)
    {
        var urls = new List<string>();
        if (string.IsNullOrWhiteSpace(html)) return urls;

        var doc = new HtmlParser().ParseDocument(html);
        foreach (var img in doc.QuerySelectorAll("img"))
        {
            var src = img.GetAttribute("src");
            if (!string.IsNullOrWhiteSpace(src)) urls.Add(src);
        }
        foreach (var video in doc.QuerySelectorAll("[data-proposal-video]"))
        {
            var poster = video.GetAttribute("data-poster");
            if (!string.IsNullOrWhiteSpace(poster)) urls.Add(poster);
        }
        return urls.Distinct().ToList();
    }

    private string BuildPublicViewUrl(Guid id) => $"{ResolvePublicFrontendUrl()}/proposals/view/{id}";

    private string ResolvePublicFrontendUrl() =>
        (_config["FRONTEND_URL"] ?? Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://sacredvibesyoga.com").TrimEnd('/');

    private static string BuildCoverNoteHtml(Proposal proposal, string? coverNote, string publicViewUrl)
    {
        var noteHtml = string.IsNullOrWhiteSpace(coverNote)
            ? ""
            : $"""<p style="margin:0 0 20px;color:#5f5248;font-size:15px;line-height:1.7;">{System.Net.WebUtility.HtmlEncode(coverNote).Replace("\n", "<br/>")}</p>""";

        return $"""
            <div style="background-color:#f3f0eb;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(28,23,20,0.10);">
                <tr>
                  <td style="background-color:#5f5248;padding:28px 32px;text-align:center;">
                    <p style="margin:0;color:#f3f0eb;font-size:18px;">{System.Net.WebUtility.HtmlEncode(proposal.Title)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 36px;color:#1c1714;font-size:15px;line-height:1.7;">
                    {noteHtml}
                    <p style="margin:0 0 24px;color:#5f5248;font-size:15px;line-height:1.7;">Your proposal is attached as a PDF. You can also view it online, where any video plays directly:</p>
                    <p style="text-align:center;margin:0 0 8px;">
                      <a href="{publicViewUrl}" style="display:inline-block;padding:12px 28px;background-color:#5f5248;color:#f3f0eb;text-decoration:none;border-radius:6px;font-size:14px;">View Proposal Online</a>
                    </p>
                  </td>
                </tr>
              </table>
            </div>
            """;
    }

    private static string SanitizeFileName(string title)
    {
        var name = string.IsNullOrWhiteSpace(title) ? "Proposal" : title.Trim();
        foreach (var c in Path.GetInvalidFileNameChars())
            name = name.Replace(c, '-');
        return name;
    }

    private static void EnsureEditable(Proposal proposal)
    {
        if (proposal.Status == ProposalStatus.Sent)
            throw new InvalidOperationException("This proposal has already been sent and can no longer be edited.");
    }

    private async Task<Proposal?> FindAsync(Guid id, CancellationToken ct) =>
        await _db.Proposals
            .Include(p => p.HeaderImageAsset)
            .Include(p => p.FooterImageAsset)
            .Include(p => p.LineItems)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    private static ProposalBannerFieldsDto ToBannerDto(string? backgroundColor, Guid? imageAssetId, string? imageUrl, string? text, string? textColor) => new()
    {
        BackgroundColor = backgroundColor,
        ImageAssetId = imageAssetId,
        ImageUrl = imageUrl,
        Text = text,
        TextColor = textColor
    };

    private static ProposalLineItemDto ToLineItemDto(ProposalLineItem l) => new()
    {
        Id = l.Id,
        Description = l.Description,
        Price = l.Price,
        SortOrder = l.SortOrder,
        ServiceOfferingId = l.ServiceOfferingId
    };

    private static ProposalListItemDto ToListItemDto(Proposal p) => new()
    {
        Id = p.Id,
        Title = p.Title,
        RecipientName = p.RecipientName,
        RecipientEmail = p.RecipientEmail,
        Status = p.Status.ToString(),
        Total = p.LineItems.Sum(l => l.Price),
        SentAt = p.SentAt,
        ViewCount = p.ViewCount,
        UpdatedAt = p.UpdatedAt
    };

    private static ProposalDto ToDto(Proposal p) => new()
    {
        Id = p.Id,
        Title = p.Title,
        RecipientName = p.RecipientName,
        RecipientEmail = p.RecipientEmail,
        Status = p.Status.ToString(),
        Total = p.LineItems.Sum(l => l.Price),
        SentAt = p.SentAt,
        ViewCount = p.ViewCount,
        UpdatedAt = p.UpdatedAt,
        Subject = p.Subject,
        Header = ToBannerDto(p.HeaderBackgroundColor, p.HeaderImageAssetId, p.HeaderImageAsset?.PublicUrl, p.HeaderText, p.HeaderTextColor),
        BodyContentHtml = p.BodyContentHtml,
        Footer = ToBannerDto(p.FooterBackgroundColor, p.FooterImageAssetId, p.FooterImageAsset?.PublicUrl, p.FooterText, p.FooterTextColor),
        LineItems = p.LineItems.OrderBy(l => l.SortOrder).Select(ToLineItemDto).ToList(),
        FirstViewedAt = p.FirstViewedAt,
        LastViewedAt = p.LastViewedAt
    };
}
