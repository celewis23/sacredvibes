using SacredVibes.Domain.Enums;

namespace SacredVibes.Domain.Entities;

public class ImportJob : BaseEntity
{
    public ImportSource Source { get; set; }
    public ImportStatus Status { get; set; } = ImportStatus.Pending;

    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public string? ExternalReference { get; set; }

    public int TotalRows { get; set; }
    public int InsertedCount { get; set; }
    public int UpdatedCount { get; set; }
    public int SkippedCount { get; set; }
    public int ErrorCount { get; set; }

    public string? ErrorSummary { get; set; }
    public string? ColumnMappingJson { get; set; }
    public string? OptionsJson { get; set; }

    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public string InitiatedByUserId { get; set; } = string.Empty;

    public ICollection<ImportJobItem> Items { get; set; } = new List<ImportJobItem>();
    public ICollection<Subscriber> Subscribers { get; set; } = new List<Subscriber>();
}

public class ImportJobItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ImportJobId { get; set; }
    public ImportJob ImportJob { get; set; } = null!;

    public int RowNumber { get; set; }
    public string RawDataJson { get; set; } = "{}";
    public string? Email { get; set; }
    public ImportItemStatus Status { get; set; } = ImportItemStatus.Pending;
    public string? ErrorMessage { get; set; }
    public Guid? SubscriberId { get; set; }
}
