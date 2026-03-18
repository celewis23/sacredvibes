using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Application.Common.DTOs;
using SacredVibes.Application.Features.Blog.DTOs;
using SacredVibes.Domain.Enums;
using SacredVibes.Infrastructure.Data;

namespace SacredVibes.Api.Controllers;

[ApiController]
[Route("api/blog")]
public class BlogController : ControllerBase
{
    private readonly AppDbContext _db;

    public BlogController(AppDbContext db) => _db = db;

    // ── Public Endpoints ─────────────────────────────────────────────────────

    [HttpGet("posts")]
    public async Task<ActionResult<ApiResponse<PagedResult<BlogPostSummaryDto>>>> GetPosts(
        [FromQuery] string? brandSlug,
        [FromQuery] string? category,
        [FromQuery] string? tag,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
    {
        var query = _db.BlogPosts
            .Include(p => p.Brand)
            .Include(p => p.Author)
            .Include(p => p.FeaturedImageAsset)
            .Include(p => p.BlogPostCategories).ThenInclude(c => c.BlogCategory)
            .Include(p => p.BlogPostTags).ThenInclude(t => t.BlogTag)
            .Where(p => p.Status == ContentStatus.Published && p.PublishedAt <= DateTime.UtcNow)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(brandSlug))
            query = query.Where(p => p.Brand.Slug == brandSlug);

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.BlogPostCategories.Any(c => c.BlogCategory.Slug == category));

        if (!string.IsNullOrWhiteSpace(tag))
            query = query.Where(p => p.BlogPostTags.Any(t => t.BlogTag.Slug == tag));

        var total = await query.CountAsync(ct);
        var posts = await query
            .OrderByDescending(p => p.PublishedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new BlogPostSummaryDto
            {
                Id = p.Id,
                BrandId = p.BrandId,
                BrandSlug = p.Brand.Slug,
                AuthorName = p.Author != null ? p.Author.FullName : "Sacred Vibes Team",
                Title = p.Title,
                Slug = p.Slug,
                Excerpt = p.Excerpt,
                FeaturedImage = p.FeaturedImageAsset != null ? new AssetSummaryDto
                {
                    Id = p.FeaturedImageAsset.Id,
                    FileName = p.FeaturedImageAsset.FileName,
                    PublicUrl = p.FeaturedImageAsset.PublicUrl,
                    AltText = p.FeaturedImageAsset.AltText,
                    Width = p.FeaturedImageAsset.Width,
                    Height = p.FeaturedImageAsset.Height,
                    VariantsJson = p.FeaturedImageAsset.VariantsJson
                } : null,
                Status = p.Status,
                PublishedAt = p.PublishedAt,
                CreatedAt = p.CreatedAt,
                CategoryNames = p.BlogPostCategories.Select(c => c.BlogCategory.Name).ToList(),
                TagNames = p.BlogPostTags.Select(t => t.BlogTag.Name).ToList()
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<PagedResult<BlogPostSummaryDto>>.Ok(
            PagedResult<BlogPostSummaryDto>.Create(posts, total, page, pageSize)));
    }

    [HttpGet("posts/{slug}")]
    public async Task<ActionResult<ApiResponse<BlogPostDto>>> GetPost(string slug, [FromQuery] string? brandSlug, CancellationToken ct = default)
    {
        var query = _db.BlogPosts
            .Include(p => p.Brand)
            .Include(p => p.Author)
            .Include(p => p.FeaturedImageAsset)
            .Include(p => p.BlogPostCategories).ThenInclude(c => c.BlogCategory)
            .Include(p => p.BlogPostTags).ThenInclude(t => t.BlogTag)
            .Where(p => p.Slug == slug);

        if (!string.IsNullOrWhiteSpace(brandSlug))
            query = query.Where(p => p.Brand.Slug == brandSlug);

        var post = await query.FirstOrDefaultAsync(ct);
        if (post is null) return NotFound();

        // Only show published posts publicly; admin can preview via separate endpoint
        if (post.Status != ContentStatus.Published)
            return NotFound();

        // Increment view count
        post.ViewCount++;
        await _db.SaveChangesAsync(ct);

        return Ok(ApiResponse<BlogPostDto>.Ok(MapToDto(post)));
    }

    [HttpGet("categories")]
    public async Task<ActionResult<ApiResponse<List<BlogCategoryDto>>>> GetCategories(
        [FromQuery] string? brandSlug, CancellationToken ct = default)
    {
        var query = _db.BlogCategories
            .Include(c => c.Brand)
            .Include(c => c.BlogPostCategories)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(brandSlug))
            query = query.Where(c => c.Brand.Slug == brandSlug);

        var categories = await query
            .OrderBy(c => c.SortOrder)
            .Select(c => new BlogCategoryDto
            {
                Id = c.Id,
                BrandId = c.BrandId,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                ParentCategoryId = c.ParentCategoryId,
                PostCount = c.BlogPostCategories.Count
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<List<BlogCategoryDto>>.Ok(categories));
    }

    [HttpGet("tags")]
    public async Task<ActionResult<ApiResponse<List<BlogTagDto>>>> GetTags(
        [FromQuery] string? brandSlug, CancellationToken ct = default)
    {
        var query = _db.BlogTags
            .Include(t => t.Brand)
            .Include(t => t.BlogPostTags)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(brandSlug))
            query = query.Where(t => t.Brand.Slug == brandSlug);

        var tags = await query
            .OrderBy(t => t.Name)
            .Select(t => new BlogTagDto
            {
                Id = t.Id,
                BrandId = t.BrandId,
                Name = t.Name,
                Slug = t.Slug,
                PostCount = t.BlogPostTags.Count
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<List<BlogTagDto>>.Ok(tags));
    }

    // ── Admin Endpoints ───────────────────────────────────────────────────────

    [Authorize]
    [HttpGet("admin/posts")]
    public async Task<ActionResult<ApiResponse<PagedResult<BlogPostSummaryDto>>>> GetAdminPosts(
        [FromQuery] Guid? brandId,
        [FromQuery] ContentStatus? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = _db.BlogPosts
            .Include(p => p.Brand)
            .Include(p => p.Author)
            .Include(p => p.FeaturedImageAsset)
            .Include(p => p.BlogPostCategories).ThenInclude(c => c.BlogCategory)
            .Include(p => p.BlogPostTags).ThenInclude(t => t.BlogTag)
            .AsQueryable();

        if (brandId.HasValue) query = query.Where(p => p.BrandId == brandId.Value);
        if (status.HasValue) query = query.Where(p => p.Status == status.Value);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Title.Contains(search) || (p.Excerpt != null && p.Excerpt.Contains(search)));

        var total = await query.CountAsync(ct);
        var posts = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new BlogPostSummaryDto
            {
                Id = p.Id,
                BrandId = p.BrandId,
                BrandSlug = p.Brand.Slug,
                AuthorName = p.Author != null ? p.Author.FullName : "Sacred Vibes Team",
                Title = p.Title,
                Slug = p.Slug,
                Excerpt = p.Excerpt,
                FeaturedImage = p.FeaturedImageAsset != null ? new AssetSummaryDto
                {
                    Id = p.FeaturedImageAsset.Id,
                    PublicUrl = p.FeaturedImageAsset.PublicUrl,
                    AltText = p.FeaturedImageAsset.AltText,
                    FileName = p.FeaturedImageAsset.FileName
                } : null,
                Status = p.Status,
                PublishedAt = p.PublishedAt,
                CreatedAt = p.CreatedAt,
                CategoryNames = p.BlogPostCategories.Select(c => c.BlogCategory.Name).ToList(),
                TagNames = p.BlogPostTags.Select(t => t.BlogTag.Name).ToList()
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<PagedResult<BlogPostSummaryDto>>.Ok(
            PagedResult<BlogPostSummaryDto>.Create(posts, total, page, pageSize)));
    }

    [Authorize]
    [HttpGet("admin/posts/{id:guid}")]
    public async Task<ActionResult<ApiResponse<BlogPostDto>>> GetAdminPost(Guid id, CancellationToken ct = default)
    {
        var post = await _db.BlogPosts
            .Include(p => p.Brand)
            .Include(p => p.Author)
            .Include(p => p.FeaturedImageAsset)
            .Include(p => p.BlogPostCategories).ThenInclude(c => c.BlogCategory)
            .Include(p => p.BlogPostTags).ThenInclude(t => t.BlogTag)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        return post is null ? NotFound() : Ok(ApiResponse<BlogPostDto>.Ok(MapToDto(post)));
    }

    [Authorize]
    [HttpPost("admin/posts")]
    public async Task<ActionResult<ApiResponse<BlogPostDto>>> CreatePost(
        [FromBody] CreateBlogPostRequest request, CancellationToken ct = default)
    {
        var authorId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")?.Value ?? string.Empty;

        var slug = string.IsNullOrWhiteSpace(request.Slug)
            ? GenerateSlug(request.Title)
            : request.Slug;

        // Ensure slug uniqueness within brand
        var baseSlug = slug;
        var counter = 1;
        while (await _db.BlogPosts.AnyAsync(p => p.BrandId == request.BrandId && p.Slug == slug, ct))
            slug = $"{baseSlug}-{counter++}";

        var post = new Domain.Entities.BlogPost
        {
            BrandId = request.BrandId,
            AuthorId = authorId,
            Title = request.Title,
            Slug = slug,
            Excerpt = request.Excerpt,
            Content = request.Content,
            FeaturedImageAssetId = request.FeaturedImageAssetId,
            Status = request.Status,
            PublishedAt = request.Status == ContentStatus.Published ? (request.PublishedAt ?? DateTime.UtcNow) : request.PublishedAt,
            ScheduledAt = request.ScheduledAt,
            SeoTitle = request.SeoTitle,
            SeoDescription = request.SeoDescription,
            CanonicalUrl = request.CanonicalUrl
        };

        await _db.BlogPosts.AddAsync(post, ct);
        await _db.SaveChangesAsync(ct);

        await SyncCategoriesAndTagsAsync(post.Id, request.CategoryIds, request.TagIds, ct);

        var created = await _db.BlogPosts
            .Include(p => p.Brand).Include(p => p.Author).Include(p => p.FeaturedImageAsset)
            .Include(p => p.BlogPostCategories).ThenInclude(c => c.BlogCategory)
            .Include(p => p.BlogPostTags).ThenInclude(t => t.BlogTag)
            .FirstAsync(p => p.Id == post.Id, ct);

        return CreatedAtAction(nameof(GetAdminPost), new { id = post.Id }, ApiResponse<BlogPostDto>.Ok(MapToDto(created)));
    }

    [Authorize]
    [HttpPut("admin/posts/{id:guid}")]
    public async Task<ActionResult<ApiResponse<BlogPostDto>>> UpdatePost(
        Guid id, [FromBody] UpdateBlogPostRequest request, CancellationToken ct = default)
    {
        var post = await _db.BlogPosts.FindAsync([id], ct);
        if (post is null) return NotFound();

        post.Title = request.Title;
        post.Slug = request.Slug ?? GenerateSlug(request.Title);
        post.Excerpt = request.Excerpt;
        post.Content = request.Content;
        post.FeaturedImageAssetId = request.FeaturedImageAssetId;
        post.Status = request.Status;
        post.PublishedAt = request.Status == ContentStatus.Published && post.PublishedAt is null
            ? (request.PublishedAt ?? DateTime.UtcNow)
            : request.PublishedAt;
        post.ScheduledAt = request.ScheduledAt;
        post.SeoTitle = request.SeoTitle;
        post.SeoDescription = request.SeoDescription;
        post.CanonicalUrl = request.CanonicalUrl;

        await SyncCategoriesAndTagsAsync(post.Id, request.CategoryIds, request.TagIds, ct);
        await _db.SaveChangesAsync(ct);

        var updated = await _db.BlogPosts
            .Include(p => p.Brand).Include(p => p.Author).Include(p => p.FeaturedImageAsset)
            .Include(p => p.BlogPostCategories).ThenInclude(c => c.BlogCategory)
            .Include(p => p.BlogPostTags).ThenInclude(t => t.BlogTag)
            .FirstAsync(p => p.Id == id, ct);

        return Ok(ApiResponse<BlogPostDto>.Ok(MapToDto(updated)));
    }

    [Authorize]
    [HttpDelete("admin/posts/{id:guid}")]
    public async Task<ActionResult> DeletePost(Guid id, CancellationToken ct = default)
    {
        var post = await _db.BlogPosts.FindAsync([id], ct);
        if (post is null) return NotFound();
        post.IsDeleted = true;
        post.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task SyncCategoriesAndTagsAsync(Guid postId, List<Guid> categoryIds, List<Guid> tagIds, CancellationToken ct)
    {
        var existingCategories = await _db.BlogPostCategories.Where(c => c.BlogPostId == postId).ToListAsync(ct);
        _db.BlogPostCategories.RemoveRange(existingCategories);

        var existingTags = await _db.BlogPostTags.Where(t => t.BlogPostId == postId).ToListAsync(ct);
        _db.BlogPostTags.RemoveRange(existingTags);

        foreach (var catId in categoryIds)
            await _db.BlogPostCategories.AddAsync(new Domain.Entities.BlogPostCategory { BlogPostId = postId, BlogCategoryId = catId }, ct);

        foreach (var tagId in tagIds)
            await _db.BlogPostTags.AddAsync(new Domain.Entities.BlogPostTag { BlogPostId = postId, BlogTagId = tagId }, ct);

        await _db.SaveChangesAsync(ct);
    }

    private static string GenerateSlug(string title) =>
        System.Text.RegularExpressions.Regex.Replace(
            title.ToLowerInvariant().Trim()
                .Replace("'", "").Replace("\"", "")
                .Replace(" ", "-"),
            @"[^a-z0-9\-]", "")
        .Trim('-');

    private static BlogPostDto MapToDto(Domain.Entities.BlogPost p) => new()
    {
        Id = p.Id,
        BrandId = p.BrandId,
        BrandSlug = p.Brand?.Slug ?? "",
        AuthorId = p.AuthorId,
        AuthorName = p.Author?.FullName ?? "Sacred Vibes Team",
        Title = p.Title,
        Slug = p.Slug,
        Excerpt = p.Excerpt,
        Content = p.Content,
        FeaturedImage = p.FeaturedImageAsset != null ? new AssetSummaryDto
        {
            Id = p.FeaturedImageAsset.Id,
            FileName = p.FeaturedImageAsset.FileName,
            PublicUrl = p.FeaturedImageAsset.PublicUrl,
            AltText = p.FeaturedImageAsset.AltText,
            Caption = p.FeaturedImageAsset.Caption,
            Width = p.FeaturedImageAsset.Width,
            Height = p.FeaturedImageAsset.Height,
            VariantsJson = p.FeaturedImageAsset.VariantsJson
        } : null,
        Status = p.Status,
        PublishedAt = p.PublishedAt,
        SeoTitle = p.SeoTitle,
        SeoDescription = p.SeoDescription,
        CanonicalUrl = p.CanonicalUrl,
        ViewCount = p.ViewCount,
        ReadingTimeMinutes = p.ReadingTimeMinutes,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt,
        Categories = p.BlogPostCategories.Select(c => new BlogCategoryDto
        {
            Id = c.BlogCategory.Id,
            BrandId = c.BlogCategory.BrandId,
            Name = c.BlogCategory.Name,
            Slug = c.BlogCategory.Slug
        }).ToList(),
        Tags = p.BlogPostTags.Select(t => new BlogTagDto
        {
            Id = t.BlogTag.Id,
            BrandId = t.BlogTag.BrandId,
            Name = t.BlogTag.Name,
            Slug = t.BlogTag.Slug
        }).ToList()
    };
}
