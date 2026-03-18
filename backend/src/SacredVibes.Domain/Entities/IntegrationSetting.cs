namespace SacredVibes.Domain.Entities;

public class IntegrationSetting : BaseEntity
{
    public string Provider { get; set; } = string.Empty;
    public string SettingsJson { get; set; } = "{}";
    public bool IsEnabled { get; set; } = false;
    public DateTime? LastSyncAt { get; set; }
    public string? LastSyncResult { get; set; }
    public string? WebhookSignatureKey { get; set; }
}

public class WebhookEvent : BaseEntity
{
    public string Provider { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string ExternalEventId { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = "{}";
    public bool IsProcessed { get; set; } = false;
    public DateTime? ProcessedAt { get; set; }
    public string? ProcessingError { get; set; }
    public int RetryCount { get; set; }
}

public class AuditLog : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string? UserEmail { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? OldValuesJson { get; set; }
    public string? NewValuesJson { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool Success { get; set; } = true;
    public string? ErrorMessage { get; set; }
}
