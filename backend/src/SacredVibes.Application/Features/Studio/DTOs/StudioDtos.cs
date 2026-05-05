namespace SacredVibes.Application.Features.Studio.DTOs;

public class StudioContentDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string RequiredTier { get; set; } = string.Empty;
    public string? Duration { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool IsPublished { get; set; }
    public int SortOrder { get; set; }
    // Null when caller doesn't have access
    public string? StreamUrl { get; set; }
    public bool Locked { get; set; }
}

public class StudioCategoryDto
{
    public string Type { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public List<StudioContentDto> Items { get; set; } = new();
}

public class StudioLibraryDto
{
    public string UserTier { get; set; } = "Free";
    public List<StudioCategoryDto> Categories { get; set; } = new();
}

public class MemberSubscriptionDto
{
    public string Tier { get; set; } = "Free";
    public string Status { get; set; } = "Active";
    public DateTime? CurrentPeriodEnd { get; set; }
    public bool IsActive { get; set; }
}

public class CreateStudioContentRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "SoundHealing";
    public string RequiredTier { get; set; } = "Free";
    public string? Duration { get; set; }
    public Guid? AssetId { get; set; }
    public Guid? ThumbnailAssetId { get; set; }
    public bool IsPublished { get; set; } = false;
    public int SortOrder { get; set; } = 0;
}

public class UpdateStudioContentRequest : CreateStudioContentRequest { }
