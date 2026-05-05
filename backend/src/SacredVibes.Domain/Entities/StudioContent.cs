using SacredVibes.Domain.Enums;

namespace SacredVibes.Domain.Entities;

public class StudioContent : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public StudioCategoryType Category { get; set; }
    public StudioTier RequiredTier { get; set; } = StudioTier.Free;
    public string? Duration { get; set; }

    // Media asset (audio / video)
    public Guid? AssetId { get; set; }
    public Asset? Asset { get; set; }

    // Thumbnail image
    public Guid? ThumbnailAssetId { get; set; }
    public Asset? ThumbnailAsset { get; set; }

    public bool IsPublished { get; set; } = false;
    public int SortOrder { get; set; } = 0;

    public Guid? BrandId { get; set; }
    public Brand? Brand { get; set; }
}
