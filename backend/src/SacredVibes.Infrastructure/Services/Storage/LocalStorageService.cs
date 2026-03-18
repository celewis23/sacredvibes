using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SacredVibes.Domain.Interfaces;

namespace SacredVibes.Infrastructure.Services.Storage;

/// <summary>
/// Local filesystem storage with S3-compatible interface for easy cloud swap.
/// CONFIGURATION: Set Storage:BasePath (defaults to wwwroot/uploads) and Storage:BaseUrl.
/// To switch to S3, implement IStorageService with AWSS3StorageService and swap registration.
/// </summary>
public class LocalStorageService : IStorageService
{
    private readonly string _basePath;
    private readonly string _baseUrl;
    private readonly ILogger<LocalStorageService> _logger;

    public LocalStorageService(IConfiguration config, ILogger<LocalStorageService> logger)
    {
        _basePath = config["Storage:BasePath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        _baseUrl = config["Storage:BaseUrl"] ?? "/uploads";
        _logger = logger;

        Directory.CreateDirectory(_basePath);
    }

    public async Task<StorageResult> StoreAsync(
        Stream stream,
        string fileName,
        string contentType,
        string? folder = null,
        CancellationToken ct = default)
    {
        try
        {
            var folderPath = folder is not null
                ? Path.Combine(_basePath, folder)
                : _basePath;

            Directory.CreateDirectory(folderPath);

            var storagePath = folder is not null
                ? $"{folder}/{fileName}"
                : fileName;

            var fullPath = Path.Combine(_basePath, storagePath.Replace('/', Path.DirectorySeparatorChar));

            stream.Position = 0;
            await using var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write);
            await stream.CopyToAsync(fileStream, ct);

            var publicUrl = GetPublicUrl(storagePath);

            return new StorageResult(true, storagePath, publicUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to store file {FileName}", fileName);
            return new StorageResult(false, string.Empty, string.Empty, ex.Message);
        }
    }

    public Task<Stream?> GetAsync(string storagePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, storagePath.Replace('/', Path.DirectorySeparatorChar));
        if (!File.Exists(fullPath))
            return Task.FromResult<Stream?>(null);

        return Task.FromResult<Stream?>(new FileStream(fullPath, FileMode.Open, FileAccess.Read));
    }

    public Task<bool> DeleteAsync(string storagePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, storagePath.Replace('/', Path.DirectorySeparatorChar));
        if (!File.Exists(fullPath)) return Task.FromResult(false);

        File.Delete(fullPath);
        return Task.FromResult(true);
    }

    public Task<bool> ExistsAsync(string storagePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, storagePath.Replace('/', Path.DirectorySeparatorChar));
        return Task.FromResult(File.Exists(fullPath));
    }

    public string GetPublicUrl(string storagePath) =>
        $"{_baseUrl.TrimEnd('/')}/{storagePath.Replace('\\', '/')}";
}
