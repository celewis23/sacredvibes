namespace SacredVibes.Application.Features.Email.DTOs;

public class EmailMailboxSettingsDto
{
    public bool IsEnabled { get; set; }
    public string EmailAddress { get; set; } = "info@sacredvibesyoga.com";
    public string FromName { get; set; } = "Sacred Vibes Healing & Wellness";
    public string ImapHost { get; set; } = string.Empty;
    public int ImapPort { get; set; } = 993;
    public bool ImapUseSsl { get; set; } = true;
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 465;
    public bool SmtpUseSsl { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public bool HasPassword { get; set; }
    public DateTime? LastSyncAt { get; set; }
    public string? LastSyncResult { get; set; }
}

public class SaveEmailMailboxSettingsRequest
{
    public bool IsEnabled { get; set; }
    public string EmailAddress { get; set; } = "info@sacredvibesyoga.com";
    public string FromName { get; set; } = "Sacred Vibes Healing & Wellness";
    public string ImapHost { get; set; } = string.Empty;
    public int ImapPort { get; set; } = 993;
    public bool ImapUseSsl { get; set; } = true;
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 465;
    public bool SmtpUseSsl { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string? Password { get; set; }
}

public class EmailFolderDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int? UnreadCount { get; set; }
    public int? TotalCount { get; set; }
}

public class EmailAddressDto
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}

public class EmailAttachmentDto
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long? Size { get; set; }
}

public class EmailMessageSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public string FolderId { get; set; } = "INBOX";
    public string Subject { get; set; } = string.Empty;
    public EmailAddressDto? From { get; set; }
    public List<EmailAddressDto> To { get; set; } = new();
    public DateTimeOffset? Date { get; set; }
    public bool IsRead { get; set; }
    public bool HasAttachments { get; set; }
    public string Preview { get; set; } = string.Empty;
}

public class EmailMessageDto : EmailMessageSummaryDto
{
    public string? HtmlBody { get; set; }
    public string? TextBody { get; set; }
    public List<EmailAddressDto> Cc { get; set; } = new();
    public List<EmailAttachmentDto> Attachments { get; set; } = new();
}

public class EmailMessageListDto
{
    public string FolderId { get; set; } = "INBOX";
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public List<EmailMessageSummaryDto> Items { get; set; } = new();
}

public class SendEmailRequest
{
    public List<string> To { get; set; } = new();
    public List<string> Cc { get; set; } = new();
    public List<string> Bcc { get; set; } = new();
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsHtml { get; set; } = true;
    public List<SendEmailAttachmentRequest> Attachments { get; set; } = new();
    public string? ReplyToMessageId { get; set; }
    public string? ReplyToFolderId { get; set; }
    // Bcc entries tied to a subscriber get sent individually with a personalized
    // unsubscribe link appended, instead of going out in the shared Bcc batch.
    public List<UnsubscribeRecipient>? UnsubscribeRecipients { get; set; }
}

public class UnsubscribeRecipient
{
    public string Email { get; set; } = string.Empty;
    public Guid SubscriberId { get; set; }
}

public class SendEmailAttachmentRequest
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public string Base64Content { get; set; } = string.Empty;
}

public class EmailMarkRequest
{
    public bool IsRead { get; set; }
}

public class EmailMoveRequest
{
    public string DestinationFolderId { get; set; } = string.Empty;
}

public class EmailTestResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class EmailContactDto
{
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public Guid? SubscriberId { get; set; }
}

public class EmailRecipientGroupDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class CreateEmailRecipientGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public List<string> Emails { get; set; } = new();
}

public class EmailSignatureDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Html { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public class SaveEmailSignatureRequest
{
    public string? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Html { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public class EmailLayoutDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    // Full HTML document containing a {{content}} placeholder where the composed message goes.
    public string Html { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public class SaveEmailLayoutRequest
{
    public string? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Html { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}
