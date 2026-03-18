using SacredVibes.Domain.Enums;

namespace SacredVibes.Domain.Entities;

public class ServiceOffering : BaseEntity
{
    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }

    public PriceType PriceType { get; set; } = PriceType.Fixed;
    public decimal? Price { get; set; }
    public decimal? PriceMin { get; set; }
    public decimal? PriceMax { get; set; }
    public string Currency { get; set; } = "USD";

    public int? DurationMinutes { get; set; }
    public string? Location { get; set; }
    public bool IsVirtual { get; set; } = false;

    public bool IsBookable { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public bool IsRecurring { get; set; } = false;
    public string? ScheduleJson { get; set; }

    public Guid? FeaturedImageAssetId { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public int SortOrder { get; set; }

    // For Square catalog item linking
    public string? ExternalSquareItemId { get; set; }
    public string? ExternalSquareVariationId { get; set; }

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
