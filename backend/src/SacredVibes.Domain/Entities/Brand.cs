using SacredVibes.Domain.Enums;

namespace SacredVibes.Domain.Entities;

public class Brand : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public BrandType Type { get; set; }
    public string Subdomain { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Tagline { get; set; }
    public string? LogoPath { get; set; }
    public string? FaviconPath { get; set; }
    public string ThemeSettingsJson { get; set; } = "{}";
    public string SeoSettingsJson { get; set; } = "{}";
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    // Navigation
    public ICollection<Page> Pages { get; set; } = new List<Page>();
    public ICollection<BlogPost> BlogPosts { get; set; } = new List<BlogPost>();
    public ICollection<Asset> Assets { get; set; } = new List<Asset>();
    public ICollection<Gallery> Galleries { get; set; } = new List<Gallery>();
    public ICollection<Lead> Leads { get; set; } = new List<Lead>();
    public ICollection<ServiceOffering> ServiceOfferings { get; set; } = new List<ServiceOffering>();
    public ICollection<EventOffering> EventOfferings { get; set; } = new List<EventOffering>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
