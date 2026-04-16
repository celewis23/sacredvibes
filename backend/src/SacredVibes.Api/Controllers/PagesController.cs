using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Domain.Enums;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/pages")]
[Authorize]
public class PagesController : ControllerBase
{
    private readonly AppDbContext _db;
    public PagesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<PageDto>>>> GetPages(
        [FromQuery] Guid? brandId, CancellationToken ct = default)
    {
        var query = _db.Pages.Include(p => p.Brand).AsQueryable();
        if (brandId.HasValue) query = query.Where(p => p.BrandId == brandId);

        var pages = await query.OrderBy(p => p.BrandId).ThenBy(p => p.NavSortOrder).ThenBy(p => p.Slug).ToListAsync(ct);
        return Ok(ApiResponse<List<PageDto>>.Ok(pages.Select(MapToDto).ToList()));
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PageDto>>> GetPublicPage(
        [FromQuery] string slug, [FromQuery] string? brandSlug, CancellationToken ct = default)
    {
        var query = _db.Pages
            .Include(p => p.Brand)
            .Where(p => p.Slug == slug);

        if (!string.IsNullOrWhiteSpace(brandSlug))
            query = query.Where(p => p.Brand != null && p.Brand.Slug == brandSlug);

        var page = await query
            .OrderBy(p => p.BrandId)
            .FirstOrDefaultAsync(ct);
        return page is null ? NotFound() : Ok(ApiResponse<PageDto>.Ok(MapToDto(page)));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<PageDto>>> GetPage(Guid id, CancellationToken ct = default)
    {
        var page = await _db.Pages.Include(p => p.Brand).FirstOrDefaultAsync(p => p.Id == id, ct);
        return page is null ? NotFound() : Ok(ApiResponse<PageDto>.Ok(MapToDto(page)));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<PageDto>>> CreatePage(
        [FromBody] SavePageRequest req, CancellationToken ct = default)
    {
        var slug = req.Slug ?? GenerateSlug(req.Title);
        var page = new Domain.Entities.Page
        {
            BrandId = req.BrandId,
            Title = req.Title,
            Slug = slug,
            HeroTitle = req.HeroTitle,
            HeroSubtitle = req.HeroSubtitle,
            SeoTitle = req.SeoTitle,
            SeoDescription = req.SeoDescription,
            Status = req.Status,
            PublishedAt = req.Status == ContentStatus.Published ? DateTime.UtcNow : null,
            ShowInNav = req.ShowInNav,
            NavLabel = req.NavLabel,
            NavSortOrder = req.NavSortOrder,
            Template = req.Template ?? "default"
        };

        await _db.Pages.AddAsync(page, ct);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetPage), new { id = page.Id }, ApiResponse<PageDto>.Ok(MapToDto(page)));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<PageDto>>> UpdatePage(
        Guid id, [FromBody] SavePageRequest req, CancellationToken ct = default)
    {
        var page = await _db.Pages.FindAsync([id], ct);
        if (page is null) return NotFound();

        page.Title = req.Title;
        page.HeroTitle = req.HeroTitle;
        page.HeroSubtitle = req.HeroSubtitle;
        page.SeoTitle = req.SeoTitle;
        page.SeoDescription = req.SeoDescription;
        page.ShowInNav = req.ShowInNav;
        page.NavLabel = req.NavLabel;
        page.NavSortOrder = req.NavSortOrder;
        if (req.ContentJson is not null) page.ContentJson = req.ContentJson;

        var wasPublished = page.Status == ContentStatus.Published;
        page.Status = req.Status;
        if (req.Status == ContentStatus.Published && !wasPublished)
            page.PublishedAt ??= DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse<PageDto>.Ok(MapToDto(page)));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeletePage(Guid id, CancellationToken ct = default)
    {
        var page = await _db.Pages.FindAsync([id], ct);
        if (page is null) return NotFound();
        page.IsDeleted = true;
        page.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static string GenerateSlug(string title) =>
        System.Text.RegularExpressions.Regex.Replace(
            title.ToLowerInvariant().Trim().Replace("'", "").Replace("\"", "").Replace(" ", "-"),
            @"[^a-z0-9\-]", "").Trim('-');

    private static PageDto MapToDto(Domain.Entities.Page p) => new()
    {
        Id = p.Id, BrandId = p.BrandId,
        BrandName = p.Brand?.Name ?? "",
        BrandSlug = p.Brand?.Slug ?? "",
        Title = p.Title, Slug = p.Slug,
        HeroTitle = p.HeroTitle, HeroSubtitle = p.HeroSubtitle,
        SeoTitle = p.SeoTitle, SeoDescription = p.SeoDescription,
        Status = p.Status.ToString(), PublishedAt = p.PublishedAt,
        ShowInNav = p.ShowInNav, NavLabel = p.NavLabel, NavSortOrder = p.NavSortOrder,
        Template = p.Template, ContentJson = p.ContentJson,
        CreatedAt = p.CreatedAt, UpdatedAt = p.UpdatedAt
    };
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

public class PageDto
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public string BrandSlug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? HeroTitle { get; set; }
    public string? HeroSubtitle { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string Status { get; set; } = "Draft";
    public DateTime? PublishedAt { get; set; }
    public bool ShowInNav { get; set; }
    public string? NavLabel { get; set; }
    public int NavSortOrder { get; set; }
    public string? Template { get; set; }
    public string? ContentJson { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class SavePageRequest
{
    public Guid BrandId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? HeroTitle { get; set; }
    public string? HeroSubtitle { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public ContentStatus Status { get; set; } = ContentStatus.Draft;
    public bool ShowInNav { get; set; }
    public string? NavLabel { get; set; }
    public int NavSortOrder { get; set; }
    public string? Template { get; set; }
    public string? ContentJson { get; set; }
}
