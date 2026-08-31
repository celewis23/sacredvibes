namespace SacredVibes.Domain.Entities;

public enum ProposalStatus
{
    Draft = 0,
    Sent = 1
}

public class Proposal : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;

    public string RecipientName { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;

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

    public ProposalStatus Status { get; set; } = ProposalStatus.Draft;
    public DateTime? SentAt { get; set; }

    // View tracking for the public "View Proposal Online" link — mirrors BlogPost.ViewCount.
    public int ViewCount { get; set; }
    public DateTime? FirstViewedAt { get; set; }
    public DateTime? LastViewedAt { get; set; }

    public ICollection<ProposalLineItem> LineItems { get; set; } = new List<ProposalLineItem>();
}

public class ProposalLineItem : BaseEntity
{
    public Guid ProposalId { get; set; }
    public Proposal Proposal { get; set; } = null!;

    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int SortOrder { get; set; }

    // Informational breadcrumb only (no FK constraint) — a proposal is a point-in-time quote,
    // so a later change or deletion of the catalog service must never affect it.
    public Guid? ServiceOfferingId { get; set; }
}
