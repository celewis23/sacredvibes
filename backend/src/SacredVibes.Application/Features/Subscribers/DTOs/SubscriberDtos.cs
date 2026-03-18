using SacredVibes.Domain.Enums;

namespace SacredVibes.Application.Features.Subscribers.DTOs;

public class SubscriberDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string FullName => $"{FirstName} {LastName}".Trim();
    public string? Phone { get; set; }
    public ImportSource Source { get; set; }
    public string? ExternalSourceId { get; set; }
    public bool IsSubscribed { get; set; }
    public ConsentStatus ConsentStatus { get; set; }
    public DateTime? ConsentedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<SubscriberTagDto> Tags { get; set; } = new();
}

public class SubscriberTagDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Color { get; set; }
}

public class CreateSubscriberRequest
{
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public ImportSource Source { get; set; } = ImportSource.Manual;
    public ConsentStatus ConsentStatus { get; set; } = ConsentStatus.Subscribed;
    public bool IsSubscribed { get; set; } = true;
    public string? Notes { get; set; }
    public List<Guid> TagIds { get; set; } = new();
}

public class UpdateSubscriberRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public bool IsSubscribed { get; set; } = true;
    public ConsentStatus ConsentStatus { get; set; }
    public string? Notes { get; set; }
    public List<Guid> TagIds { get; set; } = new();
}

public class SubscriberFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public string? Search { get; set; }
    public bool? IsSubscribed { get; set; }
    public ImportSource? Source { get; set; }
    public ConsentStatus? ConsentStatus { get; set; }
    public Guid? TagId { get; set; }
    public DateTime? CreatedAfter { get; set; }
    public DateTime? CreatedBefore { get; set; }
}

public class ImportPreviewResult
{
    public int TotalRows { get; set; }
    public int ValidRows { get; set; }
    public int DuplicateRows { get; set; }
    public int ErrorRows { get; set; }
    public List<ImportRowPreview> Rows { get; set; } = new();
    public List<string> DetectedColumns { get; set; } = new();
}

public class ImportRowPreview
{
    public int RowNumber { get; set; }
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public bool IsValid { get; set; }
    public bool IsDuplicate { get; set; }
    public string? ErrorMessage { get; set; }
}

public class ImportResultDto
{
    public Guid ImportJobId { get; set; }
    public int TotalRows { get; set; }
    public int InsertedCount { get; set; }
    public int UpdatedCount { get; set; }
    public int SkippedCount { get; set; }
    public int ErrorCount { get; set; }
    public ImportStatus Status { get; set; }
    public string? ErrorSummary { get; set; }
}
