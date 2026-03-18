using SacredVibes.Domain.Enums;

namespace SacredVibes.Domain.Entities;

public class EventOffering : BaseEntity
{
    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }

    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public string? TimeZone { get; set; } = "America/New_York";

    public string? Venue { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Zip { get; set; }
    public bool IsVirtual { get; set; } = false;
    public string? VirtualUrl { get; set; }

    public int? Capacity { get; set; }
    public int RegisteredCount { get; set; }

    public PriceType PriceType { get; set; } = PriceType.Fixed;
    public decimal? Price { get; set; }
    public string Currency { get; set; } = "USD";

    public bool IsBookable { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; } = false;
    public bool IsSoldOut { get; set; } = false;

    public Guid? FeaturedImageAssetId { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? ExternalUrl { get; set; }

    // For Sound on the River special program
    public bool IsSoundOnTheRiver { get; set; } = false;

    public string? InstructorName { get; set; }
    public string? InstructorBio { get; set; }

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
