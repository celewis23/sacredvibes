using Microsoft.Extensions.Logging;
using SacredVibes.Application.Common.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace SacredVibes.Infrastructure.Services.ImageProcessing;

public class ImageProcessingService : IImageProcessingService
{
    private readonly ILogger<ImageProcessingService> _logger;

    private static readonly HashSet<string> SupportedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"
    };

    public ImageProcessingService(ILogger<ImageProcessingService> logger) => _logger = logger;

    public bool IsImageContentType(string contentType) =>
        SupportedTypes.Contains(contentType.Split(';')[0].Trim());

    public async Task<ImageProcessingResult> ProcessAsync(
        Stream inputStream, string originalFileName, ImageProcessingOptions options, CancellationToken ct = default)
    {
        var result = new ImageProcessingResult();
        try
        {
            var imageBytes = new byte[inputStream.Length];
            inputStream.Position = 0;
            await inputStream.ReadExactlyAsync(imageBytes, ct);

            using var image = Image.Load(imageBytes);
            result.OriginalWidth = image.Width;
            result.OriginalHeight = image.Height;
            result.Success = true;

            if (options.GenerateThumbnail)
                result.Variants.Add(await GenerateVariantAsync(imageBytes, "thumbnail", options.Thumbnail.Width, options.Thumbnail.Height, options.Quality, ct));
            if (options.GenerateMedium)
                result.Variants.Add(await GenerateVariantAsync(imageBytes, "medium", options.Medium.Width, options.Medium.Height, options.Quality, ct));
            if (options.GenerateLarge)
                result.Variants.Add(await GenerateVariantAsync(imageBytes, "large", options.Large.Width, options.Large.Height, options.Quality, ct));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Image processing failed for {FileName}", originalFileName);
            result.Success = false;
            result.Error = ex.Message;
        }
        return result;
    }

    public async Task<ImageVariant> ResizeAsync(Stream inputStream, int targetWidth, int targetHeight, bool crop, CancellationToken ct = default)
    {
        var bytes = new byte[inputStream.Length];
        inputStream.Position = 0;
        await inputStream.ReadExactlyAsync(bytes, ct);
        return await GenerateVariantAsync(bytes, "custom", targetWidth, targetHeight, 82, ct, crop);
    }

    public async Task<Stream> OptimizeAsync(Stream inputStream, string contentType, int quality = 80, CancellationToken ct = default)
    {
        var bytes = new byte[inputStream.Length];
        inputStream.Position = 0;
        await inputStream.ReadExactlyAsync(bytes, ct);
        using var image = Image.Load(bytes);
        var output = new MemoryStream();
        await image.SaveAsWebpAsync(output, new WebpEncoder { Quality = quality }, ct);
        output.Position = 0;
        return output;
    }

    private static async Task<ImageVariant> GenerateVariantAsync(
        byte[] sourceBytes, string name, int maxWidth, int maxHeight, int quality, CancellationToken ct, bool crop = false)
    {
        using var image = Image.Load(sourceBytes);

        if (image.Width <= maxWidth && image.Height <= maxHeight)
        {
            var smallOutput = new MemoryStream();
            await image.SaveAsWebpAsync(smallOutput, new WebpEncoder { Quality = quality }, ct);
            smallOutput.Position = 0;
            return new ImageVariant { Name = name, Stream = smallOutput, ContentType = "image/webp", Extension = ".webp", Width = image.Width, Height = image.Height, FileSize = smallOutput.Length };
        }

        image.Mutate(x => x.Resize(new ResizeOptions
        {
            Size = new Size(maxWidth, maxHeight),
            Mode = crop ? ResizeMode.Crop : ResizeMode.Max,
            Position = AnchorPositionMode.Center
        }));

        var output = new MemoryStream();
        await image.SaveAsWebpAsync(output, new WebpEncoder { Quality = quality }, ct);
        output.Position = 0;
        return new ImageVariant { Name = name, Stream = output, ContentType = "image/webp", Extension = ".webp", Width = image.Width, Height = image.Height, FileSize = output.Length };
    }
}
