using SacredVibes.Domain.Enums;

namespace SacredVibes.Domain.Entities;

public class Asset : BaseEntity
{
    public Guid? BrandId { get; set; }
    public Brand? Brand { get; set; }

    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string? PublicUrl { get; set; }

    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? AltText { get; set; }
    public string? Caption { get; set; }
    public string? Description { get; set; }

    public AssetType AssetType { get; set; } = AssetType.Image;
    public AssetVisibility Visibility { get; set; } = AssetVisibility.Public;
    public AssetUsage Usage { get; set; } = AssetUsage.General;

    public bool IsGalleryItem { get; set; } = false;
    public string? FolderPath { get; set; }
    public string TagsJson { get; set; } = "[]";

    // Generated variants stored as JSON map: { "thumbnail": "path", "medium": "path", "large": "path" }
    public string? VariantsJson { get; set; }

    public string UploadedByUserId { get; set; } = string.Empty;
    public ApplicationUser? UploadedByUser { get; set; }

    public string? StorageProvider { get; set; } = "local";

    // Navigation
    public ICollection<GalleryAsset> GalleryAssets { get; set; } = new List<GalleryAsset>();
}
