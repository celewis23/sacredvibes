using SacredVibes.Application.Features.Subscribers.DTOs;

namespace SacredVibes.Application.Features.Imports;

public interface IStripeImportService
{
    Task<ImportResultDto> ImportCustomersAsync(string? startingAfter = null, int limit = 100, CancellationToken ct = default);
    Task<int> GetCustomerCountAsync(CancellationToken ct = default);
}

public interface ICsvImportService
{
    Task<ImportPreviewResult> PreviewAsync(Stream csvStream, CsvImportOptions options, CancellationToken ct = default);
    Task<ImportResultDto> ImportAsync(Stream csvStream, CsvImportOptions options, List<Guid>? tagIds = null, CancellationToken ct = default);
}

public class CsvImportOptions
{
    public bool HasHeader { get; set; } = true;
    public string Delimiter { get; set; } = ",";
    public string? EmailColumn { get; set; }
    public string? FirstNameColumn { get; set; }
    public string? LastNameColumn { get; set; }
    public string? PhoneColumn { get; set; }
    public bool UpdateExisting { get; set; } = true;
    public bool SkipInvalid { get; set; } = true;
    public Dictionary<string, string> ColumnMappings { get; set; } = new();
}
