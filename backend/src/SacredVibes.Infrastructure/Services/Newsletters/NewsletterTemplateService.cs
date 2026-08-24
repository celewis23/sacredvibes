using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Features.Newsletters;
using SacredVibes.Application.Features.Newsletters.DTOs;
using SacredVibes.Domain.Entities;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Infrastructure.Services.Newsletters;

public class NewsletterTemplateService : INewsletterTemplateService
{
    private readonly AppDbContext _db;

    public NewsletterTemplateService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<NewsletterTemplateDto>> GetAllAsync(CancellationToken ct = default)
    {
        var templates = await _db.NewsletterTemplates
            .Include(t => t.HeaderImageAsset)
            .Include(t => t.FooterImageAsset)
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync(ct);

        return templates.Select(ToDto).ToList();
    }

    public async Task<NewsletterTemplateDto?> GetAsync(Guid id, CancellationToken ct = default)
    {
        var template = await FindAsync(id, ct);
        return template is null ? null : ToDto(template);
    }

    public async Task<NewsletterTemplateDto> CreateAsync(SaveNewsletterTemplateRequest request, CancellationToken ct = default)
    {
        var template = new NewsletterTemplate();
        ApplyRequest(template, request);
        await _db.NewsletterTemplates.AddAsync(template, ct);
        await _db.SaveChangesAsync(ct);
        return await GetAsync(template.Id, ct) ?? throw new InvalidOperationException("Template could not be created.");
    }

    public async Task<NewsletterTemplateDto> UpdateAsync(Guid id, SaveNewsletterTemplateRequest request, CancellationToken ct = default)
    {
        var template = await FindAsync(id, ct) ?? throw new InvalidOperationException("Template not found.");
        ApplyRequest(template, request);
        await _db.SaveChangesAsync(ct);
        return await GetAsync(template.Id, ct) ?? throw new InvalidOperationException("Template could not be updated.");
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var template = await FindAsync(id, ct) ?? throw new InvalidOperationException("Template not found.");
        template.IsDeleted = true;
        template.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    private async Task<NewsletterTemplate?> FindAsync(Guid id, CancellationToken ct) =>
        await _db.NewsletterTemplates
            .Include(t => t.HeaderImageAsset)
            .Include(t => t.FooterImageAsset)
            .FirstOrDefaultAsync(t => t.Id == id, ct);

    private static void ApplyRequest(NewsletterTemplate template, SaveNewsletterTemplateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Template name is required.");

        template.Name = request.Name.Trim();
        template.Description = request.Description?.Trim();

        template.HeaderBackgroundColor = request.Header.BackgroundColor;
        template.HeaderImageAssetId = request.Header.ImageAssetId;
        template.HeaderText = request.Header.Text;
        template.HeaderTextColor = request.Header.TextColor;

        template.BodyContentHtml = request.BodyContentHtml ?? string.Empty;

        template.FooterBackgroundColor = request.Footer.BackgroundColor;
        template.FooterImageAssetId = request.Footer.ImageAssetId;
        template.FooterText = request.Footer.Text;
        template.FooterTextColor = request.Footer.TextColor;
    }

    internal static NewsletterTemplateDto ToDto(NewsletterTemplate t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        Description = t.Description,
        Header = new NewsletterBannerFieldsDto
        {
            BackgroundColor = t.HeaderBackgroundColor,
            ImageAssetId = t.HeaderImageAssetId,
            ImageUrl = t.HeaderImageAsset?.PublicUrl,
            Text = t.HeaderText,
            TextColor = t.HeaderTextColor
        },
        BodyContentHtml = t.BodyContentHtml,
        Footer = new NewsletterBannerFieldsDto
        {
            BackgroundColor = t.FooterBackgroundColor,
            ImageAssetId = t.FooterImageAssetId,
            ImageUrl = t.FooterImageAsset?.PublicUrl,
            Text = t.FooterText,
            TextColor = t.FooterTextColor
        },
        CreatedAt = t.CreatedAt,
        UpdatedAt = t.UpdatedAt
    };
}
