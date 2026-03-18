namespace SacredVibes.Application.Common.Interfaces;

public interface IImageProcessingService
{
    Task<ImageProcessingResult> ProcessAsync(Stream inputStream, string originalFileName, ImageProcessingOptions options, CancellationToken ct = default);
    Task<ImageVariant> ResizeAsync(Stream inputStream, int targetWidth, int targetHeight, bool crop, CancellationToken ct = default);
    Task<Stream> OptimizeAsync(Stream inputStream, string contentType, int quality = 80, CancellationToken ct = default);
    bool IsImageContentType(string contentType);
}

public class ImageProcessingOptions
{
    public bool GenerateThumbnail { get; set; } = true;
    public bool GenerateMedium { get; set; } = true;
    public bool GenerateLarge { get; set; } = true;
    public bool Optimize { get; set; } = true;
    public int Quality { get; set; } = 82;
    public ImageSize Thumbnail { get; set; } = new(300, 300);
    public ImageSize Medium { get; set; } = new(800, 800);
    public ImageSize Large { get; set; } = new(1600, 1600);
}

public record ImageSize(int Width, int Height);

public class ImageProcessingResult
{
    public bool Success { get; set; }
    public int OriginalWidth { get; set; }
    public int OriginalHeight { get; set; }
    public string? Error { get; set; }
    public List<ImageVariant> Variants { get; set; } = new();
}

public class ImageVariant
{
    public string Name { get; set; } = string.Empty; // thumbnail, medium, large
    public Stream Stream { get; set; } = Stream.Null;
    public string ContentType { get; set; } = "image/webp";
    public string Extension { get; set; } = ".webp";
    public int Width { get; set; }
    public int Height { get; set; }
    public long FileSize { get; set; }
}
