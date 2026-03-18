namespace SacredVibes.Domain.Interfaces;

public interface IStorageService
{
    Task<StorageResult> StoreAsync(Stream stream, string fileName, string contentType, string? folder = null, CancellationToken ct = default);
    Task<Stream?> GetAsync(string storagePath, CancellationToken ct = default);
    Task<bool> DeleteAsync(string storagePath, CancellationToken ct = default);
    Task<bool> ExistsAsync(string storagePath, CancellationToken ct = default);
    string GetPublicUrl(string storagePath);
}

public record StorageResult(
    bool Success,
    string StoragePath,
    string PublicUrl,
    string? Error = null
);
