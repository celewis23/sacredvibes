namespace SacredVibes.Application.Features.Newsletters.DTOs;

public class NewsletterBannerFieldsDto
{
    public string? BackgroundColor { get; set; }
    public Guid? ImageAssetId { get; set; }
    public string? ImageUrl { get; set; }
    public string? Text { get; set; }
    public string? TextColor { get; set; }
}

public class NewsletterTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public NewsletterBannerFieldsDto Header { get; set; } = new();
    public string BodyContentHtml { get; set; } = string.Empty;
    public NewsletterBannerFieldsDto Footer { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class SaveNewsletterTemplateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public NewsletterBannerFieldsDto Header { get; set; } = new();
    public string BodyContentHtml { get; set; } = string.Empty;
    public NewsletterBannerFieldsDto Footer { get; set; } = new();
}

public class NewsletterListItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? RecipientGroupLabel { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime? SentAt { get; set; }
    public int RecipientCount { get; set; }
    public int SentCount { get; set; }
    public int FailedCount { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class NewsletterDto : NewsletterListItemDto
{
    public Guid? TemplateId { get; set; }
    public NewsletterBannerFieldsDto Header { get; set; } = new();
    public string BodyContentHtml { get; set; } = string.Empty;
    public NewsletterBannerFieldsDto Footer { get; set; } = new();
    public string? RecipientGroupId { get; set; }
    public string? FailureReason { get; set; }
    public string? CancelledReason { get; set; }
}

public class CreateNewsletterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public Guid? TemplateId { get; set; }
}

public class UpdateNewsletterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public NewsletterBannerFieldsDto Header { get; set; } = new();
    public string BodyContentHtml { get; set; } = string.Empty;
    public NewsletterBannerFieldsDto Footer { get; set; } = new();
}

public class ScheduleNewsletterRequest
{
    public string RecipientGroupId { get; set; } = string.Empty;
    public DateTime ScheduledAtUtc { get; set; }
}

public class SendNewsletterNowRequest
{
    public string RecipientGroupId { get; set; } = string.Empty;
}

public class SendNewsletterTestRequest
{
    public string TestEmail { get; set; } = string.Empty;
}

public class NewsletterRecipientLogDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? SentAt { get; set; }
    public string? ErrorMessage { get; set; }
}
