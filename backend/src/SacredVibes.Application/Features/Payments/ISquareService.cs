using SacredVibes.Application.Features.Bookings.DTOs;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Application.Features.Payments;

public interface ISquareService
{
    Task<CheckoutResponse> CreateCheckoutAsync(CreateCheckoutRequest request, BookingDto booking, CancellationToken ct = default);
    Task<SquarePaymentStatusResult> GetPaymentStatusAsync(string squarePaymentId, CancellationToken ct = default);
    Task<WebhookProcessResult> ProcessWebhookAsync(string rawPayload, string squareSignature, CancellationToken ct = default);
    Task<SquareCustomerImportResult> ImportCustomersAsync(CancellationToken ct = default);
    Task<SquareServiceCatalogSyncResult> ImportServiceCatalogAsync(Guid brandId, CancellationToken ct = default);
    Task<SquareServicePushResult> PushServiceToSquareAsync(Guid serviceId, CancellationToken ct = default);
    Task<SquareServiceCatalogSyncResult> PushServiceCatalogAsync(Guid? brandId = null, CancellationToken ct = default);
    Task<SquareServiceDeleteResult> DeleteServiceFromSquareAsync(ServiceOffering service, CancellationToken ct = default);
    Task<bool> ValidateWebhookSignatureAsync(string rawPayload, string squareSignature, CancellationToken ct = default);
}

public class SquarePaymentStatusResult
{
    public bool Found { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public DateTime? CompletedAt { get; set; }
    public string? Error { get; set; }
}

public class WebhookProcessResult
{
    public bool Success { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? Message { get; set; }
}

public class SquareCustomerImportResult
{
    public int TotalFetched { get; set; }
    public int Inserted { get; set; }
    public int Updated { get; set; }
    public int Skipped { get; set; }
    public int Errors { get; set; }
    public List<string> ErrorMessages { get; set; } = new();
}

public class SquareServiceCatalogSyncResult
{
    public int TotalFetched { get; set; }
    public int Inserted { get; set; }
    public int Updated { get; set; }
    public int Skipped { get; set; }
    public int Pushed { get; set; }
    public int Errors { get; set; }
    public List<string> ErrorMessages { get; set; } = new();
}

public class SquareServicePushResult
{
    public bool Success { get; set; }
    public string? SquareItemId { get; set; }
    public string? SquareVariationId { get; set; }
    public string? Error { get; set; }
}

public class SquareServiceDeleteResult
{
    public bool Success { get; set; }
    public string? SquareItemId { get; set; }
    public string? Error { get; set; }
}
