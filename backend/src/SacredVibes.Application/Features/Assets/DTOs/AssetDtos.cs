using SacredVibes.Domain.Enums;

namespace SacredVibes.Application.Features.Assets.DTOs;

public class AssetDto
{
    public Guid Id { get; set; }
    public Guid? BrandId { get; set; }
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
    public AssetType AssetType { get; set; }
    public AssetVisibility Visibility { get; set; }
    public AssetUsage Usage { get; set; }
    public bool IsGalleryItem { get; set; }
    public string? FolderPath { get; set; }
    public string TagsJson { get; set; } = "[]";
    public string? VariantsJson { get; set; }
    public string UploadedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class UploadAssetRequest
{
    public Guid? BrandId { get; set; }
    public string? AltText { get; set; }
    public string? Caption { get; set; }
    public string? Description { get; set; }
    public AssetUsage Usage { get; set; } = AssetUsage.General;
    public AssetVisibility Visibility { get; set; } = AssetVisibility.Public;
    public bool IsGalleryItem { get; set; } = false;
    public string? FolderPath { get; set; }
    public List<string> Tags { get; set; } = new();
    public Guid? AssignToGalleryId { get; set; }
}

public class UpdateAssetRequest
{
    public string? AltText { get; set; }
    public string? Caption { get; set; }
    public string? Description { get; set; }
    public AssetUsage Usage { get; set; }
    public AssetVisibility Visibility { get; set; }
    public bool IsGalleryItem { get; set; }
    public string? FolderPath { get; set; }
    public List<string> Tags { get; set; } = new();
}

public class AssetFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 24;
    public Guid? BrandId { get; set; }
    public AssetType? AssetType { get; set; }
    public AssetUsage? Usage { get; set; }
    public bool? IsGalleryItem { get; set; }
    public string? FolderPath { get; set; }
    public string? Search { get; set; }
    public string? Tag { get; set; }
}
