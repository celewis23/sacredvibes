namespace SacredVibes.Domain.Entities;

public enum NewsletterStatus
{
    Draft = 0,
    Scheduled = 1,
    Sending = 2,
    Sent = 3,
    SentWithErrors = 4,
    Failed = 5,
    Cancelled = 6
}

public enum NewsletterRecipientStatus
{
    Pending = 0,
    Sent = 1,
    Failed = 2
}

// A reusable starting point for new newsletters. Fields are copied onto a Newsletter at
// creation time (not a live reference), so editing a template never changes newsletters
// already created from it.
public class NewsletterTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public string? HeaderBackgroundColor { get; set; }
    public Guid? HeaderImageAssetId { get; set; }
    public Asset? HeaderImageAsset { get; set; }
    public string? HeaderText { get; set; }
    public string? HeaderTextColor { get; set; }

    public string BodyContentHtml { get; set; } = string.Empty;

    public string? FooterBackgroundColor { get; set; }
    public Guid? FooterImageAssetId { get; set; }
    public Asset? FooterImageAsset { get; set; }
    public string? FooterText { get; set; }
    public string? FooterTextColor { get; set; }

    public ICollection<Newsletter> Newsletters { get; set; } = new List<Newsletter>();
}

public class Newsletter : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;

    public Guid? TemplateId { get; set; }
    public NewsletterTemplate? Template { get; set; }

    public string? HeaderBackgroundColor { get; set; }
    public Guid? HeaderImageAssetId { get; set; }
    public Asset? HeaderImageAsset { get; set; }
    public string? HeaderText { get; set; }
    public string? HeaderTextColor { get; set; }

    public string BodyContentHtml { get; set; } = string.Empty;

    public string? FooterBackgroundColor { get; set; }
    public Guid? FooterImageAssetId { get; set; }
    public Asset? FooterImageAsset { get; set; }
    public string? FooterText { get; set; }
    public string? FooterTextColor { get; set; }

    public NewsletterStatus Status { get; set; } = NewsletterStatus.Draft;

    // Resolved fresh at send time via IEmailMailboxService.GetGroupRecipientsAsync, not frozen —
    // so a newly tagged subscriber is included and an unsubscribe is always respected.
    public string? RecipientGroupId { get; set; }
    public string RecipientGroupLabel { get; set; } = string.Empty;

    public DateTime? ScheduledAt { get; set; }
    public DateTime? SendStartedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public string? CancelledReason { get; set; }
    public string? FailureReason { get; set; }

    public int RecipientCount { get; set; }
    public int SentCount { get; set; }
    public int FailedCount { get; set; }

    public ICollection<NewsletterRecipientLog> RecipientLogs { get; set; } = new List<NewsletterRecipientLog>();
}

// One row per resolved recipient of a newsletter send — gives a real "who got it" record.
public class NewsletterRecipientLog : BaseEntity
{
    public Guid NewsletterId { get; set; }
    public Newsletter Newsletter { get; set; } = null!;

    public Guid SubscriberId { get; set; }
    public string Email { get; set; } = string.Empty;

    public NewsletterRecipientStatus Status { get; set; } = NewsletterRecipientStatus.Pending;
    public DateTime? SentAt { get; set; }
    public string? ErrorMessage { get; set; }
}
