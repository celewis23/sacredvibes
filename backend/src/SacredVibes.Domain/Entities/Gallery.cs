namespace SacredVibes.Domain.Entities;

public class Gallery : BaseEntity
{
    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImagePath { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; } = false;
    public int SortOrder { get; set; }

    public ICollection<GalleryAsset> GalleryAssets { get; set; } = new List<GalleryAsset>();
}

public class GalleryAsset
{
    public Guid GalleryId { get; set; }
    public Gallery Gallery { get; set; } = null!;

    public Guid AssetId { get; set; }
    public Asset Asset { get; set; } = null!;

    public int SortOrder { get; set; }
    public bool IsFeatured { get; set; } = false;
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
