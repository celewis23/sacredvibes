using SacredVibes.Domain.Enums;

namespace SacredVibes.Domain.Entities;

public class BlogPost : BaseEntity
{
    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public string AuthorId { get; set; } = string.Empty;
    public ApplicationUser? Author { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string Content { get; set; } = string.Empty;

    public Guid? FeaturedImageAssetId { get; set; }
    public Asset? FeaturedImageAsset { get; set; }

    public ContentStatus Status { get; set; } = ContentStatus.Draft;
    public DateTime? PublishedAt { get; set; }
    public DateTime? ScheduledAt { get; set; }

    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? OgTitle { get; set; }
    public string? OgDescription { get; set; }
    public Guid? OgImageAssetId { get; set; }
    public string? CanonicalUrl { get; set; }

    public bool AllowComments { get; set; } = false;
    public int ViewCount { get; set; }
    public string? ReadingTimeMinutes { get; set; }

    // Navigation
    public ICollection<BlogPostCategory> BlogPostCategories { get; set; } = new List<BlogPostCategory>();
    public ICollection<BlogPostTag> BlogPostTags { get; set; } = new List<BlogPostTag>();
}

public class BlogCategory : BaseEntity
{
    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentCategoryId { get; set; }
    public BlogCategory? ParentCategory { get; set; }
    public int SortOrder { get; set; }

    public ICollection<BlogPostCategory> BlogPostCategories { get; set; } = new List<BlogPostCategory>();
}

public class BlogTag : BaseEntity
{
    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    public ICollection<BlogPostTag> BlogPostTags { get; set; } = new List<BlogPostTag>();
}

public class BlogPostCategory
{
    public Guid BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;

    public Guid BlogCategoryId { get; set; }
    public BlogCategory BlogCategory { get; set; } = null!;
}

public class BlogPostTag
{
    public Guid BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;

    public Guid BlogTagId { get; set; }
    public BlogTag BlogTag { get; set; } = null!;
}
