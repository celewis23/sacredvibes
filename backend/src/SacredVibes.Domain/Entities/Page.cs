using SacredVibes.Domain.Enums;

namespace SacredVibes.Domain.Entities;

public class Page : BaseEntity
{
    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ContentJson { get; set; }
    public string? HeroTitle { get; set; }
    public string? HeroSubtitle { get; set; }
    public Guid? HeroImageAssetId { get; set; }
    public Asset? HeroImageAsset { get; set; }

    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? OgTitle { get; set; }
    public string? OgDescription { get; set; }
    public Guid? OgImageAssetId { get; set; }
    public string? CanonicalUrl { get; set; }

    public ContentStatus Status { get; set; } = ContentStatus.Draft;
    public DateTime? PublishedAt { get; set; }
    public bool ShowInNav { get; set; } = false;
    public int NavSortOrder { get; set; }
    public string? NavLabel { get; set; }
    public string? Template { get; set; } = "default";
}
