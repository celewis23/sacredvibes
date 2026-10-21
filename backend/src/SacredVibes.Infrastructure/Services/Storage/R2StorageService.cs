using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SacredVibes.Domain.Interfaces;
using SacredVibes.Infrastructure.Services;

namespace SacredVibes.Infrastructure.Services.Storage;

/// <summary>
/// Cloudflare R2 (S3-compatible) storage — host-independent so uploaded media survives a
/// failover between API hosts, unlike a container's local disk. Configuration:
/// Storage:R2:AccountId, Storage:R2:AccessKeyId, Storage:R2:SecretAccessKey, Storage:R2:BucketName,
/// Storage:BaseUrl (the bucket's public URL or custom domain).
/// </summary>
public class R2StorageService : IStorageService
{
    private readonly IAmazonS3 _client;
    private readonly string _bucketName;
    private readonly string _baseUrl;
    private readonly ILogger<R2StorageService> _logger;

    public R2StorageService(IConfiguration config, ILogger<R2StorageService> logger)
    {
        var accountId = config["Storage:R2:AccountId"]
            ?? throw new InvalidOperationException("Storage:R2:AccountId is not set.");
        var accessKeyId = config["Storage:R2:AccessKeyId"]
            ?? throw new InvalidOperationException("Storage:R2:AccessKeyId is not set.");
        var secretAccessKey = config["Storage:R2:SecretAccessKey"]
            ?? throw new InvalidOperationException("Storage:R2:SecretAccessKey is not set.");
        _bucketName = config["Storage:R2:BucketName"]
            ?? throw new InvalidOperationException("Storage:R2:BucketName is not set.");
        _baseUrl = config["Storage:BaseUrl"]
            ?? throw new InvalidOperationException("Storage:BaseUrl is not set.");
        _logger = logger;

        _client = new AmazonS3Client(
            new BasicAWSCredentials(accessKeyId, secretAccessKey),
            new AmazonS3Config
            {
                ServiceURL = $"https://{accountId}.r2.cloudflarestorage.com",
                ForcePathStyle = true,
                // AWSSDK.S3 3.7.412+ defaults to sending a trailing checksum on every request,
                // which R2 rejects (STREAMING-AWS4-HMAC-SHA256-PAYLOAD-TRAILER not implemented).
                RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
            });
    }

    public async Task<StorageResult> StoreAsync(
        Stream stream,
        string fileName,
        string contentType,
        string? folder = null,
        CancellationToken ct = default)
    {
        var storagePath = folder is not null ? $"{folder}/{fileName}" : fileName;

        try
        {
            stream.Position = 0;
            await _client.PutObjectAsync(new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = storagePath,
                InputStream = stream,
                ContentType = contentType,
                AutoCloseStream = false,
            }, ct);

            return new StorageResult(true, storagePath, GetPublicUrl(storagePath));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to store file {FileName}", fileName);
            return new StorageResult(false, string.Empty, string.Empty, ex.Message);
        }
    }

    public async Task<Stream?> GetAsync(string storagePath, CancellationToken ct = default)
    {
        try
        {
            var response = await _client.GetObjectAsync(_bucketName, storagePath, ct);
            return response.ResponseStream;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<bool> DeleteAsync(string storagePath, CancellationToken ct = default)
    {
        if (!await ExistsAsync(storagePath, ct)) return false;

        await _client.DeleteObjectAsync(_bucketName, storagePath, ct);
        return true;
    }

    public async Task<bool> ExistsAsync(string storagePath, CancellationToken ct = default)
    {
        try
        {
            await _client.GetObjectMetadataAsync(_bucketName, storagePath, ct);
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public string GetPublicUrl(string storagePath) =>
        PublicUrlResolver.ToAbsoluteUrl($"{_baseUrl.TrimEnd('/')}/{storagePath.Replace('\\', '/')}");
}
