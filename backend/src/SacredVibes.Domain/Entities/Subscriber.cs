using SacredVibes.Domain.Enums;

namespace SacredVibes.Domain.Entities;

public class Subscriber : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }

    public ImportSource Source { get; set; } = ImportSource.Manual;
    public string? ExternalSourceId { get; set; }
    public Guid? ImportJobId { get; set; }
    public ImportJob? ImportJob { get; set; }

    public bool IsSubscribed { get; set; } = true;
    public ConsentStatus ConsentStatus { get; set; } = ConsentStatus.Unknown;
    public DateTime? ConsentedAt { get; set; }
    public string? ConsentMethod { get; set; }

    public DateTime? UnsubscribedAt { get; set; }
    public string? UnsubscribeReason { get; set; }

    public string? Notes { get; set; }
    public string MetadataJson { get; set; } = "{}";

    public ICollection<SubscriberTagMap> SubscriberTagMaps { get; set; } = new List<SubscriberTagMap>();
}

public class SubscriberTag : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string? Description { get; set; }

    public ICollection<SubscriberTagMap> SubscriberTagMaps { get; set; } = new List<SubscriberTagMap>();
}

public class SubscriberTagMap
{
    public Guid SubscriberId { get; set; }
    public Subscriber Subscriber { get; set; } = null!;

    public Guid SubscriberTagId { get; set; }
    public SubscriberTag SubscriberTag { get; set; } = null!;

    public DateTime TaggedAt { get; set; } = DateTime.UtcNow;
    public string? TaggedBy { get; set; }
}
