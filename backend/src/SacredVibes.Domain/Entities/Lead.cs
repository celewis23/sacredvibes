using SacredVibes.Domain.Enums;

namespace SacredVibes.Domain.Entities;

public class Lead : BaseEntity
{
    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public LeadType Type { get; set; } = LeadType.ContactForm;
    public LeadStatus Status { get; set; } = LeadStatus.New;

    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Subject { get; set; }
    public string? Message { get; set; }

    public string? ServiceInterest { get; set; }
    public string? PreferredDate { get; set; }
    public string? PreferredTime { get; set; }

    public string? ReferralSource { get; set; }
    public bool NewsletterOptIn { get; set; } = false;

    public string MetadataJson { get; set; } = "{}";
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public string? AdminNotes { get; set; }
    public DateTime? ContactedAt { get; set; }
    public string? ContactedByUserId { get; set; }

    // Optional link if this led to a subscriber
    public Guid? ConvertedSubscriberId { get; set; }
}
