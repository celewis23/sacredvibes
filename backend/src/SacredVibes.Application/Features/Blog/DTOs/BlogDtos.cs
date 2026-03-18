using SacredVibes.Domain.Enums;

namespace SacredVibes.Application.Features.Blog.DTOs;

public class BlogPostDto
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string BrandSlug { get; set; } = string.Empty;
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string Content { get; set; } = string.Empty;
    public AssetSummaryDto? FeaturedImage { get; set; }
    public ContentStatus Status { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? CanonicalUrl { get; set; }
    public int ViewCount { get; set; }
    public string? ReadingTimeMinutes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<BlogCategoryDto> Categories { get; set; } = new();
    public List<BlogTagDto> Tags { get; set; } = new();
}

public class BlogPostSummaryDto
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string BrandSlug { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public AssetSummaryDto? FeaturedImage { get; set; }
    public ContentStatus Status { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> CategoryNames { get; set; } = new();
    public List<string> TagNames { get; set; } = new();
}

public class CreateBlogPostRequest
{
    public Guid BrandId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Excerpt { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid? FeaturedImageAssetId { get; set; }
    public ContentStatus Status { get; set; } = ContentStatus.Draft;
    public DateTime? PublishedAt { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? CanonicalUrl { get; set; }
    public List<Guid> CategoryIds { get; set; } = new();
    public List<Guid> TagIds { get; set; } = new();
}

public class UpdateBlogPostRequest : CreateBlogPostRequest
{
    public Guid Id { get; set; }
}

public class BlogCategoryDto
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentCategoryId { get; set; }
    public int PostCount { get; set; }
}

public class BlogTagDto
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int PostCount { get; set; }
}

public class AssetSummaryDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? PublicUrl { get; set; }
    public string? AltText { get; set; }
    public string? Caption { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? VariantsJson { get; set; }
}
