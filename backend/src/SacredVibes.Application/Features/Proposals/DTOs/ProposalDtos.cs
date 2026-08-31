namespace SacredVibes.Application.Features.Proposals.DTOs;

public class ProposalBannerFieldsDto
{
    public string? BackgroundColor { get; set; }
    public Guid? ImageAssetId { get; set; }
    public string? ImageUrl { get; set; }
    public string? Text { get; set; }
    public string? TextColor { get; set; }
}

public class ProposalLineItemDto
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int SortOrder { get; set; }
    public Guid? ServiceOfferingId { get; set; }
}

public class ProposalListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string RecipientName { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public DateTime? SentAt { get; set; }
    public int ViewCount { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ProposalDto : ProposalListItemDto
{
    public string Subject { get; set; } = string.Empty;
    public ProposalBannerFieldsDto Header { get; set; } = new();
    public string BodyContentHtml { get; set; } = string.Empty;
    public ProposalBannerFieldsDto Footer { get; set; } = new();
    public List<ProposalLineItemDto> LineItems { get; set; } = new();
    public DateTime? FirstViewedAt { get; set; }
    public DateTime? LastViewedAt { get; set; }
}

public class CreateProposalRequest
{
    public string Title { get; set; } = string.Empty;
}

public class SaveProposalLineItemRequest
{
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int SortOrder { get; set; }
    public Guid? ServiceOfferingId { get; set; }
}

public class UpdateProposalRequest
{
    public string Title { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string RecipientName { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public ProposalBannerFieldsDto Header { get; set; } = new();
    public string BodyContentHtml { get; set; } = string.Empty;
    public ProposalBannerFieldsDto Footer { get; set; } = new();
    public List<SaveProposalLineItemRequest> LineItems { get; set; } = new();
}

public class SendProposalRequest
{
    public string? CoverNote { get; set; }
}

public class SendProposalTestRequest
{
    public string TestEmail { get; set; } = string.Empty;
}

// Public-facing shape — deliberately excludes Subject and any internal-only fields.
public class PublicProposalDto
{
    public string Title { get; set; } = string.Empty;
    public ProposalBannerFieldsDto Header { get; set; } = new();
    public string BodyContentHtml { get; set; } = string.Empty;
    public ProposalBannerFieldsDto Footer { get; set; } = new();
    public List<ProposalLineItemDto> LineItems { get; set; } = new();
    public decimal Total { get; set; }
}
